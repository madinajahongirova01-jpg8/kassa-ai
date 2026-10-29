import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CashEntriesModule } from './cash-entries/cash-entries.module';
import { validateEnv } from './config/env';
import { CustomersModule } from './customers/customers.module';
import { DebtsModule } from './debts/debts.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    CustomersModule,
    DebtsModule,
    CashEntriesModule,
    ReportsModule,
  ],
})
export class AppModule {}
