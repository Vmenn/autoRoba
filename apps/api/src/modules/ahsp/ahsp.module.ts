import { Module } from '@nestjs/common';
import { AHSPController } from './ahsp.controller';
import { AHSPService } from './ahsp.service';
import { AHSPEngineService } from './ahsp-engine.service';

@Module({
  controllers: [AHSPController],
  providers: [AHSPService, AHSPEngineService],
  exports: [AHSPEngineService],
})
export class AHSPModule {}
