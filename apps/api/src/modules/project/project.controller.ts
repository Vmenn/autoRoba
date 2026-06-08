import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectService, CreateProjectDto, CreateWBSNodeDto } from './project.service';

@ApiTags('Projects & WBS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private service: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Buat proyek baru' })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar proyek dalam tenant' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail proyek' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post(':id/wbs')
  @ApiOperation({ summary: 'Tambah node WBS ke proyek (§5)' })
  createWBSNode(@Body() dto: CreateWBSNodeDto, @CurrentUser() user: any) {
    return this.service.createWBSNode({ ...dto }, user.tenantId);
  }

  @Get(':id/wbs')
  @ApiOperation({ summary: 'Pohon WBS proyek' })
  getWBSTree(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getWBSTree(id, user.tenantId);
  }
}
