import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBudgetVersionDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class RABLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  wbsNodeId?: string;

  @ApiPropertyOptional({ description: 'Link ke AHSP item untuk auto-fill breakdown' })
  @IsOptional()
  @IsUUID()
  ahspItemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ description: 'HSP jual ke owner (RAB)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  hspJual: number;

  @ApiProperty({ description: 'HSP biaya internal (RAP)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  hspBiaya: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  regionCode?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  calculationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'AHSP cost breakdown (L/M/E/Overhead/Profit)' })
  @IsOptional()
  laborCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  materialCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  equipmentCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  overheadAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  profitAmount?: number;
}

export class CreateRABLinesDto {
  @ApiProperty({ type: [RABLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RABLineDto)
  lines: RABLineDto[];
}
