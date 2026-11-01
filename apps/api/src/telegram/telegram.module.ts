import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DebtsModule } from '../debts/debts.module';
import { PrismaLinkRepository } from './repositories/prisma-link-repository';
import { PrismaTransactionRepository } from './repositories/prisma-transaction-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { TelegramLinkController } from './telegram-link.controller';
import { TelegramKassaSync } from './telegram-kassa-sync';
import { TelegramLinkService } from './telegram-link.service';

@Module({
  imports: [AuthModule, DebtsModule],
  controllers: [TelegramLinkController],
  providers: [TelegramLinkService, TelegramKassaSync, PrismaUserRepository, PrismaLinkRepository, PrismaTransactionRepository],
})
export class TelegramModule {}
