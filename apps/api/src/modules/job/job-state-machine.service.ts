import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Job, JobStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// Valid state transitions — §12.3
const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'BLOCKED', 'CANCELLED'],
  IN_PROGRESS: ['SUBMITTED', 'BLOCKED', 'CANCELLED'],
  BLOCKED: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
  SUBMITTED: ['VERIFIED', 'REJECTED'],
  VERIFIED: ['CLOSED'],
  REJECTED: ['IN_PROGRESS'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'CANCELLED'],
  CANCELLED: [],
};

// Roles allowed to VERIFY
const VERIFIER_ROLES = ['PM', 'QAQC', 'OWNER', 'DIRECTOR', 'ADMIN'];

// Roles allowed to REOPEN from CLOSED
const REOPEN_ROLES = ['PM', 'QAQC', 'OWNER', 'DIRECTOR', 'ADMIN'];

// Roles allowed to CANCEL
const CANCEL_ROLES = ['PM', 'OWNER', 'DIRECTOR', 'ADMIN'];

export interface TransitionOptions {
  note?: string;
  reason?: string;
  evidence?: Array<{ kind: string; url?: string; metadata?: Record<string, any> }>;
  progressPercent?: number;
  actorRoles?: string[];
}

@Injectable()
export class JobStateMachineService {
  constructor(private prisma: PrismaService) {}

  async transition(
    jobId: string,
    toStatus: JobStatus,
    actorId: string,
    opts: TransitionOptions = {},
  ): Promise<Job> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, isDeleted: false },
    });
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    this.assertTransitionAllowed(job, toStatus);
    await this.assertGuards(job, toStatus, actorId, opts);

    const updates = this.buildUpdates(job, toStatus, actorId, opts);

    const [updated] = await this.prisma.$transaction([
      this.prisma.job.update({ where: { id: jobId }, data: updates }),
      this.prisma.jobAuditTrail.create({
        data: {
          jobId,
          actorId,
          fromStatus: job.status,
          toStatus,
          note: opts.note ?? opts.reason,
          metadata: opts.evidence ? { evidence: opts.evidence } : undefined,
        },
      }),
    ]);

    // Side effect: update WBS EV when job is CLOSED with a wbs_ref
    if (toStatus === 'CLOSED' && job.wbsNodeId) {
      await this.updateWBSEarnedValue(job);
    }

    return updated;
  }

  private assertTransitionAllowed(job: Job, toStatus: JobStatus) {
    const allowed = TRANSITIONS[job.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Transisi ${job.status} → ${toStatus} tidak valid. Transisi yang diizinkan: ${allowed.join(', ')}`,
      );
    }
  }

  private async assertGuards(
    job: Job,
    toStatus: JobStatus,
    actorId: string,
    opts: TransitionOptions,
  ) {
    switch (toStatus) {
      case 'ASSIGNED':
        // OPEN→ASSIGNED requires assignee already set or being set here
        if (!job.assigneeId && !opts.reason) {
          // assignee must have been set on job already at this point
          throw new BadRequestException('Job harus memiliki assignee sebelum ASSIGNED');
        }
        break;

      case 'SUBMITTED': {
        // Assignee must attach required evidence
        const requiredEvidence = job.requiredEvidence ?? [];
        if (requiredEvidence.length > 0) {
          const providedKinds = (opts.evidence ?? []).map((e) => e.kind);
          const missing = requiredEvidence.filter((r) => !providedKinds.includes(r));
          if (missing.length > 0) {
            throw new BadRequestException(
              `Bukti penyelesaian wajib belum dilampirkan: ${missing.join(', ')}`,
            );
          }
        }
        break;
      }

      case 'VERIFIED':
      case 'REJECTED': {
        const roles = opts.actorRoles ?? [];
        if (!VERIFIER_ROLES.some((r) => roles.includes(r))) {
          throw new ForbiddenException('Hanya verifikator berwenang (PM/QAQC/Owner) yang dapat VERIFIED/REJECTED');
        }
        if (toStatus === 'REJECTED' && !opts.reason) {
          throw new BadRequestException('Alasan penolakan wajib diisi (reason)');
        }
        break;
      }

      case 'IN_PROGRESS': {
        // Check blocked_by dependencies
        if (job.blockedByIds?.length) {
          const openBlockers = await this.prisma.job.count({
            where: {
              id: { in: job.blockedByIds as string[] },
              status: { notIn: ['CLOSED', 'CANCELLED'] },
            },
          });
          if (openBlockers > 0) {
            throw new BadRequestException(
              `Job memiliki ${openBlockers} blocker yang belum CLOSED. Selesaikan terlebih dahulu.`,
            );
          }
        }
        break;
      }

      case 'REOPENED': {
        const roles = opts.actorRoles ?? [];
        if (!REOPEN_ROLES.some((r) => roles.includes(r))) {
          throw new ForbiddenException('Hanya PM/Owner/Admin yang dapat membuka kembali (REOPEN) job yang sudah CLOSED');
        }
        break;
      }

      case 'CANCELLED': {
        const roles = opts.actorRoles ?? [];
        if (!CANCEL_ROLES.some((r) => roles.includes(r))) {
          throw new ForbiddenException('Hanya PM/Owner/Admin yang dapat membatalkan (CANCEL) job');
        }
        if (!opts.reason) {
          throw new BadRequestException('Alasan pembatalan wajib diisi (reason)');
        }
        break;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildUpdates(
    job: Job,
    toStatus: JobStatus,
    actorId: string,
    opts: TransitionOptions,
  ): any {
    const now = new Date();
    const updates: any = { status: toStatus, updatedBy: actorId };

    if (toStatus === 'IN_PROGRESS' && !job.actualStart) {
      updates.actualStart = now;
    }
    if (toStatus === 'SUBMITTED') {
      updates.submittedAt = now;
      if (opts.progressPercent !== undefined) {
        updates.progressPercent = opts.progressPercent;
      }
      if (opts.evidence?.length) {
        updates.completionEvidence = [
          ...(job.completionEvidence as any[]),
          ...opts.evidence,
        ];
      }
    }
    if (toStatus === 'VERIFIED') {
      updates.verifiedAt = now;
      updates.verifierId = actorId;
    }
    if (toStatus === 'CLOSED') {
      updates.closedAt = now;
      updates.progressPercent = 100;
    }
    if (toStatus === 'REJECTED') {
      updates.rejectedReason = opts.reason;
      updates.rejectedBy = actorId;
    }
    if (toStatus === 'CANCELLED') {
      updates.cancelledReason = opts.reason;
      updates.cancelledBy = actorId;
    }

    return updates;
  }

  private async updateWBSEarnedValue(job: Job) {
    if (!job.wbsNodeId) return;

    // Recalculate progress from closed jobs on this WBS node
    const totalJobs = await this.prisma.job.count({
      where: { wbsNodeId: job.wbsNodeId, isDeleted: false },
    });
    const closedJobs = await this.prisma.job.count({
      where: { wbsNodeId: job.wbsNodeId, isDeleted: false, status: 'CLOSED' },
    });

    if (totalJobs === 0) return;

    const progressPct = (closedJobs / totalJobs) * 100;

    await this.prisma.wBSNode.update({
      where: { id: job.wbsNodeId },
      data: { progressPct },
    });
  }
}
