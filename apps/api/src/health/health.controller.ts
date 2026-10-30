import { Controller, Get, Header } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
}

// Public liveness check for the hosting platform: no auth, no throttling, no database access.
@Controller('health')
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
