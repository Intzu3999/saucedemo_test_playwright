#!/usr/bin/env node
/**
 * First-time repo setup.
 *
 * Runs the three steps a fresh clone needs:
 *   1. `npm ci`                             -- install Node dependencies
 *   2. `npx playwright install --with-deps` -- install Chromium
 *   3. Copy `.env.example` -> `.env`         (only if `.env` does not exist)
 *
 * Cross-platform (Node built-ins only, no shell scripts). Works on Windows
 * PowerShell, macOS, Linux, and CI runners.
 *
 * Usage:
 *   npm run setup            # normal flow
 *   node scripts/setup.mjs   # equivalent, no npm indirection
 *
 * Exit codes:
 *   0  -- all steps succeeded
 *   1  -- any step failed (npm ci, playwright install, or fs error)
 *
 * Idempotent: safe to re-run. `.env` is never overwritten if it exists.
 */

import { execSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function heading(label) {
  const bar = '='.repeat(Math.max(label.length + 8, 60));
  console.log(`\n${bar}\n>>> ${label}\n${bar}`);
}

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

try {
  heading('1/3  Install Node dependencies (npm ci)');
  run('npm ci');

  heading('2/3  Install Playwright browsers (Chromium)');
  // --with-deps also installs missing OS-level libs on Linux CI runners;
  // no-op on Windows / macOS.
  run('npx playwright install --with-deps chromium');

  heading('3/3  Ensure .env exists');
  const envPath = join(root, '.env');
  const examplePath = join(root, '.env.example');
  if (existsSync(envPath)) {
    console.log('.env already exists -- leaving untouched.');
  } else if (existsSync(examplePath)) {
    copyFileSync(examplePath, envPath);
    console.log('Copied .env.example -> .env.');
    console.log(
      'Edit .env and fill in real values (QASE_TESTOPS_API_TOKEN, etc.)\n' +
        'before running the suite against Qase.io.'
    );
  } else {
    console.log(
      'WARN: neither .env nor .env.example is present. Skipping this step.'
    );
  }

  heading('Setup complete');
  console.log('Next: run the full suite with `npm test`.');
} catch (err) {
  console.error('\nSetup failed:', err.message ?? err);
  process.exit(1);
}
