import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JobService } from './job.service';
import {
  AssignJobDto,
  CreateJobDto,
  JobQueryDto,
  SubmitJobDto,
  TransitionJobDto,
} from './dto/job.dto';

@ApiTags('Job Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobController {
  constructor(private jobService: JobService) {}

  @Post()
  @ApiOperation({ summary: 'Buat job baru', description: 'Job dapat ad-hoc atau dari NCR/PO/RFI/dll' })
  create(@Body() dto: CreateJobDto, @CurrentUser() user: any) {
    return this.jobService.create(dto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar job dengan filter status/tipe/prioritas/assignee' })
  findAll(@CurrentUser() user: any, @Query() query: JobQueryDto) {
    return this.jobService.findAll(user.tenantId, query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Job yang di-assign ke saya (My Jobs §12.8)' })
  myJobs(@CurrentUser() user: any, @Query() query: JobQueryDto) {
    return this.jobService.myJobs(user.id, user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail job + audit trail' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobService.findOne(id, user.tenantId);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign job ke user/crew/subkon → status ASSIGNED' })
  assign(@Param('id') id: string, @Body() dto: AssignJobDto, @CurrentUser() user: any) {
    return this.jobService.assign(id, dto, user);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Submit job sebagai selesai + upload bukti (IN_PROGRESS → SUBMITTED)',
  })
  submit(@Param('id') id: string, @Body() dto: SubmitJobDto, @CurrentUser() user: any) {
    return this.jobService.submit(id, dto, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transisi status job (VERIFIED, REJECTED, CLOSED, REOPEN, BLOCKED, dll)' })
  transition(@Param('id') id: string, @Body() dto: TransitionJobDto, @CurrentUser() user: any) {
    return this.jobService.transition(id, dto, user);
  }

  @Get(':id/audit-trail')
  @ApiOperation({ summary: 'Riwayat transisi status (audit trail §12.3, §32)' })
  auditTrail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobService.getAuditTrail(id, user.tenantId);
  }
}
