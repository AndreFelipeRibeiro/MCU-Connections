// Checks saved display preferences (mcu.prefs.v1) on mobile and desktop.
const QA_PORT = +process.env.PORT || 8205; // regress/quick give each check its own port
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
  const { ctx, page, errors } = await ctxPage(browser, DESKTOP, "localStorage.setItem('mcu.welcome.v1','test');");
  await go(page);
  const act = () => page.evaluate(() => { const a = document.activeElement; const card = a && a.closest && a.closest('.card'); const vp = document.querySelector('.viewport'); const v = vp.getBoundingClientRect(); const r = card ? card.getBoundingClientRect() : null;
    return { cls: a ? (a.id || a.className) : null, card: card ? card.dataset.id : null, fv: a ? a.matches(':focus-visible') : null, inView: r ? (r.left >= v.left && r.right <= v.right && r.top >= v.top && r.bottom <= v.bottom) : null, scroll: [vp.scrollLeft, vp.scrollTop], ring: card ? getComputedStyle(a).boxShadow.slice(0, 40) : null }; });
  // Tab from the search box until a card has focus.
  await page.locator('.search-wrap input').focus();
  let tabs = 0, s;
  for (; tabs < 60; tabs++) { await page.keyboard.press('Tab'); s = await act(); if (s.card) break; }
  R.firstCard = { tabs: tabs + 1, ...s };
  await page.screenshot({ path: 'shots/kb-focus.png' });
  // Walk 20 more cards: every focused card ends up in view, the box never scrolls.
  const walk = [];
  for (let i = 0; i < 20; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(700); const a = await act(); walk.push(a.card ? ((a.cls === 'card-open' ? 'C' : 'b') + (a.inView ? '' : '!OUT')) : ('-' + a.cls)); }
  R.walk = walk.join(' ');
  R.scrollAfter = (await act()).scroll;
  // Enter opens the focused card's details; Escape closes and returns focus.
  for (let i = 0; i < 3 && (await act()).cls !== 'card-open'; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(600); }
  const target = (await act()).card;
  await page.keyboard.press('Enter'); await page.waitForTimeout(1300);
  R.afterEnter = await page.evaluate(() => ({ title: (document.querySelector('.drawer.open .drawer-title') || {}).textContent, drawer: (document.querySelector('.drawer.open .drawer-title') || {}).textContent, focus: document.activeElement.id, ringHidden: document.querySelectorAll('.card.ring-hidden').length }));
  R.target = target;
  // Tab inside the ring skips the hidden cards (focus leaves the drawer to the next card).
  await page.keyboard.press('Escape'); await page.waitForTimeout(1300);
  R.afterEsc = await act();
  R.drawerClosed = !(await page.locator('.drawer.open').count());
  console.log(JSON.stringify(R, null, 1));
  R.vis = await page.evaluate(() => { const v = document.querySelector('.viewport').getBoundingClientRect(); return { vp: [v.left|0, v.top|0, v.width|0, v.height|0], t: document.querySelector('.canvas').style.transform, sample: [...document.querySelectorAll('.card')].slice(0, 3).map(c => { const r = c.getBoundingClientRect(); return [c.dataset.id, r.left|0, r.top|0, r.width|0]; }) }; });
  console.log(JSON.stringify(R.vis));
  try {
  await page.mouse.move(700, 700); await page.waitForTimeout(300);
  const c = await page.evaluate(() => { const el = document.querySelector('.card[data-id="incredible-hulk"]'); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 60, id: el.dataset.id }; });
  await page.mouse.click(c.x, c.y); await page.waitForTimeout(1300);
  R.mouse = await page.evaluate(() => ({ drawer: !!document.querySelector('.drawer.open'), fv: document.activeElement.matches(':focus-visible'), focus: document.activeElement.id || document.activeElement.className || document.activeElement.tagName }));
  } catch (e) { R.mouseErr = e.message.slice(0, 80); }
  R.errors = errors;
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
