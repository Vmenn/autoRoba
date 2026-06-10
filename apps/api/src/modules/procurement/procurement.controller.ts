import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProcurementService } from './procurement.service';
import { CreatePODto, POQueryDto } from './dto/procurement.dto';

@ApiTags('Procurement — Purchase Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class ProcurementController {
  constructor(private procurementService: ProcurementService) {}

  @Post()
  @ApiOperation({ summary: 'Buat Purchase Order baru' })
  create(@Body() dto: CreatePODto, @CurrentUser() user: any) {
    return this.procurementService.createPO(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar Purchase Order' })
  findAll(@CurrentUser() user: any, @Query() query: POQueryDto) {
    return this.procurementService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail PO + line items' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.procurementService.findOne(id, user.tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transisi status PO (DRAFT→SUBMITTED→APPROVED→ISSUED→RECEIVED)' })
  transition(@Param('id') id: string, @Body() body: { toStatus: string }, @CurrentUser() user: any) {
    return this.procurementService.transition(id, body.toStatus, user.tenantId, user.id);
  }
}
