// Draws favicon.png (64px) and apple-touch-icon.png (180px) from the logo mark,
// src/assets/logo-mark.svg, so the browser tab and the home-screen icon match
// the mark in the app. Run it again after replacing that file:
//
//   node tools/make-icons.js
//
// Uses the Playwright that qa/ installs (bash qa/setup.sh), rendering in
// headless Chromium so the SVG is drawn exactly as the app draws it: as a mask,
// painted with the dark theme's --brand on the dark theme's --background
// (src/index.css). Icons have no light or dark mode, and the dark tile reads
// on both light and dark browser chrome, as V3's icons did.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(import.meta.url)(path.join(ROOT, 'qa', 'node_modules', 'playwright'));
const svg = fs.readFileSync(path.join(ROOT, 'src', 'assets', 'logo-mark.svg'), 'utf8');
const mask = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
const BRAND = 'oklch(0.68 0.17 23)';   // --brand, .dark
const TILE = 'oklch(0.145 0 0)';       // --background, .dark

const ICONS = [
  // The tab icon keeps transparent corners; the tile is the icon.
  { file: 'favicon.png', size: 64, radius: 14, mark: 44 },
  // iOS rounds the corners itself and fills transparency with black, so this
  // one is a full, opaque square.
  { file: 'apple-touch-icon.png', size: 180, radius: 0, mark: 112 },
];

(async () => {
  const browser = await chromium.launch();
  for (const ic of ICONS) {
    const page = await browser.newPage({ viewport: { width: ic.size, height: ic.size } });
    await page.setContent(`<!doctype html><style>
      html, body { margin: 0; background: transparent; }
      .tile { width: ${ic.size}px; height: ${ic.size}px; border-radius: ${ic.radius}px; background: ${TILE};
        display: flex; align-items: center; justify-content: center; }
      .mark { width: ${ic.mark}px; height: ${ic.mark}px; background: ${BRAND};
        -webkit-mask: ${mask} center / contain no-repeat; mask: ${mask} center / contain no-repeat; }
    </style><div class="tile"><div class="mark"></div></div>`);
    await page.screenshot({ path: path.join(ROOT, ic.file), omitBackground: ic.radius > 0 });
    await page.close();
    console.log('wrote ' + ic.file + ' (' + ic.size + 'px)');
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
