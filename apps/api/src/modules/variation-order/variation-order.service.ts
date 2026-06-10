import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVODto, VOQueryDto } from './dto/vo.dto';

@Injectable()
export class VariationOrderService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVODto, tenantId: string, userId: string) {
    const voNumber = await this.generateNo(tenantId, dto.projectId);
    return this.prisma.variationOrder.create({
      data: {
        tenantId, projectId: dto.projectId, voNumber,
        title: dto.title, description: dto.description,
        type: dto.type as any,
        valueRAB: dto.valueRAB ?? 0, valueRAP: dto.valueRAP ?? 0,
        impactDays: dto.impactDays ?? 0,
        submittedBy: userId,
      },
    });
  }

  async findAll(tenantId: string, query: VOQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.variationOrder.findMany({
        where,
        include: { project: { select: { code: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.variationOrder.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string, tenantId: string) {
    const vo = await this.prisma.variationOrder.findFirst({
      where: { id, tenantId },
      include: { project: { select: { code: true, name: true } } },
    });
    if (!vo) throw new NotFoundException('Variation Order tidak ditemukan');
    return vo;
  }

  async submit(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.variationOrder.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedBy: userId, submittedAt: new Date() },
    });
  }

  async approve(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.variationOrder.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
    });
  }

  async reject(id: string, tenantId: string, userId: string, reason: string) {
    await this.findOne(id, tenantId);
    return this.prisma.variationOrder.update({
      where: { id },
      data: { status: 'REJECTED', rejectedBy: userId, rejectedAt: new Date(), rejectReason: reason },
    });
  }

  private async generateNo(tenantId: string, projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'VO', projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'VO', projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `VO-${project?.code ?? 'PRJ'}-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }
}
