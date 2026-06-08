import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Master Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('master')
export class MasterDataController {
  constructor(private prisma: PrismaService) {}

  @Get('regions')
  @ApiOperation({ summary: 'Daftar region (provinsi/kab) Indonesia' })
  async regions() {
    return this.prisma.region.findMany({
      where: { isActive: true, type: 'PROVINCE' },
      orderBy: { code: 'asc' },
    });
  }

  @Get('hsd')
  @ApiOperation({ summary: 'Harga Satuan Dasar (HSD) per region & tanggal' })
  @ApiQuery({ name: 'regionCode', required: true, example: 'ID-JK' })
  @ApiQuery({ name: 'type', required: false, enum: ['LABOR', 'MATERIAL', 'EQUIPMENT'] })
  @ApiQuery({ name: 'effectiveDate', required: false, example: '2026-06-01' })
  async hsd(
    @Query('regionCode') regionCode: string,
    @Query('type') type?: string,
    @Query('effectiveDate') effectiveDate?: string,
  ) {
    const date = effectiveDate ? new Date(effectiveDate) : new Date();
    return this.prisma.hSDMaster.findMany({
      where: {
        regionCode,
        ...(type && { type: type as any }),
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: date } }],
      },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });
  }

  @Get('minimum-wages')
  @ApiOperation({ summary: 'UMR/UMP per region & tahun' })
  @ApiQuery({ name: 'regionCode', required: false })
  @ApiQuery({ name: 'year', required: false })
  async minimumWages(
    @Query('regionCode') regionCode?: string,
    @Query('year') year?: string,
  ) {
    return this.prisma.minimumWage.findMany({
      where: {
        ...(regionCode && { regionCode }),
        ...(year && { year: parseInt(year) }),
      },
      include: { region: { select: { code: true, name: true } } },
      orderBy: [{ regionCode: 'asc' }, { year: 'desc' }],
    });
  }
}
