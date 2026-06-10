import { IsString, IsOptional, IsIn, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVODto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsIn(['SCOPE_CHANGE','DESIGN_CHANGE','SITE_CONDITION','CLIENT_REQUEST','FORCE_MAJEURE','OTHER'])
  type: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() valueRAB?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() valueRAP?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() impactDays?: number;
}

export class VOQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
}
