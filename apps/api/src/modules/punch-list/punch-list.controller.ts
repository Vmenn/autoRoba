import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PunchListService } from './punch-list.service';
import { CreatePunchListDto, PunchQueryDto } from './dto/punch-list.dto';

@ApiTags('Punch List')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('punch-lists')
export class PunchListController {
  constructor(private punchService: PunchListService) {}

  @Post()
  @ApiOperation({ summary: 'Buat Punch List baru' })
  create(@Body() dto: CreatePunchListDto, @CurrentUser() user: any) {
    return this.punchService.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar Punch List' })
  findAll(@CurrentUser() user: any, @Query() query: PunchQueryDto) {
    return this.punchService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail Punch List dengan semua item' })
  getList(@Param('id') id: string, @CurrentUser() user: any) {
    return this.punchService.getList(id, user.tenantId);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Tambah item ke Punch List' })
  addItem(
    @Param('id') id: string,
    @Body() body: { description: string; category: string; location?: string; dueDate?: string },
    @CurrentUser() user: any,
  ) {
    return this.punchService.addItem(id, user.tenantId, user.id, body);
  }

  @Patch(':id/items/:itemId/clear')
  @ApiOperation({ summary: 'Clear punch item (kontraktor selesai)' })
  clearItem(@Param('id') id: string, @Param('itemId') itemId: string, @CurrentUser() user: any) {
    return this.punchService.clearItem(id, itemId, user.tenantId, user.id);
  }

  @Patch(':id/items/:itemId/accept')
  @ApiOperation({ summary: 'Accept punch item (owner/QC terima)' })
  acceptItem(@Param('id') id: string, @Param('itemId') itemId: string, @CurrentUser() user: any) {
    return this.punchService.acceptItem(id, itemId, user.tenantId, user.id);
  }
}
