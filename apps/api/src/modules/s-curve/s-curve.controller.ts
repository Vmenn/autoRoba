import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SCurveService } from './s-curve.service';
import { CreateSnapshotDto } from './dto/s-curve.dto';

@ApiTags('S-Curve & Progress Snapshots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('s-curve')
export class SCurveController {
  constructor(private sCurveService: SCurveService) {}

  @Post('snapshots')
  @ApiOperation({ summary: 'Simpan atau update snapshot kemajuan proyek' })
  upsert(@Body() dto: CreateSnapshotDto, @CurrentUser() user: any) {
    return this.sCurveService.upsertSnapshot(dto, user.tenantId, user.id);
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Data S-Curve untuk satu proyek (semua snapshots)' })
  getSCurve(@Param('projectId') projectId: string, @CurrentUser() user: any) {
    return this.sCurveService.getSCurve(projectId, user.tenantId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Ringkasan deviasi progress semua proyek aktif' })
  getSummary(@CurrentUser() user: any) {
    return this.sCurveService.getAllProjectsSummary(user.tenantId);
  }
}
