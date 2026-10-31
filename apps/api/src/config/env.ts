import { isIP } from 'node:net';

export type NodeEnv = 'development' | 'test' | 'production';

export interface Env {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN_SECONDS: number;
  AUTH_THROTTLE_LIMIT: number;
  AUTH_THROTTLE_TTL_SECONDS: number;
  TRUST_PROXY: string[];
  GEMINI_API_KEY: string | undefined;
  GEMINI_MODEL: string;
  ENTRY_PARSE_THROTTLE_LIMIT: number;
  ENTRY_PARSE_THROTTLE_TTL_SECONDS: number;
}

const NODE_ENVS: readonly NodeEnv[] = ['development', 'test', 'production'];
const MIN_JWT_SECRET_LENGTH = 32;
const PLACEHOLDER_JWT_SECRET = 'replace-with-a-random-string-of-at-least-32-characters';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_MODEL_PATTERN = /^[a-z0-9][a-z0-9.-]{1,63}$/;
const TRUST_PROXY_NAMES: readonly string[] = ['loopback', 'linklocal', 'uniquelocal'];

function isTrustProxyEntry(entry: string): boolean {
  if (TRUST_PROXY_NAMES.includes(entry)) {
    return true;
  }
  const [address, prefix, ...rest] = entry.split('/');
  const version = isIP(address);
  if (version === 0 || rest.length > 0) {
    return false;
  }
  if (prefix === undefined) {
    return true;
  }
  return /^\d{1,3}$/.test(prefix) && Number(prefix) <= (version === 4 ? 32 : 128);
}

function readTrustProxy(config: Record<string, unknown>, errors: string[]): string[] {
  const entries = (readString(config, 'TRUST_PROXY') ?? 'loopback')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
  if (entries.length === 0 || !entries.every(isTrustProxyEntry)) {
    errors.push(`TRUST_PROXY must be a comma-separated list of IP addresses, CIDR ranges or ${TRUST_PROXY_NAMES.join('/')}`);
  }
  return entries;
}

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
  const authThrottleLimit = readPositiveInteger(config, 'AUTH_THROTTLE_LIMIT', 10, errors);
  const authThrottleTtl = readPositiveInteger(config, 'AUTH_THROTTLE_TTL_SECONDS', 60, errors);
  const trustProxy = readTrustProxy(config, errors);
  const geminiModel = readString(config, 'GEMINI_MODEL') ?? DEFAULT_GEMINI_MODEL;
  if (!GEMINI_MODEL_PATTERN.test(geminiModel)) {
    errors.push('GEMINI_MODEL must be a model id such as ' + DEFAULT_GEMINI_MODEL);
  }
  const parseThrottleLimit = readPositiveInteger(config, 'ENTRY_PARSE_THROTTLE_LIMIT', 20, errors);
  const parseThrottleTtl = readPositiveInteger(config, 'ENTRY_PARSE_THROTTLE_TTL_SECONDS', 60, errors);

  if (errors.length > 0 || nodeEnv === undefined || databaseUrl === undefined || jwtSecret === undefined) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN_SECONDS: jwtExpiresIn,
    AUTH_THROTTLE_LIMIT: authThrottleLimit,
    AUTH_THROTTLE_TTL_SECONDS: authThrottleTtl,
    TRUST_PROXY: trustProxy,
    GEMINI_API_KEY: readString(config, 'GEMINI_API_KEY'),
    GEMINI_MODEL: geminiModel,
    ENTRY_PARSE_THROTTLE_LIMIT: parseThrottleLimit,
    ENTRY_PARSE_THROTTLE_TTL_SECONDS: parseThrottleTtl,
  };
}
