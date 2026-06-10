import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaveDto, ReviewLeaveDto, LeaveQueryDto } from './dto/leave.dto';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLeaveDto, tenantId: string, userId: string) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException('Tanggal selesai harus setelah tanggal mulai');

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return this.prisma.leaveRequest.create({
      data: {
        tenantId,
        userId,
        leaveType: dto.leaveType as any,
        startDate: start,
        endDate: end,
        totalDays,
        reason: dto.reason,
      },
    });
  }

  async findAll(tenantId: string, userId: string, query: LeaveQueryDto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { tenantId, userId };
    if (query.status) where.status = query.status;
    if (query.leaveType) where.leaveType = query.leaveType;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.leaveRequest.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: where as any,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.prisma.leaveRequest.count({ where: where as any }),
    ]);
    return { items, total };
  }

  async cancel(id: string, userId: string) {
    const leave = await this.prisma.leaveRequest.findFirst({ where: { id, userId } });
    if (!leave) throw new NotFoundException('Pengajuan tidak ditemukan');
    if (leave.status !== 'PENDING') throw new BadRequestException('Hanya pengajuan berstatus PENDING yang bisa dibatalkan');
    return this.prisma.leaveRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async review(id: string, dto: ReviewLeaveDto, reviewerId: string, tenantId: string) {
    const leave = await this.prisma.leaveRequest.findFirst({ where: { id, tenantId } });
    if (!leave) throw new NotFoundException('Pengajuan tidak ditemukan');
    if (leave.status !== 'PENDING') throw new BadRequestException('Pengajuan sudah diproses');

    const data: any = { status: dto.action };
    if (dto.action === 'APPROVED') { data.approvedBy = reviewerId; data.approvedAt = new Date(); }
    if (dto.action === 'REJECTED') { data.rejectedBy = reviewerId; data.rejectedAt = new Date(); data.rejectReason = dto.rejectReason; }
    return this.prisma.leaveRequest.update({ where: { id }, data });
  }
}
