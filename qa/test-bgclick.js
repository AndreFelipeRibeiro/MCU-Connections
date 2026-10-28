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
const URL = 'http://127.0.0.1:8193/';
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
  await new Promise(r => server.listen(8193, r));
  const browser = await chromium.launch();
  const R = {};
  const { ctx, page, errors } = await ctxPage(browser, DESKTOP, "localStorage.setItem('mcu.welcome.v1','test');");
  await go(page);
  const st = () => page.evaluate(() => ({ selected: document.querySelectorAll('.card.selected').length, drawer: !!document.querySelector('.drawer.open'), dimmed: document.querySelectorAll('.card.dimmed').length, hidden: document.querySelectorAll('.card.ring-hidden').length, t: document.querySelector('.canvas').style.transform }));
  // An empty point: inside the viewport, element under it is background.
  const empty = () => page.evaluate(() => {
    const vp = document.querySelector('.viewport').getBoundingClientRect();
    for (let y = vp.top + 140; y < vp.bottom - 60; y += 23) for (let x = vp.left + 40; x < vp.right - 460; x += 29) {
      const el = document.elementFromPoint(x, y);
      if (el && (el.classList.contains('canvas-bg') || el.classList.contains('viewport') || el.classList.contains('canvas') || el.tagName === 'svg')) return { x, y, el: el.className && el.className.baseVal !== undefined ? 'svg' : el.className };
    }
    return null;
  });
  const before = (await st()).t;
  await page.locator('.card').nth(3).click(); await page.waitForTimeout(1000);
  R.selected = await st();
  const p = await empty(); R.emptyPoint = p;
  // 1. Drag from empty space: selection stays.
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + 60, p.y + 20, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(300);
  R.afterDrag = await st();
  // 1b. Click empty background: closes the selection and its details.
  await page.mouse.click(p.x, p.y); await page.waitForTimeout(1200);
  R.afterEmptyClick = await st();
  R.cameraBackA = R.afterEmptyClick.t === before;
  await page.waitForTimeout(1500); R.settled = await st();
  await page.mouse.move(p.x + 5, p.y + 5); await page.waitForTimeout(400); R.afterMove = await st();
  R.underCursor = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); const c = e && e.closest('.card'); return c ? 'card ' + c.dataset.id : (e && e.className); }, [p.x + 5, p.y + 5]);
  await page.mouse.move(5, 895); await page.waitForTimeout(400); R.awayFromCards = await st();
  R.dimReason = await page.evaluate(() => { const c = document.querySelector('.card.dimmed'); return c ? c.className : null; });
  await page.locator('.card').nth(3).click(); await page.waitForTimeout(1000);
  // 2. Click a connection line: selection stays.
  const line = await page.evaluate(() => {
    for (const path of document.querySelectorAll('.connection-layer path')) {
      const L = path.getTotalLength(); if (!L) continue;
      const pt = path.getPointAtLength(L / 2); const m = path.getScreenCTM(); if (!m) continue;
      const x = pt.x * m.a + pt.y * m.c + m.e, y = pt.x * m.b + pt.y * m.d + m.f;
      const el = document.elementFromPoint(x, y);
      if (el && el.tagName === 'path') return { x, y };
    }
    return null;
  });
  R.linePoint = line;
  if (line) { await page.mouse.click(line.x, line.y); await page.waitForTimeout(600); R.afterLine = await st(); R.pairOpen = await page.evaluate(() => !!document.querySelector('.pair, .pair-view, [class*="pair"]')); }
  // 3. Click empty background: steps back (pair first if one opened, then the selection).
  const p2 = await empty();
  await page.mouse.click(p2.x, p2.y); await page.waitForTimeout(900);
  R.afterClick1 = await st();
  { const p4 = await empty(); await page.mouse.click(p4.x, p4.y); await page.waitForTimeout(900); R.afterClick1b = await st(); }
  if (R.afterClick1.selected) { const p3 = await empty(); await page.mouse.click(p3.x, p3.y); await page.waitForTimeout(900); R.afterClick2 = await st(); }
  await page.waitForTimeout(600);
  R.cameraBack = (await st()).t === before;
  R.tBefore = before; R.tAfter = (await st()).t;
  // 4. Card-to-card: clicking another card switches the selection.
  await page.locator('.card').nth(3).click(); await page.waitForTimeout(900);
  const other = await page.evaluate(() => { const c = [...document.querySelectorAll('.card:not(.ring-hidden):not(.selected)')][0]; const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 30, id: c.dataset.id }; });
  await page.mouse.click(other.x, other.y); await page.waitForTimeout(900);
  R.switched = await page.evaluate(id => !!document.querySelector(`.card.selected[data-id="${id}"]`), other.id);
  R.errors = errors;
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
