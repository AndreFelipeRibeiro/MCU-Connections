// Checks saved display preferences (mcu.prefs.v1) on mobile and desktop.
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
const URL = 'http://127.0.0.1:8194/';
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
const reload = async page => { await page.reload(); await settle(page); };
(async () => {
  await new Promise(r => server.listen(8194, r));
  const browser = await chromium.launch();
  const R = {};
  const bootState = p => p.evaluate(() => { const b = document.getElementById('mcu-boot'); if (!b) return null; const btn = b.querySelector('.boot-reload'); return { state: b.dataset.state, msg: b.querySelector('.boot-msg').textContent, btn: btn.hidden ? null : btn.textContent }; });
  const run = async (name, opts, setup, after) => {
    const { ctx, page, errors } = await ctxPage(browser, opts, "localStorage.setItem('mcu.welcome.v1','test');");
    if (setup) await setup(page);
    let early = null;
    page.on('domcontentloaded', async () => { try { early = await bootState(page); } catch (e) {} });
    await page.goto('http://127.0.0.1:8194/', { waitUntil: 'commit' }); await page.waitForSelector('#root', { state: 'attached' });
    const r = { early };
    if (after) await after(page, r);
    await page.waitForFunction(() => !!document.querySelector('.toolbar, .m-appbar'), null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(300);
    r.appRendered = await page.evaluate(() => !!document.querySelector('.toolbar, .m-appbar'));
    r.final = await bootState(page);
    r.errors = errors.length;
    R[name] = r;
    await ctx.close();
  };
  await run('normal-en', DESKTOP, null, async (p, r) => { await p.waitForTimeout(100); r.shortlyAfter = await bootState(p); });
  await run('normal-pt-phone', { ...MOBILE, locale: 'pt-BR' }, async p => {
    // Hold Babel back briefly so the loading screen is observable after the locales run.
    await p.route('**/babel.min.js', async route => { await new Promise(r => setTimeout(r, 1500)); route.fallback(); });
  }, async (p, r) => { await p.waitForTimeout(1000); r.whileWaiting = await bootState(p); await p.screenshot({ path: 'shots/boot-phone.png' }); });
  await run('react-blocked', DESKTOP, async p => { await p.route('**/react.production.min.js', route => route.abort()); });
  await run('sri-mismatch', { ...MOBILE, locale: 'pt-BR' }, async p => { await p.route('**/react-dom.production.min.js', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* tampered */' })); }, async p => { await p.waitForTimeout(1500); await p.screenshot({ path: 'shots/boot-failed-phone.png' }); });
  await run('jsx-error', DESKTOP, async p => { await p.route('**/desktop-list.jsx', route => route.fulfill({ status: 200, contentType: 'text/babel', body: 'const x = <div>;' })); });
  await run('slow', DESKTOP, async p => {
    await p.clock.install();
    await p.route('**/babel.min.js', () => {});   // never answers
  }, async (p, r) => { await p.waitForTimeout(500); await p.clock.fastForward(26000); await p.waitForTimeout(300); r.afterSlow = await bootState(p); });
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
