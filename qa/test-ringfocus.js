// Checks saved display preferences (mcu.prefs.v1) on mobile and desktop.
const QA_PORT = +process.env.PORT || 8196; // regress/quick give each check its own port
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
const URL = 'http://127.0.0.1:' + QA_PORT + '/';
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
const settle = page => require('./ready').appReady(page);
const go = async page => { await page.goto(URL); await settle(page); };
const reload = async page => { await page.reload(); await settle(page); };
(async () => {
  await new Promise(r => server.listen(QA_PORT, r));
  const browser = await chromium.launch();
  const R = {};
  const measure = (p, id) => p.evaluate(id => {
    const cards = [...document.querySelectorAll('.canvas .card')].filter(c => !c.classList.contains('ring-hidden'));
    const sel = document.querySelector(`.card[data-id="${id}"]`);
    const sr = sel.getBoundingClientRect();
    const other = cards.find(c => c !== sel).getBoundingClientRect();
    let minGap = Infinity, overlaps = [];
    for (const c of cards) { if (c === sel) continue; const r = c.getBoundingClientRect();
      const gx = Math.max(r.left - sr.right, sr.left - r.right), gy = Math.max(r.top - sr.bottom, sr.top - r.bottom);
      const gap = Math.max(gx, gy); minGap = Math.min(minGap, gap); if (gx < 0 && gy < 0) overlaps.push(c.dataset.id); }
    return { cls: sel.className.includes('ring-focus'), ratio: +(sr.width / other.width).toFixed(3), visible: cards.length, minGapPx: Math.round(minGap), overlaps };
  }, id);
  for (const [dev, opts] of [['desk', DESKTOP], ['phone', MOBILE]]) {
    const { ctx, page, errors } = await ctxPage(browser, opts, "localStorage.setItem('mcu.welcome.v1','test');localStorage.setItem('mcu.prefs.v1', JSON.stringify({version:1, viewMode:'spatial'}));");
    await go(page);
    for (const id of ['iron-man-2', 'endgame', 'shang-chi']) {
      const c = page.locator(`.card[data-id="${id}"]`);
      if (!(await c.count())) { R[dev + ':' + id] = 'missing'; continue; }
      if (dev === 'desk') await c.click(); else await c.tap();
      await page.waitForTimeout(1400);
      R[dev + ':' + id] = await measure(page, id);
      if (dev === 'desk' && id === 'iron-man-2') await page.screenshot({ path: 'shots/ringfocus-desk.png' });
      if (dev === 'phone' && id === 'iron-man-2') await page.screenshot({ path: 'shots/ringfocus-phone.png' });
      if (dev === 'desk') await page.keyboard.press('Escape'); else await page.touchscreen.tap(5, 300);
      await page.waitForTimeout(900);
    }
    R[dev + ':afterClose'] = await page.evaluate(() => ({ focus: document.querySelectorAll('.card.ring-focus').length, selected: document.querySelectorAll('.card.selected').length, hidden: document.querySelectorAll('.card.ring-hidden').length }));
    R[dev + ':errors'] = errors;
    await ctx.close();
  }
  console.log(JSON.stringify(R));
  await browser.close(); server.close();
})();
