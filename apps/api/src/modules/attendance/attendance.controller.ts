import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
import { CheckInDto, CheckOutDto, AttendanceQueryDto } from './dto/attendance.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Check-in dengan GPS' })
  checkIn(@Body() dto: CheckInDto, @CurrentUser() user: any) {
    return this.service.checkIn(dto, user.tenantId, user.id);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Check-out dengan GPS' })
  checkOut(@Body() dto: CheckOutDto, @CurrentUser() user: any) {
    return this.service.checkOut(dto, user.id);
  }

  @Get('today')
  @ApiOperation({ summary: 'Absensi hari ini' })
  getToday(@CurrentUser() user: any) {
    return this.service.getToday(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Riwayat absensi' })
  findAll(@Query() query: AttendanceQueryDto, @CurrentUser() user: any) {
    return this.service.findAll(user.tenantId, user.id, query);
  }
}
