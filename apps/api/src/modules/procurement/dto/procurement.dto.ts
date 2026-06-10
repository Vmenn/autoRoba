import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsDateString, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class POLineDto {
  @ApiPropertyOptional() @IsOptional() @IsString() itemCode?: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsString() unit: string;
  @ApiProperty() @IsNumber() quantity: number;
  @ApiProperty() @IsNumber() unitPrice: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() wbsNodeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreatePODto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() vendorName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vendorNPWP?: string;
  @ApiProperty() @IsString() subject: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() deliveryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [POLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => POLineDto)
  lines: POLineDto[];
}

export class POQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
