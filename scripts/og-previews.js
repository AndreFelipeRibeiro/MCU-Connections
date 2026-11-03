// Link previews, rendered by the build (Notion V4 Tasks, "Share 3/3").
//
// For the app-wide card and every title, character and guide this writes
//   dist/og/<kind>/<id>.png    the 1200×630 preview image
//   dist/og/<kind>/<id>.html   the built index.html with that preview's tags
// and middleware.ts serves the .html to /?title=…, /?char=… and /?guide=….
// Images are static files: the CDN caches them and they cost nothing per
// visit. The app-wide card is dist/og/default.png, and index.html points at it.
//
// It runs in Vercel's build, so no browser: Satori lays the card out and turns
// its text into outlines (src/share-card/cards.ts, the same templates the app
// uses for the share card), and resvg rasterises the SVG. Fonts are the
// design system's Inter, as static .woff files (Satori can't read woff2).
//
// Called from vite.config.js after the bundle is written. Not in tools/,
// because .vercelignore keeps tools/ out of Vercel's build.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { transformWithOxc } from 'vite';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readDarkTokens, cardColors } from '../src/share-card/tokens.ts';
import { previewCard, logoMark, PREVIEW } from '../src/share-card/cards.ts';
import { previewEntries } from '../src/share-card/previews.ts';
import { applyPreviewTags } from '../src/share-card/meta.ts';

/** Production, under the public name (src/app/share.tsx's PUBLIC_URL). */
export const SITE = 'https://redthread.tv';

const require = createRequire(import.meta.url);

// The catalog files publish on `window`; run them in a sandbox that has one,
// rather than giving the build process a fake window.
async function loadCatalog(root) {
  const window = {};
  for (const file of ['src/data/data.ts', 'src/data/guides.ts']) {
    // Type-stripping only: the data files import nothing but types.
    const { code } = await transformWithOxc(readFileSync(join(root, file), 'utf8'), file, { lang: 'ts' });
    // Oxc keeps the file a module with an empty `export {};`; the sandbox runs
    // it as a plain script.
    vm.runInNewContext(code.replace(/^export \{\};?\s*$/m, ''), { window, console });
  }
  return { titles: window.TITLES, characters: window.CHARACTERS, guides: window.GUIDES };
}

function loadLocale(root, code) {
  const window = { MCU_LOCALES: {} };
  vm.runInNewContext(readFileSync(join(root, 'locales', code + '.js'), 'utf8'), { window });
  return window.MCU_LOCALES[code];
}

export function loadFonts() {
  const file = (w) => readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${w}-normal.woff`));
  return [400, 600, 700].map((weight) => ({ name: 'Inter', data: file(weight), weight, style: 'normal' }));
}

export async function buildPreviews({ root, outDir }) {
  const started = Date.now();
  const colors = cardColors(readDarkTokens(readFileSync(join(root, 'src/index.css'), 'utf8')));
  const logo = logoMark(readFileSync(join(root, 'src/assets/logo-mark.svg'), 'utf8'), colors.logo);
  const fonts = loadFonts();
  const catalog = await loadCatalog(root);
  const entries = previewEntries(catalog, loadLocale(root, 'en'), colors, SITE.replace(/^https:\/\//, ''));
  const index = readFileSync(join(outDir, 'index.html'), 'utf8');
  let bytes = 0;
  for (const e of entries) {
    const svg = await satori(previewCard(e.input, colors, logo), { ...PREVIEW, fonts });
    // The text is already outlines, so resvg needs no fonts: without this it
    // scans the machine's system fonts for every image (about a second each).
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: PREVIEW.width }, font: { loadSystemFonts: false } }).render().asPng();
    const dir = e.kind === 'default' ? join(outDir, 'og') : join(outDir, 'og', e.kind);
    mkdirSync(dir, { recursive: true });
    const name = e.kind === 'default' ? 'default' : e.id;
    writeFileSync(join(dir, name + '.png'), png);
    bytes += png.length;
    if (e.kind === 'default') continue;
    const query = { title: 'title', char: 'char', guide: 'guide' }[e.kind];
    writeFileSync(join(dir, name + '.html'), applyPreviewTags(index, {
      title: e.title, description: e.description, alt: e.alt,
      url: `${SITE}/?${query}=${encodeURIComponent(e.id)}`,
      image: `${SITE}/og/${e.kind}/${name}.png`,
    }));
  }
  return { count: entries.length, bytes, ms: Date.now() - started };
}
