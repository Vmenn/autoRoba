import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditQueryDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUsers(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, isActive: true, lastLoginAt: true, createdAt: true,
        roleAssignments: {
          select: { role: { select: { name: true, code: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => ({
      ...u,
      roles: u.roleAssignments.map((ra: any) => ra.role.name),
    }));
  }

  async toggleUser(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) return null;
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }

  async getAuditLogs(tenantId: string, query: AuditQueryDto) {
    const where: any = { tenantId };
    if (query.resource) where.resource = query.resource;
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    const limit = parseInt(query.limit ?? '100', 10);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where, orderBy: { createdAt: 'desc' }, take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  }

  async writeLog(tenantId: string, userId: string, action: string, resource: string, resourceId?: string, summary?: string) {
    return this.prisma.auditLog.create({
      data: { tenantId, userId, action, resource, resourceId, summary },
    });
  }

  async getTenantStats(tenantId: string) {
    const [users, projects, jobs, ncrs] = await Promise.all([
      this.prisma.user.count({ where: { tenantId, isActive: true } }),
      this.prisma.project.count({ where: { tenantId } }),
      this.prisma.job.count({ where: { tenantId } }),
      this.prisma.nCR.count({ where: { tenantId } }),
    ]);
    return { activeUsers: users, totalProjects: projects, totalJobs: jobs, totalNcrs: ncrs };
  }
}
