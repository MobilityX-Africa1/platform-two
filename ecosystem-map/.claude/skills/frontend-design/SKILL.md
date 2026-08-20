---
name: frontend-design
description: Use before writing or editing any frontend UI code in this repo (React components, CSS, HTML pages, dashboards, marketing pages). Governs brand-asset lookup, screenshot-driven visual QA via Puppeteer, the fallback design system (color/type/shadow/spacing tokens), and anti-generic guardrails so output doesn't look like a default AI-generated template. Triggers on: building a new page/component, redesigning an existing one, or any change a human would review by looking at it.
---

# Frontend Design Workflow

This is the project's local copy of the design workflow `CLAUDE.md` mandates before any frontend
code. It doesn't depend on an external skill path — everything needed is below.

## Step 0 — Which design system applies

Before anything else, check whether the target codebase already has an established design system
(CSS custom properties, a theme file, existing components using consistent tokens).

- **If one exists** (e.g. this repo's `ecosystem-map/frontend/src/index.css`, which defines `--plum`,
  `--sky`, `--leaf`, `--coral`, spacing/radius/shadow scales, and Google Sans + Roboto), **use
  those tokens**, not the fallback system in Step 4. Matching what's already shipped beats
  introducing a second, conflicting token set — even if it differs from Step 4 below.
- **If none exists** (a genuinely new app/page with no prior tokens), use the fallback Design
  System in Step 4.

## Step 1 — Brand assets check

```bash
ls brand_assets/
```

- Logo exists → use it, never a text placeholder.
- Palette file exists → use those exact hex values, don't invent colors.
- Font specified → import and use it, don't substitute.
- Style guide exists → read it before designing.

If `brand_assets/` is empty or missing, fall back to Step 0's decision.

## Step 2 — Local server

Never screenshot a `file:///` URL — fonts, CDN assets, and relative paths won't render correctly.

```bash
# find the project's dev command (package.json "scripts", or serve.mjs in the project root)
npm run dev &     # or: node serve.mjs &
curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>   # must return 200
```

Check `lsof -i :<port>` before starting a second instance.

## Step 3 — Screenshot workflow (Puppeteer)

If the app resets client-side route state on a hard reload (check `main.jsx`/`index.js` for a
`history.replaceState` reset), don't `page.goto()` a deep link — drive it like a user: `goto` the
root, then click through the app's own nav/links to reach the target view. See
`ecosystem-map/frontend/scripts/screenshot-nav.mjs` in this repo for a working example.

Otherwise, a plain screenshot script is enough:

```js
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
```

After every screenshot:
1. Read the PNG with the Read tool — actually look at it, don't just save it.
2. Compare against the reference/spec with specifics: exact px/color deltas, not "looks off."
3. Fix mismatches, re-screenshot. **Minimum 2 comparison rounds before declaring done.**

## Step 4 — Fallback design system

Only applies when Step 0 found no existing tokens to match.

### Color

```css
:root {
  --color-primary:        #5B47E0;
  --color-primary-light:  #EDE9FE;
  --color-primary-dark:   #3C3489;
  --color-primary-hover:  #4C3BC7;
  --color-accent:         #0D9488;
  --color-accent-light:   #E1F5EE;
  --color-accent-dark:    #0F6E56;
  --color-navy:           #0F172A;
  --color-text:           #1E293B;
  --color-text-secondary: #475569;
  --color-text-muted:     #94A3B8;
  --color-bg:             #F8FAFC;
  --color-surface:        #FFFFFF;
  --color-surface-raised: #F1F5F9;
  --color-border:         #E2E8F0;
  --color-border-strong:  #CBD5E1;
  --color-success:        #16A34A; --color-success-light: #DCFCE7;
  --color-warning:        #D97706; --color-warning-light: #FEF3C7;
  --color-danger:         #DC2626; --color-danger-light:  #FEE2E2;
}
```

Never use Tailwind's default palette (`indigo-500`, `blue-600`, etc.) as primary colors — always
these tokens or explicit hex values derived from them.

### Typography

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Fraunces:ital,wght@0,700;1,700&display=swap');

:root {
  --font-display: 'Fraunces', Georgia, serif;      /* headings */
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;  /* body/UI */
  --text-xs: 11px; --text-sm: 13px; --text-base: 15px; --text-md: 17px;
  --text-lg: 20px; --text-xl: 24px; --text-2xl: 30px; --text-3xl: 38px;
  --text-4xl: 48px; --text-hero: 64px;
}
h1, h2, h3 { font-family: var(--font-display); letter-spacing: -0.02em; line-height: 1.15; }
body, p, label, button, input { font-family: var(--font-sans); line-height: 1.6; }
```

Never use the same font for headings and body. Never use Inter or Roboto as the only typeface.

### Shadows — always layered, never flat

```css
--shadow-sm:    0 1px 2px rgba(15,23,42,0.04), 0 1px 4px rgba(15,23,42,0.06);
--shadow-card:  0 2px 4px rgba(15,23,42,0.04), 0 4px 16px rgba(91,71,224,0.06);
--shadow-raised:0 4px 8px rgba(15,23,42,0.06), 0 8px 32px rgba(91,71,224,0.08);
--shadow-float: 0 8px 16px rgba(15,23,42,0.08), 0 24px 64px rgba(91,71,224,0.12);
```

### Spacing / radius

```css
--space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:20px; --space-6:24px;
--space-8:32px; --space-10:40px; --space-12:48px; --space-16:64px; --space-20:80px;
--space-24:96px; --space-32:128px;
--radius-sm:4px; --radius:8px; --radius-md:12px; --radius-lg:16px; --radius-xl:24px; --radius-full:9999px;
```

## Step 5 — Reference image handling

- Reference provided → match layout/spacing/type/color as closely as possible; use
  `https://placehold.co/WIDTHxHEIGHT` for unsupplied images; don't improve or extend it, match it;
  keep iterating screenshots until no visible diff remains.
- No reference → apply the design system, and design from the subject's actual domain/world, not
  a generic SaaS template.

## Step 6 — Anti-generic guardrails (hard rules)

- Never use Tailwind `indigo-*`/`blue-*`/`violet-*`/`slate-*` as primary palette colors when the
  fallback system (Step 4) applies.
- Never use `transition: all` — animate `transform`/`opacity` only, spring easing
  `cubic-bezier(0.34, 1.56, 0.64, 1)` for interactive elements.
- Every clickable element needs hover, `:focus-visible`, and `:active` states — no exceptions.
- Never a single flat `box-shadow` — always 2+ layered values.
- Never a single-direction gradient as the only depth treatment — layer 2–3 radial gradients.
- Maintain a layering system: page bg → in-flow cards (`shadow-card`) → raised panels
  (`shadow-raised`) → floating elements (`shadow-float`).
- Never a raw `<img>` with no treatment in a hero/feature section — gradient overlay at minimum.
- Never repeat the same section background twice in a row; alternate bg/surface.
- Never `position: fixed` for modals — nest inside a min-height wrapper div.

## Step 7 — Session checklist

- [ ] Decided which token system applies (Step 0) and why
- [ ] Checked `brand_assets/`
- [ ] Local server running, confirmed 200
- [ ] Screenshot taken from localhost and actually read/viewed
- [ ] Compared against reference/spec with specific deltas
- [ ] Fixed mismatches, minimum 2 comparison rounds complete
- [ ] No Tailwind default colors used as primary (fallback system only)
- [ ] Shadows layered, `transition: all` not used, all interactive states defined
