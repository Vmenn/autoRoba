import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIncidentDto, CreatePTWDto, HSEQueryDto } from './dto/hse.dto';

@Injectable()
export class HSEService {
  constructor(private prisma: PrismaService) {}

  async createIncident(dto: CreateIncidentDto, tenantId: string, userId: string) {
    const incidentNo = await this.generateNo(tenantId, dto.projectId, 'INC');
    return this.prisma.safetyIncident.create({
      data: {
        tenantId, projectId: dto.projectId,
        incidentNo, title: dto.title, description: dto.description,
        incidentDate: new Date(dto.incidentDate),
        location: dto.location,
        severity: dto.severity as any,
        injuredPersons: dto.injuredPersons ?? 0,
        lostTimeDays: dto.lostTimeDays ?? 0,
        reportedBy: userId,
      },
    });
  }

  async findAllIncidents(tenantId: string, query: HSEQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.safetyIncident.findMany({
        where,
        include: { project: { select: { code: true, name: true } } },
        orderBy: { incidentDate: 'desc' },
        take: 100,
      }),
      this.prisma.safetyIncident.count({ where }),
    ]);
    return { items, total };
  }

  async getIncident(id: string, tenantId: string) {
    const incident = await this.prisma.safetyIncident.findFirst({ where: { id, tenantId } });
    if (!incident) throw new NotFoundException('Insiden tidak ditemukan');
    return incident;
  }

  async closeIncident(id: string, tenantId: string, userId: string, rootCause: string, correctiveAction: string) {
    await this.getIncident(id, tenantId);
    return this.prisma.safetyIncident.update({
      where: { id },
      data: { status: 'CLOSED', closedBy: userId, closedAt: new Date(), rootCause, correctiveAction },
    });
  }

  async getHSEStats(tenantId: string, projectId?: string) {
    const where: any = { tenantId };
    if (projectId) where.projectId = projectId;
    const [total, bySeverity, lostDays] = await Promise.all([
      this.prisma.safetyIncident.count({ where }),
      this.prisma.safetyIncident.groupBy({ by: ['severity'], where, _count: true }),
      this.prisma.safetyIncident.aggregate({ where, _sum: { lostTimeDays: true, injuredPersons: true } }),
    ]);
    return {
      totalIncidents: total,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bySeverity: bySeverity.map((s: any) => ({ severity: s.severity, count: s._count })),
      totalLostDays: lostDays._sum.lostTimeDays ?? 0,
      totalInjured: lostDays._sum.injuredPersons ?? 0,
    };
  }

  async createPTW(dto: CreatePTWDto, tenantId: string, userId: string) {
    const permitNo = await this.generateNo(tenantId, dto.projectId, 'PTW');
    return this.prisma.permitToWork.create({
      data: {
        tenantId, projectId: dto.projectId, permitNo,
        permitType: dto.permitType, workActivity: dto.workActivity,
        location: dto.location,
        validFrom: new Date(dto.validFrom), validTo: new Date(dto.validTo),
        riskAssessment: dto.riskAssessment,
        requestedBy: userId,
      },
    });
  }

  async findAllPTW(tenantId: string, query: HSEQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    return this.prisma.permitToWork.findMany({
      where,
      include: { project: { select: { code: true, name: true } } },
      orderBy: { validFrom: 'desc' },
      take: 100,
    });
  }

  private async generateNo(tenantId: string, projectId: string, prefix: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix, projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix, projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `${prefix}-${project?.code ?? 'PRJ'}-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }
}
