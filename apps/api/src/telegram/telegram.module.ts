import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaLinkRepository } from './repositories/prisma-link-repository';
import { PrismaTransactionRepository } from './repositories/prisma-transaction-repository';
import { PrismaUserRepository } from './repositories/prisma-user-repository';
import { TelegramLinkController } from './telegram-link.controller';
import { TelegramLinkService } from './telegram-link.service';

@Module({
  imports: [AuthModule],
  controllers: [TelegramLinkController],
  providers: [TelegramLinkService, PrismaUserRepository, PrismaLinkRepository, PrismaTransactionRepository],
})
export class TelegramModule {}
