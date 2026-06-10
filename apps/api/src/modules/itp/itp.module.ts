import { Module } from '@nestjs/common';
import { ITPController } from './itp.controller';
import { ITPService } from './itp.service';

@Module({
  controllers: [ITPController],
  providers: [ITPService],
  exports: [ITPService],
})
export class ITPModule {}
