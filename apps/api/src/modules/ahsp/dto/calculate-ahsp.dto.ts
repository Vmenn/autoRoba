import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CalculateAHSPDto {
  @ApiProperty({ description: 'AHSP item ID' })
  @IsUUID()
  ahspItemId: string;

  @ApiProperty({ description: 'Kode region (provinsi/kab) untuk lookup HSD', example: 'ID-JK' })
  @IsString()
  regionCode: string;

  @ApiPropertyOptional({ description: 'Tanggal perhitungan (default: hari ini)', example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  calculationDate?: string;

  @ApiPropertyOptional({ description: 'Override overhead % (default: dari AHSP item)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  overheadPct?: number;

  @ApiPropertyOptional({ description: 'Override profit % (default: dari AHSP item)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  profitPct?: number;
}

export class CalculateAHSPBatchDto {
  @ApiProperty({ type: [CalculateAHSPDto] })
  items: CalculateAHSPDto[];
}
