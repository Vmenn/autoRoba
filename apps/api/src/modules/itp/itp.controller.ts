import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ITPService } from './itp.service';
import { CreateITPTemplateDto, CreateInspectionRecordDto, ITPQueryDto } from './dto/itp.dto';

@ApiTags('ITP — Quality & Inspection')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('itp')
export class ITPController {
  constructor(private itpService: ITPService) {}

  @Post('templates')
  @ApiOperation({ summary: 'Buat template ITP baru' })
  createTemplate(@Body() dto: CreateITPTemplateDto, @CurrentUser() user: any) {
    return this.itpService.createTemplate(dto, user.tenantId, user.id);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Daftar template ITP' })
  findAllTemplates(@CurrentUser() user: any) {
    return this.itpService.findAllTemplates(user.tenantId);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Detail template ITP' })
  getTemplate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.itpService.getTemplate(id, user.tenantId);
  }

  @Post('records')
  @ApiOperation({ summary: 'Buat rekaman inspeksi baru' })
  createRecord(@Body() dto: CreateInspectionRecordDto, @CurrentUser() user: any) {
    return this.itpService.createRecord(dto, user.tenantId, user.id);
  }

  @Get('records')
  @ApiOperation({ summary: 'Daftar rekaman inspeksi' })
  findAllRecords(@CurrentUser() user: any, @Query() query: ITPQueryDto) {
    return this.itpService.findAllRecords(user.tenantId, query);
  }

  @Patch('records/:id/close')
  @ApiOperation({ summary: 'Tutup rekaman inspeksi (PASSED/FAILED/PARTIAL)' })
  closeRecord(
    @Param('id') id: string,
    @Body() body: { status: string; remarks?: string },
    @CurrentUser() user: any,
  ) {
    return this.itpService.closeRecord(id, user.tenantId, user.id, body.status, body.remarks);
  }
}
