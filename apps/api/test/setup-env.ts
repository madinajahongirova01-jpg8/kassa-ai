import { resolveTestDatabaseUrl } from './test-database';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = resolveTestDatabaseUrl();
process.env.JWT_SECRET = 'e2e-test-only-secret-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN_SECONDS = '3600';
process.env.AUTH_THROTTLE_LIMIT = '10000';
