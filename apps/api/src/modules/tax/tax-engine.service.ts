import { Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { CalculateProgressClaimDto } from './dto/calculate-tax.dto';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface ProgressClaimResult {
  dpp: string;
  // PPh Final
  pphFinal: {
    rateCode: string;
    description: string;
    qualification: string | null;
    rate: string;
    amount: string;
    legalBasis: string;
  };
  // PPN
  ppn: {
    rate: string;
    amount: string;
  };
  // Deductions
  recoupment: string;
  retention: string;
  // Net
  netCashIn: string;
  // Memo
  transactionDate: string;
  notes: string;
}

export interface TaxRateDetail {
  code: string;
  description: string;
  qualification: string | null;
  rate: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  legalBasis: string;
}

@Injectable()
export class TaxEngineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Hitung nilai bayar termin lengkap dengan PPh Final, PPN, recoupment, retensi.
   *
   * Formula (§22.2):
   *   Net cash-in = DPP + PPN − PPh Final − Recoupment − Retensi
   *
   * DPP = nilai kontrak/termin TIDAK termasuk PPN (§24.2)
   */
  async calculateProgressClaim(dto: CalculateProgressClaimDto): Promise<ProgressClaimResult> {
    const txDate = dto.transactionDate ? new Date(dto.transactionDate) : new Date();

    const [pphRate, ppnRate] = await Promise.all([
      this.getEffectiveTaxRate(dto.taxRateCode, txDate),
      this.getEffectiveTaxRate('PPN', txDate),
    ]);

    const dpp = new Decimal(dto.dpp.toString());
    const ppnAmount = dpp.times(ppnRate.rate.toString()).toDecimalPlaces(2);
    const pphAmount = dpp.times(pphRate.rate.toString()).toDecimalPlaces(2);

    let recoupment = new Decimal(0);
    if (dto.recoupmentPct) {
      recoupment = dpp.times(dto.recoupmentPct.toString()).div(100).toDecimalPlaces(2);
    }

    let retention = new Decimal(0);
    if (dto.retentionPct) {
      retention = dpp.times(dto.retentionPct.toString()).div(100).toDecimalPlaces(2);
    }

    const netCashIn = dpp
      .plus(ppnAmount)
      .minus(pphAmount)
      .minus(recoupment)
      .minus(retention)
      .toDecimalPlaces(2);

    return {
      dpp: dpp.toFixed(2),
      pphFinal: {
        rateCode: pphRate.code,
        description: pphRate.description,
        qualification: pphRate.qualification,
        rate: new Decimal(pphRate.rate.toString()).toFixed(4),
        amount: pphAmount.toFixed(2),
        legalBasis: pphRate.legalBasis,
      },
      ppn: {
        rate: new Decimal(ppnRate.rate.toString()).toFixed(4),
        amount: ppnAmount.toFixed(2),
      },
      recoupment: recoupment.toFixed(2),
      retention: retention.toFixed(2),
      netCashIn: netCashIn.toFixed(2),
      transactionDate: txDate.toISOString().slice(0, 10),
      notes: `DPP ${dpp.toFixed(0)} + PPN ${ppnAmount.toFixed(0)} − PPh Final ${pphAmount.toFixed(0)} − Recoupment ${recoupment.toFixed(0)} − Retensi ${retention.toFixed(0)} = ${netCashIn.toFixed(0)}`,
    };
  }

  async getEffectiveTaxRate(code: string, date: Date) {
    const rate = await this.prisma.taxRate.findFirst({
      where: {
        code,
        isActive: true,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: date } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!rate) {
      throw new NotFoundException(
        `Tarif pajak "${code}" tidak ditemukan untuk tanggal ${date.toISOString().slice(0, 10)}`,
      );
    }

    return rate;
  }

  async listRates(date?: Date): Promise<TaxRateDetail[]> {
    const effectiveDate = date ?? new Date();
    const rates = await this.prisma.taxRate.findMany({
      where: {
        isActive: true,
        effectiveFrom: { lte: effectiveDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: effectiveDate } }],
      },
      orderBy: [{ taxType: 'asc' }, { code: 'asc' }],
    });

    return rates.map((r) => ({
      code: r.code,
      description: r.description,
      qualification: r.qualification,
      rate: new Decimal(r.rate.toString()).toFixed(4),
      effectiveFrom: r.effectiveFrom.toISOString().slice(0, 10),
      effectiveTo: r.effectiveTo ? r.effectiveTo.toISOString().slice(0, 10) : null,
      legalBasis: r.legalBasis,
    }));
  }
}
