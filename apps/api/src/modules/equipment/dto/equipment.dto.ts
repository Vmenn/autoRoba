import { IsString, IsOptional, IsNumber, IsDateString, IsIn, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEquipmentDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() category: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() model?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serialNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacityValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() capacityUnit?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() dailyRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() hourlyRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class DeployEquipmentDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsDateString() deployedAt: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() returnedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() hoursUsed?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() operatorName?: string;
}

export class EquipmentQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
}
