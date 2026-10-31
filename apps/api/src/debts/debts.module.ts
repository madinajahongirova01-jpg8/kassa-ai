import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { DebtEditsController } from './debt-edits.controller';
import { DebtEditsService } from './debt-edits.service';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';

@Module({
  imports: [AuthModule, CustomersModule],
  controllers: [DebtsController, DebtEditsController],
  providers: [DebtsService, DebtEditsService],
})
export class DebtsModule {}
