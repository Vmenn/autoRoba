import { Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStateMachineService } from './job-state-machine.service';
import {
  AssignJobDto,
  CreateJobDto,
  JobQueryDto,
  SubmitJobDto,
  TransitionJobDto,
} from './dto/job.dto';

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: JobStateMachineService,
  ) {}

  async create(dto: CreateJobDto, tenantId: string, userId: string) {
    const jobNo = await this.generateJobNo(tenantId, dto.projectId);

    const toStatus: JobStatus =
      dto.assigneeId ? 'ASSIGNED' : 'OPEN';

    const job = await this.prisma.job.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        wbsNodeId: dto.wbsNodeId,
        jobNo,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority,
        status: toStatus,
        assigneeType: dto.assigneeType,
        assigneeId: dto.assigneeId,
        assigneeName: dto.assigneeName,
        sourceRef: dto.sourceRef as any,
        wbsRef: dto.wbsRef,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        requiredEvidence: dto.requiredEvidence ?? [],
        sla: dto.sla as any,
        geoLocation: dto.geoLocation as any,
        blockedByIds: dto.blockedByIds ?? [],
        recurrence: dto.recurrence as any,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Initial audit trail entry
    await this.prisma.jobAuditTrail.create({
      data: {
        jobId: job.id,
        actorId: userId,
        fromStatus: undefined,
        toStatus: toStatus,
        note: 'Job created',
      },
    });

    return job;
  }

  async findAll(tenantId: string, query: JobQueryDto) {
    const skip = ((query.page ?? 1) - 1) * (query.limit ?? 20);
    const now = new Date();

    const where: any = {
      tenantId,
      isDeleted: false,
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
      ...(query.priority && { priority: query.priority }),
      ...(query.assigneeId && { assigneeId: query.assigneeId }),
      ...(query.projectId && { projectId: query.projectId }),
      ...(query.overdue && { dueDate: { lt: now }, status: { notIn: ['CLOSED', 'CANCELLED'] } }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { jobNo: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: query.limit ?? 20,
        include: {
          project: { select: { id: true, code: true, name: true } },
          wbsNode: { select: { id: true, code: true, name: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      totalPages: Math.ceil(total / (query.limit ?? 20)),
    };
  }

  async findOne(id: string, tenantId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: {
        auditTrail: {
          include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
        collaborators: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        project: { select: { id: true, code: true, name: true } },
        wbsNode: { select: { id: true, code: true, name: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async myJobs(userId: string, tenantId: string, query: JobQueryDto) {
    return this.findAll(tenantId, { ...query, assigneeId: userId });
  }

  async assign(jobId: string, dto: AssignJobDto, actor: any) {
    const job = await this.findOne(jobId, actor.tenantId);

    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        assigneeType: dto.assigneeType,
        assigneeId: dto.assigneeId,
        assigneeName: dto.assigneeName,
        updatedBy: actor.id,
      },
    });

    return this.stateMachine.transition(jobId, 'ASSIGNED', actor.id, {
      note: dto.note ?? `Assigned to ${dto.assigneeName ?? dto.assigneeId}`,
      actorRoles: actor.roles,
    });
  }

  async submit(jobId: string, dto: SubmitJobDto, actor: any) {
    return this.stateMachine.transition(jobId, 'SUBMITTED', actor.id, {
      note: dto.note,
      evidence: dto.evidence,
      progressPercent: dto.progressPercent,
      actorRoles: actor.roles,
    });
  }

  async transition(jobId: string, dto: TransitionJobDto, actor: any) {
    return this.stateMachine.transition(jobId, dto.toStatus, actor.id, {
      note: dto.note,
      reason: dto.reason ?? dto.cancelReason,
      actorRoles: actor.roles,
    });
  }

  async getAuditTrail(jobId: string, tenantId: string) {
    await this.findOne(jobId, tenantId);
    return this.prisma.jobAuditTrail.findMany({
      where: { jobId },
      include: {
        actor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async generateJobNo(tenantId: string, projectId?: string): Promise<string> {
    const now = new Date();
    const yearMonth = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;

    let projectCode: string | null = null;
    if (projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { code: true },
      });
      projectCode = project?.code ?? null;
    }

    const seq = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.documentSequence.upsert({
        where: {
          tenantId_prefix_projectCode_yearMonth: {
            tenantId,
            prefix: 'JOB',
            projectCode: projectCode ?? '',
            yearMonth,
          },
        },
        create: {
          tenantId,
          prefix: 'JOB',
          projectCode: projectCode ?? '',
          yearMonth,
          lastSeq: 1,
        },
        update: { lastSeq: { increment: 1 } },
      });
      return existing.lastSeq;
    });

    const seqStr = String(seq).padStart(4, '0');
    if (projectCode) {
      return `JOB/${projectCode}/${yearMonth}/${seqStr}`;
    }
    return `JOB/${yearMonth}/${seqStr}`;
  }
}
