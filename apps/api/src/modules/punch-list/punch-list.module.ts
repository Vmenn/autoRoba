import { Module } from '@nestjs/common';
import { PunchListController } from './punch-list.controller';
import { PunchListService } from './punch-list.service';

@Module({
  controllers: [PunchListController],
  providers: [PunchListService],
  exports: [PunchListService],
})
export class PunchListModule {}
