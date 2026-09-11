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
// 'retain-on-first-failure' keeps the trace from the first attempt only.
// With retries on, 'retain-on-failure' stores one trace per attempt, and
// traces dominate the published report (~0.7 MB each). The retry traces are
// near-duplicates, so first-failure keeps what is useful at a third the size.
const TRACE = process.env.TRACE ?? 'retain-on-first-failure';

// Qase reporter is only added when QASE_MODE is set to a non-"off" value.
// Modes: 'testops' (send to Qase cloud) | 'report' (local file) | 'off' (disabled)
//
// Also skipped when `--list` is passed to Playwright: the reporter's lifecycle
// hooks (onBegin / onEnd) would still fire for a list-only invocation and
// create a phantom empty run on the Qase dashboard (0 tests, 0s duration).
const qaseMode = (process.env.QASE_MODE ?? 'off').toLowerCase();
const isListingOnly = process.argv.some((a) => a === '--list' || a === '--list-only');
const qaseEnabled = qaseMode !== 'off' && qaseMode !== '' && !isListingOnly;

/** @type {import('@playwright/test').ReporterDescription[]} */
const reporters = [
  ['list'],
  ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  // Machine-readable results, consumed by scripts/ci-gate.mjs to tell an
  // expected @known-bug failure apart from a real regression.
  ['json', { outputFile: 'test-results/results.json' }],
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
        // When true, the reporter flips the completed run to publicly viewable
        // and prints a "Public report link: https://..." line to stdout. Anyone
        // with that link can view the run dashboard -- no Qase account needed.
        // Off by default because it makes the run world-readable. Best left on
        // only in CI so reviewers on a PR can open the report without logging
        // in; leave off locally.
        showPublicReportLink:
          (process.env.QASE_TESTOPS_SHOW_PUBLIC_REPORT_LINK ?? 'false').toLowerCase() ===
          'true',
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
    trace: TRACE,
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
