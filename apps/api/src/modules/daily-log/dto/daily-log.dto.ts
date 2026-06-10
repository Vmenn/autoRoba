import { IsString, IsOptional, IsDateString, IsNumber, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDailyLogDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsDateString() logDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() weather?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() manpowerCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() workSummary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issues?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() materials?: any[];
  @ApiPropertyOptional() @IsOptional() @IsArray() equipment?: any[];
}

export class DailyLogQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() to?: string;
}
