import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HSEService } from './hse.service';
import { CreateIncidentDto, CreatePTWDto, HSEQueryDto } from './dto/hse.dto';

@ApiTags('HSE — Health, Safety & Environment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hse')
export class HSEController {
  constructor(private hseService: HSEService) {}

  @Post('incidents')
  @ApiOperation({ summary: 'Lapor insiden baru (near-miss, FAC, LTI, fatality)' })
  createIncident(@Body() dto: CreateIncidentDto, @CurrentUser() user: any) {
    return this.hseService.createIncident(dto, user.tenantId, user.id);
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Daftar insiden K3' })
  findAllIncidents(@CurrentUser() user: any, @Query() query: HSEQueryDto) {
    return this.hseService.findAllIncidents(user.tenantId, query);
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Detail insiden' })
  getIncident(@Param('id') id: string, @CurrentUser() user: any) {
    return this.hseService.getIncident(id, user.tenantId);
  }

  @Patch('incidents/:id/close')
  @ApiOperation({ summary: 'Tutup insiden setelah investigasi' })
  closeIncident(
    @Param('id') id: string,
    @Body() body: { rootCause: string; correctiveAction: string },
    @CurrentUser() user: any,
  ) {
    return this.hseService.closeIncident(id, user.tenantId, user.id, body.rootCause, body.correctiveAction);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistik K3: TRIR, lost days, severity breakdown' })
  getStats(@CurrentUser() user: any, @Query('projectId') projectId?: string) {
    return this.hseService.getHSEStats(user.tenantId, projectId);
  }

  @Post('permits')
  @ApiOperation({ summary: 'Buat Permit to Work baru' })
  createPTW(@Body() dto: CreatePTWDto, @CurrentUser() user: any) {
    return this.hseService.createPTW(dto, user.tenantId, user.id);
  }

  @Get('permits')
  @ApiOperation({ summary: 'Daftar Permit to Work' })
  findAllPTW(@CurrentUser() user: any, @Query() query: HSEQueryDto) {
    return this.hseService.findAllPTW(user.tenantId, query);
  }
}
