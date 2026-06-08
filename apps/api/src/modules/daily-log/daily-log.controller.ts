import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DailyLogService } from './daily-log.service';
import { CreateDailyLogDto, DailyLogQueryDto } from './dto/daily-log.dto';

@ApiTags('Daily Log — Field Diary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('daily-logs')
export class DailyLogController {
  constructor(private dailyLogService: DailyLogService) {}

  @Post()
  @ApiOperation({ summary: 'Buat log harian baru' })
  create(@Body() dto: CreateDailyLogDto, @CurrentUser() user: any) {
    return this.dailyLogService.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar log harian dengan filter proyek/tanggal' })
  findAll(@CurrentUser() user: any, @Query() query: DailyLogQueryDto) {
    return this.dailyLogService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail log harian' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.dailyLogService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update log harian' })
  update(@Param('id') id: string, @Body() dto: CreateDailyLogDto, @CurrentUser() user: any) {
    return this.dailyLogService.update(id, dto, user.tenantId);
  }
}
