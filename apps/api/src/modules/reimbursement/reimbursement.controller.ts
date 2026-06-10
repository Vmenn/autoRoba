import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReimbursementService } from './reimbursement.service';
import { CreateReimbursementDto, ReviewReimbursementDto, ReimbursementQueryDto } from './dto/reimbursement.dto';

@ApiTags('Reimbursement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reimbursements')
export class ReimbursementController {
  constructor(private service: ReimbursementService) {}

  @Post()
  @ApiOperation({ summary: 'Ajukan reimburse' })
  create(@Body() dto: CreateReimbursementDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar reimburse saya' })
  findAll(@Query() query: ReimbursementQueryDto, @CurrentUser() user: any) {
    return this.service.findAll(user.tenantId, user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail reimburse' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Approve/Reject reimburse (Finance/Manager)' })
  review(@Param('id') id: string, @Body() dto: ReviewReimbursementDto, @CurrentUser() user: any) {
    return this.service.review(id, dto, user.id, user.tenantId);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Tandai sebagai dibayar (Finance)' })
  markPaid(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.markPaid(id, user.tenantId);
  }
}
