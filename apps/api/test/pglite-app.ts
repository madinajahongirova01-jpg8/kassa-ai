import './pglite-env';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { getOptionsToken, ThrottlerModuleOptions } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { createPgliteDatabase, PgliteDatabase } from './pglite-database';

export interface PgliteApp {
  app: NestExpressApplication;
  db: PgliteDatabase;
  close(): Promise<void>;
}

/** The whole API (guards, pipes, filter) on an in-memory PGlite database, for HTTP unit tests. */
export async function createPgliteApp(throttle?: ThrottlerModuleOptions): Promise<PgliteApp> {
  const db = await createPgliteDatabase();

  let builder = Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(db.prisma);
  if (throttle !== undefined) {
    builder = builder.overrideProvider(getOptionsToken()).useValue(throttle);
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  app.useLogger(false);
  configureApp(app);
  await app.init();

  return {
    app,
    db,
    close: async () => {
      await app.close();
      await db.close();
    },
  };
}
