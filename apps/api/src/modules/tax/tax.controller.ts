import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/roles.decorator';
import { TaxEngineService } from './tax-engine.service';
import { CalculateProgressClaimDto } from './dto/calculate-tax.dto';

@ApiTags('Tax Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tax')
export class TaxController {
  constructor(private taxEngine: TaxEngineService) {}

  @Get('rates')
  @ApiOperation({
    summary: 'Daftar tarif pajak efektif — PPh Final konstruksi (PP 9/2022) + PPN',
  })
  @ApiQuery({ name: 'effectiveDate', required: false, example: '2026-06-01' })
  listRates(@Query('effectiveDate') effectiveDate?: string) {
    return this.taxEngine.listRates(effectiveDate ? new Date(effectiveDate) : undefined);
  }

  @Post('progress-claim')
  @ApiOperation({
    summary: 'Hitung nilai bersih diterima (net cash-in) per termin',
    description:
      'Formula §22.2: Net = DPP + PPN − PPh Final − Recoupment DP − Retensi\n\n' +
      'DPP = nilai termin TIDAK termasuk PPN (§24.2)',
  })
  calculateProgressClaim(@Body() dto: CalculateProgressClaimDto) {
    return this.taxEngine.calculateProgressClaim(dto);
  }
}
