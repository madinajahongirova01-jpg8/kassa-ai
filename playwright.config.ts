import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const WEB_URL = "http://localhost:3000";
const API_URL = "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm --prefix apps/api run start",
      url: `${API_URL}/health`,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: { PORT: "3001", NODE_ENV: "production" },
    },
    {
      command: "npm run start",
      url: WEB_URL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: { KASSA_API_URL: API_URL, PORT: "3000" },
    },
  ],
});
