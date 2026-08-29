#!/usr/bin/env node
/**
 * Qase run cleanup script.
 *
 * When a Playwright run is aborted (Ctrl+C, IDE kill, crash, etc.), the Qase
 * reporter's `onBegin` hook has already created the run on the server but
 * `onEnd` never fires, so the run is stuck "In progress" forever with 0
 * elapsed time and no stats. This is the main source of "phantom" runs on
 * the dashboard.
 *
 * This script:
 *   1. Lists recent runs in the Qase project.
 *   2. Finds any that have no `end_time` (still "In progress").
 *   3. Optionally: marks each of them complete via POST /run/{code}/{id}/complete.
 *   4. Optionally: deletes empty runs (0 test results) via DELETE /run/{code}/{id}.
 *
 * Usage (from repo root):
 *   node scripts/qase-cleanup.mjs                # dry-run: show what would happen
 *   node scripts/qase-cleanup.mjs --complete     # mark stale in-progress runs complete
 *   node scripts/qase-cleanup.mjs --delete-empty # delete runs with 0 test results
 *   node scripts/qase-cleanup.mjs --all          # do both (complete + delete-empty)
 *
 * Reads QASE_TESTOPS_API_TOKEN + QASE_TESTOPS_PROJECT from .env (or process env).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');

// Minimal .env loader (no dep on dotenv for this standalone script).
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
} catch {
  // .env not present -- rely on process.env (CI use case).
}

// Corporate SSL workaround parity with playwright.config.js.
if ((process.env.IGNORE_HTTPS_ERRORS ?? 'false').toLowerCase() === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const TOKEN = process.env.QASE_TESTOPS_API_TOKEN;
const PROJECT = process.env.QASE_TESTOPS_PROJECT ?? 'SAUCEPW';
const BASE = 'https://api.qase.io/v1';

if (!TOKEN) {
  console.error('ERROR: QASE_TESTOPS_API_TOKEN missing (checked .env and env vars).');
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const doComplete = args.has('--complete') || args.has('--all');
const doDelete = args.has('--delete-empty') || args.has('--all');
const dryRun = !doComplete && !doDelete;

const headers = { Token: TOKEN, 'Content-Type': 'application/json' };

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function listRuns() {
  // Fetch newest first; 100 is plenty for a project with a handful of daily runs.
  const data = await api(`/run/${PROJECT}?limit=100`);
  return data.result?.entities ?? [];
}

async function completeRun(id) {
  await api(`/run/${PROJECT}/${id}/complete`, { method: 'POST' });
}

async function deleteRun(id) {
  await api(`/run/${PROJECT}/${id}`, { method: 'DELETE' });
}

function fmtDate(v) {
  if (v == null) return '?';
  // Qase returns start_time as a "YYYY-MM-DD HH:mm:ss" string or a unix seconds
  // number depending on endpoint. Handle both defensively.
  try {
    const d = typeof v === 'number' ? new Date(v * 1000) : new Date(v);
    return Number.isNaN(d.valueOf()) ? String(v) : d.toISOString();
  } catch {
    return String(v);
  }
}

function fmtRun(r) {
  const stats = r.stats
    ? `total=${r.stats.total ?? 0} passed=${r.stats.passed ?? 0} failed=${r.stats.failed ?? 0}`
    : 'no stats';
  return `#${r.id}  "${r.title}"  start=${fmtDate(r.start_time)}  ${stats}`;
}

(async () => {
  console.log(`Qase cleanup -- project ${PROJECT}`);
  if (dryRun) console.log('(dry-run: pass --complete / --delete-empty / --all to act)');
  console.log('');

  const runs = await listRuns();
  console.log(`Found ${runs.length} recent runs.\n`);

  const stuck = runs.filter((r) => r.end_time == null);
  const empty = runs.filter((r) => (r.stats?.total ?? 0) === 0);

  console.log(`Stuck "In progress" runs (no end_time): ${stuck.length}`);
  stuck.forEach((r) => console.log(`  - ${fmtRun(r)}`));
  console.log('');

  console.log(`Empty runs (0 test results): ${empty.length}`);
  empty.forEach((r) => console.log(`  - ${fmtRun(r)}`));
  console.log('');

  if (doComplete) {
    console.log(`Marking ${stuck.length} stuck run(s) complete...`);
    for (const r of stuck) {
      try {
        await completeRun(r.id);
        console.log(`  OK  run #${r.id} marked complete`);
      } catch (e) {
        console.log(`  FAIL run #${r.id}: ${e.message}`);
      }
    }
    console.log('');
  }

  if (doDelete) {
    console.log(`Deleting ${empty.length} empty run(s)...`);
    for (const r of empty) {
      try {
        await deleteRun(r.id);
        console.log(`  OK  run #${r.id} deleted`);
      } catch (e) {
        console.log(`  FAIL run #${r.id}: ${e.message}`);
      }
    }
    console.log('');
  }

  console.log('Done.');
})().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
