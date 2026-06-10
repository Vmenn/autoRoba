import { IsString, IsOptional, IsArray, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() discipline?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() tags?: string[];
}

export class AddVersionDto {
  @ApiProperty() @IsString() revision: string;
  @ApiProperty() @IsIn(['DRAFT', 'IFA', 'IFR', 'IFC', 'IFI']) status: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileKey?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() changeNote?: string;
}

export class DocumentQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() discipline?: string;
}
