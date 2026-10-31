// V4 build step. See docs/V4-PLAN.md §3 (the build) and §9 (the order).
//
// Phase 2 step 1 (this file's first version) stands up the toolchain WITHOUT
// converting the app. Vite owns index.html, the stylesheets and the icons;
// every app script still loads the V3 way, as a classic <script> compiled by
// Babel in the browser, so behaviour is unchanged. Step 3 converts those files
// to modules one at a time, and each one converted is deleted from LEGACY
// below until the list is empty and this plugin goes away with it.
import { readFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// The files index.html still loads as classic scripts, in its own order, plus
// the root-path assets below. Vite leaves the <script> tags alone (it reports
// that it "can't bundle" them), so without this copy the built site would ask
// for each one and get a 404.
const LEGACY = [
  'boot.js',
  'locales/en.js',
  'locales/pt-BR.js',
  'i18n.js',
  // Stays a separate file on purpose: test-watch replaces it over the
  // network to serve a fixture (qa/test-watch.js), so it must keep its own
  // URL. docs/V4-PLAN.md §5.5.
  'watch-data.js',
  'poster.jsx',
  'tracking.jsx',
  'celebrate.jsx',
  'account.jsx',
  'about.jsx',
  'search-suggest.jsx',
  'mobile.jsx',
  'desktop-list.jsx',
  'upnext.jsx',
  'watch.jsx',
  'guides-ui.jsx',
  'picker.jsx',
  'app.jsx',
  // Vite fingerprints the icons and rewrites the tags that point at them, but
  // clients ask for these paths directly without reading the HTML (iOS asks
  // for /apple-touch-icon.png; crawlers follow the absolute og:image URL), so
  // the plain root paths have to keep working too.
  'favicon.png',
  'apple-touch-icon.png',
  'og-image.jpg',
  // Served today and linked from the README's setup notes.
  'schema.sql',
];

const copyLegacy = () => ({
  name: 'mcu-copy-legacy',
  apply: 'build',
  writeBundle(options) {
    const out = options.dir;
    for (const file of LEGACY) {
      const to = join(out, file);
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(file, to);
    }
  },
});

// The checks and the QA harness read index.html to find the app's scripts, and
// a missing file here is a 404 the browser reports as a blank page, so fail
// the build loudly rather than shipping a site with a hole in it.
const checkLegacy = () => ({
  name: 'mcu-check-legacy',
  apply: 'build',
  buildStart() {
    const html = readFileSync('index.html', 'utf8');
    // Module scripts are Vite's to bundle; only the classic ones need copying.
    const tags = html.match(/<script[^>]*\ssrc="(?!http)[^"]+"[^>]*>/g) || [];
    const referenced = tags
      .filter(t => !/type="module"/.test(t))
      .map(t => t.match(/\ssrc="([^"]+)"/)[1]);
    const missing = referenced.filter(f => !LEGACY.includes(f));
    if (missing.length) {
      this.error(
        'index.html loads scripts that are neither bundled nor copied: ' +
        missing.join(', ') + '. Add them to LEGACY in vite.config.js, or ' +
        'convert them to modules (docs/V4-PLAN.md §3.3).'
      );
    }
  },
});

export default {
  plugins: [react(), tailwindcss(), checkLegacy(), copyLegacy()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      input: {
        // The app. Still the V3 loading path; see LEGACY above.
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // The V4 design-system preview, a page of its own that the app never
        // loads and which never loads the app (docs/V4-PLAN.md §9, and the
        // Notion ticket "Design system preview page").
        design: fileURLToPath(new URL('./design.html', import.meta.url)),
      },
    },
  },
  // Google sign-in only works from origins the OAuth client allows. 8126 is
  // the one registered for local work (README, "App redirects"), so the dev
  // server must take that port or stop rather than quietly pick another.
  server: { port: 8126, strictPort: true },
  preview: { port: 8126, strictPort: true },
};
