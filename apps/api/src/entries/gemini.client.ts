import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env';
import { GEMINI_RESPONSE_SCHEMA, GEMINI_SYSTEM_PROMPT } from './gemini.prompt';

export const GEMINI_TIMEOUT_MS = 8000;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export type GeminiFailure = 'timeout' | 'network' | 'http' | 'bad-response';

export class GeminiError extends Error {
  constructor(
    readonly reason: GeminiFailure,
    readonly status?: number,
  ) {
    super(status === undefined ? `Gemini request failed: ${reason}` : `Gemini request failed: ${reason} ${status}`);
    this.name = 'GeminiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function responseText(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  const candidates: unknown = body.candidates;
  const candidate: unknown = Array.isArray(candidates) ? (candidates as unknown[])[0] : undefined;
  if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) return undefined;
  const texts = candidate.content.parts
    .map((part: unknown) => (isRecord(part) && typeof part.text === 'string' ? part.text : ''))
    .join('');
  return texts === '' ? undefined : texts;
}

function isTimeout(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('name' in error)) return false;
  return error.name === 'TimeoutError' || error.name === 'AbortError';
}

@Injectable()
export class GeminiClient {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get enabled(): boolean {
    return this.apiKey() !== undefined;
  }

  private apiKey(): string | undefined {
    const key = this.config.get('GEMINI_API_KEY', { infer: true })?.trim();
    return key === undefined || key === '' ? undefined : key;
  }

  async extract(text: string): Promise<unknown> {
    const key = this.apiKey();
    if (key === undefined) throw new GeminiError('network');
    const model = this.config.get('GEMINI_MODEL', { infer: true });

    let response: Response;
    try {
      response = await fetch(`${GEMINI_API_URL}/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: JSON.stringify({ text }) }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: GEMINI_RESPONSE_SCHEMA,
            temperature: 0,
            maxOutputTokens: 4096,
          },
        }),
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      });
    } catch (error) {
      throw new GeminiError(isTimeout(error) ? 'timeout' : 'network');
    }

    if (!response.ok) throw new GeminiError('http', response.status);

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      throw new GeminiError(isTimeout(error) ? 'timeout' : 'bad-response');
    }
    const output = responseText(body);
    if (output === undefined) throw new GeminiError('bad-response');
    try {
      return JSON.parse(output) as unknown;
    } catch {
      throw new GeminiError('bad-response');
    }
  }
}
