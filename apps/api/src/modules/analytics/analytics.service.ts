import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(tenantId: string) {
    const [
      totalProjects,
      activeProjects,
      totalJobs,
      openJobs,
      overdueJobs,
      openNCRs,
      openRFIs,
      pendingClaims,
      recentJobs,
      projectSummary,
    ] = await Promise.all([
      this.prisma.project.count({ where: { tenantId } }),
      this.prisma.project.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.job.count({ where: { tenantId, isDeleted: false } }),
      this.prisma.job.count({ where: { tenantId, isDeleted: false, status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      this.prisma.job.count({
        where: {
          tenantId,
          isDeleted: false,
          status: { notIn: ['CLOSED', 'CANCELLED'] },
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.nCR.count({ where: { tenantId, status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      this.prisma.rFI.count({ where: { tenantId, status: { in: ['DRAFT', 'ISSUED'] } } }),
      this.prisma.progressClaim.count({ where: { tenantId, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      this.prisma.job.findMany({
        where: { tenantId, isDeleted: false },
        select: { id: true, jobNo: true, title: true, status: true, priority: true, dueDate: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.project.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: {
          id: true,
          code: true,
          name: true,
          contractValue: true,
          startDate: true,
          endDate: true,
          _count: { select: { jobs: true, wbsNodes: true } },
        },
        take: 5,
      }),
    ]);

    const jobsByStatus = await this.prisma.job.groupBy({
      by: ['status'],
      where: { tenantId, isDeleted: false },
      _count: true,
    });

    const ncrBySeverity = await this.prisma.nCR.groupBy({
      by: ['severity'],
      where: { tenantId },
      _count: true,
    });

    return {
      summary: {
        totalProjects,
        activeProjects,
        totalJobs,
        openJobs,
        overdueJobs,
        openNCRs,
        openRFIs,
        pendingClaims,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobsByStatus: jobsByStatus.map((j: any) => ({ status: j.status, count: j._count })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ncrBySeverity: ncrBySeverity.map((n: any) => ({ severity: n.severity, count: n._count })),
      recentJobs,
      activeProjects: projectSummary,
    };
  }

  async getProjectEVM(projectId: string, tenantId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      include: {
        wbsNodes: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
            weight: true,
            progressPct: true,
            earnedValue: true,
            actualCost: true,
          },
        },
        budgetVersions: {
          where: { isBaseline: true },
          select: { totalRAB: true, totalRAP: true, version: true },
          take: 1,
        },
      },
    });
    if (!project) return null;

    const baseline = project.budgetVersions[0];
    const bac = baseline ? new Decimal(baseline.totalRAB.toString()) : new Decimal(0);

    // EVM: aggregate WBS nodes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalEV = project.wbsNodes.reduce((acc: Decimal, n: any) => acc.plus(n.earnedValue.toString()), new Decimal(0));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalAC = project.wbsNodes.reduce((acc: Decimal, n: any) => acc.plus(n.actualCost.toString()), new Decimal(0));

    // PV: proportional to schedule (simplified: linear interpolation)
    const now = new Date();
    let pv = new Decimal(0);
    if (project.startDate && project.endDate) {
      const totalDays = (project.endDate.getTime() - project.startDate.getTime()) / 86400000;
      const elapsed = (now.getTime() - project.startDate.getTime()) / 86400000;
      const schedulePct = Math.max(0, Math.min(1, elapsed / totalDays));
      pv = bac.times(schedulePct);
    }

    const spi = pv.isZero() ? new Decimal(0) : totalEV.div(pv);
    const cpi = totalAC.isZero() ? new Decimal(0) : totalEV.div(totalAC);
    const eac = cpi.isZero() ? bac : bac.div(cpi);
    const etcAmount = eac.minus(totalAC);
    const vac = bac.minus(eac);

    return {
      project: { id: project.id, code: project.code, name: project.name },
      evm: {
        bac: bac.toFixed(2),
        pv: pv.toFixed(2),
        ev: totalEV.toFixed(2),
        ac: totalAC.toFixed(2),
        spi: spi.toFixed(4),
        cpi: cpi.toFixed(4),
        eac: eac.toFixed(2),
        etc: etcAmount.toFixed(2),
        vac: vac.toFixed(2),
        svAmount: totalEV.minus(pv).toFixed(2),
        cvAmount: totalEV.minus(totalAC).toFixed(2),
      },
      wbsNodes: project.wbsNodes,
    };
  }

  async getBudgetVsActual(projectId: string, tenantId: string) {
    const [baseline, claims] = await Promise.all([
      this.prisma.budgetVersion.findFirst({
        where: { projectId, tenantId, isBaseline: true },
        include: {
          rabLines: {
            select: {
              id: true,
              description: true,
              wbsNodeId: true,
              rabAmount: true,
              rapAmount: true,
              laborCost: true,
              materialCost: true,
              equipmentCost: true,
            },
          },
        },
      }),
      this.prisma.progressClaim.findMany({
        where: { projectId, tenantId, status: { in: ['CERTIFIED', 'PAID'] } },
        select: { claimNo: true, dppAmount: true, netCashIn: true, claimPeriodEnd: true, thisPeriodPct: true, cumulativePct: true },
        orderBy: { claimPeriodEnd: 'asc' },
      }),
    ]);

    return { baseline, claims };
  }
}
