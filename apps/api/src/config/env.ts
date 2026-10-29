export type NodeEnv = 'development' | 'test' | 'production';

export interface Env {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN_SECONDS: number;
}

const NODE_ENVS: readonly NodeEnv[] = ['development', 'test', 'production'];
const MIN_JWT_SECRET_LENGTH = 32;
const PLACEHOLDER_JWT_SECRET = 'replace-with-a-random-string-of-at-least-32-characters';

function readString(config: Record<string, unknown>, key: string): string | undefined {
  const value = config[key];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function readPositiveInteger(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
  errors: string[],
): number {
  const raw = readString(config, key);
  if (raw === undefined) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    errors.push(`${key} must be a positive integer`);
    return fallback;
  }
  return value;
}

export function validateEnv(config: Record<string, unknown>): Env {
  const errors: string[] = [];

  const nodeEnvRaw = readString(config, 'NODE_ENV') ?? 'development';
  const nodeEnv = NODE_ENVS.find((candidate) => candidate === nodeEnvRaw);
  if (nodeEnv === undefined) {
    errors.push(`NODE_ENV must be one of: ${NODE_ENVS.join(', ')}`);
  }

  const port = readPositiveInteger(config, 'PORT', 3001, errors);
  if (port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  const databaseUrl = readString(config, 'DATABASE_URL');
  if (databaseUrl === undefined) {
    errors.push('DATABASE_URL is required');
  } else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    errors.push('DATABASE_URL must be a PostgreSQL connection string');
  }

  const jwtSecret = readString(config, 'JWT_SECRET');
  if (jwtSecret === undefined) {
    errors.push('JWT_SECRET is required');
  } else if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`);
  } else if (nodeEnv === 'production' && jwtSecret === PLACEHOLDER_JWT_SECRET) {
    errors.push('JWT_SECRET must not use the example value in production');
  }

  const jwtExpiresIn = readPositiveInteger(config, 'JWT_EXPIRES_IN_SECONDS', 3600, errors);

  if (errors.length > 0 || nodeEnv === undefined || databaseUrl === undefined || jwtSecret === undefined) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN_SECONDS: jwtExpiresIn,
  };
}
