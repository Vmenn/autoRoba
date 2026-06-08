import { Module } from '@nestjs/common';
import { NCRController } from './ncr.controller';
import { NCRService } from './ncr.service';

@Module({
  controllers: [NCRController],
  providers: [NCRService],
  exports: [NCRService],
})
export class NCRModule {}
