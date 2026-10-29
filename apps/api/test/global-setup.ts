import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { API_ROOT, resolveTestDatabaseUrl } from './test-database';

export default function globalSetup(): void {
  const databaseUrl = resolveTestDatabaseUrl();
  execFileSync(process.execPath, [resolve(API_ROOT, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: API_ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}
