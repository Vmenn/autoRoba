import { IsString, IsOptional, IsDateString, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDailyLogDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsDateString() logDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() weather?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() manpowerCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() workSummary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issues?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() materials?: any[];
  @ApiPropertyOptional() @IsOptional() @IsArray() equipment?: any[];
}

export class DailyLogQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() to?: string;
}
