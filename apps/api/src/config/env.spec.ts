import { validateEnv } from './env';

const validConfig = {
  NODE_ENV: 'test',
  PORT: '4000',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/kassa_ai_test',
  JWT_SECRET: 'a'.repeat(32),
  JWT_EXPIRES_IN_SECONDS: '900',
};

describe('validateEnv', () => {
  it('parses a valid configuration into typed values', () => {
    expect(validateEnv(validConfig)).toEqual({
      NODE_ENV: 'test',
      PORT: 4000,
      DATABASE_URL: validConfig.DATABASE_URL,
      JWT_SECRET: validConfig.JWT_SECRET,
      JWT_EXPIRES_IN_SECONDS: 900,
    });
  });

  it('applies defaults for optional values', () => {
    const result = validateEnv({
      DATABASE_URL: validConfig.DATABASE_URL,
      JWT_SECRET: validConfig.JWT_SECRET,
    });
    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3001);
    expect(result.JWT_EXPIRES_IN_SECONDS).toBe(3600);
  });

  it('rejects missing required values', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL is required[\s\S]*JWT_SECRET is required/);
  });

  it('rejects a short JWT secret without printing it', () => {
    const secret = 'short-secret-value';
    let message = '';
    try {
      validateEnv({ ...validConfig, JWT_SECRET: secret });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }
    expect(message).toMatch(/JWT_SECRET must be at least 32 characters/);
    expect(message).not.toContain(secret);
  });

  it('rejects the example JWT secret in production', () => {
    expect(() =>
      validateEnv({
        ...validConfig,
        NODE_ENV: 'production',
        JWT_SECRET: 'replace-with-a-random-string-of-at-least-32-characters',
      }),
    ).toThrow(/must not use the example value/);
  });

  it('rejects non-PostgreSQL database URLs and invalid numbers', () => {
    expect(() =>
      validateEnv({ ...validConfig, DATABASE_URL: 'mysql://localhost/db', PORT: 'abc' }),
    ).toThrow(/PORT must be a positive integer[\s\S]*DATABASE_URL must be a PostgreSQL/);
  });
});
