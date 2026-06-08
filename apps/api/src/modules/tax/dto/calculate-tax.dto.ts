import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CalculateProgressClaimDto {
  @ApiProperty({
    description: 'DPP (Dasar Pengenaan Pajak) = nilai termin sebelum PPN',
    example: 3000000000,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  dpp: number;

  @ApiProperty({
    description: 'Kode tarif PPh Final (JK-01 s/d JK-07)',
    example: 'JK-04',
  })
  @IsString()
  taxRateCode: string;

  @ApiPropertyOptional({ description: 'Tanggal transaksi (default: hari ini)', example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ description: '% recoupment uang muka dari DPP', example: 20, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  recoupmentPct?: number;

  @ApiPropertyOptional({ description: '% retensi dari DPP (default 5%)', example: 5, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  retentionPct?: number;
}

export class GetTaxRateDto {
  @ApiPropertyOptional({ description: 'Filter by code (JK-01..JK-07, PPN)', example: 'JK-04' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Tanggal efektif', example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}
