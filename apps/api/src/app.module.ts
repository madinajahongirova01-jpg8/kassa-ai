import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { CashEntriesModule } from './cash-entries/cash-entries.module';
import { validateEnv } from './config/env';
import { CustomersModule } from './customers/customers.module';
import { DebtsModule } from './debts/debts.module';
import { EntriesModule } from './entries/entries.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CustomersModule,
    DebtsModule,
    CashEntriesModule,
    EntriesModule,
    ReportsModule,
    TelegramModule,
    HealthModule,
  ],
})
export class AppModule {}
