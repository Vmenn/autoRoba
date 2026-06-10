import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VariationOrderService } from './variation-order.service';
import { CreateVODto, VOQueryDto } from './dto/vo.dto';

@ApiTags('Variation Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('variation-orders')
export class VariationOrderController {
  constructor(private voService: VariationOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Buat Variation Order baru' })
  create(@Body() dto: CreateVODto, @CurrentUser() user: any) {
    return this.voService.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar Variation Orders' })
  findAll(@CurrentUser() user: any, @Query() query: VOQueryDto) {
    return this.voService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail Variation Order' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.voService.findOne(id, user.tenantId);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit VO untuk persetujuan' })
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.voService.submit(id, user.tenantId, user.id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Setujui VO' })
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.voService.approve(id, user.tenantId, user.id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Tolak VO' })
  reject(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: any) {
    return this.voService.reject(id, user.tenantId, user.id, reason);
  }
}
