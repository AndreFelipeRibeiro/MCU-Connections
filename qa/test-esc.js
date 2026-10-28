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
const URL = 'http://127.0.0.1:8199/';
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
  await new Promise(r => server.listen(8199, r));
  const browser = await chromium.launch();
  const R = {};
  const st = p => p.evaluate(() => ({ drawer: !!document.querySelector('.drawer.open'), title: (document.querySelector('.drawer.open .drawer-title') || {}).textContent || null, focus: (() => { const a = document.activeElement; if (!a || a === document.body) return 'body'; return a.id || a.className || a.tagName; })(), selected: document.querySelectorAll('.card.selected').length, pairDim: document.querySelectorAll('.card.dimmed').length }));
  // Desktop List, keyboard only.
  {
    const { ctx, page, errors } = await ctxPage(browser, DESKTOP, "localStorage.setItem('mcu.welcome.v1','test');localStorage.setItem('mcu.prefs.v1', JSON.stringify({version:1, desktopView:'list'}));");
    await go(page);
    await page.locator('.dl-open').nth(1).focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(800);
    R.listOpen = await st(page);
    await page.keyboard.press('Tab'); R.tabInto = (await st(page)).focus;
    await page.keyboard.press('Escape'); await page.waitForTimeout(800);
    R.listEsc = await st(page);
    R.focusBackOnRow = await page.evaluate(() => document.activeElement === document.querySelectorAll('.dl-open')[1]);
    // Search box: Escape belongs to the search, not the drawer.
    await page.locator('.dl-open').nth(2).click(); await page.waitForTimeout(700);
    const box = page.locator('.search-wrap input'); await box.click(); await box.type('th'); await page.waitForTimeout(300);
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    R.escInSearch = await st(page);
    // Account menu open: Escape closes the menu only.
    await page.locator('.acct-pill').click(); await page.waitForTimeout(400);
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    R.escWithMenu = { ...(await st(page)), menu: await page.locator('.acct-pop').count() };
    // Then Escape again closes the drawer.
    await page.keyboard.press('Escape'); await page.waitForTimeout(700);
    R.escAfterMenu = await st(page);
    R.listErrors = errors; await ctx.close();
  }
  // Mouse opens: no focus moved into the drawer, so no ring on the title.
  {
    const { ctx, page } = await ctxPage(browser, DESKTOP, "localStorage.setItem('mcu.welcome.v1','test');localStorage.setItem('mcu.prefs.v1', JSON.stringify({version:1, desktopView:'list'}));");
    await go(page);
    await page.locator('.dl-row').nth(3).click({ position: { x: 600, y: 20 } }); await page.waitForTimeout(900);
    R.mouseListOpen = await st(page);
    R.titleOutline = await page.evaluate(() => getComputedStyle(document.querySelector('.drawer.open .drawer-title')).outlineStyle);
    await page.screenshot({ path: 'shots/drawer-mouse.png', clip: { x: 1040, y: 120, width: 400, height: 160 } });
    await ctx.close();
  }
  // Desktop Spatial, mouse + Escape; pair view first.
  {
    const { ctx, page, errors } = await ctxPage(browser, DESKTOP, "localStorage.setItem('mcu.welcome.v1','test');");
    await go(page);
    const before = await page.evaluate(() => document.querySelector('.canvas').style.transform);
    await page.locator('.card').nth(3).click(); await page.waitForTimeout(1200);
    R.spOpen = await st(page);
    const line = await page.evaluate(() => { for (const path of document.querySelectorAll('.connection-layer path')) { const L = path.getTotalLength(); if (!L) continue; const pt = path.getPointAtLength(L / 2); const m = path.getScreenCTM(); const x = pt.x * m.a + pt.y * m.c + m.e, y = pt.x * m.b + pt.y * m.d + m.f; const el = document.elementFromPoint(x, y); if (el && el.tagName === 'path') return { x, y }; } return null; });
    if (line) { await page.mouse.click(line.x, line.y); await page.waitForTimeout(800); R.pair = await st(page); await page.keyboard.press('Escape'); await page.waitForTimeout(800); R.escPair = await st(page); }
    await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
    R.escSpatial = await st(page);
    R.cameraBack = (await page.evaluate(() => document.querySelector('.canvas').style.transform)) === before;
    await page.keyboard.press('Escape'); await page.waitForTimeout(300); R.escNothing = await st(page);
    R.spErrors = errors; await ctx.close();
  }
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
