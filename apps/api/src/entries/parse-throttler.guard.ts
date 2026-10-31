import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  seconds,
  ThrottlerGuard,
  type ThrottlerModuleOptions,
  type ThrottlerRequest,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import { Env } from '../config/env';

export function parseTracker(req: Record<string, unknown>): string {
  const user = req.user;
  if (typeof user === 'object' && user !== null && 'id' in user && typeof user.id === 'string') {
    return `user:${user.id}`;
  }
  return `ip:${String(req.ip)}`;
}

@Injectable()
export class ParseThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly config: ConfigService<Env, true>,
  ) {
    super(options, storage, reflector);
  }

  protected override handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const ttl = seconds(this.config.get('ENTRY_PARSE_THROTTLE_TTL_SECONDS', { infer: true }));
    return super.handleRequest({
      ...requestProps,
      limit: this.config.get('ENTRY_PARSE_THROTTLE_LIMIT', { infer: true }),
      ttl,
      blockDuration: ttl,
      getTracker: parseTracker,
    });
  }
}
