import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthenticatedRequest, PublicUser } from './auth.types';
import { extractBearerToken, JwtAuthGuard } from './jwt-auth.guard';

const SECRET = 'unit-test-secret-that-is-at-least-32-chars';
const USER: PublicUser = {
  id: '7f9c2c1e-3b0a-4c39-9a51-0d4f3f7d2a10',
  email: 'owner@example.com',
  name: null,
  businessName: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function contextFor(request: Partial<AuthenticatedRequest>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('extractBearerToken', () => {
  it.each([
    [undefined, undefined],
    ['', undefined],
    ['Basic abc', undefined],
    ['Bearer', undefined],
    ['Bearer a b', undefined],
    ['Bearer abc.def', 'abc.def'],
    ['bearer   abc.def', 'abc.def'],
  ])('parses %p as %p', (header, expected) => {
    expect(extractBearerToken(header)).toBe(expected);
  });
});

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: SECRET, verifyOptions: { algorithms: ['HS256'] } });
  let findSessionUser: jest.Mock<Promise<PublicUser | null>, [string, number]>;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    findSessionUser = jest.fn<Promise<PublicUser | null>, [string, number]>();
    guard = new JwtAuthGuard(jwt, { findSessionUser } as unknown as AuthService);
  });

  it('attaches the user for a valid token', async () => {
    findSessionUser.mockResolvedValue(USER);
    const token = await jwt.signAsync({ sub: USER.id });
    const request: Partial<AuthenticatedRequest> = { headers: { authorization: `Bearer ${token}` } };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toEqual(USER);
    expect(findSessionUser).toHaveBeenCalledWith(USER.id, expect.any(Number));
  });

  it('rejects a token without an issue time', async () => {
    const token = await jwt.signAsync({ sub: USER.id }, { noTimestamp: true });

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findSessionUser).not.toHaveBeenCalled();
  });

  it('rejects a request without a token', async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(findSessionUser).not.toHaveBeenCalled();
  });

  it('rejects a token signed with another secret', async () => {
    const forged = await new JwtService({ secret: 'another-secret-that-is-32-characters-long' }).signAsync({
      sub: USER.id,
    });

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${forged}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findSessionUser).not.toHaveBeenCalled();
  });

  it('rejects an expired token', async () => {
    const expired = await jwt.signAsync({ sub: USER.id, exp: Math.floor(Date.now() / 1000) - 60 });

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${expired}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token whose subject is not a UUID', async () => {
    const token = await jwt.signAsync({ sub: 'not-a-uuid' });

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findSessionUser).not.toHaveBeenCalled();
  });

  it('rejects a token for a user that no longer exists or changed the password since', async () => {
    findSessionUser.mockResolvedValue(null);
    const token = await jwt.signAsync({ sub: USER.id });

    await expect(
      guard.canActivate(contextFor({ headers: { authorization: `Bearer ${token}` } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
