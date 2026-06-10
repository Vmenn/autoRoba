import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto, DeployEquipmentDto, EquipmentQueryDto } from './dto/equipment.dto';

@ApiTags('Equipment & Machinery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private equipmentService: EquipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Daftarkan alat/mesin baru' })
  create(@Body() dto: CreateEquipmentDto, @CurrentUser() user: any) {
    return this.equipmentService.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar alat/mesin dengan filter kategori/status' })
  findAll(@CurrentUser() user: any, @Query() query: EquipmentQueryDto) {
    return this.equipmentService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail alat/mesin + riwayat deployment' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.equipmentService.findOne(id, user.tenantId);
  }

  @Post(':id/deploy')
  @ApiOperation({ summary: 'Deploy alat ke proyek' })
  deploy(@Param('id') id: string, @Body() dto: DeployEquipmentDto, @CurrentUser() user: any) {
    return this.equipmentService.deploy(id, dto, user.tenantId, user.id);
  }

  @Patch('deployments/:deploymentId/return')
  @ApiOperation({ summary: 'Return alat dari proyek' })
  returnEquipment(
    @Param('deploymentId') deploymentId: string,
    @Body() body: { hoursUsed: number },
    @CurrentUser() user: any,
  ) {
    return this.equipmentService.returnEquipment(deploymentId, body.hoursUsed, user.tenantId);
  }
}
