import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyLogDto, DailyLogQueryDto } from './dto/daily-log.dto';

@Injectable()
export class DailyLogService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDailyLogDto, tenantId: string, userId: string) {
    const logDate = new Date(dto.logDate);
    const existing = await this.prisma.dailyLog.findUnique({
      where: { projectId_logDate: { projectId: dto.projectId, logDate } },
    });
    if (existing) throw new ConflictException('Log harian untuk tanggal ini sudah ada');

    return this.prisma.dailyLog.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        logDate,
        weather: dto.weather,
        manpowerCount: dto.manpowerCount ?? 0,
        workSummary: dto.workSummary,
        issues: dto.issues,
        materials: dto.materials ?? [],
        equipment: dto.equipment ?? [],
        preparedBy: userId,
      },
    });
  }

  async findAll(tenantId: string, query: DailyLogQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.from || query.to) {
      where.logDate = {};
      if (query.from) where.logDate.gte = new Date(query.from);
      if (query.to) where.logDate.lte = new Date(query.to);
    }
    return this.prisma.dailyLog.findMany({
      where,
      include: { project: { select: { code: true, name: true } } },
      orderBy: { logDate: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string, tenantId: string) {
    const log = await this.prisma.dailyLog.findFirst({ where: { id, tenantId } });
    if (!log) throw new NotFoundException('Log harian tidak ditemukan');
    return log;
  }

  async update(id: string, dto: Partial<CreateDailyLogDto>, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.dailyLog.update({
      where: { id },
      data: {
        weather: dto.weather,
        manpowerCount: dto.manpowerCount,
        workSummary: dto.workSummary,
        issues: dto.issues,
        materials: dto.materials,
        equipment: dto.equipment,
      },
    });
  }
}
