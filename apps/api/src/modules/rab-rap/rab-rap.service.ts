import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { AHSPEngineService } from '../ahsp/ahsp-engine.service';
import { CreateBudgetVersionDto, CreateRABLinesDto } from './dto/rab-rap.dto';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

@Injectable()
export class RABRAPService {
  constructor(
    private prisma: PrismaService,
    private ahspEngine: AHSPEngineService,
  ) {}

  async createVersion(dto: CreateBudgetVersionDto, tenantId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const lastVersion = await this.prisma.budgetVersion.findFirst({
      where: { projectId: dto.projectId },
      orderBy: { version: 'desc' },
    });

    return this.prisma.budgetVersion.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        version: (lastVersion?.version ?? 0) + 1,
        name: dto.name,
        description: dto.description,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async listVersions(projectId: string, tenantId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.budgetVersion.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
  }

  async addLines(versionId: string, dto: CreateRABLinesDto, tenantId: string, userId: string) {
    const version = await this.prisma.budgetVersion.findFirst({
      where: { id: versionId, tenantId },
    });
    if (!version) throw new NotFoundException('Budget version not found');
    if (version.isLocked) throw new BadRequestException('Budget version is locked');

    const created = [];
    for (const line of dto.lines) {
      let laborCost = line.laborCost ?? 0;
      let materialCost = line.materialCost ?? 0;
      let equipmentCost = line.equipmentCost ?? 0;
      let overheadAmount = line.overheadAmount ?? 0;
      let profitAmount = line.profitAmount ?? 0;

      // Auto-fill AHSP breakdown if ahspItemId provided
      if (line.ahspItemId && line.regionCode) {
        try {
          const ahspResult = await this.ahspEngine.calculate({
            ahspItemId: line.ahspItemId,
            regionCode: line.regionCode,
            calculationDate: line.calculationDate,
          });
          laborCost = parseFloat(ahspResult.laborTotal);
          materialCost = parseFloat(ahspResult.materialTotal);
          equipmentCost = parseFloat(ahspResult.equipmentTotal);
          overheadAmount = parseFloat(ahspResult.overheadAmount);
          profitAmount = parseFloat(ahspResult.profitAmount);
        } catch {
          // AHSP breakdown not mandatory; proceed without it
        }
      }

      const qty = new Decimal(line.quantity);
      const rabAmount = qty.times(line.hspJual).toDecimalPlaces(2);
      const rapAmount = qty.times(line.hspBiaya).toDecimalPlaces(2);

      const rab = await this.prisma.rABLine.create({
        data: {
          budgetVersionId: versionId,
          wbsNodeId: line.wbsNodeId,
          ahspItemId: line.ahspItemId,
          itemCode: line.itemCode,
          description: line.description,
          unit: line.unit,
          quantity: line.quantity,
          hspJual: line.hspJual,
          rabAmount: rabAmount.toNumber(),
          hspBiaya: line.hspBiaya,
          rapAmount: rapAmount.toNumber(),
          laborCost,
          materialCost,
          equipmentCost,
          overheadAmount,
          profitAmount,
          sortOrder: line.sortOrder ?? 0,
          notes: line.notes,
          regionCode: line.regionCode,
          calculationDate: line.calculationDate ? new Date(line.calculationDate) : undefined,
          createdBy: userId,
          updatedBy: userId,
        },
      });
      created.push(rab);
    }

    // Recompute version totals
    await this.recalcVersionTotals(versionId);

    return created;
  }

  async getVersion(versionId: string, tenantId: string) {
    const version = await this.prisma.budgetVersion.findFirst({
      where: { id: versionId, tenantId },
      include: {
        rabLines: {
          where: { parentId: null },
          include: { children: true, wbsNode: { select: { code: true, name: true } }, ahspItem: { select: { code: true, name: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!version) throw new NotFoundException('Budget version not found');
    return version;
  }

  async lockVersion(versionId: string, tenantId: string, userId: string) {
    const version = await this.prisma.budgetVersion.findFirst({
      where: { id: versionId, tenantId },
    });
    if (!version) throw new NotFoundException('Budget version not found');
    if (version.isLocked) throw new BadRequestException('Already locked');

    return this.prisma.budgetVersion.update({
      where: { id: versionId },
      data: { isLocked: true, lockedAt: new Date(), lockedBy: userId, updatedBy: userId },
    });
  }

  async setBaseline(versionId: string, projectId: string, tenantId: string, userId: string) {
    const version = await this.prisma.budgetVersion.findFirst({
      where: { id: versionId, projectId, tenantId },
    });
    if (!version) throw new NotFoundException('Budget version not found');

    // Clear old baseline for this project
    await this.prisma.budgetVersion.updateMany({
      where: { projectId, isBaseline: true },
      data: { isBaseline: false },
    });

    return this.prisma.budgetVersion.update({
      where: { id: versionId },
      data: { isBaseline: true, isLocked: true, lockedAt: new Date(), lockedBy: userId, updatedBy: userId },
    });
  }

  async getSummary(projectId: string, tenantId: string) {
    const versions = await this.prisma.budgetVersion.findMany({
      where: { projectId, tenantId },
      orderBy: { version: 'asc' },
    });

    return versions.map((v) => ({
      id: v.id,
      version: v.version,
      name: v.name,
      isBaseline: v.isBaseline,
      isLocked: v.isLocked,
      totalRAB: v.totalRAB,
      totalRAP: v.totalRAP,
      margin: v.margin,
      marginPct: v.marginPct,
    }));
  }

  private async recalcVersionTotals(versionId: string) {
    const lines = await this.prisma.rABLine.findMany({
      where: { budgetVersionId: versionId, parentId: null },
    });

    const totalRAB = lines.reduce((s, l) => s.plus(l.rabAmount.toString()), new Decimal(0));
    const totalRAP = lines.reduce((s, l) => s.plus(l.rapAmount.toString()), new Decimal(0));
    const margin = totalRAB.minus(totalRAP);
    const marginPct = totalRAB.gt(0)
      ? margin.div(totalRAB).times(100).toDecimalPlaces(2)
      : new Decimal(0);

    await this.prisma.budgetVersion.update({
      where: { id: versionId },
      data: {
        totalRAB: totalRAB.toDecimalPlaces(2).toNumber(),
        totalRAP: totalRAP.toDecimalPlaces(2).toNumber(),
        margin: margin.toDecimalPlaces(2).toNumber(),
        marginPct: marginPct.toNumber(),
      },
    });
  }
}
