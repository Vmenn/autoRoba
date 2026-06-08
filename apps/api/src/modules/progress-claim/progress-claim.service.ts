import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { TaxEngineService } from '../tax/tax-engine.service';
import { CreateProgressClaimDto, ProgressClaimQueryDto } from './dto/progress-claim.dto';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

@Injectable()
export class ProgressClaimService {
  constructor(
    private prisma: PrismaService,
    private taxEngine: TaxEngineService,
  ) {}

  async create(dto: CreateProgressClaimDto, tenantId: string, userId: string) {
    const claimNo = await this.generateNo(tenantId, dto.projectId);

    // Calculate line amounts
    const processedLines = dto.lines.map((line) => {
      const contractAmount = new Decimal(line.contractQty).times(line.contractRate);
      const prevAmt = contractAmount.times(line.prevClaimedPct).div(100);
      const thisAmt = contractAmount.times(line.thisClaimPct).div(100);
      const cumulativePct = new Decimal(line.prevClaimedPct).plus(line.thisClaimPct);
      const cumulativeAmt = prevAmt.plus(thisAmt);
      return {
        wbsNodeId: line.wbsNodeId,
        rabLineId: line.rabLineId,
        description: line.description,
        unit: line.unit,
        contractQty: line.contractQty,
        contractRate: line.contractRate,
        contractAmount: contractAmount.toDecimalPlaces(2).toNumber(),
        prevClaimedPct: line.prevClaimedPct,
        prevClaimedAmt: prevAmt.toDecimalPlaces(2).toNumber(),
        thisClaimPct: line.thisClaimPct,
        thisClaimQty: new Decimal(line.contractQty).times(line.thisClaimPct).div(100).toDecimalPlaces(4).toNumber(),
        thisClaimAmt: thisAmt.toDecimalPlaces(2).toNumber(),
        cumulativePct: cumulativePct.toDecimalPlaces(2).toNumber(),
        cumulativeAmt: cumulativeAmt.toDecimalPlaces(2).toNumber(),
        evidenceNotes: line.evidenceNotes,
      };
    });

    // DPP = sum of thisClaimAmt
    const dpp = processedLines.reduce((acc, l) => acc.plus(l.thisClaimAmt), new Decimal(0));
    const totalContractAmt = processedLines.reduce((acc, l) => acc.plus(l.contractAmount), new Decimal(0));
    const thisPeriodPct = totalContractAmt.isZero() ? new Decimal(0) : dpp.div(totalContractAmt).times(100);

    // Tax calculation
    const taxResult = await this.taxEngine.calculateProgressClaim({
      dpp: dpp.toNumber(),
      taxRateCode: dto.taxRateCode,
      recoupmentPct: dto.recoupmentPct ?? 0,
      retentionPct: dto.retentionPct ?? 5,
    });

    const contractValue = new Decimal(dto.contractValue);
    const prevCumulative = await this.prisma.progressClaim.aggregate({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { projectId: dto.projectId, status: { in: ['APPROVED', 'CERTIFIED', 'PAID'] as any[] } },
      _sum: { thisPeriodPct: true },
    });
    const prevPct = new Decimal(prevCumulative._sum.thisPeriodPct?.toString() ?? 0);
    const cumulativePct = prevPct.plus(thisPeriodPct);

    return this.prisma.progressClaim.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        budgetVersionId: dto.budgetVersionId,
        claimNo,
        claimPeriodStart: new Date(dto.claimPeriodStart),
        claimPeriodEnd: new Date(dto.claimPeriodEnd),
        contractValue: contractValue.toNumber(),
        cumulativePct: cumulativePct.toDecimalPlaces(2).toNumber(),
        thisPeriodPct: thisPeriodPct.toDecimalPlaces(2).toNumber(),
        dppAmount: parseFloat(taxResult.dpp),
        ppnAmount: parseFloat(taxResult.ppn.amount),
        pphAmount: parseFloat(taxResult.pphFinal.amount),
        recoupmentAmount: parseFloat(taxResult.recoupment),
        retentionAmount: parseFloat(taxResult.retention),
        netCashIn: parseFloat(taxResult.netCashIn),
        taxCalculation: taxResult as any,
        taxRateCode: dto.taxRateCode,
        recoupmentPct: dto.recoupmentPct ?? 0,
        retentionPct: dto.retentionPct ?? 5,
        notes: dto.notes,
        createdBy: userId,
        lines: { createMany: { data: processedLines } },
      },
      include: { lines: true },
    });
  }

  async findAll(tenantId: string, query: ProgressClaimQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.progressClaim.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: where as any,
        include: {
          project: { select: { code: true, name: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.prisma.progressClaim.count({ where: where as any }),
    ]);
    return { items, total };
  }

  async findOne(id: string, tenantId: string) {
    const claim = await this.prisma.progressClaim.findFirst({
      where: { id, tenantId },
      include: { lines: { include: { wbsNode: { select: { code: true, name: true } } } } },
    });
    if (!claim) throw new NotFoundException('Progress claim tidak ditemukan');
    return claim;
  }

  async transition(id: string, toStatus: string, tenantId: string, userId: string) {
    const claim = await this.findOne(id, tenantId);
    const transitions: Record<string, string[]> = {
      DRAFT: ['SUBMITTED', 'VOID'],
      SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
      UNDER_REVIEW: ['APPROVED', 'REJECTED'],
      APPROVED: ['CERTIFIED', 'REJECTED'],
      CERTIFIED: ['PAID'],
      REJECTED: ['DRAFT'],
      PAID: [],
      VOID: [],
    };
    if (!transitions[claim.status]?.includes(toStatus)) {
      throw new BadRequestException(`Transisi ${claim.status} → ${toStatus} tidak valid`);
    }
    const updates: any = { status: toStatus as any };
    if (toStatus === 'SUBMITTED') { updates.submittedBy = userId; updates.submittedAt = new Date(); }
    if (toStatus === 'APPROVED') { updates.approvedBy = userId; updates.approvedAt = new Date(); }
    if (toStatus === 'CERTIFIED') { updates.certifiedBy = userId; updates.certifiedAt = new Date(); }
    return this.prisma.progressClaim.update({ where: { id }, data: updates });
  }

  private async generateNo(tenantId: string, projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'CLM', projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'CLM', projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `CLM-${project?.code ?? 'PRJ'}-${ym}-${String(seq.lastSeq).padStart(3, '0')}`;
  }
}
