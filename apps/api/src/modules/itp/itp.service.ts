import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateITPTemplateDto, CreateInspectionRecordDto, ITPQueryDto } from './dto/itp.dto';

@Injectable()
export class ITPService {
  constructor(private prisma: PrismaService) {}

  async createTemplate(dto: CreateITPTemplateDto, tenantId: string, userId: string) {
    return this.prisma.iTPTemplate.create({
      data: {
        tenantId, code: dto.code, name: dto.name, discipline: dto.discipline,
        createdBy: userId,
        items: dto.items ? {
          create: dto.items.map((item, i) => ({
            itemNo: item.itemNo, activity: item.activity,
            inspectionType: item.inspectionType as any,
            referenceDoc: item.referenceDoc,
            acceptanceCriteria: item.acceptanceCriteria,
            responsibilityContractor: item.responsibilityContractor ?? true,
            responsibilityClient: item.responsibilityClient ?? false,
            sortOrder: i,
          })),
        } : undefined,
      },
      include: { items: true },
    });
  }

  async findAllTemplates(tenantId: string) {
    return this.prisma.iTPTemplate.findMany({
      where: { tenantId, isActive: true },
      include: { _count: { select: { items: true } } },
      orderBy: { code: 'asc' },
    });
  }

  async getTemplate(id: string, tenantId: string) {
    const t = await this.prisma.iTPTemplate.findFirst({
      where: { id, tenantId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!t) throw new NotFoundException('Template ITP tidak ditemukan');
    return t;
  }

  async createRecord(dto: CreateInspectionRecordDto, tenantId: string, userId: string) {
    const recordNo = await this.generateRecordNo(tenantId, dto.projectId);
    return this.prisma.inspectionRecord.create({
      data: {
        tenantId, projectId: dto.projectId, recordNo, title: dto.title,
        templateId: dto.templateId ?? null,
        wbsNodeId: dto.wbsNodeId ?? null,
        createdBy: userId,
        checkItems: dto.checkItems ? {
          create: dto.checkItems.map((c, i) => ({
            description: c.description,
            result: c.result as any ?? null,
            remark: c.remark,
            sortOrder: i,
          })),
        } : undefined,
      },
      include: { checkItems: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findAllRecords(tenantId: string, query: ITPQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.inspectionRecord.findMany({
        where,
        include: {
          project: { select: { code: true, name: true } },
          template: { select: { code: true, name: true } },
          _count: { select: { checkItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.inspectionRecord.count({ where }),
    ]);
    return { items, total };
  }

  async closeRecord(id: string, tenantId: string, userId: string, status: string, remarks?: string) {
    const rec = await this.prisma.inspectionRecord.findFirst({ where: { id, tenantId } });
    if (!rec) throw new NotFoundException('Rekaman inspeksi tidak ditemukan');
    return this.prisma.inspectionRecord.update({
      where: { id },
      data: { status: status as any, inspectedBy: userId, inspectedAt: new Date(), remarks },
    });
  }

  private async generateRecordNo(tenantId: string, projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'ITP', projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'ITP', projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `ITP-${project?.code ?? 'PRJ'}-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }
}
