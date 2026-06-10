import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaterialItemDto, CreateMRDto, MaterialQueryDto } from './dto/material.dto';

@Injectable()
export class MaterialService {
  constructor(private prisma: PrismaService) {}

  async createItem(dto: CreateMaterialItemDto, tenantId: string, userId: string) {
    return this.prisma.materialItem.create({
      data: {
        tenantId, projectId: dto.projectId,
        itemCode: dto.itemCode, description: dto.description,
        unit: dto.unit, spec: dto.spec,
        qtyBudget: dto.qtyBudget ?? 0,
        wbsNodeId: dto.wbsNodeId ?? null,
        createdBy: userId,
      },
    });
  }

  async findItems(tenantId: string, projectId?: string) {
    const where: any = { tenantId };
    if (projectId) where.projectId = projectId;
    return this.prisma.materialItem.findMany({
      where,
      include: { project: { select: { code: true, name: true } } },
      orderBy: { itemCode: 'asc' },
      take: 500,
    });
  }

  async createMR(dto: CreateMRDto, tenantId: string, userId: string) {
    const mrNumber = await this.generateMRNo(tenantId, dto.projectId);
    return this.prisma.materialRequisition.create({
      data: {
        tenantId, projectId: dto.projectId,
        mrNumber, title: dto.title,
        requiredBy: new Date(dto.requiredBy),
        remarks: dto.remarks,
        requestedBy: userId,
        lines: {
          create: dto.lines.map((l) => ({
            materialId: l.materialId,
            qtyRequested: l.qtyRequested,
            remarks: l.remarks,
          })),
        },
      },
      include: { lines: { include: { material: { select: { itemCode: true, description: true, unit: true } } } } },
    });
  }

  async findMRs(tenantId: string, query: MaterialQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.materialRequisition.findMany({
        where,
        include: {
          project: { select: { code: true, name: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.materialRequisition.count({ where }),
    ]);
    return { items, total };
  }

  async getMR(id: string, tenantId: string) {
    const mr = await this.prisma.materialRequisition.findFirst({
      where: { id, tenantId },
      include: {
        lines: { include: { material: true } },
        project: { select: { code: true, name: true } },
      },
    });
    if (!mr) throw new NotFoundException('MR tidak ditemukan');
    return mr;
  }

  async approveMR(id: string, tenantId: string, userId: string) {
    await this.getMR(id, tenantId);
    return this.prisma.materialRequisition.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
    });
  }

  private async generateMRNo(tenantId: string, projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'MR', projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'MR', projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `MR-${project?.code ?? 'PRJ'}-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }
}
