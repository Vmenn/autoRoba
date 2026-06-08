import { Module } from '@nestjs/common';
import { ProgressClaimController } from './progress-claim.controller';
import { ProgressClaimService } from './progress-claim.service';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [TaxModule],
  controllers: [ProgressClaimController],
  providers: [ProgressClaimService],
  exports: [ProgressClaimService],
})
export class ProgressClaimModule {}
