import { IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSnapshotDto {
  @ApiProperty() @IsString() projectId: string;
  @ApiProperty() @IsDateString() snapshotDate: string;
  @ApiProperty() @IsNumber() plannedPct: number;
  @ApiProperty() @IsNumber() actualPct: number;
  @ApiProperty() @IsNumber() plannedValue: number;
  @ApiProperty() @IsNumber() earnedValue: number;
  @ApiProperty() @IsNumber() actualCost: number;
}
