import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProgressClaimService } from './progress-claim.service';
import { CreateProgressClaimDto, ProgressClaimQueryDto } from './dto/progress-claim.dto';

@ApiTags('Progress Claim — §22')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('progress-claims')
export class ProgressClaimController {
  constructor(private claimService: ProgressClaimService) {}

  @Post()
  @ApiOperation({ summary: 'Buat progress claim baru dengan kalkulasi DPP/PPN/PPh otomatis' })
  create(@Body() dto: CreateProgressClaimDto, @CurrentUser() user: any) {
    return this.claimService.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar progress claims' })
  findAll(@CurrentUser() user: any, @Query() query: ProgressClaimQueryDto) {
    return this.claimService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail progress claim + lines' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.claimService.findOne(id, user.tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transisi status claim (SUBMITTED → UNDER_REVIEW → APPROVED → CERTIFIED → PAID)' })
  transition(
    @Param('id') id: string,
    @Body() body: { toStatus: string },
    @CurrentUser() user: any,
  ) {
    return this.claimService.transition(id, body.toStatus, user.tenantId, user.id);
  }
}
