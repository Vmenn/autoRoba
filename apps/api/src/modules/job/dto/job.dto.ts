import {
  IsArray,
  IsDateString,
  IsEnum,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  AssigneeType,
  EvidenceType,
  JobPriority,
  JobStatus,
  JobType,
} from '@prisma/client';

export class CreateJobDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  wbsNodeId?: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: JobType, default: JobType.GENERIC })
  @IsEnum(JobType)
  type: JobType;

  @ApiProperty({ enum: JobPriority, default: JobPriority.MEDIUM })
  @IsEnum(JobPriority)
  priority: JobPriority;

  @ApiPropertyOptional({ enum: AssigneeType })
  @IsOptional()
  @IsEnum(AssigneeType)
  assigneeType?: AssigneeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeName?: string;

  @ApiPropertyOptional({ description: 'Referensi objek asal: { kind, id, no }' })
  @IsOptional()
  sourceRef?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wbsRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ type: [String], enum: EvidenceType })
  @IsOptional()
  @IsArray()
  @IsEnum(EvidenceType, { each: true })
  requiredEvidence?: EvidenceType[];

  @ApiPropertyOptional({ description: 'SLA config: { targetHours, workingHoursOnly }' })
  @IsOptional()
  sla?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Geo: { lat, lng }' })
  @IsOptional()
  geoLocation?: Record<string, number>;

  @ApiPropertyOptional({ type: [String], description: 'IDs of jobs that must be closed first' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  blockedByIds?: string[];

  @ApiPropertyOptional({ description: 'Recurrence: { freq, interval, endDate }' })
  @IsOptional()
  recurrence?: Record<string, any>;
}

export class TransitionJobDto {
  @ApiProperty({ enum: JobStatus })
  @IsEnum(JobStatus)
  toStatus: JobStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Rejection reason (required for REJECTED)' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Cancellation reason (required for CANCELLED)' })
  @IsOptional()
  @IsString()
  cancelReason?: string;
}

export class SubmitJobDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progressPercent?: number;

  @ApiProperty({
    description: 'Evidence objects: [{ kind: "PHOTO"|"CHECKLIST"|..., url, metadata }]',
    type: 'array',
  })
  @IsArray()
  evidence: Array<{ kind: EvidenceType; url?: string; metadata?: Record<string, any> }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AssignJobDto {
  @ApiProperty({ enum: AssigneeType })
  @IsEnum(AssigneeType)
  assigneeType: AssigneeType;

  @ApiProperty()
  @IsUUID()
  assigneeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class JobQueryDto {
  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ enum: JobType })
  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @ApiPropertyOptional({ enum: JobPriority })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Only overdue jobs' })
  @IsOptional()
  overdue?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
