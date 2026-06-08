import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRFIDto, RespondRFIDto, RFIQueryDto } from './dto/rfi.dto';

@Injectable()
export class RFIService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRFIDto, tenantId: string, userId: string) {
    const rfiNo = await this.generateNo(tenantId, dto.projectId);
    return this.prisma.rFI.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        wbsNodeId: dto.wbsNodeId,
        rfiNo,
        subject: dto.subject,
        question: dto.question,
        discipline: dto.discipline,
        priority: dto.priority ?? 'NORMAL',
        requiredResponseDate: dto.requiredResponseDate ? new Date(dto.requiredResponseDate) : undefined,
        issuedBy: userId,
        status: 'DRAFT',
      },
    });
  }

  async findAll(tenantId: string, query: RFIQueryDto) {
    const where: any = { tenantId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    if (query.discipline) where.discipline = query.discipline;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.rFI.findMany({
        where,
        include: { project: { select: { code: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.rFI.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string, tenantId: string) {
    const rfi = await this.prisma.rFI.findFirst({ where: { id, tenantId } });
    if (!rfi) throw new NotFoundException('RFI tidak ditemukan');
    return rfi;
  }

  async issue(id: string, tenantId: string) {
    const rfi = await this.findOne(id, tenantId);
    if (rfi.status !== 'DRAFT') throw new BadRequestException('Hanya RFI DRAFT yang bisa di-issue');
    return this.prisma.rFI.update({
      where: { id },
      data: { status: 'ISSUED', issuedAt: new Date() },
    });
  }

  async respond(id: string, dto: RespondRFIDto, tenantId: string, userId: string) {
    const rfi = await this.findOne(id, tenantId);
    if (!['ISSUED', 'CLARIFICATION_NEEDED'].includes(rfi.status)) {
      throw new BadRequestException('RFI harus dalam status ISSUED untuk direspons');
    }
    return this.prisma.rFI.update({
      where: { id },
      data: {
        status: 'RESPONDED',
        response: dto.response,
        costImpact: dto.costImpact,
        timeImpactDays: dto.timeImpactDays,
        respondedBy: userId,
        respondedAt: new Date(),
      },
    });
  }

  async close(id: string, tenantId: string) {
    const rfi = await this.findOne(id, tenantId);
    if (!['RESPONDED', 'ISSUED'].includes(rfi.status)) {
      throw new BadRequestException('RFI harus RESPONDED atau ISSUED untuk ditutup');
    }
    return this.prisma.rFI.update({ where: { id }, data: { status: 'CLOSED' } });
  }

  private async generateNo(tenantId: string, projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { code: true } });
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const seq = await this.prisma.documentSequence.upsert({
      where: { tenantId_prefix_projectCode_yearMonth: { tenantId, prefix: 'RFI', projectCode: project?.code ?? '', yearMonth: ym } },
      update: { lastSeq: { increment: 1 } },
      create: { tenantId, prefix: 'RFI', projectCode: project?.code ?? '', yearMonth: ym, lastSeq: 1 },
    });
    return `RFI-${project?.code ?? 'PRJ'}-${ym}-${String(seq.lastSeq).padStart(4, '0')}`;
  }
}
