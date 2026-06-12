import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckInDto, CheckOutDto, AttendanceQueryDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(dto: CheckInDto, tenantId: string, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing?.checkInTime) {
      throw new BadRequestException('Sudah check-in hari ini');
    }

    const now = new Date();
    const isLate = now.getHours() >= 9;

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkInTime: now,
          checkInLat: dto.latitude,
          checkInLng: dto.longitude,
          projectId: dto.projectId,
          status: isLate ? 'LATE' : 'PRESENT',
        },
      });
    }

    return this.prisma.attendance.create({
      data: {
        tenantId,
        userId,
        projectId: dto.projectId,
        date: today,
        checkInTime: now,
        checkInLat: dto.latitude,
        checkInLng: dto.longitude,
        status: isLate ? 'LATE' : 'PRESENT',
        notes: dto.notes,
      },
    });
  }

  async checkOut(dto: CheckOutDto, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (!record?.checkInTime) throw new BadRequestException('Belum check-in hari ini');
    if (record.checkOutTime) throw new BadRequestException('Sudah check-out hari ini');

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOutTime: new Date(),
        checkOutLat: dto.latitude,
        checkOutLng: dto.longitude,
      },
    });
  }

  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
      include: { project: { select: { code: true, name: true } } },
    });
  }

  async findReport(tenantId: string, query: AttendanceQueryDto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where: where as any,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          project: { select: { code: true, name: true } },
        },
        orderBy: [{ date: 'desc' }, { user: { firstName: 'asc' } }],
        take: 200,
      }),
      this.prisma.attendance.count({ where: where as any }),
    ]);
    return { items, total };
  }

  async findAll(tenantId: string, userId: string, query: AttendanceQueryDto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { tenantId, userId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = new Date(query.from);
      if (query.to) where.date.lte = new Date(query.to);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: where as any,
        include: { project: { select: { code: true, name: true } } },
        orderBy: { date: 'desc' },
        take: 30,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.prisma.attendance.count({ where: where as any }),
    ]);
    return { items, total };
  }
}
