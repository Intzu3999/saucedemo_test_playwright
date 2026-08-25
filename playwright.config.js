// @ts-check
require('dotenv').config();

// Corporate SSL interception workaround. Default false (proper SSL validation).
// Set IGNORE_HTTPS_ERRORS=true in .env when running behind a corporate proxy
// that presents a self-signed cert (e.g. Zscaler, Netskope).
//
// This also disables Node's TLS chain validation globally for the test process,
// so the Qase reporter (axios) and any other HTTPS client works too. Never set
// this to true in CI or production - only on trusted corporate networks.
const IGNORE_HTTPS_ERRORS =
  (process.env.IGNORE_HTTPS_ERRORS ?? 'false').toLowerCase() === 'true';
if (IGNORE_HTTPS_ERRORS) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const { defineConfig, devices } = require('@playwright/test');

const HEADLESS = (process.env.HEADLESS ?? 'true').toLowerCase() !== 'false';
const WORKERS = Number(process.env.WORKERS ?? 1);
const RETRIES = Number(process.env.RETRIES ?? 1);
const BASE_URL = process.env.BASE_URL ?? 'https://www.saucedemo.com';

// Qase reporter is only added when QASE_MODE is set to a non-"off" value.
// Modes: 'testops' (send to Qase cloud) | 'report' (local file) | 'off' (disabled)
const qaseMode = (process.env.QASE_MODE ?? 'off').toLowerCase();
const qaseEnabled = qaseMode !== 'off' && qaseMode !== '';

/** @type {import('@playwright/test').ReporterDescription[]} */
const reporters = [
  ['list'],
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
];

if (qaseEnabled) {
  reporters.push([
    'playwright-qase-reporter',
    {
      mode: qaseMode,
      debug: false,
      testops: {
        api: {
          token: process.env.QASE_TESTOPS_API_TOKEN,
        },
        project: process.env.QASE_TESTOPS_PROJECT,
        uploadAttachments: true,
        run: {
          title:
            process.env.QASE_TESTOPS_RUN_TITLE ||
            `Playwright Demo Run - ${new Date().toISOString()}`,
          complete:
            (process.env.QASE_TESTOPS_RUN_COMPLETE ?? 'true').toLowerCase() ===
            'true',
        },
      },
    },
  ]);
}

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : RETRIES,
  workers: process.env.CI ? 1 : WORKERS,
  reporter: reporters,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    headless: HEADLESS,
    ignoreHTTPSErrors: IGNORE_HTTPS_ERRORS,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Additional browsers can be enabled here once installed.
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  outputDir: 'test-results/',
});
