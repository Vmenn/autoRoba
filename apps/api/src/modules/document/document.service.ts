import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddVersionDto, CreateDocumentDto, DocumentQueryDto } from './dto/document.dto';

@Injectable()
export class DocumentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDocumentDto, tenantId: string, userId: string) {
    const docNo = await this.generateNo(tenantId, dto.projectId);
    return this.prisma.document.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        docNo,
        title: dto.title,
        discipline: (dto.discipline ?? 'GENERAL') as any,
        category: dto.category,
        tags: dto.tags ?? [],
        createdBy: userId,
      },
    });
  }

  async findAll(tenantId: string, query: DocumentQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    if (query.discipline) where.discipline = query.discipline;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        include: {
          project: { select: { code: true, name: true } },
          _count: { select: { versions: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.document.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string, tenantId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId },
      include: { versions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');
    return doc;
  }

  async addVersion(id: string, dto: AddVersionDto, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    const [version] = await this.prisma.$transaction([
      this.prisma.documentVersion.create({
        data: {
          documentId: id,
          revision: dto.revision,
          status: dto.status as any,
          fileName: dto.fileName,
          fileKey: dto.fileKey,
          changeNote: dto.changeNote,
          createdBy: userId,
        },
      }),
      this.prisma.document.update({
        where: { id },
        data: { currentRev: dto.revision, status: dto.status as any },
      }),
    ]);
    return version;
  }

  private async generateNo(tenantId: string, projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'DOC', projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'DOC', projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `DOC-${project?.code ?? 'PRJ'}-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }
}
