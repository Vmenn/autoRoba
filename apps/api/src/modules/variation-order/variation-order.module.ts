import { Module } from '@nestjs/common';
import { VariationOrderController } from './variation-order.controller';
import { VariationOrderService } from './variation-order.service';

@Module({
  controllers: [VariationOrderController],
  providers: [VariationOrderService],
  exports: [VariationOrderService],
})
export class VariationOrderModule {}
