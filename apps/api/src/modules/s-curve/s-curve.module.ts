import { Module } from '@nestjs/common';
import { SCurveController } from './s-curve.controller';
import { SCurveService } from './s-curve.service';

@Module({
  controllers: [SCurveController],
  providers: [SCurveService],
  exports: [SCurveService],
})
export class SCurveModule {}
