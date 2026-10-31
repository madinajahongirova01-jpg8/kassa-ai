import { Injectable, Logger } from '@nestjs/common';
import { GeminiClient, GeminiError } from './gemini.client';
import { ParseResultResponse, readAiEntries, rulesEntries } from './parsed-entry';

@Injectable()
export class EntriesParserService {
  private readonly logger = new Logger(EntriesParserService.name);

  constructor(private readonly gemini: GeminiClient) {}

  async parse(text: string): Promise<ParseResultResponse> {
    if (!this.gemini.enabled) return this.byRules(text);
    try {
      const entries = readAiEntries(await this.gemini.extract(text), text);
      if (entries === null) {
        this.logger.warn('AI parse fell back to rules: invalid output');
        return this.byRules(text);
      }
      return { source: 'ai', entries };
    } catch (error) {
      const reason = error instanceof GeminiError ? error.message : 'unexpected error';
      this.logger.warn(`AI parse fell back to rules: ${reason}`);
      return this.byRules(text);
    }
  }

  private byRules(text: string): ParseResultResponse {
    return { source: 'rules', entries: rulesEntries(text) };
  }
}
