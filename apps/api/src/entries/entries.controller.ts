import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParseEntriesDto } from './dto/parse-entries.dto';
import { EntriesParserService } from './entries-parser.service';
import { ParseResultResponse } from './parsed-entry';
import { ParseThrottlerGuard } from './parse-throttler.guard';

@Controller('entries')
@UseGuards(JwtAuthGuard, ParseThrottlerGuard)
export class EntriesController {
  constructor(private readonly parser: EntriesParserService) {}

  @Post('parse')
  @HttpCode(HttpStatus.OK)
  parse(@Body() dto: ParseEntriesDto): Promise<ParseResultResponse> {
    return this.parser.parse(dto.text);
  }
}
