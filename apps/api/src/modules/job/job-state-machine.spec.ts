import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { JobStateMachineService } from './job-state-machine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus } from '@prisma/client';

describe('JobStateMachineService', () => {
  let service: JobStateMachineService;

  const baseJob: any = {
    id: 'job-1',
    status: 'DRAFT',
    assigneeId: null,
    requiredEvidence: [],
    blockedByIds: [],
    wbsNodeId: null,
    completionEvidence: [],
    actualStart: null,
    progressPercent: 0,
  };

  const mockPrisma: any = {
    job: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({ ...baseJob }),
      count: jest.fn().mockResolvedValue(0),
    },
    jobAuditTrail: {
      create: jest.fn().mockResolvedValue({}),
    },
    wBSNode: {
      update: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation(async (ops: any[]) => {
      return Promise.all(ops.map((op) => (typeof op.then === 'function' ? op : Promise.resolve(op))));
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobStateMachineService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<JobStateMachineService>(JobStateMachineService);
    jest.clearAllMocks();
  });

  describe('valid transitions', () => {
    it('DRAFT → OPEN', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({ ...baseJob, status: 'DRAFT' });
      await expect(service.transition('job-1', 'OPEN', 'user-1', {})).resolves.not.toThrow();
    });

    it('OPEN → ASSIGNED (with assignee on job)', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({ ...baseJob, status: 'OPEN', assigneeId: 'user-2' });
      await expect(service.transition('job-1', 'ASSIGNED', 'user-1', {})).resolves.not.toThrow();
    });

    it('IN_PROGRESS → SUBMITTED with photo evidence', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        ...baseJob,
        status: 'IN_PROGRESS',
        requiredEvidence: ['PHOTO'],
      });
      await expect(
        service.transition('job-1', 'SUBMITTED', 'user-1', {
          evidence: [{ kind: 'PHOTO', url: 'http://example.com/photo.jpg' }],
        }),
      ).resolves.not.toThrow();
    });

    it('SUBMITTED → VERIFIED by PM', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({ ...baseJob, status: 'SUBMITTED' });
      await expect(
        service.transition('job-1', 'VERIFIED', 'user-pm', { actorRoles: ['PM'] }),
      ).resolves.not.toThrow();
    });
  });

  describe('invalid transitions', () => {
    it('rejects DRAFT → CLOSED', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({ ...baseJob, status: 'DRAFT' });
      await expect(service.transition('job-1', 'CLOSED', 'user-1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects CANCELLED → OPEN', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({ ...baseJob, status: 'CANCELLED' });
      await expect(service.transition('job-1', 'OPEN', 'user-1', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('guards', () => {
    it('AC2: rejects SUBMITTED without required evidence', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        ...baseJob,
        status: 'IN_PROGRESS',
        requiredEvidence: ['PHOTO', 'CHECKLIST'],
      });
      await expect(
        service.transition('job-1', 'SUBMITTED', 'user-1', {
          evidence: [{ kind: 'PHOTO', url: 'photo.jpg' }],
        }),
      ).rejects.toThrow(/CHECKLIST/);
    });

    it('AC3: rejects VERIFIED by non-verifier role', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({ ...baseJob, status: 'SUBMITTED' });
      await expect(
        service.transition('job-1', 'VERIFIED', 'user-worker', { actorRoles: ['WORKER'] }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('AC3: requires reason for REJECTED', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({ ...baseJob, status: 'SUBMITTED' });
      await expect(
        service.transition('job-1', 'REJECTED', 'user-pm', { actorRoles: ['PM'] }),
      ).rejects.toThrow(/alasan/i);
    });

    it('AC5: blocks IN_PROGRESS when blocker job not CLOSED', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        ...baseJob,
        status: 'ASSIGNED',
        blockedByIds: ['blocker-job-id'],
      });
      mockPrisma.job.count.mockResolvedValue(1); // 1 open blocker

      await expect(
        service.transition('job-1', 'IN_PROGRESS', 'user-1', {}),
      ).rejects.toThrow(/blocker/i);
    });

    it('AC5: allows IN_PROGRESS when blockers are all CLOSED', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({
        ...baseJob,
        status: 'ASSIGNED',
        blockedByIds: ['blocker-job-id'],
      });
      mockPrisma.job.count.mockResolvedValue(0); // no open blockers

      await expect(
        service.transition('job-1', 'IN_PROGRESS', 'user-1', {}),
      ).resolves.not.toThrow();
    });
  });

  describe('AC7: audit trail', () => {
    it('creates audit trail entry on every transition', async () => {
      mockPrisma.job.findUnique.mockResolvedValue({ ...baseJob, status: 'DRAFT' });

      await service.transition('job-1', 'OPEN', 'user-1', { note: 'Opening job' });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
