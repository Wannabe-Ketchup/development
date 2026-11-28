import { defineConfig, devices } from '@playwright/test';

const COMPACT_SPEC = /pomodoro-compact-accessibility\.spec\.ts/;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      // 좁은 화면 흐름은 아래 두 프로젝트가 맡는다
      testIgnore: COMPACT_SPEC,
      use: {
        ...devices['Desktop Chrome'],
        // 홈은 너비 1200 이상이라 데스크톱이고, 방은 너비 1080 이상이라 데스크톱이다.
        viewport: { width: 1440, height: 900 },
        channel: 'chrome',
      },
    },
    {
      // 폰 화면(너비 870 미만, iPhone 15)
      name: 'compact-mobile',
      testMatch: COMPACT_SPEC,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 393, height: 852 },
        channel: 'chrome',
      },
    },
    {
      // 중간 화면(너비 870 이상 1080 미만, iPad Pro 12.9 세로)
      name: 'compact-tablet',
      testMatch: COMPACT_SPEC,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 1366 },
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
