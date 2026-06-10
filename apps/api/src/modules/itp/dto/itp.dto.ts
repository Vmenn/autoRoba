import { IsString, IsOptional, IsIn, IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateITPTemplateDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() discipline: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ITPItemDto)
  items?: ITPItemDto[];
}

export class ITPItemDto {
  @ApiProperty() @IsString() itemNo: string;
  @ApiProperty() @IsString() activity: string;
  @ApiProperty() @IsIn(['REVIEW','HOLD','WITNESS','INFORMATION']) inspectionType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceDoc?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() acceptanceCriteria?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() responsibilityContractor?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() responsibilityClient?: boolean;
}

export class CreateInspectionRecordDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() templateId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() wbsNodeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CheckItemDto)
  checkItems?: CheckItemDto[];
}

export class CheckItemDto {
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(['PASS','FAIL','NA']) result?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remark?: string;
}

export class ITPQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
