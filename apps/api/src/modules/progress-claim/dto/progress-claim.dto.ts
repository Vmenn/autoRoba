import { Type } from 'class-transformer';
import { IsString, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClaimLineDto {
  @ApiProperty() @IsString() wbsNodeId: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsString() unit: string;
  @ApiProperty() @IsNumber() contractQty: number;
  @ApiProperty() @IsNumber() contractRate: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) prevClaimedPct: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) thisClaimPct: number;
  @ApiPropertyOptional() @IsOptional() @IsString() rabLineId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() evidenceNotes?: string;
}

export class CreateProgressClaimDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() budgetVersionId: string;
  @ApiProperty() @IsDateString() claimPeriodStart: string;
  @ApiProperty() @IsDateString() claimPeriodEnd: string;
  @ApiProperty() @IsNumber() contractValue: number;
  @ApiProperty() @IsString() taxRateCode: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) recoupmentPct?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) retentionPct?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [ClaimLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimLineDto)
  lines: ClaimLineDto[];
}

export class ProgressClaimQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
