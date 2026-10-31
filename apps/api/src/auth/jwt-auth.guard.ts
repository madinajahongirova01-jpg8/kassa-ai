import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { AuthService } from './auth.service';
import { AuthenticatedRequest, JwtPayload } from './auth.types';

const UNAUTHORIZED_MESSAGE = 'Missing or invalid access token';

export function extractBearerToken(header: string | undefined): string | undefined {
  if (header === undefined) {
    return undefined;
  }
  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || token === undefined || rest.length > 0) {
    return undefined;
  }
  return token;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (token === undefined) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const payload = await this.verify(token);
    if (
      payload === undefined ||
      typeof payload.sub !== 'string' ||
      !isUUID(payload.sub) ||
      typeof payload.iat !== 'number'
    ) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    const user = await this.auth.findSessionUser(payload.sub, payload.iat);
    if (user === null) {
      throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    }

    request.user = user;
    return true;
  }

  private async verify(token: string): Promise<Partial<JwtPayload> | undefined> {
    try {
      return await this.jwt.verifyAsync<Partial<JwtPayload>>(token);
    } catch {
      return undefined;
    }
  }
}
