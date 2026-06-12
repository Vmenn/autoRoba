import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReimbursementDto, ReviewReimbursementDto, ReimbursementQueryDto } from './dto/reimbursement.dto';

@Injectable()
export class ReimbursementService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReimbursementDto, tenantId: string, userId: string) {
    const claimNo = await this.generateNo(tenantId);
    return this.prisma.reimbursement.create({
      data: {
        tenantId,
        userId,
        claimNo,
        category: dto.category as any,
        amount: new Decimal(dto.amount).toDecimalPlaces(2).toNumber(),
        description: dto.description,
        expenseDate: new Date(dto.expenseDate),
        receiptKey: dto.receiptUri,
        status: 'SUBMITTED',
      },
    });
  }

  async findAll(tenantId: string, userId: string, query: ReimbursementQueryDto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { tenantId, userId };
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;

    const [items, total] = await this.prisma.$transaction([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.prisma.reimbursement.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: where as any,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.prisma.reimbursement.count({ where: where as any }),
    ]);
    return { items, total };
  }

  async findOne(id: string, tenantId: string) {
    const r = await this.prisma.reimbursement.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Reimbursement tidak ditemukan');
    return r;
  }

  async review(id: string, dto: ReviewReimbursementDto, reviewerId: string, tenantId: string) {
    const r = await this.findOne(id, tenantId);
    if (!['SUBMITTED', 'DRAFT'].includes(r.status)) throw new BadRequestException('Status tidak valid untuk review');
    const data: any = { status: dto.action };
    if (dto.action === 'APPROVED') { data.approvedBy = reviewerId; data.approvedAt = new Date(); }
    if (dto.action === 'REJECTED') { data.rejectedBy = reviewerId; data.rejectedAt = new Date(); data.rejectReason = dto.rejectReason; }
    return this.prisma.reimbursement.update({ where: { id }, data });
  }

  async findPending(tenantId: string) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.reimbursement.findMany({
        where: { tenantId, status: 'SUBMITTED' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'asc' },
        take: 100,
      }),
      this.prisma.reimbursement.count({ where: { tenantId, status: 'SUBMITTED' } }),
    ]);
    return { items, total };
  }

  async findAllTenant(tenantId: string, query: ReimbursementQueryDto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    const [items, total] = await this.prisma.$transaction([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.prisma.reimbursement.findMany({
        where: where as any,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.prisma.reimbursement.count({ where: where as any }),
    ]);
    return { items, total };
  }

  async markPaid(id: string, tenantId: string) {
    const r = await this.findOne(id, tenantId);
    if (r.status !== 'APPROVED') throw new BadRequestException('Hanya status APPROVED yang bisa dibayar');
    return this.prisma.reimbursement.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } });
  }

  private async generateNo(tenantId: string): Promise<string> {
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'RBM', projectCode: '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'RBM', projectCode: '', yearMonth: ym, lastSeq: 1 },
    });
    return `RBM-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }
}
