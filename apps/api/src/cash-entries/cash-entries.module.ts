import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CashEntriesController } from './cash-entries.controller';
import { CashEntriesService } from './cash-entries.service';

@Module({
  imports: [AuthModule],
  controllers: [CashEntriesController],
  providers: [CashEntriesService],
})
export class CashEntriesModule {}
