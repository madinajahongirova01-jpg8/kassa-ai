import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EntriesParserService } from './entries-parser.service';
import { EntriesController } from './entries.controller';
import { GeminiClient } from './gemini.client';
import { ParseThrottlerGuard } from './parse-throttler.guard';

@Module({
  imports: [AuthModule],
  controllers: [EntriesController],
  providers: [EntriesParserService, GeminiClient, ParseThrottlerGuard],
})
export class EntriesModule {}
