import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  /* Retry on CI, and once locally since this suite runs against the real
     coppel.com production site. */
  retries: process.env.CI ? 2 : 1,
  /* Coppel.com is a real third-party site; keep concurrency low to avoid
     tripping rate limits / anti-automation heuristics from too many
     simultaneous sessions. */
  workers: 2,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    /* 'on' toma una captura al final de cada test, pase o falle -- no solo
       en fallos -- como evidencia visual de cada corrida. */
    screenshot: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
