import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// main.jsx forces a fresh page load back to "/" — so deep-linking via
// page.goto doesn't work for review screenshots. This clicks through the
// app's own client-side routing instead, like a real user would.
const base = process.argv[2] || 'http://localhost:5174';
const steps = process.argv.slice(3); // sequence of link text to click, in order
const label = 'nav-' + (steps[steps.length - 1] || 'home').toLowerCase().replace(/[^a-z0-9]+/g, '-');

const dir = './screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir);
const existing = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
const n = String(existing.length + 1).padStart(2, '0');
const outPath = path.join(dir, `screenshot-${n}-${label}.png`);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('pageerror', (err) => console.log('[pageerror]', err.message));
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(base, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));

for (const text of steps) {
  const clicked = await page.evaluate((linkText) => {
    const els = Array.from(document.querySelectorAll('a, button, [role="link"], .list-row'));
    const target = els.find((el) => el.textContent.trim().includes(linkText));
    if (!target) return false;
    target.scrollIntoView({ block: 'center' });
    target.click();
    return true;
  }, text);
  if (!clicked) {
    console.log(`[warn] could not find clickable element with text: "${text}"`);
  }
  await new Promise((r) => setTimeout(r, 1200));
}

await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 800));
// Content scrolls inside .right-panel, not <body> — measure that instead.
const fullHeight = await page.evaluate(() => {
  const el = document.querySelector('.right-panel') || document.documentElement;
  return el.scrollHeight;
});
await page.setViewport({ width: 1440, height: Math.min(fullHeight + 40, 20000), deviceScaleFactor: 2 });
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const el = document.querySelector('.right-panel');
  if (el) el.style.overflow = 'visible';
});
await new Promise((r) => setTimeout(r, 200));
await page.screenshot({ path: outPath, fullPage: false });
console.log(`URL after nav: ${page.url()}`);
await browser.close();
console.log(`Saved: ${outPath}`);
