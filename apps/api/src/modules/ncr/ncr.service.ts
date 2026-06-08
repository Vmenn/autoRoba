import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNCRDto, UpdateNCRDto, NCRQueryDto } from './dto/ncr.dto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['UNDER_REVIEW', 'VOID'],
  UNDER_REVIEW: ['AWAITING_CLOSURE', 'OPEN', 'VOID'],
  AWAITING_CLOSURE: ['CLOSED', 'UNDER_REVIEW'],
  CLOSED: [],
  VOID: [],
};

@Injectable()
export class NCRService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNCRDto, tenantId: string, userId: string) {
    const ncrNo = await this.generateNo(tenantId, dto.projectId);
    return this.prisma.nCR.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        wbsNodeId: dto.wbsNodeId,
        ncrNo,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        severity: dto.severity,
        location: dto.location,
        discipline: dto.discipline,
        assignedTo: dto.assignedTo,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        raisedBy: userId,
      },
    });
  }

  async findAll(tenantId: string, query: NCRQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.discipline) where.discipline = query.discipline;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.nCR.findMany({
        where,
        include: { project: { select: { code: true, name: true } } },
        orderBy: { raisedAt: 'desc' },
        take: 100,
      }),
      this.prisma.nCR.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string, tenantId: string) {
    const ncr = await this.prisma.nCR.findFirst({ where: { id, tenantId } });
    if (!ncr) throw new NotFoundException('NCR tidak ditemukan');
    return ncr;
  }

  async update(id: string, dto: UpdateNCRDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.nCR.update({
      where: { id },
      data: {
        rootCause: dto.rootCause,
        correctiveAction: dto.correctiveAction,
        preventiveAction: dto.preventiveAction,
        assignedTo: dto.assignedTo,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        closureNotes: dto.closureNotes,
      },
    });
  }

  async transition(id: string, toStatus: string, note: string | undefined, tenantId: string, userId: string) {
    const ncr = await this.findOne(id, tenantId);
    const allowed = VALID_TRANSITIONS[ncr.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(`Transisi ${ncr.status} → ${toStatus} tidak diizinkan`);
    }
    const updates: any = { status: toStatus as any };
    if (toStatus === 'CLOSED') {
      updates.closedBy = userId;
      updates.closedAt = new Date();
    }
    return this.prisma.nCR.update({ where: { id }, data: updates });
  }

  private async generateNo(tenantId: string, projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const prefix = `NCR-${project?.code ?? 'PRJ'}`;
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'NCR', projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'NCR', projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `${prefix}-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }
}
