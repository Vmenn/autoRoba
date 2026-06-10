import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMaterialItemDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() itemCode: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsString() unit: string;
  @ApiPropertyOptional() @IsOptional() @IsString() spec?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() qtyBudget?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() wbsNodeId?: string;
}

export class CreateMRDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsDateString() requiredBy: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
  @ApiProperty() @IsArray() @ValidateNested({ each: true }) @Type(() => MRLineDto)
  lines: MRLineDto[];
}

export class MRLineDto {
  @ApiProperty() @IsUUID() materialId: string;
  @ApiProperty() @IsNumber() qtyRequested: number;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}

export class MaterialQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
