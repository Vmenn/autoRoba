import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics & EVM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard stats: proyek aktif, jobs, NCR, RFI, claims tertunda' })
  getDashboard(@CurrentUser() user: any) {
    return this.analyticsService.getDashboardStats(user.tenantId);
  }

  @Get('projects/:id/evm')
  @ApiOperation({ summary: 'EVM metrics: BAC, PV, EV, AC, SPI, CPI, EAC, ETC, VAC' })
  getEVM(@Param('id') id: string, @CurrentUser() user: any) {
    return this.analyticsService.getProjectEVM(id, user.tenantId);
  }

  @Get('projects/:id/budget-vs-actual')
  @ApiOperation({ summary: 'Budget vs Actual: baseline RAB vs klaim termin' })
  getBudgetVsActual(@Param('id') id: string, @CurrentUser() user: any) {
    return this.analyticsService.getBudgetVsActual(id, user.tenantId);
  }
}
