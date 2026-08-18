# CLAUDE.md — E-Mobility Ecosystem Mapping Platform
## Website & UI Build Rules

---

## STEP 0 — MANDATORY BEFORE ANY CODE

**Invoke the `frontend-design` skill before writing a single line of frontend code. Every session. No exceptions.**

```
Read: /mnt/skills/public/frontend-design/SKILL.md
```

Do not start designing until you have read it. Confirm in your response that you have read it.

---

## STEP 1 — BRAND ASSETS CHECK

Before designing anything, check the `brand_assets/` folder in the project root.

```bash
ls brand_assets/
```

- If a logo exists → use it. Never use a text placeholder where the real logo exists.
- If a color palette file exists → use those exact hex values. Do not invent colors.
- If a font is specified → import and use it. Do not substitute.
- If a style guide exists → read it before designing.

If `brand_assets/` is empty or missing, use the **Design System** defined in this file (Section 4).

---

## STEP 2 — LOCAL SERVER

**Always serve on localhost. Never screenshot a `file:///` URL — it will not render fonts, CDN assets, or relative paths correctly.**

```bash
# Start the dev server (runs project root at http://localhost:3000)
node serve.mjs &

# Confirm it is running before screenshotting
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Must return 200 before proceeding
```

- `serve.mjs` lives in the project root. Start it in the background.
- If it is already running, do not start a second instance — check with `lsof -i :3000`.
- All screenshots must use `http://localhost:3000` as the base URL.

---

## STEP 3 — PUPPETEER SETUP & SCREENSHOT WORKFLOW

### First-time setup (run once per project)

```bash
# Install puppeteer if not already present
npm init -y 2>/dev/null; npm install puppeteer

# Confirm Chrome is available
node -e "const p = require('puppeteer'); p.launch().then(b => { console.log('Puppeteer OK'); b.close(); })"
```

### screenshot.mjs — create this file in the project root if it does not exist

```js
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir   = './screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const existing = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
const n = String(existing.length + 1).padStart(2, '0');
const filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const outPath  = path.join(dir, filename);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved: ${outPath}`);
```

### Taking screenshots

```bash
# Standard screenshot
node screenshot.mjs http://localhost:3000

# With a label (for comparison rounds)
node screenshot.mjs http://localhost:3000 before-fix
node screenshot.mjs http://localhost:3000 after-fix

# Mobile viewport — add a second script or flag
node screenshot.mjs http://localhost:3000 mobile
```

Screenshots are saved to `./screenshots/` — auto-incremented, never overwritten.

### After every screenshot

1. Read the PNG file with the Read/View tool — Claude must see the image, not just save it.
2. Compare against reference image or design spec.
3. Be specific in your comparison notes:
   - ✗ "Heading looks slightly off"
   - ✓ "Heading is `font-size: 32px` but spec shows `~24px`. Gap between nav and hero is `40px` but should be `80px`. Primary button background is `#5B47E0` but rendering as `#6366F1` (wrong — that's Tailwind indigo)."
4. Fix all mismatches, take another screenshot. Repeat until no visible differences remain.
5. **Minimum 2 comparison rounds before declaring done.** Do not stop after one pass.

---

## STEP 4 — DESIGN SYSTEM

Use this system for all builds unless `brand_assets/` overrides it.
This palette is derived from the platform's established visual identity — do not swap it for Tailwind defaults.

### Color Tokens

```css
:root {
  /* Primary — Purple */
  --color-primary:        #5B47E0;
  --color-primary-light:  #EDE9FE;
  --color-primary-dark:   #3C3489;
  --color-primary-hover:  #4C3BC7;

  /* Accent — Teal */
  --color-accent:         #0D9488;
  --color-accent-light:   #E1F5EE;
  --color-accent-dark:    #0F6E56;

  /* Neutrals */
  --color-navy:           #0F172A;   /* Primary text / headings */
  --color-text:           #1E293B;   /* Body text */
  --color-text-secondary: #475569;   /* Supporting text */
  --color-text-muted:     #94A3B8;   /* Captions, placeholders */

  /* Surfaces */
  --color-bg:             #F8FAFC;   /* Page background */
  --color-surface:        #FFFFFF;   /* Card surface */
  --color-surface-raised: #F1F5F9;   /* Slightly elevated */

  /* Borders */
  --color-border:         #E2E8F0;   /* Default hairline */
  --color-border-strong:  #CBD5E1;   /* Emphasis */

  /* Semantic */
  --color-success:        #16A34A;
  --color-success-light:  #DCFCE7;
  --color-warning:        #D97706;
  --color-warning-light:  #FEF3C7;
  --color-danger:         #DC2626;
  --color-danger-light:   #FEE2E2;

  /* Category colors — ecosystem map */
  --color-cat-oem:        #5B47E0;   /* OEM / Manufacturer → Purple */
  --color-cat-operator:   #0D9488;   /* Operator / Fleet → Teal */
  --color-cat-infra:      #D97706;   /* Infrastructure → Amber */
  --color-cat-fintech:    #16A34A;   /* Fintech / Financing → Green */
  --color-cat-logistics:  #7C3AED;   /* Fleet / Logistics → Violet */
  --color-cat-software:   #0369A1;   /* Software / Platform → Sky */
}
```

**Never use Tailwind's default palette** (`indigo-500`, `blue-600`, etc.) as primary colors.
Always use CSS custom properties or explicit hex values from the tokens above.

### Typography

```css
/* Import — always use these, not system fonts */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Fraunces:ital,wght@0,700;1,700&display=swap');

:root {
  /* Display / Hero headings — Fraunces (has character, not generic) */
  --font-display: 'Fraunces', Georgia, serif;

  /* UI / Body — Plus Jakarta Sans (clean, modern, not Inter which is overused) */
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;

  /* Type scale */
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-md:   17px;
  --text-lg:   20px;
  --text-xl:   24px;
  --text-2xl:  30px;
  --text-3xl:  38px;
  --text-4xl:  48px;
  --text-hero: 64px;
}

/* Application */
h1, h2, h3 { font-family: var(--font-display); letter-spacing: -0.02em; line-height: 1.15; }
body, p, label, button, input { font-family: var(--font-sans); line-height: 1.6; }
p { font-size: var(--text-base); color: var(--color-text-secondary); line-height: 1.75; }
```

### Shadows — layered only, never flat

```css
/* Never use box-shadow: 0 4px 6px rgba(0,0,0,0.1) — that's generic */

--shadow-sm:   0 1px 2px rgba(15,23,42,0.04), 0 1px 4px rgba(15,23,42,0.06);
--shadow-card: 0 2px 4px rgba(15,23,42,0.04), 0 4px 16px rgba(91,71,224,0.06);
--shadow-raised:0 4px 8px rgba(15,23,42,0.06), 0 8px 32px rgba(91,71,224,0.08);
--shadow-float:0 8px 16px rgba(15,23,42,0.08), 0 24px 64px rgba(91,71,224,0.12);

/* Purple-tinted shadow on primary elements */
--shadow-primary: 0 4px 14px rgba(91,71,224,0.35), 0 1px 4px rgba(91,71,224,0.2);
```

### Spacing Tokens

```css
/* Use these — do not mix random Tailwind steps */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;
```

### Border Radius

```css
--radius-sm:   4px;
--radius:      8px;
--radius-md:   12px;
--radius-lg:   16px;
--radius-xl:   24px;
--radius-full: 9999px;
```

---

## STEP 5 — REFERENCE IMAGE HANDLING

### If a reference image is provided

- Match layout, spacing, typography, and color **exactly** — pixel for pixel where possible.
- Use placeholder content (`https://placehold.co/WIDTHxHEIGHT`) for any images not supplied.
- Do **not** improve, simplify, or add to the reference. Your job is to match it.
- Do **not** stop after one screenshot — keep comparing and fixing until no differences are visible.

### If no reference image

- Run the full design system from this file.
- Apply the `frontend-design` skill's brainstorm → plan → critique → build process.
- Design from the subject's world — this is an **e-mobility ecosystem map for Africa**, not a generic SaaS dashboard.

---

## STEP 6 — ANTI-GENERIC GUARDRAILS

These are hard rules. Break any of them and the output will look like a vibe-coded AI website.

### Color
- ✗ Never use Tailwind's `indigo-*`, `blue-*`, `violet-*`, `slate-*` as primary palette colors
- ✓ Always use hex values from the Design System token list above
- ✓ Derive all variations (hover, active, disabled) from the primary token — do not invent new hues

### Typography
- ✗ Never use the same font for headings and body
- ✗ Never use Inter (overused AI default) or Roboto as the only font
- ✓ Always use Fraunces (display) + Plus Jakarta Sans (body)
- ✓ Large headings: `letter-spacing: -0.02em`, `line-height: 1.15`
- ✓ Body text: `line-height: 1.75`, `color: var(--color-text-secondary)`

### Shadows
- ✗ Never use `shadow-md`, `shadow-lg`, or any flat `box-shadow` with a single black rgba layer
- ✓ Always use the layered, color-tinted shadow tokens above

### Gradients
- ✗ Never use a single-direction gradient (`linear-gradient(to right, ...)`) as the only depth treatment
- ✓ Layer 2–3 radial gradients at different focal points to create real depth
- ✓ Example hero background: radial at top-left (purple/10%), radial at bottom-right (teal/8%), base white

### Animations
- ✗ Never use `transition: all` — it is slow and unpredictable
- ✓ Only animate `transform` and `opacity`
- ✓ Spring-style easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` for interactive elements
- ✓ Use `will-change: transform` only where motion is guaranteed

### Interactive States
Every clickable element **must** have all three states defined. No exceptions.
```css
/* Pattern — apply to every button, link, card, and input */
element:hover   { /* visible change — not just opacity tweak */ }
element:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
element:active  { transform: scale(0.98); }
```

### Surfaces / Depth
The UI must have a **layering system** — elements cannot all sit at the same visual plane:
```
Level 0 — page background:   var(--color-bg) = #F8FAFC
Level 1 — in-flow cards:     var(--color-surface) + var(--shadow-card)
Level 2 — raised panels:     var(--color-surface) + var(--shadow-raised)
Level 3 — floating (dropdowns, tooltips): var(--color-surface) + var(--shadow-float)
```

### Images
- Always add a gradient overlay on hero images: `background: linear-gradient(to top, rgba(15,23,42,0.7) 0%, transparent 60%)`
- Add a subtle color treatment layer with `mix-blend-mode: multiply` using the primary purple at low opacity
- Never show a raw `<img>` with no treatment in a hero or feature section

### Sections
- Never repeat the same section background color twice in a row — alternate between `--color-bg` and `--color-surface`
- No section should feel like a copy-paste of a Bootstrap template
- Section padding minimum: `padding: var(--space-20) 0` (80px top/bottom)

---

## STEP 7 — OUTPUT FORMAT

```
Default: single index.html, all CSS inline in <style> block, all JS inline in <script> block
Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script> — only for utility classes, not as the primary design system
Fonts: always load from Google Fonts as shown in Step 4
Placeholder images: https://placehold.co/WIDTHxHEIGHT/hex/hex (use brand colors in placeholders, not grey)
Responsive: mobile-first, breakpoints at 640px, 1024px, 1440px
```

---

## STEP 8 — HARD RULES

1. **Do not start writing code before reading the `frontend-design` skill.** Confirmed in response.
2. **Do not use `transition: all`** anywhere in the codebase.
3. **Do not use Tailwind default blue/indigo/violet as primary brand color.**
4. **Do not stop after one screenshot pass** — minimum 2 rounds.
5. **Do not screenshot a `file:///` URL** — always serve on localhost first.
6. **Do not add content or sections not in the reference** — match only, do not extend.
7. **Do not use Inter** as the only typeface.
8. **Do not use flat `box-shadow`** — always layer at least 2 shadow values.
9. **Do not use `position: fixed` for modals** — nest inside a min-height wrapper div.
10. **Do not leave any clickable element without hover, focus, and active states.**

---

## STEP 9 — SESSION CHECKLIST

Run through this before submitting any frontend output:

- [ ] Read `frontend-design` skill ✓
- [ ] Checked `brand_assets/` folder ✓
- [ ] Localhost server running at :3000 ✓
- [ ] Puppeteer screenshot taken from localhost ✓
- [ ] Screenshot read with View tool ✓
- [ ] Compared against reference — mismatches documented ✓
- [ ] Fixed mismatches, re-screenshotted ✓
- [ ] Second comparison round complete ✓
- [ ] No Tailwind default colors used as primary ✓
- [ ] All shadows are layered (2+ layers) ✓
- [ ] Fonts: Fraunces (display) + Plus Jakarta Sans (body) ✓
- [ ] Every clickable element has hover + focus + active states ✓
- [ ] `transition: all` not used anywhere ✓
- [ ] Surfaces use the 4-level depth system ✓

---

## Reference: Aesthetic Target

The platform this CLAUDE.md was written for is the **E-Mobility Ecosystem Mapping Platform for Africa** — a data intelligence tool that maps companies, vehicles, swap stations, and investment across the African e-mobility value chain.

Visual references to study before building:
- **Nexus SaaS Dashboard** — clean white surfaces, grouped sidebar navigation, purple brand color, trend badges on metric cards, stacked bar charts with rounded tops
- **ACRU Finance App** — three-column layout, widget-based modularity, green-tinted data cards, transaction history patterns
- **CB Insights** — how to structure ecosystem map category views and company leaderboards

The platform should feel like **a product built by a focused, well-funded team** — not a free template. Every component should have a reason for existing. When in doubt: remove, don't add.
