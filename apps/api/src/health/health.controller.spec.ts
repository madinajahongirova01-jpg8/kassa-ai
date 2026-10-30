import { GUARDS_METADATA } from '@nestjs/common/constants';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HealthController } from './health.controller';
import { HealthModule } from './health.module';

describe('HealthController', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [HealthModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers without a session', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('has no auth or throttler guards', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, HealthController)).toBeUndefined();
    const check = Object.getOwnPropertyDescriptor(HealthController.prototype, 'check')?.value as object;
    expect(Reflect.getMetadata(GUARDS_METADATA, check)).toBeUndefined();
  });
});
