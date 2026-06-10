import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubcontractorService } from './subcontractor.service';
import { CreateSubcontractorDto, CreateSPKDto, CreateSPKClaimDto, SubcontractorQueryDto } from './dto/subcontractor.dto';

@ApiTags('Subcontractors & SPK')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subcontractors')
export class SubcontractorController {
  constructor(private subService: SubcontractorService) {}

  @Post()
  @ApiOperation({ summary: 'Daftarkan subkontraktor baru' })
  createSubcontractor(@Body() dto: CreateSubcontractorDto, @CurrentUser() user: any) {
    return this.subService.createSubcontractor(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar subkontraktor' })
  findAll(@CurrentUser() user: any) {
    return this.subService.findAllSubcontractors(user.tenantId);
  }

  @Post('spk')
  @ApiOperation({ summary: 'Buat SPK (Surat Perintah Kerja)' })
  createSPK(@Body() dto: CreateSPKDto, @CurrentUser() user: any) {
    return this.subService.createSPK(dto, user.tenantId, user.id);
  }

  @Get('spk')
  @ApiOperation({ summary: 'Daftar SPK' })
  findAllSPK(@CurrentUser() user: any, @Query() query: SubcontractorQueryDto) {
    return this.subService.findAllSPK(user.tenantId, query);
  }

  @Get('spk/:id')
  @ApiOperation({ summary: 'Detail SPK dan riwayat klaim' })
  getSPK(@Param('id') id: string, @CurrentUser() user: any) {
    return this.subService.getSPK(id, user.tenantId);
  }

  @Post('spk/:id/claims')
  @ApiOperation({ summary: 'Buat klaim tagihan subkontraktor' })
  createClaim(@Param('id') contractId: string, @Body() dto: CreateSPKClaimDto, @CurrentUser() user: any) {
    return this.subService.createClaim(contractId, dto, user.tenantId, user.id);
  }
}
