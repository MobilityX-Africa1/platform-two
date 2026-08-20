import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const url   = process.argv[2] || 'http://localhost:5176/';
const label = process.argv[3] || '';
const dir   = './screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const existing = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
const n = String(existing.length + 1).padStart(2, '0');
const filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const outPath  = path.join(dir, filename);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page    = await browser.newPage();
page.on('console', (msg) => console.log('[console]', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('[pageerror]', err.message));
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 1500));

// Resize the viewport to the full document height ourselves before capturing.
// fullPage:true screenshots make Puppeteer resize the viewport internally right
// before painting; with many @font-face subsets in flight (e.g. Google Sans,
// which ships ~75 unicode-range rules) that resize can race a font swap and
// corrupt text shaping in the captured frame even though the live DOM layout
// is correct. Resizing ourselves, ahead of time, avoids that race.
const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
await page.setViewport({ width: 1440, height: fullHeight, deviceScaleFactor: 2 });
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();

console.log(`Saved: ${outPath}`);
