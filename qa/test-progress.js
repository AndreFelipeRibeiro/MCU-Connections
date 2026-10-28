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
const URL = 'http://127.0.0.1:8218/';
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

(async () => {
  await new Promise(r => server.listen(8218, r));
  const browser = await chromium.launch();
  const R = {}; const errors = [];
  const { page } = await ctxPage(browser, DESKTOP, "localStorage.setItem('mcu.welcome.v1','test');");
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await go(page);

  const toList = async () => page.evaluate(async () => {
    const b = [...document.querySelectorAll('button')].find(x => /(^|[^a-z])List$/i.test(x.textContent.trim()));
    if (b) b.click();
    await new Promise(r => setTimeout(r, 1400));
  });
  const dividers = () => page.evaluate(() =>
    [...document.querySelectorAll('.dl-table .dl-phase-divider .pgh')].map(p => ({
      label: p.querySelector('.pgh-label').textContent.trim(),
      count: (p.querySelector('.pgh-count') || {}).textContent,
      up: (p.querySelector('.pgh-up') || {}).textContent || null,
      sr: (p.querySelector('.story-sr') || {}).textContent.trim(),
    })));

  await toList();
  R.start = await dividers();

  // One divider per phase, and the catalog has six.
  if (R.start.length !== 6) errors.push(`expected 6 phase dividers, got ${R.start.length}`);
  // Nothing seen yet: an empty track and 0/N, not a hidden header.
  if (R.start[0] && R.start[0].count !== '0/6') errors.push(`Phase 1 opened at "${R.start[0].count}", expected 0/6`);

  // The denominator counts released titles only. Phase 6 has unreleased ones,
  // so its total must be smaller than its number of titles, and it must say so.
  R.phase6 = R.start[5] || null;
  if (!R.phase6) errors.push('no Phase 6 divider');
  else {
    if (!R.phase6.up) errors.push('Phase 6 has unreleased titles but shows no "+N" hint');
    const total = Number((R.phase6.count || '').split('/')[1]);
    const inCatalog = await page.evaluate(() => window.TITLES.filter(t => t.phase === 6).length);
    if (!(total < inCatalog)) errors.push(`Phase 6 counts ${total} of ${inCatalog} titles; unreleased ones should be left out`);
  }

  // Marking a title seen moves its phase's count, live.
  await page.evaluate(async () => {
    const first = window.TITLES.filter(t => t.phase === 1)[0];
    const row = document.querySelector(`[data-row-id="${first.id}"]`);
    const btn = [...row.querySelectorAll('button')].find(b => /seen|visto/i.test(b.getAttribute('aria-label') || ''));
    if (btn) btn.click();
    await new Promise(r => setTimeout(r, 900));
  });
  R.afterMark = (await dividers())[0];
  if (!R.afterMark || R.afterMark.count !== '1/6') {
    errors.push(`after marking one title Phase 1 reads "${R.afterMark && R.afterMark.count}", expected 1/6`);
  }
  if (!/1 of 6|1 de 6/.test((R.afterMark && R.afterMark.sr) || '')) {
    errors.push(`the spoken form reads "${R.afterMark && R.afterMark.sr}" — colour and digits must not be the only signal`);
  }

  // The collection tab must NOT feed the fraction. On the Seen tab only seen
  // titles are listed, so a count taken from the visible set would read 1/1.
  await page.evaluate(async () => {
    const b = [...document.querySelectorAll('button')].find(x => /^(Seen|Vistos)$/i.test(x.textContent.trim()));
    if (b) b.click();
    await new Promise(r => setTimeout(r, 1200));
  });
  R.onSeenTab = (await dividers())[0] || null;
  if (R.onSeenTab && R.onSeenTab.count !== '1/6') {
    errors.push(`the Seen tab changed Phase 1 to "${R.onSeenTab.count}"; the collection tab must not feed its own numbers`);
  }
  await page.evaluate(async () => {
    const b = [...document.querySelectorAll('button')].find(x => /^(All|Todos)$/i.test(x.textContent.trim()));
    if (b) b.click();
    await new Promise(r => setTimeout(r, 1000));
  });

  // A text search narrows the catalog, so the headers stand down entirely.
  await page.fill('.search-wrap input', 'iron');
  await page.waitForTimeout(900);
  R.duringSearch = (await dividers()).length;
  if (R.duringSearch !== 0) errors.push(`${R.duringSearch} dividers survived a text search; they should be hidden`);
  await page.fill('.search-wrap input', '');
  await page.waitForTimeout(900);
  R.afterSearch = (await dividers()).length;
  if (R.afterSearch !== 6) errors.push(`dividers did not come back after the search (${R.afterSearch})`);

  R.errors = errors;
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
