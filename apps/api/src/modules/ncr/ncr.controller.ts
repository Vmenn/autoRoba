import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NCRService } from './ncr.service';
import { CreateNCRDto, NCRQueryDto, UpdateNCRDto } from './dto/ncr.dto';

@ApiTags('NCR — Non-Conformance Report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ncrs')
export class NCRController {
  constructor(private ncrService: NCRService) {}

  @Post()
  @ApiOperation({ summary: 'Buat NCR baru' })
  create(@Body() dto: CreateNCRDto, @CurrentUser() user: any) {
    return this.ncrService.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar NCR dengan filter project/status/severity' })
  findAll(@CurrentUser() user: any, @Query() query: NCRQueryDto) {
    return this.ncrService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail NCR' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ncrService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update NCR (root cause, corrective action, dll)' })
  update(@Param('id') id: string, @Body() dto: UpdateNCRDto, @CurrentUser() user: any) {
    return this.ncrService.update(id, dto, user.tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transisi status NCR' })
  transition(
    @Param('id') id: string,
    @Body() body: { toStatus: string; note?: string },
    @CurrentUser() user: any,
  ) {
    return this.ncrService.transition(id, body.toStatus, body.note, user.tenantId, user.id);
  }
}
