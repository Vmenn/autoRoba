import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RFIService } from './rfi.service';
import { CreateRFIDto, RespondRFIDto, RFIQueryDto } from './dto/rfi.dto';

@ApiTags('RFI — Request for Information')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rfis')
export class RFIController {
  constructor(private rfiService: RFIService) {}

  @Post()
  @ApiOperation({ summary: 'Buat RFI baru' })
  create(@Body() dto: CreateRFIDto, @CurrentUser() user: any) {
    return this.rfiService.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar RFI' })
  findAll(@CurrentUser() user: any, @Query() query: RFIQueryDto) {
    return this.rfiService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail RFI' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rfiService.findOne(id, user.tenantId);
  }

  @Post(':id/issue')
  @ApiOperation({ summary: 'Issue RFI (DRAFT → ISSUED)' })
  issue(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rfiService.issue(id, user.tenantId);
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Respond terhadap RFI' })
  respond(@Param('id') id: string, @Body() dto: RespondRFIDto, @CurrentUser() user: any) {
    return this.rfiService.respond(id, dto, user.tenantId, user.id);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Tutup RFI' })
  close(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rfiService.close(id, user.tenantId);
  }
}
