/**
 * Builds the evidence bundle for a migration phase: per-story screenshots, an axe-core
 * report, and measured properties of every rendered control. Then compares two labels.
 *
 *   node tools/storybook-evidence.mjs --label before
 *   node tools/storybook-evidence.mjs --label after
 *   node tools/storybook-evidence.mjs --compare before after [--strict-pixels]
 *
 * Everything is written to .storybook-evidence/<label>/. Expects `npm run build-storybook`
 * to have been run against the commit you are labelling.
 *
 * What is a gate and what is not
 * ------------------------------
 * A raw pixel diff is NOT a gate for the MDC migration: MDC intentionally changes the DOM and
 * CSS of every component, so every story legitimately moves. The diff percentage and diff image
 * exist to tell a reviewer *where* to look. Use --strict-pixels for phases that are supposed to
 * be visually inert (e.g. a version bump after the MDC work is done), where any movement is a
 * regression.
 *
 * The real gates survive an intentional redesign, because they assert properties rather than
 * pixels: no story may disappear, axe violations may not increase, no control may lose its
 * accessible name, shrink below the 24x24 target minimum, or drop below the contrast floor.
 */
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const STORYBOOK_DIR = resolve('dist/storybook/bofa-design-system');
const EVIDENCE_DIR = resolve('.storybook-evidence');
const AXE_PATH = resolve('node_modules/axe-core/axe.min.js');
const VIEWPORT = { width: 900, height: 600 };

/** WCAG 2.1 AA, mirroring BRAND_CONTRACT.md A1 and B2. */
const MIN_CONTRAST_TEXT = 4.5;
const MIN_TARGET_PX = 24;
/** Fraction of differing pixels below which a change isn't worth a reviewer's attention. */
const PIXEL_NOISE_FLOOR = 0.001;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function serve(root) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]);
    const file = join(root, path === '/' ? 'index.html' : path);
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

/**
 * Runs in the page. Measures every interactive control: accessible name, rendered size, and
 * the contrast of its text against the nearest opaque ancestor background.
 */
/* c8 ignore start */
function measureControls() {
  const luminance = (rgb) => {
    const lin = rgb.map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  };
  const parse = (value) => {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((n) => parseFloat(n));
    if (parts.length === 4 && parts[3] === 0) return null;
    return parts.slice(0, 3);
  };
  const backdrop = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const rgb = parse(getComputedStyle(node).backgroundColor);
      if (rgb) return rgb;
      node = node.parentElement;
    }
    return [255, 255, 255];
  };
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  const selector = 'button, [role="button"], a[href], input, select, textarea, [role="switch"], [tabindex]:not([tabindex="-1"])';
  return [...document.querySelectorAll(selector)].map((el, i) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const fg = parse(style.color) ?? [0, 0, 0];
    const text = (el.textContent ?? '').trim();
    const name = (
      el.getAttribute('aria-label') ??
      el.getAttribute('title') ??
      text
    ).trim();
    return {
      key: `${el.tagName.toLowerCase()}#${i}`,
      name,
      // Only meaningful when the control actually renders text.
      contrast: text ? Number(contrast(fg, backdrop(el)).toFixed(2)) : null,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      disabled: el.hasAttribute('disabled'),
    };
  });
}
/* c8 ignore stop */

async function capture(label) {
  if (!existsSync(STORYBOOK_DIR)) {
    throw new Error(`No Storybook build at ${STORYBOOK_DIR}. Run: npm run build-storybook`);
  }

  const index = JSON.parse(await readFile(join(STORYBOOK_DIR, 'index.json'), 'utf8'));
  const stories = Object.values(index.entries).filter((e) => e.type === 'story');
  const outDir = join(EVIDENCE_DIR, label);
  await mkdir(outDir, { recursive: true });

  const server = await serve(STORYBOOK_DIR);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT });
  const axe = await readFile(AXE_PATH, 'utf8');

  const report = [];
  for (const story of stories) {
    await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`, {
      waitUntil: 'networkidle',
    });
    await page.waitForSelector('#storybook-root > *', { timeout: 15000 });
    await page.screenshot({ path: join(outDir, `${story.id}.png`) });

    await page.addScriptTag({ content: axe });
    const axeResult = await page.evaluate(async () =>
      // eslint-disable-next-line no-undef
      window.axe.run('#storybook-root', { resultTypes: ['violations'] })
    );
    const violations = axeResult.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      help: v.help,
    }));

    const controls = await page.evaluate(measureControls);

    report.push({ story: story.id, title: story.title, name: story.name, violations, controls });
    const issues = violations.reduce((n, v) => n + v.nodes, 0);
    console.log(
      `  ${issues === 0 ? 'clean    ' : `${issues} issue(s)`}  ${controls.length} control(s)  ${story.id}`
    );
  }

  await browser.close();
  server.close();
  await writeFile(join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');

  const total = report.reduce((n, r) => n + r.violations.reduce((m, v) => m + v.nodes, 0), 0);
  console.log(`\n${stories.length} stories captured to ${outDir}`);
  console.log(`${total} axe violation node(s)`);
}

const axeCount = (entry) => entry.violations.reduce((n, v) => n + v.nodes, 0);

async function pixelDiff(beforeLabel, afterLabel, storyId) {
  const load = async (label) => {
    const file = join(EVIDENCE_DIR, label, `${storyId}.png`);
    return existsSync(file) ? PNG.sync.read(await readFile(file)) : null;
  };
  const a = await load(beforeLabel);
  const b = await load(afterLabel);
  if (!a || !b) return null;
  if (a.width !== b.width || a.height !== b.height) {
    return { changed: 1, note: 'dimensions differ' };
  }

  const diff = new PNG({ width: a.width, height: a.height });
  const differing = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  const dir = join(EVIDENCE_DIR, `diff-${beforeLabel}-${afterLabel}`);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${storyId}.png`), PNG.sync.write(diff));
  return { changed: differing / (a.width * a.height) };
}

/** Property regressions that matter regardless of how much the pixels moved. */
function regressions(before, after) {
  const found = [];
  const prev = new Map(before.controls.map((c) => [c.key, c]));

  if (before.controls.length > after.controls.length) {
    found.push(`lost ${before.controls.length - after.controls.length} control(s)`);
  }
  for (const control of after.controls) {
    const was = prev.get(control.key);
    if (!was) continue;
    if (was.name && !control.name) {
      found.push(`${control.key} lost its accessible name ("${was.name}")`);
    }
    const smaller = Math.min(control.width, control.height);
    const wasSmaller = Math.min(was.width, was.height);
    if (smaller < MIN_TARGET_PX && smaller < wasSmaller) {
      found.push(
        `${control.key} shrank to ${control.width}x${control.height}, below the ${MIN_TARGET_PX}px minimum (was ${was.width}x${was.height})`
      );
    }
    if (
      control.contrast !== null &&
      was.contrast !== null &&
      control.contrast < MIN_CONTRAST_TEXT &&
      control.contrast < was.contrast
    ) {
      found.push(
        `${control.key} contrast fell to ${control.contrast}:1, below ${MIN_CONTRAST_TEXT}:1 (was ${was.contrast}:1)`
      );
    }
  }
  return found;
}

async function compare(beforeLabel, afterLabel, strictPixels) {
  const load = async (label) =>
    JSON.parse(await readFile(join(EVIDENCE_DIR, label, 'report.json'), 'utf8'));
  const before = new Map((await load(beforeLabel)).map((r) => [r.story, r]));
  const after = await load(afterLabel);

  const rows = [];
  const failures = [];

  for (const entry of after) {
    const was = before.get(entry.story);
    if (!was) {
      rows.push(`| \`${entry.story}\` | — | ${axeCount(entry)} | — | new story |`);
      continue;
    }

    const a = axeCount(was);
    const b = axeCount(entry);
    if (b > a) failures.push(`${entry.story}: axe violations ${a} -> ${b}`);

    const props = regressions(was, entry);
    props.forEach((p) => failures.push(`${entry.story}: ${p}`));

    const diff = await pixelDiff(beforeLabel, afterLabel, entry.story);
    const pct = diff ? `${(diff.changed * 100).toFixed(1)}%` : 'n/a';
    if (strictPixels && diff && diff.changed > PIXEL_NOISE_FLOOR) {
      failures.push(`${entry.story}: ${pct} of pixels changed in a phase that should be inert`);
    }

    const verdict = props.length
      ? `**${props.length} property regression(s)**`
      : b > a
      ? '**axe regression**'
      : diff && diff.changed > PIXEL_NOISE_FLOOR
      ? 'visual change — review'
      : 'unchanged';
    rows.push(`| \`${entry.story}\` | ${a} | ${b} | ${pct} | ${verdict} |`);
  }

  const missing = [...before.keys()].filter((id) => !after.some((e) => e.story === id));
  missing.forEach((id) => failures.push(`${id}: story disappeared`));

  console.log(`| Story | axe (${beforeLabel}) | axe (${afterLabel}) | pixels moved | |`);
  console.log('|---|---|---|---|---|');
  console.log(rows.join('\n'));
  console.log(
    `\nScreenshots: .storybook-evidence/{${beforeLabel},${afterLabel}}/  ` +
      `Diffs: .storybook-evidence/diff-${beforeLabel}-${afterLabel}/`
  );

  if (failures.length) {
    console.error(`\nFAIL — ${failures.length} regression(s):`);
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exitCode = 1;
  } else {
    console.log(
      '\nPASS — no story lost, no new axe violations, no control lost its name, shrank below ' +
        `${MIN_TARGET_PX}px, or fell below ${MIN_CONTRAST_TEXT}:1. Visual changes still need a human on the diffs.`
    );
  }
}

const args = process.argv.slice(2);
const labelIdx = args.indexOf('--label');
const compareIdx = args.indexOf('--compare');

if (compareIdx !== -1) {
  await compare(args[compareIdx + 1], args[compareIdx + 2], args.includes('--strict-pixels'));
} else if (labelIdx !== -1) {
  await capture(args[labelIdx + 1]);
} else {
  const labels = existsSync(EVIDENCE_DIR) ? await readdir(EVIDENCE_DIR) : [];
  console.log('Usage:');
  console.log('  node tools/storybook-evidence.mjs --label <name>');
  console.log('  node tools/storybook-evidence.mjs --compare <before> <after> [--strict-pixels]');
  console.log(`\nExisting labels: ${labels.join(', ') || '(none)'}`);
  process.exitCode = 1;
}
