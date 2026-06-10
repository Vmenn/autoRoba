import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEquipmentDto, DeployEquipmentDto, EquipmentQueryDto } from './dto/equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEquipmentDto, tenantId: string, userId: string) {
    const existing = await this.prisma.equipment.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new ConflictException(`Kode alat ${dto.code} sudah ada`);
    return this.prisma.equipment.create({
      data: {
        tenantId, code: dto.code, name: dto.name, category: dto.category,
        brand: dto.brand, model: dto.model, serialNo: dto.serialNo,
        capacityValue: dto.capacityValue, capacityUnit: dto.capacityUnit,
        dailyRate: dto.dailyRate, hourlyRate: dto.hourlyRate,
        notes: dto.notes, createdBy: userId,
      },
    });
  }

  async findAll(tenantId: string, query: EquipmentQueryDto) {
    const where: any = { tenantId };
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.equipment.findMany({
        where,
        include: {
          deployments: {
            where: { returnedAt: null },
            include: { project: { select: { code: true, name: true } } },
            take: 1,
          },
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.equipment.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string, tenantId: string) {
    const eq = await this.prisma.equipment.findFirst({
      where: { id, tenantId },
      include: {
        deployments: {
          include: { project: { select: { code: true, name: true } } },
          orderBy: { deployedAt: 'desc' },
        },
      },
    });
    if (!eq) throw new NotFoundException('Alat/mesin tidak ditemukan');
    return eq;
  }

  async deploy(id: string, dto: DeployEquipmentDto, tenantId: string, userId: string) {
    const eq = await this.findOne(id, tenantId);
    const activeDeployment = await this.prisma.equipmentDeployment.findFirst({
      where: { equipmentId: id, returnedAt: null },
    });
    if (activeDeployment) {
      throw new ConflictException('Alat ini sedang dalam kondisi deployed. Return dulu sebelum deploy ulang.');
    }
    const [deployment] = await this.prisma.$transaction([
      this.prisma.equipmentDeployment.create({
        data: {
          equipmentId: id,
          projectId: dto.projectId,
          deployedAt: new Date(dto.deployedAt),
          returnedAt: dto.returnedAt ? new Date(dto.returnedAt) : undefined,
          hoursUsed: dto.hoursUsed,
          location: dto.location,
          operatorName: dto.operatorName,
          deployedBy: userId,
        },
      }),
      this.prisma.equipment.update({
        where: { id },
        data: { status: 'DEPLOYED' },
      }),
    ]);
    return deployment;
  }

  async returnEquipment(deploymentId: string, hoursUsed: number, tenantId: string) {
    const deployment = await this.prisma.equipmentDeployment.findFirst({
      where: { id: deploymentId },
      include: { equipment: true },
    });
    if (!deployment || deployment.equipment.tenantId !== tenantId) {
      throw new NotFoundException('Deployment tidak ditemukan');
    }
    return this.prisma.$transaction([
      this.prisma.equipmentDeployment.update({
        where: { id: deploymentId },
        data: { returnedAt: new Date(), hoursUsed },
      }),
      this.prisma.equipment.update({
        where: { id: deployment.equipmentId },
        data: { status: 'AVAILABLE' },
      }),
    ]);
  }
}
