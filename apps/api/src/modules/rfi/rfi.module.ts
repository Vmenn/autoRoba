import { Module } from '@nestjs/common';
import { RFIController } from './rfi.controller';
import { RFIService } from './rfi.service';

@Module({
  controllers: [RFIController],
  providers: [RFIService],
  exports: [RFIService],
})
export class RFIModule {}
