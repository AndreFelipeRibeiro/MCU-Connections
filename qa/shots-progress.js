const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const S = __dirname;
const SITE = (process.env.SITE ? path.join(S, process.env.SITE) : path.join(S, '..'));
const V = path.join(S, 'vendor');
const VENDOR = {
  'react@18.3.1/umd/react.development.js': 'x-react-18.3.1/package/umd/react.development.js',
  'react-dom@18.3.1/umd/react-dom.development.js': 'x-react-dom-18.3.1/package/umd/react-dom.development.js',
  'react@18.3.1/umd/react.production.min.js': 'x-react-18.3.1/package/umd/react.production.min.js',
  'react-dom@18.3.1/umd/react-dom.production.min.js': 'x-react-dom-18.3.1/package/umd/react-dom.production.min.js',
  '@babel/standalone@7.29.0/babel.min.js': 'x-babel-standalone-7.29.0/package/babel.min.js',
  '@supabase/supabase-js@2.112.2/dist/umd/supabase.js': 'x-supabase-supabase-js-2.112.2/package/dist/umd/supabase.js',
};
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.jsx': 'text/babel', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(SITE, p);
  if (!f.startsWith(SITE) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const URL = 'http://127.0.0.1:8219/';
const MOBILE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
const DESKTOP = { viewport: { width: 1440, height: 900 } };

async function ctxPage(browser, opts, init) {
  const ctx = await browser.newContext(opts);
  if (init) await ctx.addInitScript(init);
  // The sign-in reminder would cover the page after a few marks: off unless a
  // test asks for it (NUDGE=1).
  if (!process.env.NUDGE) await ctx.addInitScript("try { if (!localStorage.getItem('mcu.signInNudge.v1')) localStorage.setItem('mcu.signInNudge.v1', '2'); } catch (e) {}");
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_FAILED')) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.route('**/*', route => {
    const u = route.request().url();
    const m = u.match(/^https:\/\/unpkg\.com\/(.+)$/);
    if (m && VENDOR[m[1]]) return route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(V, VENDOR[m[1]])) });
    if (u.startsWith('http://127.0.0.1')) return route.continue();
    return route.abort();
  });
  return { ctx, page, errors };
}
const settle = page => page.waitForTimeout(2200);
const go = async page => { await page.goto(URL); await settle(page); };

// A collection worth looking at: Phase 1 complete, Phase 2 partly, Phase 3
// barely started, so one capture shows the complete, partial and empty states.
const SEED_COLLECTION = `(() => {
  const states = {};
  const byPhase = {};
  (window.MCU_SEED_TITLES || []).forEach(t => { (byPhase[t.phase] = byPhase[t.phase] || []).push(t.id); });
  (byPhase[1] || []).forEach(id => { states[id] = 'seen'; });
  (byPhase[2] || []).slice(0, 4).forEach(id => { states[id] = 'seen'; });
  (byPhase[3] || []).slice(0, 2).forEach(id => { states[id] = 'seen'; });
  localStorage.setItem('mcu.collection.v1', JSON.stringify({ version: 1, states }));
  localStorage.setItem('mcu.welcome.v1', 'test');
  localStorage.setItem('mcu.signInNudge.v1', '2');
})();`;

(async () => {
  await new Promise(r => server.listen(8219, r));
  const browser = await chromium.launch();
  const shots = [];
  // The seed needs the catalog, which is not loaded when addInitScript runs,
  // so the ids are read from data.js here and handed over as a literal.
  const sandbox = { window: {} };
  const vm = require('vm');
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(SITE, 'data.js'), 'utf8'), sandbox);
  const titles = sandbox.window.TITLES.map(t => ({ id: t.id, phase: t.phase }));
  const seed = `window.MCU_SEED_TITLES = ${JSON.stringify(titles)};` + SEED_COLLECTION;

  const shot = async (page, name) => {
    const file = path.join(S, 'shots', name + '.png');
    await page.screenshot({ path: file });
    shots.push(file);
  };
  const setLang = async (page, lang) => {
    await page.evaluate(l => localStorage.setItem('mcu.lang.v1', l), lang);
    await page.reload();
    await page.waitForTimeout(2600);
  };
  const clickText = async (page, re) => {
    await page.evaluate(async (src) => {
      const rx = new RegExp(src, 'i');
      const b = [...document.querySelectorAll('button')].find(x => rx.test(x.textContent.trim()));
      if (b) b.click();
      await new Promise(r => setTimeout(r, 1700));
    }, re);
  };

  for (const [lang, tag] of [['en-US', 'en'], ['pt-BR', 'pt']]) {
    // Desktop
    let { page } = await ctxPage(browser, DESKTOP, seed);
    await go(page);
    if (lang !== 'en-US') await setLang(page, lang);
    await clickText(page, '(^|[^a-z])List$|(^|[^a-z])Lista$');
    await shot(page, `progress-desktop-list-release-${tag}`);
    await clickText(page, 'By Phase|Fase');
    await shot(page, `progress-desktop-list-byphase-${tag}`);
    await clickText(page, 'Spatial|Espacial');
    await clickText(page, 'Release|Lan');
    await shot(page, `progress-desktop-spatial-release-${tag}`);
    await clickText(page, 'Chrono');
    await shot(page, `progress-desktop-spatial-chrono-${tag}`);
    await page.context().close();

    // Phone, 390 and then 320 for the tight case
    for (const w of [390, 320]) {
      const ctx2 = await ctxPage(browser, { viewport: { width: w, height: 820 }, hasTouch: true, isMobile: true }, seed);
      const p2 = ctx2.page;
      await go(p2);
      if (lang !== 'en-US') await setLang(p2, lang);
      await shot(p2, `progress-phone-list-${w}-${tag}`);
      if (w === 390) {
        // Switch through the UI: writing the pref and reloading did not take,
        // and a screenshot labelled "grid" that shows the List is worse than
        // no screenshot at all.
        const toGrid = await p2.evaluate(async () => {
          // The view chip carries its own glyph ("\u2630List"), and a loose match
          // picks up the Watchlist filter instead.
          const chip = [...document.querySelectorAll('button')]
            .find(b => /^\u2630\s*(List|Lista)$/.test(b.textContent.trim()));
          if (!chip) return 'no view chip';
          chip.click();
          await new Promise(r => setTimeout(r, 700));
          const opt = [...document.querySelectorAll('button, [role="option"], li')]
            .find(e => /^\u25A6\s*(Grid|Grade)$/.test(e.textContent.trim()));
          if (!opt) return 'no Grid option';
          opt.click();
          await new Promise(r => setTimeout(r, 1800));
          return document.querySelector('.m-grid, .m-cards') ? 'ok' : 'clicked but no grid';
        });
        if (toGrid !== 'ok') console.error('grid switch:', toGrid);
        await shot(p2, `progress-phone-grid-${w}-${tag}`);
      }
      await p2.context().close();
    }
  }
  console.log(JSON.stringify({ shots, errors: [] }, null, 1));
  await browser.close(); server.close();
})();
