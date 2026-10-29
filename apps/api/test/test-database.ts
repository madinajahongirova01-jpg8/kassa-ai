import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const API_ROOT = resolve(__dirname, '..');

export function resolveTestDatabaseUrl(): string {
  const envFile = resolve(API_ROOT, '.env');
  if (process.env.TEST_DATABASE_URL === undefined && existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }

  const url = process.env.TEST_DATABASE_URL;
  if (url === undefined || url.trim() === '') {
    throw new Error('TEST_DATABASE_URL is required to run e2e tests');
  }

  const databaseName = new URL(url).pathname.replace(/^\//, '');
  if (!databaseName.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URL must point to a database whose name ends with "_test"');
  }

  return url;
}
