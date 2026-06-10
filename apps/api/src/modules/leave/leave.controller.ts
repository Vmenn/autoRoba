import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LeaveService } from './leave.service';
import { CreateLeaveDto, ReviewLeaveDto, LeaveQueryDto } from './dto/leave.dto';

@ApiTags('Leave Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leaves')
export class LeaveController {
  constructor(private service: LeaveService) {}

  @Post()
  @ApiOperation({ summary: 'Ajukan cuti' })
  create(@Body() dto: CreateLeaveDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar pengajuan cuti saya' })
  findAll(@Query() query: LeaveQueryDto, @CurrentUser() user: any) {
    return this.service.findAll(user.tenantId, user.id, query);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Semua pengajuan cuti menunggu persetujuan (Manager/HR)' })
  findPending(@CurrentUser() user: any) {
    return this.service.findPending(user.tenantId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Batalkan pengajuan cuti' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.cancel(id, user.id);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Approve/Reject pengajuan (Manager/HR)' })
  review(@Param('id') id: string, @Body() dto: ReviewLeaveDto, @CurrentUser() user: any) {
    return this.service.review(id, dto, user.id, user.tenantId);
  }
}
