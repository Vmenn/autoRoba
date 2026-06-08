import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, type: string, title: string, body?: string, data?: any) {
    return this.prisma.notification.create({
      data: { tenantId, userId, type: type as any, title, body, data },
    });
  }

  async findAll(userId: string, tenantId: string, onlyUnread = false) {
    const where: any = { userId, tenantId };
    if (onlyUnread) where.isRead = false;
    const [items, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({ where: { userId, tenantId, isRead: false } }),
    ]);
    return { items, unreadCount };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string, tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, tenantId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
