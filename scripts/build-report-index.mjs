#!/usr/bin/env node
/**
 * Regenerates the root index.html of the gh-pages report store.
 *
 * The store looks like:
 *   reports/<slot>/run-<n>/index.html   <- a published Playwright report
 *   reports/<slot>/run-<n>/meta.json    <- optional run metadata (see below)
 *
 * where <slot> is "pr-<number>" or "branch-<name>". Runs published before
 * meta.json existed simply render without the extra detail.
 *
 * With --keep <n>, only the n newest runs per slot are retained; older run
 * folders are deleted before the index is written, so the index never lists
 * a report that was just pruned. A published report is ~13 MB, and GitHub
 * Pages serves at most 1 GB, so the store needs a ceiling.
 *
 * Usage: node scripts/build-report-index.mjs <gh-pages-root> [--keep <n>]
 */
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const root = args.find((a) => !a.startsWith('--'));
if (!root) {
  console.error('usage: node scripts/build-report-index.mjs <gh-pages-root> [--keep <n>]');
  process.exit(2);
}

const keepArg = args.indexOf('--keep');
const keep = keepArg === -1 ? Infinity : Number(args[keepArg + 1]);
if (!(keep > 0)) {
  console.error(`--keep needs a positive number, got "${args[keepArg + 1]}"`);
  process.exit(2);
}

const dirsIn = (path) => {
  try {
    return readdirSync(path, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
};

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

const reportsRoot = join(root, 'reports');
const slots = [];

for (const slot of dirsIn(reportsRoot)) {
  const runs = [];

  for (const run of dirsIn(join(reportsRoot, slot))) {
    const m = /^run-(\d+)$/.exec(run);
    if (!m) continue;

    const dir = join(reportsRoot, slot, run);
    try {
      statSync(join(dir, 'index.html'));
    } catch {
      continue; // no report here, skip
    }

    let meta = {};
    try {
      meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
    } catch {
      // Pre-meta.json run, or malformed -- render what we can.
    }

    runs.push({ number: Number(m[1]), href: `reports/${slot}/${run}/`, meta });
  }

  if (runs.length === 0) continue;
  runs.sort((a, b) => b.number - a.number);

  // Drop the oldest runs past the cap. Only ever removes directories this
  // loop already matched as run-<n> under reports/<slot>/.
  for (const stale of runs.splice(Number.isFinite(keep) ? keep : runs.length)) {
    const dir = join(reportsRoot, slot, `run-${stale.number}`);
    rmSync(dir, { recursive: true, force: true });
    console.log(`pruned ${dir}`);
  }

  slots.push({ slot, runs });
}

// Open PRs first (highest PR number first), then branches alphabetically.
slots.sort((a, b) => {
  const pr = (s) => (/^pr-(\d+)$/.test(s) ? Number(/^pr-(\d+)$/.exec(s)[1]) : -1);
  const [x, y] = [pr(a.slot), pr(b.slot)];
  if (x !== y) return y - x;
  return a.slot.localeCompare(b.slot);
});

const label = (slot) => {
  const m = /^pr-(\d+)$/.exec(slot);
  return m ? `Pull request #${m[1]}` : slot.replace(/^branch-/, 'Branch: ');
};

const totalRuns = slots.reduce((n, s) => n + s.runs.length, 0);

const rows = (runs) =>
  runs
    .map((r) => {
      const when = r.meta.published_at
        ? new Date(r.meta.published_at).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
        : '&mdash;';
      const sha = r.meta.sha
        ? `<code>${esc(r.meta.sha)}</code>`
        : '&mdash;';
      return `      <tr>
        <td><a href="${esc(r.href)}">Run #${r.number}</a></td>
        <td>${when}</td>
        <td>${sha}</td>
      </tr>`;
    })
    .join('\n');

const sections = slots
  .map(
    (s) => `    <h2>${esc(label(s.slot))} <span class="count">${s.runs.length} run${
      s.runs.length === 1 ? '' : 's'
    }</span></h2>
    <table>
      <thead><tr><th>Report</th><th>Published</th><th>Commit</th></tr></thead>
      <tbody>
${rows(s.runs)}
      </tbody>
    </table>`,
  )
  .join('\n\n');

const empty = `    <p class="empty">No reports published yet.</p>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Playwright reports -- saucedemo_test_playwright</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         max-width: 60rem; margin: 3rem auto; padding: 0 1.5rem; line-height: 1.55; }
  h1 { margin-bottom: .25rem; }
  .sub { opacity: .7; margin-top: 0; }
  h2 { margin-top: 2.5rem; font-size: 1.1rem; }
  .count { font-weight: 400; opacity: .6; font-size: .85rem; margin-left: .5rem; }
  table { border-collapse: collapse; width: 100%; margin-top: .5rem; }
  th, td { text-align: left; padding: .5rem .75rem; border-bottom: 1px solid rgba(128,128,128,.3); }
  th { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; opacity: .7; }
  code { font-size: .9em; }
  footer { margin-top: 3rem; font-size: .85rem; opacity: .6; }
  .empty { opacity: .7; margin-top: 2rem; }
</style>
</head>
<body>
  <h1>Playwright test reports</h1>
  <p class="sub">
    Published by CI from
    <a href="https://github.com/Intzu3999/saucedemo_test_playwright">Intzu3999/saucedemo_test_playwright</a>.
    Each CI run publishes to its own permanent URL, newest first.
  </p>

${totalRuns === 0 ? empty : sections}

  <footer>
    ${totalRuns} report${totalRuns === 1 ? '' : 's'} &middot;
    index regenerated ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC
  </footer>
</body>
</html>
`;

writeFileSync(join(root, 'index.html'), html);
console.log(`wrote ${join(root, 'index.html')}: ${slots.length} slot(s), ${totalRuns} run(s)`);
