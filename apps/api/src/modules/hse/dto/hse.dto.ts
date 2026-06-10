import { IsString, IsOptional, IsDateString, IsNumber, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIncidentDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsDateString() incidentDate: string;
  @ApiProperty() @IsString() location: string;
  @ApiProperty() @IsIn(['NEAR_MISS','FIRST_AID','MEDICAL_TREATMENT','LOST_TIME','FATALITY'])
  severity: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() injuredPersons?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lostTimeDays?: number;
}

export class CreatePTWDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsString() permitType: string;
  @ApiProperty() @IsString() workActivity: string;
  @ApiProperty() @IsString() location: string;
  @ApiProperty() @IsDateString() validFrom: string;
  @ApiProperty() @IsDateString() validTo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() riskAssessment?: string;
}

export class HSEQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() severity?: string;
}
