// Panning inertia: a drag that ends with speed decelerates instead of stopping
// dead, and anything that reaches for the canvas cancels it immediately.
const QA_PORT = +process.env.PORT || 8212; // regress/quick give each check its own port
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
const settle = page => page.waitForTimeout(2200);
const go = async page => { await page.goto(URL); await settle(page); };
const reload = async page => { await page.reload(); await settle(page); };

const REDUCED = { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' };
const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

(async () => {
  await new Promise(r => server.listen(QA_PORT, r));
  const browser = await chromium.launch();
  const R = {};
  const errors = [];

  const xOf = t => { const m = /translate(?:3d)?\(([-0-9.]+)px/.exec(t || ''); return m ? Number(m[1]) : null; };
  const tf = p => p.evaluate(() => document.querySelector('.canvas').style.transform);

  // A point on the canvas background. Deliberately not the connection-line
  // layer: a press on that <svg> does not start a pan (true before this change
  // too), so a test that grabbed one would measure nothing.
  const empty = p => p.evaluate(() => {
    const vp = document.querySelector('.viewport').getBoundingClientRect();
    for (let y = vp.top + 160; y < vp.bottom - 80; y += 17)
      for (let x = vp.left + 40; x < vp.right - 460; x += 19) {
        const el = document.elementFromPoint(x, y);
        if (el && (el.classList.contains('canvas-bg') || el.classList.contains('canvas') || el.classList.contains('viewport'))) return { x, y };
      }
    return null;
  });
  // Drag fast enough to count as a throw, then let go.
  const flick = async (p, pt, steps = 6) => {
    await p.mouse.move(pt.x, pt.y);
    await p.mouse.down();
    for (let i = 1; i <= steps; i++) await p.mouse.move(pt.x + i * 28, pt.y, { steps: 1 });
    await p.mouse.up();
  };

  // 1. A flick keeps moving after release, then settles.
  {
    const { ctx, page } = await ctxPage(browser, DESKTOP, "localStorage.setItem('mcu.welcome.v1','test');");
    page.on('pageerror', e => errors.push('desktop: ' + e.message));
    await go(page);
    const pt = await empty(page);
    await flick(page, pt);
    const atRelease = xOf(await tf(page));
    await page.waitForTimeout(90);
    const justAfter = xOf(await tf(page));
    await page.waitForTimeout(900);
    const settled = xOf(await tf(page));
    R.flick = { atRelease, justAfter, settled, carriedOn: justAfter > atRelease, stopped: Math.abs(settled - justAfter) < 400 };
    if (!R.flick.carriedOn) errors.push('a flick did not carry on after release');
    if (!R.flick.stopped) errors.push('the glide had not settled after a second');

    // 2. A press during the glide stops it dead.
    const pt2 = await empty(page);
    await flick(page, pt2);
    await page.waitForTimeout(60);
    await page.mouse.move(pt2.x, pt2.y); await page.mouse.down();
    // Let the last frame already in flight flush before reading, otherwise the
    // measurement straddles it and reports movement that already happened.
    await page.waitForTimeout(120);
    const atGrab = xOf(await tf(page));
    await page.waitForTimeout(350);
    const afterGrab = xOf(await tf(page));
    await page.mouse.up();
    R.grabStops = { atGrab, afterGrab, stopped: Math.abs(afterGrab - atGrab) < 2 };
    if (!R.grabStops.stopped) errors.push('a press did not stop the glide (moved ' + (afterGrab - atGrab) + 'px)');

    // 3. A slow release places the canvas rather than throwing it.
    await page.waitForTimeout(600);
    const pt3 = await empty(page);
    await page.mouse.move(pt3.x, pt3.y); await page.mouse.down();
    for (let i = 1; i <= 6; i++) { await page.mouse.move(pt3.x + i * 10, pt3.y, { steps: 1 }); await page.waitForTimeout(60); }
    await page.mouse.up();
    const slowRelease = xOf(await tf(page));
    await page.waitForTimeout(500);
    const slowSettled = xOf(await tf(page));
    R.slowRelease = { slowRelease, slowSettled, stayedPut: Math.abs(slowSettled - slowRelease) < 2 };
    if (!R.slowRelease.stayedPut) errors.push('a slow release still threw the canvas');

    // 4. Drag-versus-click is untouched: a tap still opens a card.
    await page.waitForTimeout(400);
    const card = await page.evaluate(() => {
      const c = [...document.querySelectorAll('.card:not(.ring-hidden)')][2];
      const r = c.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + 30 };
    });
    await page.mouse.move(card.x, card.y); await page.waitForTimeout(250);
    await page.mouse.down(); await page.waitForTimeout(40); await page.mouse.up();
    await page.waitForTimeout(900);
    R.tapStillSelects = await page.evaluate(() => !!document.querySelector('.drawer.open'));
    if (!R.tapStillSelects) errors.push('a tap no longer opens a card');
    await ctx.close();
  }

  // 5. Reduced motion: no inertia at all.
  {
    const { ctx, page } = await ctxPage(browser, REDUCED, "localStorage.setItem('mcu.welcome.v1','test');");
    await go(page);
    const pt = await empty(page);
    await flick(page, pt);
    const atRelease = xOf(await tf(page));
    await page.waitForTimeout(500);
    const after = xOf(await tf(page));
    R.reducedMotion = { atRelease, after, stayedPut: Math.abs(after - atRelease) < 2 };
    if (!R.reducedMotion.stayedPut) errors.push('reduced motion still glided');
    await ctx.close();
  }

  R.errors = errors;
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
