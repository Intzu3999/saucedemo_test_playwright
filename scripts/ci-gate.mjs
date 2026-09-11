#!/usr/bin/env node
/**
 * Decides whether a CI run should pass, after running the FULL suite.
 *
 * The suite deliberately contains tests that assert correct behaviour against
 * SauceDemo bugs, tagged @known-bug. Those failures are the expected signal,
 * not a broken build -- but a failure anywhere else is a real regression.
 *
 * So the run itself is allowed to exit non-zero, and this script makes the
 * pass/fail call from the JSON report:
 *
 *   exit 0  -- only @known-bug tests failed (or nothing failed)
 *   exit 1  -- at least one test without @known-bug failed
 *
 * It also reports @known-bug tests that PASSED, which means SauceDemo fixed
 * the defect and the tag should be dropped so CI starts protecting the fix.
 *
 * Usage: node scripts/ci-gate.mjs [path/to/results.json]
 */
import { readFileSync, appendFileSync } from 'node:fs';

const KNOWN_BUG = '@known-bug';
const file = process.argv[2] ?? 'test-results/results.json';

let report;
try {
  report = JSON.parse(readFileSync(file, 'utf8'));
} catch (err) {
  console.error(`ci-gate: cannot read ${file}: ${err.message}`);
  console.error('ci-gate: did the test step run with the json reporter enabled?');
  process.exit(2);
}

/** Flatten the suite tree into one entry per test. */
const collect = (suite, titles = []) => {
  const path = suite.title ? [...titles, suite.title] : titles;
  const out = [];

  for (const spec of suite.specs ?? []) {
    // A spec may run under several projects; each is a separate result.
    for (const test of spec.tests ?? []) {
      const results = test.results ?? [];
      const last = results[results.length - 1];
      out.push({
        // Matches how Playwright's --grep sees a test: the whole title chain.
        fullTitle: [...path, spec.title].join(' > '),
        status: test.status ?? last?.status ?? 'unknown',
        attempts: results.length,
      });
    }
  }

  for (const child of suite.suites ?? []) out.push(...collect(child, path));
  return out;
};

const tests = (report.suites ?? []).flatMap((s) => collect(s));

if (tests.length === 0) {
  console.error('ci-gate: no tests found in the report -- treating as failure');
  process.exit(2);
}

const isKnownBug = (t) => t.fullTitle.includes(KNOWN_BUG);
// Playwright's per-test status: 'expected' | 'unexpected' | 'flaky' | 'skipped'
const failed = (t) => t.status === 'unexpected';

const knownBugFailures = tests.filter((t) => isKnownBug(t) && failed(t));
const realFailures = tests.filter((t) => !isKnownBug(t) && failed(t));
const knownBugPasses = tests.filter((t) => isKnownBug(t) && t.status === 'expected');
const flaky = tests.filter((t) => t.status === 'flaky');
const skipped = tests.filter((t) => t.status === 'skipped');

const line = (label, n) => `  ${label.padEnd(38)} ${String(n).padStart(3)}`;
console.log('\nCI gate summary');
console.log('---------------');
console.log(line('total tests', tests.length));
console.log(line('known-bug failures (expected)', knownBugFailures.length));
console.log(line('known-bug passes (bug may be fixed)', knownBugPasses.length));
console.log(line('flaky', flaky.length));
console.log(line('skipped', skipped.length));
console.log(line('UNEXPECTED failures', realFailures.length));

if (knownBugPasses.length > 0) {
  console.log('\nThese @known-bug tests PASSED -- if SauceDemo fixed the defect,');
  console.log('drop the tag so CI starts protecting the fix:');
  for (const t of knownBugPasses) console.log(`  - ${t.fullTitle}`);
}

if (realFailures.length > 0) {
  console.log('\nUnexpected failures (these fail the build):');
  for (const t of realFailures) console.log(`  - ${t.fullTitle}`);
}

// Surface the verdict in the GitHub Actions job summary when available.
if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = [
    ['Total tests', tests.length],
    ['Known-bug failures (expected)', knownBugFailures.length],
    ['Known-bug passes (possibly fixed)', knownBugPasses.length],
    ['Flaky', flaky.length],
    ['Skipped', skipped.length],
    ['**Unexpected failures**', `**${realFailures.length}**`],
  ];
  const md = [
    '## Playwright CI gate',
    '',
    '| Outcome | Count |',
    '|---|---|',
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
    '',
    realFailures.length > 0
      ? `Failing because ${realFailures.length} test(s) outside \`${KNOWN_BUG}\` failed.`
      : `Passing: every failure was an expected \`${KNOWN_BUG}\`.`,
    '',
  ];
  if (realFailures.length > 0) {
    md.push('<details><summary>Unexpected failures</summary>', '');
    for (const t of realFailures) md.push(`- \`${t.fullTitle}\``);
    md.push('', '</details>', '');
  }
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n'));
}

if (realFailures.length > 0) {
  console.log(`\nRESULT: FAIL -- ${realFailures.length} unexpected failure(s).\n`);
  process.exit(1);
}

console.log(
  `\nRESULT: PASS -- ${knownBugFailures.length} expected ${KNOWN_BUG} failure(s), no regressions.\n`,
);
