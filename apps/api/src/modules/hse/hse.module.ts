import { Module } from '@nestjs/common';
import { HSEController } from './hse.controller';
import { HSEService } from './hse.service';

@Module({
  controllers: [HSEController],
  providers: [HSEService],
  exports: [HSEService],
})
export class HSEModule {}
