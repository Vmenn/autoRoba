import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSnapshotDto } from './dto/s-curve.dto';

@Injectable()
export class SCurveService {
  constructor(private prisma: PrismaService) {}

  async upsertSnapshot(dto: CreateSnapshotDto, tenantId: string, userId: string) {
    const date = new Date(dto.snapshotDate);
    date.setUTCHours(0, 0, 0, 0);
    return this.prisma.progressSnapshot.upsert({
      where: { projectId_snapshotDate: { projectId: dto.projectId, snapshotDate: date } },
      update: {
        plannedPct: dto.plannedPct, actualPct: dto.actualPct,
        plannedValue: dto.plannedValue, earnedValue: dto.earnedValue,
        actualCost: dto.actualCost,
      },
      create: {
        tenantId, projectId: dto.projectId, snapshotDate: date,
        plannedPct: dto.plannedPct, actualPct: dto.actualPct,
        plannedValue: dto.plannedValue, earnedValue: dto.earnedValue,
        actualCost: dto.actualCost, createdBy: userId,
      },
    });
  }

  async getSCurve(projectId: string, tenantId: string) {
    const snapshots = await this.prisma.progressSnapshot.findMany({
      where: { projectId, tenantId },
      orderBy: { snapshotDate: 'asc' },
    });

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { code: true, name: true, startDate: true, endDate: true, contractValue: true },
    });

    return {
      project,
      snapshots: snapshots.map((s) => ({
        date: s.snapshotDate.toISOString().slice(0, 10),
        plannedPct: Number(s.plannedPct),
        actualPct: Number(s.actualPct),
        plannedValue: Number(s.plannedValue),
        earnedValue: Number(s.earnedValue),
        actualCost: Number(s.actualCost),
        spi: Number(s.plannedValue) > 0 ? Number(s.earnedValue) / Number(s.plannedValue) : null,
        cpi: Number(s.actualCost) > 0 ? Number(s.earnedValue) / Number(s.actualCost) : null,
      })),
    };
  }

  async getAllProjectsSummary(tenantId: string) {
    const projects = await this.prisma.project.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true, code: true, name: true },
    });

    const summaries = await Promise.all(
      projects.map(async (p) => {
        const latest = await this.prisma.progressSnapshot.findFirst({
          where: { projectId: p.id, tenantId },
          orderBy: { snapshotDate: 'desc' },
        });
        return {
          projectId: p.id, code: p.code, name: p.name,
          latestDate: latest?.snapshotDate?.toISOString().slice(0, 10) ?? null,
          plannedPct: latest ? Number(latest.plannedPct) : 0,
          actualPct: latest ? Number(latest.actualPct) : 0,
          deviation: latest ? Number(latest.actualPct) - Number(latest.plannedPct) : 0,
        };
      }),
    );
    return summaries;
  }
}
