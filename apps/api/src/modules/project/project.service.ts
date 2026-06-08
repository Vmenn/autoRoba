import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateProjectDto {
  companyId: string;
  businessUnitId?: string;
  code: string;
  name: string;
  type: string;
  regionCode?: string;
  contractValue?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateWBSNodeDto {
  projectId: string;
  parentId?: string;
  code: string;
  name: string;
  sortOrder?: number;
}

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto, tenantId: string, userId: string) {
    return this.prisma.project.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        businessUnitId: dto.businessUnitId,
        code: dto.code,
        name: dto.name,
        type: dto.type as any,
        regionCode: dto.regionCode,
        contractValue: dto.contractValue,
        currency: dto.currency ?? 'IDR',
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        wbsPrefix: `P${dto.code}`,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.project.findMany({
      where: { tenantId },
      include: { company: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const p = await this.prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        company: true,
        businessUnit: true,
        _count: { select: { jobs: true, wbsNodes: true, budgetVersions: true } },
      },
    });
    if (!p) throw new NotFoundException('Project not found');
    return p;
  }

  async createWBSNode(dto: CreateWBSNodeDto, tenantId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException('Project not found');

    let level = 0;
    if (dto.parentId) {
      const parent = await this.prisma.wBSNode.findUnique({ where: { id: dto.parentId } });
      level = (parent?.level ?? 0) + 1;
    }

    return this.prisma.wBSNode.create({
      data: {
        projectId: dto.projectId,
        parentId: dto.parentId,
        code: dto.code,
        name: dto.name,
        level,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async getWBSTree(projectId: string, tenantId: string) {
    await this.findOne(projectId, tenantId);

    const nodes = await this.prisma.wBSNode.findMany({
      where: { projectId },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
    });

    return this.buildTree(nodes);
  }

  private buildTree(nodes: any[], parentId: string | null = null): any[] {
    return nodes
      .filter((n) => n.parentId === parentId)
      .map((n) => ({ ...n, children: this.buildTree(nodes, n.id) }));
  }
}
