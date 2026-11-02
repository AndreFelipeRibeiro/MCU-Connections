// Text size and the type scale (Notion V4 Tasks, "Font size increase").
//   - Default size: no visible text under 12px anywhere but the Spatial
//     canvas's cards (desktop Spatial, List, details, guide; phone List,
//     Grid, details, guide, Settings, account).
//   - Settings → Text size: Small / Default / Large scale the root
//     (87.5 / 100 / 106.25% on desktop, 112.5% Large on phones), apply at once and survive a reload; a
//     Spatial card's text keeps its size; the choice stays on the device
//     (not in the synced preferences). Controls grow with Large and never
//     get smaller than their default at Small.
//   - Phones set body text at 14px (15.75 at Large), the bottom nav at 12px
//     (12.75 at Large, never under 12) and draw the search field at 13px
//     (13.8 at Large) while its own font stays 16px or more, so iPhones
//     don't zoom in when it takes focus.
//   - The desktop List keeps every cell inside its column (English and
//     Portuguese, Default and Large, 1024–1440px), with all 12 columns at
//     1280px at the default size.
//   - Desktop at 200% browser zoom (a 720px-wide layout) stays usable: no
//     sideways scroll, nothing in the app bar past the edge.
// Every failed expectation lands in `errors`, which is what regress.sh gates on.
const QA_PORT = +process.env.PORT || 8305;
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const S = __dirname;
const SITE = process.env.SITE ? path.join(S, process.env.SITE) : path.join(S, '..', 'dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(SITE, p);
  if (!f.startsWith(SITE) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const URL_BASE = 'http://127.0.0.1:' + QA_PORT + '/';
const SEED = "try { localStorage.setItem('mcu.welcome.v1', 'test'); localStorage.setItem('mcu.signInNudge.v1', '2'); if (!localStorage.getItem('mcu.collection.v1')) localStorage.setItem('mcu.collection.v1', JSON.stringify({ version: 1, states: { 'iron-man': 'seen', 'loki-s1': 'watchlist' } })); } catch (e) {}";
const DESK = { viewport: { width: 1440, height: 900 } };
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

// Visible text under 12px, outside the Spatial cards (which keep pixel
// sizes on purpose: the canvas has its own zoom).
const SCAN = () => {
  const small = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.textContent.trim()) continue;
    const e = n.parentElement;
    if (!e || e.closest('.card, svg, .story-sr, script, style, .boot')) continue;
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) continue;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.opacity === '0' || (cs.position === 'absolute' && r.width <= 1)) continue;
    const px = parseFloat(cs.fontSize);
    if (px < 11.9) small.set((typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : e.tagName) + ' ' + px + 'px', n.textContent.trim().slice(0, 24));
  }
  return [...small.entries()].map(([k, v]) => `${k} "${v}"`);
};

(async () => {
  await new Promise(r => server.listen(QA_PORT, r));
  const browser = await chromium.launch();
  const errors = [];
  const out = {};
  const expect = (ok, msg) => { if (!ok) errors.push(msg); };
  const open = async (opts, init = '') => {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(SEED + init);
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    await page.route('**/*', r => r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort());
    return { ctx, page };
  };
  const ready = (page) => require('./ready').appReady(page, 300);
  const go = async (page, q) => { await page.goto(URL_BASE + q); await ready(page); };

  // ---- The floor, at the default size --------------------------------------
  for (const [label, opts, pages] of [
    ['desktop', DESK, ['', '?view=list', '?title=iron-man', '?guide=before-doomsday&view=list']],
    ['phone', PHONE, ['', '?view=grid', '?title=iron-man', '?guide=before-doomsday&view=list']],
  ]) {
    const { ctx, page } = await open(opts);
    for (const q of pages) {
      await go(page, q);
      const small = await page.evaluate(SCAN);
      if (small.length) errors.push(`${label} ${q || '/'}: text under 12px: ${small.slice(0, 6).join(' | ')}`);
    }
    // Settings and the account panel too.
    await go(page, '');
    await page.locator(label === 'phone' ? '.m-settings-btn' : '.toolbar .settings-btn').click(); await page.waitForTimeout(500);
    let small = await page.evaluate(SCAN);
    if (small.length) errors.push(`${label} Settings: text under 12px: ${small.slice(0, 6).join(' | ')}`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    await page.locator(label === 'phone' ? '.m-acct' : '.acct-pill').click(); await page.waitForTimeout(500);
    small = await page.evaluate(SCAN);
    if (small.length) errors.push(`${label} account: text under 12px: ${small.slice(0, 6).join(' | ')}`);
    await ctx.close();
  }

  // ---- The Text size setting -----------------------------------------------
  {
    const { ctx, page } = await open(DESK);
    await go(page, '');
    const sizes = () => page.evaluate(() => ({
      root: parseFloat(getComputedStyle(document.documentElement).fontSize),
      brand: parseFloat(getComputedStyle(document.querySelector('.brand-title')).fontSize),
      card: parseFloat(getComputedStyle(document.querySelector('.card .card-title')).fontSize),
      // A control's height: grows with Large, never shrinks at Small.
      gear: document.querySelector('.toolbar .settings-btn').getBoundingClientRect().height,
      attr: document.documentElement.getAttribute('data-text-size'),
    }));
    const base = await sizes();
    out.default = base;
    expect(base.root === 16 && base.attr === null, 'default: the root is not 16px ' + JSON.stringify(base));
    await page.locator('.toolbar .settings-btn').click(); await page.waitForTimeout(500);
    const panel = page.locator('.settings-panel');
    const group = panel.getByRole('radiogroup', { name: 'Text size' });
    expect(await group.getByRole('radio').count() === 3, 'Settings: Text size does not offer three choices (Small, Default, Large)');
    for (const [name, attr, scale] of [['Large', 'large', 1.0625], ['Small', 'small', 0.875]]) {
      await group.getByRole('radio', { name, exact: true }).click(); await page.waitForTimeout(150);
      const s = await sizes();
      out[attr] = s;
      expect(s.attr === attr && Math.abs(s.root - 16 * scale) < 0.01, `${name}: the root is ${s.root}px (attr ${s.attr}), expected ${16 * scale}`);
      expect(Math.abs(s.brand - base.brand * scale) < 0.05, `${name}: the app name is ${s.brand}px, expected ${base.brand * scale}`);
      expect(s.card === base.card, `${name}: a Spatial card's title changed size (${base.card} → ${s.card}px)`);
      const gear = Math.max(base.gear, base.gear * scale);
      expect(Math.abs(s.gear - gear) < 0.6, `${name}: the toolbar gear is ${s.gear}px tall, expected ${gear} (controls grow with Large, never shrink at Small)`);
    }
    await group.getByRole('radio', { name: 'Large', exact: true }).click(); await page.waitForTimeout(150);
    expect(await page.evaluate(() => !('textSize' in window.MCU_PREFS.snapshot())), 'Text size is in the synced preferences');
    await page.reload(); await ready(page);
    const after = await sizes();
    out.afterReload = after;
    expect(after.attr === 'large' && after.root === 17, 'Large did not survive a reload ' + JSON.stringify(after));
    await page.locator('.toolbar .settings-btn').click(); await page.waitForTimeout(500);
    await page.locator('.settings-panel').getByRole('radiogroup', { name: 'Text size' }).getByRole('radio', { name: 'Default' }).click(); await page.waitForTimeout(150);
    const back = await sizes();
    expect(back.attr === null && back.root === 16 && await page.evaluate(() => localStorage.getItem('mcu.textSize.v1')) === null, 'Default did not clear the setting ' + JSON.stringify(back));
    await ctx.close();
  }

  // ---- Phone sizes: body, bottom nav, search ---------------------------------
  {
    const want = { '': { root: 16, body: 14, nav: 12, shown: 13 }, large: { root: 18, body: 15.75, nav: 12.75, shown: 13.81 }, small: { root: 14, body: 12.25, nav: 12, shown: 13 } };
    for (const size of ['', 'large', 'small']) {
      const { ctx, page } = await open(PHONE, size ? `localStorage.setItem('mcu.textSize.v1', '${size}');` : '');
      await go(page, '?view=list');
      const m = await page.evaluate(() => {
        const f = s => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
        const inp = document.querySelector('.m-searchbar input');
        const scale = inp.getBoundingClientRect().height / inp.offsetHeight;
        return { root: f('html'), body: f('.m-ltitle'), nav: f('.m-tab'), font: f('.m-searchbar input'), shown: +(f('.m-searchbar input') * scale).toFixed(2) };
      });
      const w = want[size];
      out['phone ' + (size || 'default')] = m;
      expect(m.root === w.root && m.body === w.body && m.nav === w.nav && Math.abs(m.shown - w.shown) < 0.05, `phone ${size || 'default'}: ${JSON.stringify(m)}, expected ${JSON.stringify(w)}`);
      expect(m.font >= 16, `phone ${size || 'default'}: the search field's font is ${m.font}px; under 16px iPhones zoom in on focus`);
      await ctx.close();
    }
  }

  // ---- The desktop List keeps every cell inside its column -----------------
  // (columns are in rem and drop earlier when the text is bigger)
  for (const lang of ['en', 'pt-BR']) for (const size of ['', 'large']) for (const w of [1024, 1280, 1440]) {
    const { ctx, page } = await open({ viewport: { width: w, height: 700 } }, `localStorage.setItem('mcu.lang.v1', '${lang}');` + (size ? `localStorage.setItem('mcu.textSize.v1', '${size}');` : ''));
    await go(page, '?view=list');
    const r = await page.evaluate(() => {
      const bad = new Set(); const lb = document.querySelector('.dlist').getBoundingClientRect();
      document.querySelectorAll('.dl-row').forEach(row => {
        if (row.getBoundingClientRect().right > lb.right + 1) bad.add('row past the List');
        [...row.children].forEach(c => { if (!c.getClientRects().length) return; const box = c.getBoundingClientRect();
          c.querySelectorAll('*').forEach(e => { if (!e.getClientRects().length || e instanceof SVGElement || getComputedStyle(e).position === 'absolute') return;
            if (e.getBoundingClientRect().right > box.right + 1) bad.add((c.className || '').split(' ')[0]); }); });
      });
      return { bad: [...bad], cols: [...document.querySelector('.dl-head').children].filter(c => c.getClientRects().length).length };
    });
    out[`list ${lang} ${size || 'default'} ${w}`] = r.cols;
    expect(!r.bad.length, `List ${lang} ${size || 'default'} ${w}px: content past its column: ${r.bad.join(', ')}`);
    await ctx.close();
  }
  expect(out['list en default 1280'] === 12 && out['list pt-BR default 1280'] === 12, 'List at 1280px, default size: not all 12 columns');

  // ---- Desktop at 200% zoom: a 720px-wide layout ---------------------------
  for (const lang of ['en', 'pt-BR']) {
    const { ctx, page } = await open({ viewport: { width: 720, height: 450 }, deviceScaleFactor: 2 }, `localStorage.setItem('mcu.lang.v1', '${lang}');`);
    await go(page, '');
    const z = await page.evaluate(() => ({
      hScroll: document.documentElement.scrollWidth > innerWidth,
      off: [...document.querySelectorAll('.m-appbar *, .toolbar *, .m-sort-footer *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && getComputedStyle(e).position !== 'absolute' && (r.right > innerWidth + 0.5 || r.left < -0.5); }).length,
    }));
    out['zoom200 ' + lang] = z;
    expect(!z.hScroll && z.off === 0, `200% zoom (${lang}): ${JSON.stringify(z)}`);
    await ctx.close();
  }

  console.log(JSON.stringify({ ...out, errors }, null, 1));
  await browser.close();
  server.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
