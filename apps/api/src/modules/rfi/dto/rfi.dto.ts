import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRFIDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() subject: string;
  @ApiProperty() @IsString() question: string;
  @ApiPropertyOptional() @IsOptional() @IsString() wbsNodeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() discipline?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() requiredResponseDate?: string;
}

export class RespondRFIDto {
  @ApiProperty() @IsString() response: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() costImpact?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() timeImpactDays?: number;
}

export class RFIQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() discipline?: string;
}
