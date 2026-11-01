// Test-only environment for HTTP unit tests on PGlite. Imported before AppModule, because
// ConfigModule reads the environment when AppModule is loaded; values already in process.env win
// over .env, so real secrets from .env are never used here.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://unused@localhost:5432/unused';
process.env.JWT_SECRET = 'unit-test-only-secret-at-least-32-characters';
process.env.JWT_EXPIRES_IN_SECONDS = '3600';
process.env.AUTH_THROTTLE_LIMIT = '10000';
process.env.AUTH_THROTTLE_TTL_SECONDS = '60';
process.env.TRUST_PROXY = 'loopback';
process.env.GEMINI_API_KEY = '';

export {};
