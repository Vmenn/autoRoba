import { Module } from '@nestjs/common';
import { TaxController } from './tax.controller';
import { TaxEngineService } from './tax-engine.service';

@Module({
  controllers: [TaxController],
  providers: [TaxEngineService],
  exports: [TaxEngineService],
})
export class TaxModule {}
