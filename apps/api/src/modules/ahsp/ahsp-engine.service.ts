import { Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { AHSPCoefficient, AHSPComponent, ComponentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CalculateAHSPDto } from './dto/calculate-ahsp.dto';

// Precision: monetary 2dp, coefficients 4dp
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface ComponentResult {
  componentId: string;
  type: ComponentType;
  hsdCode: string;
  description: string;
  unit: string;
  coefficient: string;
  unitPrice: string;
  amount: string;
}

export interface AHSPCalculationResult {
  ahspItemId: string;
  ahspItemCode: string;
  ahspItemName: string;
  unit: string;
  regulationBasis: string;
  calculationDate: string;
  regionCode: string;
  components: ComponentResult[];
  laborTotal: string;
  materialTotal: string;
  equipmentTotal: string;
  directCost: string;
  overheadPct: string;
  overheadAmount: string;
  profitPct: string;
  profitAmount: string;
  hsp: string;
  hspWithOverheadProfit: string;
  warnings: string[];
}

@Injectable()
export class AHSPEngineService {
  constructor(private prisma: PrismaService) {}

  async calculate(dto: CalculateAHSPDto): Promise<AHSPCalculationResult> {
    const calcDate = dto.calculationDate ? new Date(dto.calculationDate) : new Date();

    const item = await this.prisma.aHSPItem.findUnique({
      where: { id: dto.ahspItemId },
      include: {
        components: {
          include: { coefficients: { orderBy: { effectiveFrom: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!item) throw new NotFoundException(`AHSP item ${dto.ahspItemId} not found`);

    const warnings: string[] = [];
    const componentResults: ComponentResult[] = [];

    for (const comp of item.components) {
      const coeff = this.getEffectiveCoefficient(comp.coefficients, calcDate);
      if (!coeff) {
        warnings.push(`No effective coefficient for component ${comp.description} on ${calcDate.toISOString().slice(0, 10)}`);
        continue;
      }

      const price = await this.getHSDPrice(comp.hsdCode, dto.regionCode, calcDate);
      if (!price) {
        warnings.push(`No HSD price for code ${comp.hsdCode} in region ${dto.regionCode} on ${calcDate.toISOString().slice(0, 10)}`);
      }

      const coeffDecimal = new Decimal(coeff.coefficient.toString());
      const priceDecimal = price ? new Decimal(price.toString()) : new Decimal(0);
      const amount = coeffDecimal.times(priceDecimal).toDecimalPlaces(2);

      componentResults.push({
        componentId: comp.id,
        type: comp.type,
        hsdCode: comp.hsdCode,
        description: comp.description,
        unit: comp.unit,
        coefficient: coeffDecimal.toFixed(4),
        unitPrice: priceDecimal.toFixed(2),
        amount: amount.toFixed(2),
      });
    }

    const sum = (type: ComponentType) =>
      componentResults
        .filter((c) => c.type === type)
        .reduce((acc, c) => acc.plus(new Decimal(c.amount)), new Decimal(0));

    const laborTotal = sum(ComponentType.LABOR).toDecimalPlaces(2);
    const materialTotal = sum(ComponentType.MATERIAL).toDecimalPlaces(2);
    const equipmentTotal = sum(ComponentType.EQUIPMENT).toDecimalPlaces(2);
    const directCost = laborTotal.plus(materialTotal).plus(equipmentTotal).toDecimalPlaces(2);

    const overheadPct = new Decimal(
      dto.overheadPct !== undefined ? dto.overheadPct : item.overheadPct.toString(),
    );
    const profitPct = new Decimal(
      dto.profitPct !== undefined ? dto.profitPct : item.profitPct.toString(),
    );

    const overheadAmount = directCost.times(overheadPct).div(100).toDecimalPlaces(2);
    const profitAmount = directCost.times(profitPct).div(100).toDecimalPlaces(2);
    const hsp = directCost.plus(overheadAmount).plus(profitAmount).toDecimalPlaces(2);

    return {
      ahspItemId: item.id,
      ahspItemCode: item.code,
      ahspItemName: item.name,
      unit: item.unit,
      regulationBasis: item.regulationBasis,
      calculationDate: calcDate.toISOString().slice(0, 10),
      regionCode: dto.regionCode,
      components: componentResults,
      laborTotal: laborTotal.toFixed(2),
      materialTotal: materialTotal.toFixed(2),
      equipmentTotal: equipmentTotal.toFixed(2),
      directCost: directCost.toFixed(2),
      overheadPct: overheadPct.toFixed(2),
      overheadAmount: overheadAmount.toFixed(2),
      profitPct: profitPct.toFixed(2),
      profitAmount: profitAmount.toFixed(2),
      hsp: directCost.toFixed(2),
      hspWithOverheadProfit: hsp.toFixed(2),
      warnings,
    };
  }

  private getEffectiveCoefficient(
    coefficients: AHSPCoefficient[],
    date: Date,
  ): AHSPCoefficient | null {
    return (
      coefficients
        .filter(
          (c) =>
            c.effectiveFrom <= date &&
            (c.effectiveTo === null || c.effectiveTo > date),
        )
        .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0] ?? null
    );
  }

  private async getHSDPrice(
    hsdCode: string,
    regionCode: string,
    date: Date,
  ): Promise<Decimal | null> {
    const hsd = await this.prisma.hSDMaster.findFirst({
      where: {
        code: hsdCode,
        regionCode,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: date } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!hsd) return null;
    return new Decimal(hsd.price.toString());
  }
}
