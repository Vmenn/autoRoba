import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComponentType, RegulationBasis } from '@prisma/client';

export class AHSPCoefficientDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  coefficient: number;

  @ApiProperty()
  @IsString()
  regulationVersion: string;

  @ApiProperty()
  @IsString()
  effectiveFrom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalBasis?: string;
}

export class AHSPComponentDto {
  @ApiProperty({ enum: ComponentType })
  @IsEnum(ComponentType)
  type: ComponentType;

  @ApiProperty({ example: 'L-PEKERJA' })
  @IsString()
  hsdCode: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  unit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ type: [AHSPCoefficientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AHSPCoefficientDto)
  coefficients: AHSPCoefficientDto[];
}

export class CreateAHSPItemDto {
  @ApiProperty({ example: 'B.01.001' })
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'm³' })
  @IsString()
  unit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discipline?: string;

  @ApiPropertyOptional({ enum: RegulationBasis, default: RegulationBasis.PUPR_1_2022 })
  @IsOptional()
  @IsEnum(RegulationBasis)
  regulationBasis?: RegulationBasis;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  overheadPct?: number;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  profitPct?: number;

  @ApiProperty({ type: [AHSPComponentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AHSPComponentDto)
  components: AHSPComponentDto[];
}
