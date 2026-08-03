import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  /* Con solo 5 tests, correr en serie ya es rápido (~8s) y evita cualquier
     necesidad de tocar la concurrencia de navegadores/tokens. */
  workers: 1,
  reporter: [['html', { outputFolder: '../playwright-report-api', open: 'never' }]],
  outputDir: '../test-results-api',
  use: {
    baseURL: 'https://www.coppel.com',
  },
});
