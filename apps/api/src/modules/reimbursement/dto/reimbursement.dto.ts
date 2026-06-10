import { IsString, IsOptional, IsNumber, IsDateString, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReimbursementDto {
  @ApiProperty() @IsIn(['TRANSPORT','ACCOMMODATION','MEAL','OFFICE_SUPPLY','COMMUNICATION','OTHER']) category: string;
  @ApiProperty() @IsNumber() @Min(1) amount: number;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsDateString() expenseDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() receiptUri?: string;
}

export class ReviewReimbursementDto {
  @ApiProperty() @IsIn(['APPROVED','REJECTED']) action: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rejectReason?: string;
}

export class ReimbursementQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
}
