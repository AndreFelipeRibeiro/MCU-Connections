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
const URL = 'http://127.0.0.1:8225/';
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


// Where to watch (watch.jsx, watch-data.js). The real snapshot is checked as
// it is; every other state uses a test snapshot served in place of
// watch-data.js, so the states are covered before (and after) any refresh.
const day = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const P = (id, name, logo) => ({ id, name, logo: logo === undefined ? '/logo' + id + '.png' : logo });
const fixture = (checkedAt) => 'window.WATCH = ' + JSON.stringify({
  checkedAt, source: 'JustWatch via TMDB', regions: ['US', 'BR'], logoBase: 'https://image.tmdb.org/t/p/w92',
  ids: { 'iron-man': { type: 'movie', id: 1726 }, 'incredible-hulk': { type: 'movie', id: 1724 }, thor: { type: 'movie', id: 10195 }, 'loki-s1': { type: 'tv', id: 84958 } },
  titles: {
    'iron-man': {
      US: { link: 'https://www.themoviedb.org/movie/1726-iron-man/watch?locale=US', stream: [P(337, 'Disney Plus')], free: [P(73, 'Tubi TV', null)],
        rent: [P(2, 'Apple TV'), P(3, 'Google Play Movies'), P(10, 'Amazon Video')], buy: [P(2, 'Apple TV'), P(7, 'Fandango At Home')] },
      BR: { link: 'https://www.themoviedb.org/movie/1726-iron-man/watch?locale=BR', stream: [P(337, 'Disney Plus')], free: [], rent: [], buy: [] },
    },
    'incredible-hulk': { US: { link: 'https://www.themoviedb.org/movie/1724/watch?locale=US', stream: [], free: [], rent: [P(2, 'Apple TV')], buy: [P(2, 'Apple TV'), P(3, 'Google Play Movies')] },
      BR: { link: null, stream: [], free: [], rent: [], buy: [] } },
    thor: { US: { link: null, stream: [], free: [], rent: [], buy: [] }, BR: { link: null, stream: [], free: [], rent: [], buy: [] } },
    'loki-s1': { US: { link: 'https://www.themoviedb.org/tv/84958/watch?locale=US', stream: [P(337, 'Disney Plus')], free: [], rent: [], buy: [] } },
  },
}) + ';';

(async () => {
  await new Promise(r => server.listen(8225, r));
  const browser = await chromium.launch();
  const out = { errors: [] };
  const err = (m) => out.errors.push(m);
  // Where to watch starts closed (user decision, 2026-10-29): open its
  // section before reading it. `closedAtFirst` records that it was closed.
  let closedAtFirst = [];
  const open = async (page, id) => {
    await page.goto(URL + '?title=' + id); await settle(page);
    const btn = page.locator('.wtw .td-acc-btn').first();
    if (await btn.count()) {
      const exp = await btn.getAttribute('aria-expanded');
      closedAtFirst.push(exp === 'false');
      if (exp === 'false') { await btn.click(); await page.waitForTimeout(200); }
    }
  };
  const read = (page) => page.evaluate(() => {
    const s = document.querySelector('.wtw');
    if (!s) return null;
    const a = s.querySelector('.wtw-link');
    const head = s.closest('.td-head');
    const kids = head ? [...head.children].map(e => e.className.split(' ')[0]) : [];
    return {
      title: s.querySelector('.wtw-title').textContent,
      kinds: [...s.querySelectorAll('.wtw-kind')].map(e => e.textContent),
      providers: [...s.querySelectorAll('.wtw-name')].map(e => e.textContent),
      fallbacks: s.querySelectorAll('.wtw-logo.none').length,
      notes: [...s.querySelectorAll('.wtw-note, .wtw-also, .wtw-series')].map(e => e.textContent),
      credit: (s.querySelector('.wtw-credit') || {}).textContent || null,
      link: a ? { href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'), label: a.getAttribute('aria-label') } : null,
      afterSynopsis: kids.indexOf('td-slot') === kids.indexOf('synopsis') + 1,
    };
  });
  const withFixture = async (opts, checkedAt, init) => {
    // The first-visit welcome would cover the page; mark it seen.
    const c = await ctxPage(browser, opts, "localStorage.setItem('mcu.welcome.v1','test');" + (init || ''));
    await c.page.route('**/watch-data.js', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: fixture(checkedAt) }));
    return c;
  };

  // 1. Region guess: the region part of the browser's languages, then the
  //    time zone, then the United States.
  for (const [locale, timezoneId, want] of [['en-US', 'America/New_York', 'United States'], ['pt-BR', 'America/Sao_Paulo', 'Brasil'], ['en', 'America/Sao_Paulo', 'Brazil'], ['fr', 'Europe/Paris', 'United States']]) {
    const { ctx, page } = await withFixture({ ...DESKTOP, locale, timezoneId }, day(3));
    await open(page, 'iron-man');
    const r = await read(page);
    (out.guess = out.guess || {})[locale + ' ' + timezoneId] = r && r.title;
    if (!r || !r.title.endsWith(want)) err(`region guess for ${locale} / ${timezoneId}: "${r && r.title}", expected ${want}`);
    await ctx.close();
  }

  // 2. The states, on the desktop drawer, in the United States.
  let { ctx, page, errors } = await withFixture({ ...DESKTOP, locale: 'en-US' }, day(3));
  await open(page, 'iron-man');
  let r = await read(page);
  out.offers = r;
  if (!r) err('no Where to watch section on a released title');
  else {
    if (r.kinds.join() !== 'Stream,Free') err(`groups: ${r.kinds.join()}`);
    if (r.providers.join() !== 'Disney Plus,Tubi TV') err(`providers: ${r.providers.join()}`);
    if (!r.notes.some(n => n === 'Also to rent or buy on Apple TV, Google Play Movies and 2 more.')) err(`rent/buy line: ${r.notes.join(' | ')}`);
    if (!r.fallbacks) err('a provider without a logo (or a logo that fails) should show its initial and name');
    if (!r.link || r.link.target !== '_blank' || r.link.rel !== 'noopener noreferrer' || !/Iron Man.*United States.*TMDB.*new tab/.test(r.link.label)) err(`link: ${JSON.stringify(r.link)}`);
    if (/[?&](utm_|ref=|aff)/.test(r.link && r.link.href || '')) err('the link carries tracking or affiliate parameters');
    if (!/^Checked .+ · Data from JustWatch via TMDB$/.test(r.credit || '')) err(`credit: ${r.credit}`);
    if (!r.afterSynopsis) err('Where to watch should sit right after the synopsis');
  }
  await open(page, 'incredible-hulk');
  r = await read(page);
  if (!r || !r.notes.includes('Not included with any subscription here.') || !r.notes.some(n => n.startsWith('Also to rent or buy on Apple TV and Google Play Movies'))) err(`rent-only: ${JSON.stringify(r && r.notes)}`);
  await open(page, 'thor');
  r = await read(page);
  if (!r || !r.notes.some(n => /^No streaming, rental or purchase options found here as of /.test(n))) err(`no offers: ${JSON.stringify(r && r.notes)}`);
  if (r && r.link && !/\/movie\/10195\/watch\?locale=US$/.test(r.link.href)) err(`no-offers link should fall back to TMDB's page: ${r.link.href}`);
  await open(page, 'loki-s1');
  r = await read(page);
  if (!r || !r.notes.includes('For the whole series.')) err(`series note: ${JSON.stringify(r && r.notes)}`);
  await open(page, 'avengers');
  r = await read(page);
  if (!r || !r.notes.includes('Availability not checked yet.') || r.credit) err(`not checked: ${JSON.stringify(r)}`);
  // Not released: no section at all (the release line covers it).
  const upcoming = await page.evaluate(() => (window.TITLES.find(t => !window.MCU_isReleased(t)) || {}).id);
  if (upcoming) { await open(page, upcoming); if (await read(page)) err(`${upcoming} is not out yet but shows Where to watch`); }

  // 3. Change the country: the picker, an unsupported country, and the
  //    choice kept on this device.
  await open(page, 'iron-man');
  await page.locator('.wtw-change').click();
  await page.locator('.wtw-picker select').selectOption('PT');
  await page.waitForTimeout(300);
  r = await read(page);
  out.portugal = r;
  if (!r || !r.notes.includes("We don't have availability for Portugal yet.") || !r.link || !/locale=PT$/.test(r.link.href)) err(`unsupported country: ${JSON.stringify(r)}`);
  if (await page.evaluate(() => localStorage.getItem('mcu.region.v1')) !== 'PT') err('the chosen country is not kept');
  await page.reload(); await settle(page);
  // A reload closes the section again (it starts closed); open it.
  await page.locator('.wtw .td-acc-btn').click(); await page.waitForTimeout(200);
  r = await read(page);
  if (!r || !r.title.endsWith('Portugal')) err(`the chosen country did not survive a reload: ${r && r.title}`);
  await page.locator('.wtw-change').click();
  await page.locator('.wtw-picker select').selectOption('BR');
  await page.waitForTimeout(300);
  r = await read(page);
  if (!r || r.providers.join() !== 'Disney Plus' || r.kinds.join() !== 'Stream') err(`Brazil offers: ${JSON.stringify(r)}`);
  errors.forEach(e => err('desktop console: ' + e));
  await ctx.close();

  // 4. Stale snapshot: offers stay, with a warning.
  ({ ctx, page, errors } = await withFixture({ ...DESKTOP, locale: 'en-US' }, day(40)));
  await open(page, 'iron-man');
  r = await read(page);
  if (!r || !r.providers.length || !/may have changed/.test(r.credit || '')) err(`stale snapshot: ${JSON.stringify(r && r.credit)}`);
  await ctx.close();

  // 5. Phone sheet and Portuguese.
  ({ ctx, page, errors } = await withFixture({ ...MOBILE, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' }, day(3), "localStorage.setItem('mcu.lang.v1','pt-BR');"));
  await open(page, 'iron-man');
  r = await page.evaluate(() => { const s = document.querySelector('.m-sheet .wtw'); return s && { title: s.querySelector('.wtw-title').textContent, kinds: [...s.querySelectorAll('.wtw-kind')].map(e => e.textContent), credit: (s.querySelector('.wtw-credit') || {}).textContent }; });
  out.phonePt = r;
  if (!r || r.title !== 'Onde assistir · Brasil' || r.kinds.join() !== 'Streaming' || !/^Verificado em .+ · Dados da JustWatch via TMDB$/.test(r.credit || '')) err(`phone, Portuguese: ${JSON.stringify(r)}`);
  r = await page.evaluate(() => { const s = document.querySelector('.m-sheet .wtw'); if (!s) return 'missing'; const box = s.getBoundingClientRect(); return [...s.querySelectorAll('*')].some(e => e.getBoundingClientRect().right > box.right + 0.5) ? 'overflow' : 'ok'; });
  if (r !== 'ok') err(`phone section: ${r}`);
  errors.forEach(e => err('phone console: ' + e));
  await ctx.close();

  // 6. The real snapshot, as committed: before the first refresh every
  //    released title says it has not been checked; after, the section shows
  //    the snapshot's own date.
  ({ ctx, page, errors } = await ctxPage(browser, { ...DESKTOP, locale: 'en-US' }, "localStorage.setItem('mcu.welcome.v1','test');"));
  await open(page, 'iron-man');
  const real = await page.evaluate(() => ({ checkedAt: window.WATCH && window.WATCH.checkedAt, has: !!(window.WATCH && window.WATCH.titles && window.WATCH.titles['iron-man']) }));
  r = await read(page);
  out.real = { ...real, notes: r && r.notes, credit: r && r.credit };
  if (!r) err('the real snapshot: no section on Iron Man');
  else if (!real.has && !r.notes.includes('Availability not checked yet.')) err('the real snapshot has no Iron Man entry but the section does not say so');
  else if (real.has && !(r.credit || '').includes('JustWatch')) err('the real snapshot is missing its credit');
  errors.forEach(e => err('real snapshot console: ' + e));
  await ctx.close();

  if (!closedAtFirst.length || closedAtFirst.some(c => !c)) err(`Where to watch should start closed on every open (${closedAtFirst.join(',')})`);
  console.log(JSON.stringify(out, null, 1));
  await browser.close(); server.close();
})();
