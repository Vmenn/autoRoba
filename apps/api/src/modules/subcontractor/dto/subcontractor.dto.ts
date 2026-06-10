import { IsString, IsOptional, IsEmail, IsBoolean, IsDateString, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubcontractorDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() npwp?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pkp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() grade?: string;
}

export class CreateSPKDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsUUID() subcontractorId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() scopeOfWork: string;
  @ApiProperty() @IsNumber() contractValue: number;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty() @IsDateString() endDate: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() retention?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() advancePayment?: number;
}

export class CreateSPKClaimDto {
  @ApiProperty() @IsNumber() claimAmount: number;
  @ApiProperty() @IsNumber() progressPct: number;
  @ApiProperty() @IsDateString() claimDate: string;
  @ApiProperty() @IsDateString() periodFrom: string;
  @ApiProperty() @IsDateString() periodTo: string;
}

export class SubcontractorQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
