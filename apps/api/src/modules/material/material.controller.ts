import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MaterialService } from './material.service';
import { CreateMaterialItemDto, CreateMRDto, MaterialQueryDto } from './dto/material.dto';

@ApiTags('Material Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('materials')
export class MaterialController {
  constructor(private materialService: MaterialService) {}

  @Post('items')
  @ApiOperation({ summary: 'Tambah item material (MTO)' })
  createItem(@Body() dto: CreateMaterialItemDto, @CurrentUser() user: any) {
    return this.materialService.createItem(dto, user.tenantId, user.id);
  }

  @Get('items')
  @ApiOperation({ summary: 'Daftar material (MTO)' })
  findItems(@CurrentUser() user: any, @Query('projectId') projectId?: string) {
    return this.materialService.findItems(user.tenantId, projectId);
  }

  @Post('requisitions')
  @ApiOperation({ summary: 'Buat Material Requisition (MR)' })
  createMR(@Body() dto: CreateMRDto, @CurrentUser() user: any) {
    return this.materialService.createMR(dto, user.tenantId, user.id);
  }

  @Get('requisitions')
  @ApiOperation({ summary: 'Daftar MR' })
  findMRs(@CurrentUser() user: any, @Query() query: MaterialQueryDto) {
    return this.materialService.findMRs(user.tenantId, query);
  }

  @Get('requisitions/:id')
  @ApiOperation({ summary: 'Detail MR' })
  getMR(@Param('id') id: string, @CurrentUser() user: any) {
    return this.materialService.getMR(id, user.tenantId);
  }

  @Patch('requisitions/:id/approve')
  @ApiOperation({ summary: 'Setujui MR' })
  approveMR(@Param('id') id: string, @CurrentUser() user: any) {
    return this.materialService.approveMR(id, user.tenantId, user.id);
  }
}
