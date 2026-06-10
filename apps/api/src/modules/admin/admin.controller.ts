import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { AuditQueryDto } from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Daftar pengguna dalam tenant' })
  getUsers(@CurrentUser() user: any) {
    return this.adminService.getUsers(user.tenantId);
  }

  @Patch('users/:id/toggle')
  @ApiOperation({ summary: 'Aktifkan / nonaktifkan pengguna' })
  toggleUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.toggleUser(id, user.tenantId);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Riwayat audit log' })
  getAuditLogs(@CurrentUser() user: any, @Query() query: AuditQueryDto) {
    return this.adminService.getAuditLogs(user.tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistik penggunaan tenant' })
  getStats(@CurrentUser() user: any) {
    return this.adminService.getTenantStats(user.tenantId);
  }
}
