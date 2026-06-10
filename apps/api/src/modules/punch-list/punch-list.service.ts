import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePunchListDto, PunchQueryDto } from './dto/punch-list.dto';

@Injectable()
export class PunchListService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePunchListDto, tenantId: string, userId: string) {
    const listNumber = await this.generateNo(tenantId, dto.projectId);
    const list = await this.prisma.punchList.create({
      data: {
        tenantId, projectId: dto.projectId,
        listNumber, title: dto.title,
        system: dto.system, discipline: dto.discipline,
        walkdownDate: dto.walkdownDate ? new Date(dto.walkdownDate) : null,
        createdBy: userId,
        items: dto.items ? {
          create: dto.items.map((item, i) => ({
            itemNo: String(i + 1).padStart(3, '0'),
            description: item.description,
            category: item.category as any,
            location: item.location,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            raisedBy: userId,
          })),
        } : undefined,
      },
      include: { items: true, _count: { select: { items: true } } },
    });
    return list;
  }

  async findAll(tenantId: string, query: PunchQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.punchList.findMany({
        where,
        include: {
          project: { select: { code: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.punchList.count({ where }),
    ]);
    return { items, total };
  }

  async getList(id: string, tenantId: string) {
    const list = await this.prisma.punchList.findFirst({
      where: { id, tenantId },
      include: {
        items: { orderBy: [{ category: 'asc' }, { itemNo: 'asc' }] },
        project: { select: { code: true, name: true } },
      },
    });
    if (!list) throw new NotFoundException('Punch List tidak ditemukan');
    return list;
  }

  async clearItem(listId: string, itemId: string, tenantId: string, userId: string) {
    const list = await this.prisma.punchList.findFirst({ where: { id: listId, tenantId } });
    if (!list) throw new NotFoundException('Punch List tidak ditemukan');
    return this.prisma.punchItem.update({
      where: { id: itemId },
      data: { status: 'CLEARED', clearedBy: userId, clearedAt: new Date() },
    });
  }

  async acceptItem(listId: string, itemId: string, tenantId: string, userId: string) {
    const list = await this.prisma.punchList.findFirst({ where: { id: listId, tenantId } });
    if (!list) throw new NotFoundException('Punch List tidak ditemukan');
    return this.prisma.punchItem.update({
      where: { id: itemId },
      data: { status: 'ACCEPTED', acceptedBy: userId, acceptedAt: new Date() },
    });
  }

  async addItem(listId: string, tenantId: string, userId: string, dto: { description: string; category: string; location?: string; dueDate?: string }) {
    const list = await this.prisma.punchList.findFirst({ where: { id: listId, tenantId } });
    if (!list) throw new NotFoundException('Punch List tidak ditemukan');
    const count = await this.prisma.punchItem.count({ where: { listId } });
    return this.prisma.punchItem.create({
      data: {
        listId, itemNo: String(count + 1).padStart(3, '0'),
        description: dto.description, category: dto.category as any,
        location: dto.location, dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        raisedBy: userId,
      },
    });
  }

  private async generateNo(tenantId: string, projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'PL', projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'PL', projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `PL-${project?.code ?? 'PRJ'}-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }
}
