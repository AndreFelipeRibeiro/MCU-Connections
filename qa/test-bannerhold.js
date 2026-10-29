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
    if (!nextBtn()) return { error: 'no pinned banner after picking a character' };
    // Stepping opens the details panel.
    await click(nextBtn());
    const drawer = document.querySelector('.drawer');
    const banner = document.querySelector('.char-banner.pinned');
    const db = drawer.getBoundingClientRect();
    const bb = banner.getBoundingClientRect();
    const tb = document.querySelector('.toolbar');
    return {
      drawerTop: Math.round(db.top), drawerLeft: Math.round(db.left),
      drawerBottom: Math.round(db.bottom), viewportH: window.innerHeight,
      toolbarBottom: tb ? Math.round(tb.getBoundingClientRect().bottom) : null,
      bannerRight: Math.round(bb.right),
      bannerPadRight: parseFloat(getComputedStyle(banner).paddingRight),
      // Where the banner's own content actually stops.
      contentRight: Math.round(bb.right) - parseFloat(getComputedStyle(banner).paddingRight),
    };
  });

  const h = R.hold;
  if (h.error) errors.push(h.error);
  else {
    // The pinned banner stops before the panel, exactly as the hover banner
    // does. Andre chose this over the full-width bar that kept the stepper
    // still: the bar changing width between hover and pinned read worse than
    // the controls moving, so the stepper IS expected to shift here.
    if (h.contentRight > h.drawerLeft + 1) {
      errors.push(`the banner's content runs to ${h.contentRight}, past the panel edge at ${h.drawerLeft}`);
    }
    if (h.bannerPadRight < 100) {
      errors.push(`the pinned banner is only indented by ${h.bannerPadRight}px; it should clear the panel`);
    }
    // The panel is no longer pushed down by the banner: it hangs from the
    // toolbar and runs the full height, the same as with no character pinned.
    if (h.toolbarBottom !== null && Math.abs(h.drawerTop - h.toolbarBottom) > 1) {
      errors.push(`the panel starts at ${h.drawerTop} but the toolbar ends at ${h.toolbarBottom}; it should hang from the toolbar`);
    }
    if (h.drawerBottom > h.viewportH + 1) errors.push(`the panel runs past the viewport bottom (${h.drawerBottom} > ${h.viewportH})`);
  }

  // The hover banner must not move the panel out from under the pointer, and
  // must be indented by the same amount as the pinned one — that equality is
  // the whole point of the change.
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
      hoverPadRight: hb ? parseFloat(getComputedStyle(hb).paddingRight) : null,
    };
  });

  const hv = R.hover;
  if (hv.error) errors.push(hv.error);
  else if (hv.hoverPinned === false) {
    if (hv.topBefore !== hv.topAfter) errors.push(`hovering a cast row moved the panel: ${hv.topBefore} -> ${hv.topAfter}`);
    if (!hv.hoverPadRight) errors.push('the hover banner lost its indent, so its close button sits under the panel');
    if (R.hold && !R.hold.error && Math.abs(hv.hoverPadRight - R.hold.bannerPadRight) > 1) {
      errors.push(`hover indent ${hv.hoverPadRight}px but pinned ${R.hold.bannerPadRight}px; the bar must not change width between the two`);
    }
  }

  R.errors = errors;
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
