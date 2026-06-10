import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeaveDto {
  @ApiProperty() @IsIn(['ANNUAL','SICK','EMERGENCY','UNPAID','MATERNITY','PATERNITY']) leaveType: string;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty() @IsDateString() endDate: string;
  @ApiProperty() @IsString() reason: string;
}

export class ReviewLeaveDto {
  @ApiProperty() @IsIn(['APPROVED','REJECTED']) action: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rejectReason?: string;
}

export class LeaveQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() leaveType?: string;
}
