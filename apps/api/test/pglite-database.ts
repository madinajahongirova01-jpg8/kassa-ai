import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PrismaPGlite } from 'pglite-prisma-adapter';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

const MIGRATIONS_DIR = resolve(__dirname, '../prisma/migrations');

export interface PgliteDatabase {
  prisma: PrismaService;
  /** Removes every row and restarts id sequences. */
  reset(): Promise<void>;
  close(): Promise<void>;
}

/**
 * In-memory PostgreSQL (PGlite) with every migration applied in order, for unit tests that need
 * real constraints, transactions and SQL semantics without a database server.
 */
export async function createPgliteDatabase(): Promise<PgliteDatabase> {
  const pg = new PGlite();
  const migrations = readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d+_/.test(name))
    .sort();
  for (const name of migrations) {
    await pg.exec(readFileSync(join(MIGRATIONS_DIR, name, 'migration.sql'), 'utf8'));
  }
  const prisma = new PrismaClient({ adapter: new PrismaPGlite(pg) });
  return {
    prisma: prisma as unknown as PrismaService,
    reset: async () => {
      await pg.exec('TRUNCATE "users", "telegram_accounts" RESTART IDENTITY CASCADE');
    },
    close: async () => {
      await prisma.$disconnect();
      await pg.close();
    },
  };
}
