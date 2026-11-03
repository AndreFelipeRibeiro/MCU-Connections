// Draws favicon.png (64px) and apple-touch-icon.png (180px) from the logo mark,
// src/assets/logo-mark.svg, so the browser tab and the home-screen icon match
// the mark in the app. Run it again after replacing that file:
//
//   node tools/make-icons.js
//
// Uses the Playwright that qa/ installs (bash qa/setup.sh), rendering in
// headless Chromium so the SVG is drawn exactly as the app draws it: as a mask.
// Icons have no light or dark mode, so they take the designer's favicon
// colours (Andre, 2026-11-02): the logo red on the navy tile of the
// "dark bg" option, which reads on both light and dark browser chrome. The
// "light bg" option is the same with TILE = '#FFFFFF'.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(import.meta.url)(path.join(ROOT, 'qa', 'node_modules', 'playwright'));
const svg = fs.readFileSync(path.join(ROOT, 'src', 'assets', 'logo-mark.svg'), 'utf8');
const mask = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
const BRAND = '#C41E3A';   // the logo's red
const TILE = '#0A0E27';    // the favicon's navy (its "dark bg" option)

const ICONS = [
  // The tab icon keeps transparent corners; the tile is the icon.
  // The mark is a tall pin: these sizes are its height.
  { file: 'favicon.png', size: 64, radius: 14, mark: 50 },
  // iOS rounds the corners itself and fills transparency with black, so this
  // one is a full, opaque square.
  { file: 'apple-touch-icon.png', size: 180, radius: 0, mark: 124 },
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
