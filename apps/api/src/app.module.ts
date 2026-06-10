import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
// Phase 0+1 Modules
import { AuthModule } from './modules/auth/auth.module';
import { AHSPModule } from './modules/ahsp/ahsp.module';
import { TaxModule } from './modules/tax/tax.module';
import { RABRAPModule } from './modules/rab-rap/rab-rap.module';
import { ProjectModule } from './modules/project/project.module';
import { JobModule } from './modules/job/job.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
// Phase 2+ Modules
import { NCRModule } from './modules/ncr/ncr.module';
import { RFIModule } from './modules/rfi/rfi.module';
import { ProgressClaimModule } from './modules/progress-claim/progress-claim.module';
import { DocumentModule } from './modules/document/document.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DailyLogModule } from './modules/daily-log/daily-log.module';
// Phase 7+ Modules
import { EquipmentModule } from './modules/equipment/equipment.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { HSEModule } from './modules/hse/hse.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    // Phase 0+1
    AuthModule,
    AHSPModule,
    TaxModule,
    RABRAPModule,
    ProjectModule,
    JobModule,
    MasterDataModule,
    // Phase 2+
    NCRModule,
    RFIModule,
    ProgressClaimModule,
    DocumentModule,
    NotificationModule,
    AnalyticsModule,
    DailyLogModule,
    // Phase 7+
    EquipmentModule,
    ProcurementModule,
    HSEModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
