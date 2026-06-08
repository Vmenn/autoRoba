import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RABRAPService } from './rab-rap.service';
import { CreateBudgetVersionDto, CreateRABLinesDto } from './dto/rab-rap.dto';

@ApiTags('RAB/RAP Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budget')
export class RABRAPController {
  constructor(private service: RABRAPService) {}

  @Post('versions')
  @ApiOperation({ summary: 'Buat versi anggaran baru (RAB/RAP)' })
  createVersion(@Body() dto: CreateBudgetVersionDto, @CurrentUser() user: any) {
    return this.service.createVersion(dto, user.tenantId, user.id);
  }

  @Get('projects/:projectId/versions')
  @ApiOperation({ summary: 'Daftar versi anggaran proyek' })
  listVersions(@Param('projectId') projectId: string, @CurrentUser() user: any) {
    return this.service.listVersions(projectId, user.tenantId);
  }

  @Get('projects/:projectId/summary')
  @ApiOperation({ summary: 'Ringkasan RAB/RAP/Margin per versi' })
  getSummary(@Param('projectId') projectId: string, @CurrentUser() user: any) {
    return this.service.getSummary(projectId, user.tenantId);
  }

  @Get('versions/:id')
  @ApiOperation({ summary: 'Detail versi anggaran beserta baris BOQ' })
  getVersion(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getVersion(id, user.tenantId);
  }

  @Post('versions/:id/lines')
  @ApiOperation({
    summary: 'Tambah baris BOQ ke versi anggaran',
    description:
      'Setiap baris memiliki quantity × HSP_jual = RAB dan quantity × HSP_biaya = RAP. ' +
      'Jika ahspItemId diberikan, breakdown L/M/E/OH/Profit dihitung otomatis.',
  })
  addLines(@Param('id') id: string, @Body() dto: CreateRABLinesDto, @CurrentUser() user: any) {
    return this.service.addLines(id, dto, user.tenantId, user.id);
  }

  @Patch('versions/:id/lock')
  @ApiOperation({ summary: 'Lock versi anggaran (immutable setelah lock)' })
  lockVersion(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.lockVersion(id, user.tenantId, user.id);
  }

  @Patch('versions/:id/baseline')
  @ApiOperation({ summary: 'Set versi ini sebagai Baseline (EVM BAC)' })
  setBaseline(
    @Param('id') id: string,
    @Body('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.setBaseline(id, projectId, user.tenantId, user.id);
  }
}
