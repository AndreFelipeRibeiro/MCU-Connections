// The placeholder logo (Notion V4 Tasks, "Placeholder new logo").
//   - Every place the mark appears (desktop toolbar, the Welcome/About dialog,
//     phone app bar, startup screen) draws it from the one SVG file: each
//     carries .logo-mark, and all of them show the same mask image.
//   - The mark is painted with the --brand token, in light and in dark, at
//     the sizes the layout was built around (32, 32, 28 and 48px).
//   - The startup screen shows the mark before the app's script has run: the
//     bundle is blocked, and the mark must still be there.
//   - The header reads "Red Thread" in English and Portuguese, and so do the
//     page title and the name iOS offers for a home-screen icon.
// Every failed expectation lands in `errors`, which is what regress.sh gates on.
const QA_PORT = +process.env.PORT || 8299;
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const S = __dirname;
const SITE = process.env.SITE ? path.join(S, process.env.SITE) : path.join(S, '..', 'dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
// qa/serve-site.js wraps this and serves the built tree; the fallback below is
// for running the check by hand without it.
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(SITE, p);
  if (!f.startsWith(SITE) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const URL_BASE = 'http://127.0.0.1:' + QA_PORT + '/';
const DESK = { viewport: { width: 1440, height: 900 } };
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

// What one mark looks like, with the --brand colour resolved the same way.
const read = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const cs = getComputedStyle(el);
  const probe = document.createElement('div');
  probe.style.backgroundColor = 'var(--brand)';
  document.body.appendChild(probe);
  const brand = getComputedStyle(probe).backgroundColor;
  probe.remove();
  const r = el.getBoundingClientRect();
  return {
    cls: el.classList.contains('logo-mark'),
    mask: cs.maskImage && cs.maskImage !== 'none' ? cs.maskImage : (cs.webkitMaskImage || 'none'),
    bg: cs.backgroundColor, brand,
    after: getComputedStyle(el, '::after').content,
    w: Math.round(r.width), h: Math.round(r.height),
    hidden: el.getAttribute('aria-hidden'),
  };
};

(async () => {
  await new Promise(r => server.listen(QA_PORT, r));
  const browser = await chromium.launch();
  const errors = [];
  const out = {};
  const masks = new Set();
  const expect = (ok, msg) => { if (!ok) errors.push(msg); };
  const checkMark = (label, m, size) => {
    out[label] = m;
    if (!m) return errors.push(label + ': no mark on the page');
    expect(m.cls, label + ': mark lacks .logo-mark');
    expect(/svg/.test(m.mask), label + ': mark has no SVG mask (' + m.mask.slice(0, 60) + ')');
    expect(m.bg === m.brand && m.brand !== 'rgba(0, 0, 0, 0)', label + ': painted ' + m.bg + ', --brand is ' + m.brand);
    expect(m.after === 'none' || m.after === 'normal', label + ': old ::after cut-out still drawn');
    expect(m.w === size && m.h === size, label + ': ' + m.w + 'x' + m.h + ', expected ' + size);
    expect(m.hidden === 'true', label + ': mark is not aria-hidden');
    masks.add(m.mask);
  };
  const open = async (opts, theme, lang, { welcome = false, block = false } = {}) => {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(`try {
      localStorage.setItem('mcu.theme', '${theme}');
      ${lang ? `localStorage.setItem('mcu.lang.v1', '${lang}');` : ''}
      ${welcome ? '' : "localStorage.setItem('mcu.welcome.v1', 'test'); localStorage.setItem('mcu.signInNudge.v1', '2');"}
    } catch (e) {}`);
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(theme + ': pageerror: ' + e.message));
    await page.route('**/*', r => {
      const u = r.request().url();
      if (!u.startsWith('http://127.0.0.1')) return r.abort();
      if (block && /\/assets\/.*\.js(\?|$)/.test(u)) return r.abort();
      return r.continue();
    });
    return { ctx, page };
  };

  const brands = {};
  for (const theme of ['light', 'dark']) {
    // Desktop: the toolbar, and the Welcome dialog a first visit opens.
    {
      const { ctx, page } = await open(DESK, theme, null, { welcome: true });
      await page.goto(URL_BASE);
      await require('./ready').appReady(page, 400);
      expect(await page.evaluate(() => document.documentElement.classList.contains('dark')) === (theme === 'dark'), theme + ': theme class not applied');
      checkMark(theme + ' toolbar', await page.evaluate(read, '.toolbar .brand-mark'), 32);
      await page.waitForSelector('.about-head .brand-mark', { timeout: 4000 }).catch(() => {});
      checkMark(theme + ' welcome', await page.evaluate(read, '.about-head .brand-mark'), 32);
      brands[theme] = out[theme + ' toolbar'] && out[theme + ' toolbar'].brand;
      await ctx.close();
    }
    // Phone app bar.
    {
      const { ctx, page } = await open(PHONE, theme, null);
      await page.goto(URL_BASE);
      await require('./ready').appReady(page, 400);
      checkMark(theme + ' phone', await page.evaluate(read, '.m-brandrow .m-mark'), 28);
      await ctx.close();
    }
    // Startup screen, with the bundle blocked so the app never replaces it.
    {
      const { ctx, page } = await open(PHONE, theme, null, { block: true });
      await page.goto(URL_BASE, { waitUntil: 'load' });
      await page.waitForTimeout(300);
      checkMark(theme + ' startup', await page.evaluate(read, '#mcu-boot .boot-mark'), 48);
      await ctx.close();
    }
  }
  // The page title and the home-screen name, straight from the built HTML.
  {
    const { ctx, page } = await open(DESK, 'dark', null, { block: true });
    await page.goto(URL_BASE, { waitUntil: 'load' });
    out.title = await page.title();
    out.homeName = await page.evaluate(() => (document.querySelector('meta[name="apple-mobile-web-app-title"]') || {}).content);
    expect(out.title === 'Red Thread — Marvel movies, series and character connections', 'page title is "' + out.title + '"');
    expect(out.homeName === 'Red Thread', 'home-screen name is "' + out.homeName + '"');
    await ctx.close();
  }
  expect(masks.size === 1, 'the marks use ' + masks.size + ' different images, expected the one file');
  expect(brands.light && brands.dark && brands.light !== brands.dark, '--brand does not change with the theme: ' + JSON.stringify(brands));

  // The name beside the mark.
  for (const [lang, opts] of [['en-US', DESK], ['pt-BR', DESK], ['en-US', PHONE], ['pt-BR', PHONE]]) {
    const { ctx, page } = await open(opts, 'dark', lang);
    await page.goto(URL_BASE);
    await require('./ready').appReady(page, 400);
    const h1 = await page.evaluate(() => [...document.querySelectorAll('h1')].filter(h => h.offsetParent).map(h => h.textContent.trim()));
    out['h1 ' + lang + (opts === PHONE ? ' phone' : '')] = h1;
    expect(h1.length === 1 && h1[0] === 'Red Thread', lang + (opts === PHONE ? ' phone' : ' desktop') + ': header reads ' + JSON.stringify(h1));
    await ctx.close();
  }

  console.log(JSON.stringify({ ...out, masks: masks.size, errors }, null, 1));
  await browser.close();
  server.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
