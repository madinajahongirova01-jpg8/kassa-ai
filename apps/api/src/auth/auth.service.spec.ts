import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Env } from '../config/env';
import { Prisma, User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { JwtPayload } from './auth.types';
import { hashPassword } from './password';

const JWT_SECRET = 'unit-test-secret-that-is-at-least-32-chars';

type CreateArgs = [{ data: Pick<User, 'email' | 'name' | 'passwordHash'> }];
type FindUniqueArgs = [{ where: { email?: string; id?: string } }];

interface UserDelegateMock {
  create: jest.Mock<Promise<User>, CreateArgs>;
  findUnique: jest.Mock<Promise<User | null>, FindUniqueArgs>;
}

function buildUser(overrides: Partial<User> = {}): User {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: '7f9c2c1e-3b0a-4c39-9a51-0d4f3f7d2a10',
    email: 'owner@example.com',
    name: 'Owner',
    passwordHash: 'not-a-real-hash',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('AuthService', () => {
  let users: UserDelegateMock;
  let jwt: JwtService;
  let service: AuthService;

  beforeEach(() => {
    users = {
      create: jest.fn<Promise<User>, CreateArgs>(),
      findUnique: jest.fn<Promise<User | null>, FindUniqueArgs>(),
    };
    jwt = new JwtService({ secret: JWT_SECRET, signOptions: { expiresIn: 3600 } });
    const prisma = { user: users } as unknown as PrismaService;
    const config = new ConfigService<Env, true>({ JWT_EXPIRES_IN_SECONDS: 3600 });
    service = new AuthService(prisma, jwt, config);
  });

  describe('register', () => {
    it('stores an argon2id hash instead of the plain password and returns a valid token', async () => {
      users.create.mockImplementation(({ data }) => Promise.resolve(buildUser(data)));

      const result = await service.register({
        email: 'owner@example.com',
        password: 'correct-horse-battery',
        name: 'Owner',
      });

      const stored = users.create.mock.calls[0][0].data;
      expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
      expect(stored.passwordHash).not.toContain('correct-horse-battery');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(3600);
      expect(result.user).toEqual({
        id: expect.any(String) as string,
        email: 'owner@example.com',
        name: 'Owner',
        createdAt: expect.any(Date) as Date,
      });
      expect(result.user).not.toHaveProperty('passwordHash');
      const payload = await jwt.verifyAsync<JwtPayload>(result.accessToken);
      expect(payload.sub).toBe(result.user.id);
    });

    it('stores null when name is not provided', async () => {
      users.create.mockImplementation(({ data }) => Promise.resolve(buildUser(data)));

      await service.register({ email: 'owner@example.com', password: 'correct-horse-battery' });

      expect(users.create.mock.calls[0][0].data.name).toBeNull();
    });

    it('throws ConflictException when the email is already registered', async () => {
      users.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.register({ email: 'owner@example.com', password: 'correct-horse-battery' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unexpected database errors', async () => {
      const failure = new Error('connection lost');
      users.create.mockRejectedValue(failure);

      await expect(
        service.register({ email: 'owner@example.com', password: 'correct-horse-battery' }),
      ).rejects.toBe(failure);
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      const user = buildUser({ passwordHash: await hashPassword('correct-horse-battery') });
      users.findUnique.mockResolvedValue(user);

      const result = await service.login({ email: user.email, password: 'correct-horse-battery' });

      expect(result.user.id).toBe(user.id);
      const payload = await jwt.verifyAsync<JwtPayload>(result.accessToken);
      expect(payload.sub).toBe(user.id);
    });

    it('rejects a wrong password with a generic message', async () => {
      users.findUnique.mockResolvedValue(
        buildUser({ passwordHash: await hashPassword('correct-horse-battery') }),
      );

      const attempt = service.login({ email: 'owner@example.com', password: 'wrong-password' });

      await expect(attempt).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(attempt).rejects.toThrow('Invalid email or password');
    });

    it('rejects an unknown email with the same generic message', async () => {
      users.findUnique.mockResolvedValue(null);

      const attempt = service.login({ email: 'nobody@example.com', password: 'whatever-123' });

      await expect(attempt).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(attempt).rejects.toThrow('Invalid email or password');
    });
  });

  describe('findPublicUserById', () => {
    it('returns the profile without the password hash', async () => {
      users.findUnique.mockResolvedValue(buildUser());

      const user = await service.findPublicUserById('7f9c2c1e-3b0a-4c39-9a51-0d4f3f7d2a10');

      expect(user).not.toBeNull();
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('returns null for a missing user', async () => {
      users.findUnique.mockResolvedValue(null);

      await expect(service.findPublicUserById('7f9c2c1e-3b0a-4c39-9a51-0d4f3f7d2a10')).resolves.toBeNull();
    });
  });
});
