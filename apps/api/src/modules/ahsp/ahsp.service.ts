import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AHSPEngineService } from './ahsp-engine.service';
import { CalculateAHSPDto } from './dto/calculate-ahsp.dto';
import { CreateAHSPItemDto } from './dto/create-ahsp-item.dto';

@Injectable()
export class AHSPService {
  constructor(
    private prisma: PrismaService,
    private engine: AHSPEngineService,
  ) {}

  async findAll(tenantId: string, query: { discipline?: string; category?: string; search?: string }) {
    return this.prisma.aHSPItem.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
        isActive: true,
        ...(query.discipline && { discipline: query.discipline }),
        ...(query.category && { category: query.category }),
        ...(query.search && {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { components: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ code: 'asc' }],
    });
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.prisma.aHSPItem.findFirst({
      where: { id, OR: [{ tenantId }, { tenantId: null }] },
      include: {
        components: {
          include: { coefficients: { orderBy: { effectiveFrom: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!item) throw new NotFoundException('AHSP item not found');
    return item;
  }

  async create(dto: CreateAHSPItemDto, tenantId: string, userId: string) {
    return this.prisma.aHSPItem.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        unit: dto.unit,
        category: dto.category,
        discipline: dto.discipline,
        regulationBasis: dto.regulationBasis ?? 'PUPR_1_2022',
        overheadPct: dto.overheadPct ?? 10,
        profitPct: dto.profitPct ?? 5,
        isCustom: true,
        createdBy: userId,
        components: {
          create: dto.components.map((comp, idx) => ({
            type: comp.type,
            hsdCode: comp.hsdCode,
            description: comp.description,
            unit: comp.unit,
            sortOrder: comp.sortOrder ?? idx,
            coefficients: {
              create: comp.coefficients.map((c) => ({
                coefficient: c.coefficient,
                regulationVersion: c.regulationVersion,
                effectiveFrom: new Date(c.effectiveFrom),
                effectiveTo: c.effectiveTo ? new Date(c.effectiveTo) : null,
                legalBasis: c.legalBasis,
                createdBy: userId,
              })),
            },
          })),
        },
      },
      include: { components: { include: { coefficients: true } } },
    });
  }

  async calculate(dto: CalculateAHSPDto) {
    return this.engine.calculate(dto);
  }

  async compareRegulations(
    ahspItemCode: string,
    regionCode: string,
    calcDate: string,
    tenantId: string,
  ) {
    const items = await this.prisma.aHSPItem.findMany({
      where: {
        code: ahspItemCode,
        OR: [{ tenantId }, { tenantId: null }],
        isActive: true,
      },
    });

    const results = await Promise.all(
      items.map(async (item) => {
        const result = await this.engine.calculate({
          ahspItemId: item.id,
          regionCode,
          calculationDate: calcDate,
        });
        return { ...result, regulationBasis: item.regulationBasis as string };
      }),
    );

    return results;
  }
}
