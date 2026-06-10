import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMaterialItemDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() itemCode: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsString() unit: string;
  @ApiPropertyOptional() @IsOptional() @IsString() spec?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() qtyBudget?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() wbsNodeId?: string;
}

export class CreateMRDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsDateString() requiredBy: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
  @ApiProperty() @IsArray() @ValidateNested({ each: true }) @Type(() => MRLineDto)
  lines: MRLineDto[];
}

export class MRLineDto {
  @ApiProperty() @IsString() materialId: string;
  @ApiProperty() @IsNumber() qtyRequested: number;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}

export class MaterialQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
