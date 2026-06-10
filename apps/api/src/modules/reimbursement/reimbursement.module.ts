import { Module } from '@nestjs/common';
import { ReimbursementController } from './reimbursement.controller';
import { ReimbursementService } from './reimbursement.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReimbursementController],
  providers: [ReimbursementService],
})
export class ReimbursementModule {}
