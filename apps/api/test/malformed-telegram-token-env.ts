// Imported first by the startup test, before AppModule reads the environment: a fake token in a
// wrong format, as if it had been pasted with quotes into the hosting dashboard.
process.env.TELEGRAM_BOT_TOKEN = '"123456:FAKE-token-for-tests"';

export {};
