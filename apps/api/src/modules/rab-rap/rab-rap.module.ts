import { Module } from '@nestjs/common';
import { RABRAPController } from './rab-rap.controller';
import { RABRAPService } from './rab-rap.service';
import { AHSPModule } from '../ahsp/ahsp.module';

@Module({
  imports: [AHSPModule],
  controllers: [RABRAPController],
  providers: [RABRAPService],
})
export class RABRAPModule {}
