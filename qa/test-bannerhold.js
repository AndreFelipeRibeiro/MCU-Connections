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
const URL = 'http://127.0.0.1:8217/';
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
  await new Promise(r => server.listen(8217, r));
  const browser = await chromium.launch();
  const R = {}; const errors = [];
  const { page } = await ctxPage(browser, DESKTOP, "localStorage.setItem('mcu.welcome.v1','test');");
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await go(page);

  R.hold = await page.evaluate(async () => {
    const click = async (el, ms = 1200) => { el.click(); await new Promise(r => setTimeout(r, ms)); };
    const inp = document.querySelector('input[role="combobox"]');
    const set = (el, v) => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    inp.focus();
    inp.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    set(inp, 'steve rogers');
    await new Promise(r => setTimeout(r, 500));
    const li = [...document.querySelectorAll('.ss-pop li')].find(l => /Steve Rogers/.test(l.innerText));
    if (!li) return { error: 'no Steve Rogers suggestion' };
    li.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 1200));

    const nextBtn = () => document.querySelector('.char-banner.pinned .cb-step button:last-child');
    const box = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y) }; };
    if (!nextBtn()) return { error: 'no pinned banner after picking a character' };
    const before = box(nextBtn());
    // Stepping opens the details panel. This is the moment the button used to move.
    await click(nextBtn());
    const after = box(nextBtn());
    const drawer = document.querySelector('.drawer');
    const banner = document.querySelector('.char-banner.pinned');
    const db = drawer.getBoundingClientRect();
    const bb = banner.getBoundingClientRect();
    return {
      before, after,
      drawerTop: Math.round(db.top), bannerBottom: Math.round(bb.bottom),
      drawerBottom: Math.round(db.bottom), viewportH: window.innerHeight,
      bannerPadRight: getComputedStyle(banner).paddingRight,
    };
  });

  const h = R.hold;
  if (h.error) errors.push(h.error);
  else {
    if (h.before.x !== h.after.x || h.before.y !== h.after.y) {
      errors.push(`the stepper moved when the panel opened: ${JSON.stringify(h.before)} -> ${JSON.stringify(h.after)}`);
    }
    if (h.drawerTop < h.bannerBottom - 1) errors.push(`the panel (top ${h.drawerTop}) covers the banner (bottom ${h.bannerBottom})`);
    if (h.drawerBottom > h.viewportH + 1) errors.push(`the panel runs past the viewport bottom (${h.drawerBottom} > ${h.viewportH})`);
    // Its own 22px gutter is fine; the 402px drawer indent is what moved the controls.
    if (parseFloat(h.bannerPadRight) > 100) errors.push(`the pinned banner is still indented by ${h.bannerPadRight}`);
  }

  // The hover banner is the opposite case: it appears and vanishes as the
  // cursor crosses a cast row INSIDE the open panel, so it must not move the
  // panel out from under the pointer. It keeps the old indent instead.
  R.hover = await page.evaluate(async () => {
    const click = async (el, ms = 900) => { el.click(); await new Promise(r => setTimeout(r, ms)); };
    await click(document.querySelector('.char-banner.pinned .cb-close'), 1200);
    const drawer = document.querySelector('.drawer');
    const topBefore = Math.round(drawer.getBoundingClientRect().top);
    const row = document.querySelector('.cast-row');
    if (!row) return { error: 'no cast row to hover' };
    row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await new Promise(r => setTimeout(r, 700));
    const hb = document.querySelector('.char-banner');
    return {
      topBefore, topAfter: Math.round(drawer.getBoundingClientRect().top),
      hoverPinned: hb ? hb.classList.contains('pinned') : null,
      hoverPadRight: hb ? getComputedStyle(hb).paddingRight : null,
    };
  });

  const hv = R.hover;
  if (hv.error) errors.push(hv.error);
  else if (hv.hoverPinned === false) {
    if (hv.topBefore !== hv.topAfter) errors.push(`hovering a cast row moved the panel: ${hv.topBefore} -> ${hv.topAfter}`);
    if (hv.hoverPadRight === '0px') errors.push('the hover banner lost its indent, so its close button sits under the panel');
  }

  R.errors = errors;
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
