import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AHSPService } from './ahsp.service';
import { CalculateAHSPDto } from './dto/calculate-ahsp.dto';
import { CreateAHSPItemDto } from './dto/create-ahsp-item.dto';

@ApiTags('AHSP Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ahsp')
export class AHSPController {
  constructor(private ahspService: AHSPService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar item AHSP (sistem + tenant)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'discipline', required: false })
  @ApiQuery({ name: 'category', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('discipline') discipline?: string,
    @Query('category') category?: string,
  ) {
    return this.ahspService.findAll(user.tenantId, { search, discipline, category });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail item AHSP beserta komponen & koefisien' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ahspService.findOne(id, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Buat item AHSP custom untuk tenant' })
  create(@Body() dto: CreateAHSPItemDto, @CurrentUser() user: any) {
    return this.ahspService.create(dto, user.tenantId, user.id);
  }

  @Post('calculate')
  @ApiOperation({
    summary: 'Hitung HSP dari item AHSP — formula §7.2',
    description:
      'HSP = Σ(koef_L×upah) + Σ(koef_M×harga) + Σ(koef_E×sewa) = Direct Cost → ×(1+overhead%+profit%)',
  })
  calculate(@Body() dto: CalculateAHSPDto) {
    return this.ahspService.calculate(dto);
  }

  @Get(':code/compare')
  @ApiOperation({ summary: 'Bandingkan hasil HSP antar basis regulasi (SNI vs PUPR 1/2022 vs custom)' })
  @ApiQuery({ name: 'regionCode', required: true, example: 'ID-JK' })
  @ApiQuery({ name: 'calcDate', required: false, example: '2026-06-01' })
  compareRegulations(
    @Param('code') code: string,
    @Query('regionCode') regionCode: string,
    @Query('calcDate') calcDate: string,
    @CurrentUser() user: any,
  ) {
    return this.ahspService.compareRegulations(code, regionCode, calcDate, user.tenantId);
  }
}
