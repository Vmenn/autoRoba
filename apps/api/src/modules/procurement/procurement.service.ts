import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePODto, POQueryDto } from './dto/procurement.dto';

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  async createPO(dto: CreatePODto, tenantId: string, userId: string) {
    const poNo = await this.generatePONo(tenantId, dto.projectId);
    const totalAmount = dto.lines.reduce(
      (sum, l) => sum.plus(new Decimal(l.quantity).times(l.unitPrice)),
      new Decimal(0),
    );
    return this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        poNo,
        vendorName: dto.vendorName,
        vendorNPWP: dto.vendorNPWP,
        subject: dto.subject,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
        totalAmount: totalAmount.toNumber(),
        notes: dto.notes,
        createdBy: userId,
        lines: {
          createMany: {
            data: dto.lines.map((l) => ({
              itemCode: l.itemCode,
              description: l.description,
              unit: l.unit,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              totalPrice: new Decimal(l.quantity).times(l.unitPrice).toNumber(),
              wbsNodeId: l.wbsNodeId,
              notes: l.notes,
            })),
          },
        },
      },
      include: { lines: true },
    });
  }

  async findAll(tenantId: string, query: POQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          project: { select: { code: true, name: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string, tenantId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { lines: true, project: { select: { code: true, name: true } } },
    });
    if (!po) throw new NotFoundException('PO tidak ditemukan');
    return po;
  }

  async transition(id: string, toStatus: string, tenantId: string, userId: string) {
    const po = await this.findOne(id, tenantId);
    const allowed: Record<string, string[]> = {
      DRAFT: ['SUBMITTED'],
      SUBMITTED: ['APPROVED', 'DRAFT'],
      APPROVED: ['ISSUED'],
      ISSUED: ['PARTIAL_RECEIVED', 'FULLY_RECEIVED', 'CANCELLED'],
      PARTIAL_RECEIVED: ['FULLY_RECEIVED'],
      FULLY_RECEIVED: [],
      CANCELLED: [],
    };
    if (!allowed[po.status]?.includes(toStatus)) {
      throw new BadRequestException(`Transisi ${po.status} → ${toStatus} tidak valid`);
    }
    const updates: any = { status: toStatus as any };
    if (toStatus === 'APPROVED') { updates.approvedBy = userId; updates.approvedAt = new Date(); }
    if (toStatus === 'ISSUED') updates.issueDate = new Date();
    return this.prisma.purchaseOrder.update({ where: { id }, data: updates });
  }

  private async generatePONo(tenantId: string, projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'PO', projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'PO', projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `PO-${project?.code ?? 'PRJ'}-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }
}
