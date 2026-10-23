#!/usr/bin/env node
// Capture a site for a video (before/after, service explainer): same viewport, lazy images
// loaded, sticky headers and cookie banners out of the way.
//
//   node capture-site.mjs <url> <out-dir> --name <name> [--sections] [--wayback YYYYMMDD] [--width 1440] [--height 900]
//   node capture-site.mjs --self-test
//
// Writes <name>-desktop.png (viewport), <name>-desktop-full.png, <name>-mobile.png and
// <name>-mobile-full.png (390x844 @2x) into <out-dir>. --sections also writes one desktop crop per
// page section (<name>-section-NN.png) and <name>-outline.json: per section its file, heading and
// visible text, so a script can quote the page instead of inventing claims.
import { createRequire } from 'node:module';
import { mkdirSync, existsSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// The skill's own node_modules (installed by setup), or PLAYWRIGHT_DIR pointing at a project that has it.
const CANDIDATES = [
  process.env.PLAYWRIGHT_DIR,
  join(dirname(fileURLToPath(import.meta.url)), '..'),
].filter(Boolean);

function loadPlaywright() {
  for (const dir of CANDIDATES) {
    try { return createRequire(join(dir, 'package.json'))('playwright'); } catch {}
  }
  throw new Error(`Playwright not found in: ${CANDIDATES.join(', ')}. Run the skill's setup script (or npm install in the skill dir), or set PLAYWRIGHT_DIR.`);
}

// Never kill animations here: entrance animations start at opacity 0 and would freeze there.
// screenshot({ animations: 'disabled' }) fast-forwards them to their end state instead.
const HIDE_CSS = `
  [class*="cookie" i], [id*="cookie" i], [class*="consent" i], [id*="consent" i],
  [class*="gdpr" i], [id*="onetrust" i], [class*="cc-window" i], [id*="CybotCookiebot" i],
  [class*="intercom" i], [id*="intercom" i], [class*="crisp" i], iframe[src*="chat" i],
  #wm-ipp-base, #wm-ipp, #donato { display: none !important; }`;

async function waybackUrl(url, stamp) {
  // CDX, not the availability API: the latter rate-limits (429) after a couple of calls.
  const cdx = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&filter=statuscode:200&closest=${stamp}&sort=closest&limit=1&fl=timestamp,original`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(cdx);
    if (res.ok) {
      const row = (await res.json())[1];
      if (!row) throw new Error(`No Wayback snapshot for ${url}`);
      const [timestamp, original] = row;
      // if_ drops the toolbar but keeps asset URLs rewritten to the archive. id_ would load
      // today's JS chunks against old HTML, and Next.js pages then crash on hydration.
      return { url: `https://web.archive.org/web/${timestamp}if_/${original}`, timestamp, wayback: true };
    }
    if (attempt === 3) throw new Error(`Wayback CDX returned ${res.status} three times; try again in a minute`);
    await new Promise((r) => setTimeout(r, 5000 * attempt));
  }
}

// Not page.addStyleTag: it awaits an in-page load event and hangs when scripts are disabled.
const addCss = (page, css) =>
  page.evaluate((text) => document.head.append(Object.assign(document.createElement('style'), { textContent: text })), css);

async function loadLazy(page) {
  // Scroll from Node, not with in-page timers: those never fire when scripts are disabled (Wayback).
  const step = Math.max(200, Math.floor(page.viewportSize().height * 0.8));
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1500); // JS-driven entrance animations (framer-motion, GSAP) settle
}

// Top-level blocks of the page: the children of <main> (or <body>) that span most of the width.
// Falls back to <section> elements when the page wraps everything in one div.
async function sections(page, outDir, name) {
  const boxes = await page.evaluate(() => {
    const vw = window.innerWidth;
    const big = (el) => { const r = el.getBoundingClientRect(); return r.height >= 160 && r.width >= vw * 0.6; };
    // Split wrappers taller than ~2 screens into their own big children, recursively.
    const split = (el) => {
      const kids = [...el.children].filter(big);
      return el.getBoundingClientRect().height > window.innerHeight * 2.2 && kids.length >= 2 ? kids.flatMap(split) : [el];
    };
    const root = document.querySelector('main') || document.body;
    let els = [...root.children].filter(big);
    if (els.length < 3) els = [...document.querySelectorAll('section')].filter((el) => big(el) && !el.parentElement.closest('section'));
    els = els.flatMap(split);
    return els.map((el, i) => {
      el.setAttribute('data-cs-section', i);
      const h = el.querySelector('h1, h2, h3');
      return { heading: h ? h.innerText.trim() : '', text: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 1200) };
    });
  });
  const outline = [];
  for (const [i, b] of boxes.entries()) {
    const file = join(outDir, `${name}-section-${String(i + 1).padStart(2, '0')}.png`);
    const el = page.locator(`[data-cs-section="${i}"]`);
    // Scroll-triggered JS reveals (text scramble, counters) only run in view; let them finish.
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await el.screenshot({ path: file, animations: 'disabled' });
    outline.push({ file, ...b });
  }
  writeFileSync(join(outDir, `${name}-outline.json`), JSON.stringify(outline, null, 2));
  return outline.map((o) => o.file);
}

async function shoot(browser, target, outDir, name, view, label, withSections) {
  const ctx = await browser.newContext({
    viewport: { width: view.width, height: view.height },
    deviceScaleFactor: view.scale,
    isMobile: view.mobile,
    hasTouch: view.mobile,
    reducedMotion: 'reduce',
    // Archived React/Next pages fail hydration (error #418) and swap in an error page;
    // their server-rendered HTML is already the full page, so render it without scripts.
    javaScriptEnabled: !target.wayback,
  });
  const page = await ctx.newPage();
  if (target.html) await page.setContent(target.html);
  else await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await addCss(page, HIDE_CSS);
  await loadLazy(page);
  const top = join(outDir, `${name}-${label}.png`);
  const full = join(outDir, `${name}-${label}-full.png`);
  await page.screenshot({ path: top, animations: 'disabled' });
  // Full-page shots repeat fixed/sticky headers down the page. Pin fixed ones to the top of the
  // document and let sticky ones scroll; a blanket position:static wrecks absolute layouts.
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      const pos = getComputedStyle(el).position;
      if (pos === 'fixed') el.style.setProperty('position', 'absolute', 'important');
      else if (pos === 'sticky') el.style.setProperty('position', 'relative', 'important');
    }
  });
  // Flattening can push content sideways; clip to the viewport width so the tall shot pans cleanly.
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const clip = { x: 0, y: 0, width: view.width, height: pageHeight };
  await page.screenshot({ path: full, fullPage: true, clip, animations: 'disabled' });
  const extra = withSections ? await sections(page, outDir, name) : [];
  await ctx.close();
  return [top, full, ...extra];
}

async function capture(target, outDir, name, width, height, withSections = false) {
  mkdirSync(outDir, { recursive: true });
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  try {
    return [
      ...(await shoot(browser, target, outDir, name, { width, height, scale: 1, mobile: false }, 'desktop', withSections)),
      ...(await shoot(browser, target, outDir, name, { width: 390, height: 844, scale: 2, mobile: true }, 'mobile')),
    ];
  } finally {
    await browser.close();
  }
}

async function selfTest() {
  const dir = join(process.env.TEMP || '/tmp', 'capture-site-selftest');
  const html = `<html><body style="margin:0">
    <header style="position:sticky;top:0;height:60px;background:#222;color:#fff">Header</header>
    <div class="cookie-banner" style="position:fixed;bottom:0;width:100%;height:80px;background:red">Cookies</div>
    <main style="height:3000px;background:linear-gradient(#fff,#ccc)">
      <section style="height:1000px"><h2>One</h2>First</section>
      <section style="height:1000px"><h2>Two</h2>Second</section>
      <section style="height:1000px"><h2>Three</h2>Third</section></main></body></html>`;
  const files = await capture({ html }, dir, 'test', 1440, 900, true);
  const outline = JSON.parse(readFileSync(join(dir, 'test-outline.json'), 'utf8'));
  console.assert(outline.length === 3 && outline[1].heading === 'Two', `bad outline: ${JSON.stringify(outline)}`);
  if (outline.length !== 3) process.exit(1);
  for (const f of files) console.assert(existsSync(f) && statSync(f).size > 1000, `missing ${f}`);
  const { chromium } = loadPlaywright();
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file:///' + files[1].replace(/\\/g, '/'));
  const h = await p.evaluate(() => document.images[0].naturalHeight);
  await b.close();
  console.assert(h >= 3000, `full-page shot too short: ${h}`);
  console.log(h >= 3000 ? `self-test OK (${files.length} files, full height ${h}px, ${outline.length} sections)` : 'self-test FAILED');
  if (h < 3000) process.exit(1);
}

const args = process.argv.slice(2);
if (args[0] === '--self-test') {
  await selfTest();
} else {
  const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
  const [url, outDir] = args;
  const name = opt('name');
  if (!url || !outDir || !/^[\w-]+$/.test(name || '')) {
    console.error('usage: capture-site.mjs <url> <out-dir> --name <name> [--sections] [--wayback YYYYMMDD] [--width 1440] [--height 900]');
    process.exit(2);
  }
  let target = { url };
  const stamp = opt('wayback');
  if (stamp) {
    target = await waybackUrl(url, stamp);
    console.log(`wayback snapshot ${target.timestamp}: ${target.url}`);
  }
  const files = await capture(target, outDir, name, Number(opt('width', 1440)), Number(opt('height', 900)), args.includes('--sections'));
  console.log(files.join('\n'));
}
