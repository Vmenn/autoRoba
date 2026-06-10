import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubcontractorDto, CreateSPKDto, CreateSPKClaimDto, SubcontractorQueryDto } from './dto/subcontractor.dto';

@Injectable()
export class SubcontractorService {
  constructor(private prisma: PrismaService) {}

  async createSubcontractor(dto: CreateSubcontractorDto, tenantId: string, userId: string) {
    return this.prisma.subcontractor.create({
      data: {
        tenantId, code: dto.code, name: dto.name,
        address: dto.address, phone: dto.phone, email: dto.email,
        npwp: dto.npwp, pkp: dto.pkp ?? false, grade: dto.grade,
        createdBy: userId,
      },
    });
  }

  async findAllSubcontractors(tenantId: string) {
    return this.prisma.subcontractor.findMany({
      where: { tenantId, isActive: true },
      include: { _count: { select: { contracts: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createSPK(dto: CreateSPKDto, tenantId: string, userId: string) {
    const sub = await this.prisma.subcontractor.findFirst({ where: { id: dto.subcontractorId, tenantId } });
    if (!sub) throw new NotFoundException('Subkontraktor tidak ditemukan');
    const spkNumber = await this.generateSPKNo(tenantId, dto.projectId);
    return this.prisma.subContract.create({
      data: {
        tenantId, projectId: dto.projectId, subcontractorId: dto.subcontractorId,
        spkNumber, title: dto.title, scopeOfWork: dto.scopeOfWork,
        contractValue: dto.contractValue,
        startDate: new Date(dto.startDate), endDate: new Date(dto.endDate),
        retention: dto.retention ?? 5, advancePayment: dto.advancePayment ?? 0,
        createdBy: userId,
      },
      include: { subcontractor: { select: { code: true, name: true } } },
    });
  }

  async findAllSPK(tenantId: string, query: SubcontractorQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.subContract.findMany({
        where,
        include: {
          subcontractor: { select: { code: true, name: true } },
          project: { select: { code: true, name: true } },
          _count: { select: { claims: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.subContract.count({ where }),
    ]);
    return { items, total };
  }

  async getSPK(id: string, tenantId: string) {
    const spk = await this.prisma.subContract.findFirst({
      where: { id, tenantId },
      include: {
        subcontractor: true,
        project: { select: { code: true, name: true } },
        claims: { orderBy: { claimDate: 'desc' } },
      },
    });
    if (!spk) throw new NotFoundException('SPK tidak ditemukan');
    return spk;
  }

  async createClaim(contractId: string, dto: CreateSPKClaimDto, tenantId: string, userId: string) {
    const spk = await this.getSPK(contractId, tenantId);
    const claimNo = await this.generateClaimNo(tenantId, spk.projectId);
    return this.prisma.subContractClaim.create({
      data: {
        tenantId, contractId,
        claimNo, claimDate: new Date(dto.claimDate),
        periodFrom: new Date(dto.periodFrom), periodTo: new Date(dto.periodTo),
        claimAmount: dto.claimAmount, progressPct: dto.progressPct,
        createdBy: userId,
      },
    });
  }

  private async generateSPKNo(tenantId: string, projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'SPK', projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'SPK', projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `SPK-${project?.code ?? 'PRJ'}-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }

  private async generateClaimNo(tenantId: string, projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'SPKC', projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'SPKC', projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `SPKC-${project?.code ?? 'PRJ'}-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }
}
