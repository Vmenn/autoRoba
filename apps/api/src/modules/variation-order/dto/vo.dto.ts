import { IsString, IsOptional, IsIn, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVODto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsIn(['SCOPE_CHANGE','DESIGN_CHANGE','SITE_CONDITION','CLIENT_REQUEST','FORCE_MAJEURE','OTHER'])
  type: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() valueRAB?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() valueRAP?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() impactDays?: number;
}

export class VOQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
}
