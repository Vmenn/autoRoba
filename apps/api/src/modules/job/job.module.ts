import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobStateMachineService } from './job-state-machine.service';

@Module({
  controllers: [JobController],
  providers: [JobService, JobStateMachineService],
  exports: [JobService, JobStateMachineService],
})
export class JobModule {}
