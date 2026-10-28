// Spatial touch input on a wide screen: a touch laptop or a landscape tablet
// takes the desktop layout, and must still pan and pinch by finger while mouse
// drag, wheel and control taps keep working.
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
const URL = 'http://127.0.0.1:8200/';
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

// Wide screen that can also be touched (a touch laptop, or a tablet in
// landscape): the layout stays desktop while the canvas still answers touch.
const WIDE_TOUCH = { viewport: { width: 1440, height: 900 }, hasTouch: true };

// React listens at the root, so real TouchEvents dispatched on the element
// under the point reach the viewport's handlers the way a finger would.
const TOUCH_HELPERS = `
  window.__t = (type, pts) => {
    const first = document.elementFromPoint(pts[0].x, pts[0].y) || document.body;
    const touches = pts.map((p, i) => new Touch({
      identifier: i, target: first, clientX: p.x, clientY: p.y, pageX: p.x, pageY: p.y,
    }));
    first.dispatchEvent(new TouchEvent(type, {
      touches: type === 'touchend' ? [] : touches,
      targetTouches: type === 'touchend' ? [] : touches,
      changedTouches: touches, bubbles: true, cancelable: true,
    }));
  };
`;

(async () => {
  await new Promise(r => server.listen(8200, r));
  const browser = await chromium.launch();
  const R = {};
  const { page, errors } = await ctxPage(browser, WIDE_TOUCH, "localStorage.setItem('mcu.welcome.v1','test');");
  await go(page);
  await page.evaluate(TOUCH_HELPERS);

  const tf = () => page.evaluate(() => document.querySelector('.canvas').style.transform);
  const scaleOf = t => { const m = /scale\(([-0-9.]+)\)/.exec(t || ''); return m ? Number(m[1]) : null; };
  // The canvas uses translate3d at >=30% zoom and translate below it.
  const xOf = t => { const m = /translate(?:3d)?\(([-0-9.]+)px/.exec(t || ''); return m ? Number(m[1]) : null; };

  // The device reports touch, so the canvas must take touch input; the window
  // is wide, so the layout must still be the desktop one.
  R.maxTouchPoints = await page.evaluate(() => navigator.maxTouchPoints);
  R.coarseAvailable = await page.evaluate(() => matchMedia('(any-pointer: coarse)').matches);
  R.viewportRole = await page.evaluate(() => document.querySelector('.viewport').getAttribute('role'));
  R.desktopLayout = R.viewportRole === 'main';

  // An empty point on the background, away from the cards.
  const empty = () => page.evaluate(() => {
    const vp = document.querySelector('.viewport').getBoundingClientRect();
    for (let y = vp.top + 140; y < vp.bottom - 60; y += 23) for (let x = vp.left + 40; x < vp.right - 460; x += 29) {
      const el = document.elementFromPoint(x, y);
      if (el && (el.classList.contains('canvas-bg') || el.classList.contains('viewport') || el.classList.contains('canvas') || el.tagName === 'svg')) return { x, y };
    }
    return null;
  });
  const p = await empty();
  R.emptyPoint = p;

  // 1. One finger pans. Past the 6px threshold the canvas has to follow.
  const beforePan = await tf();
  await page.evaluate(([pt]) => {
    window.__t('touchstart', [pt]);
    window.__t('touchmove', [{ x: pt.x + 40, y: pt.y + 18 }]);
    window.__t('touchmove', [{ x: pt.x + 90, y: pt.y + 40 }]);
    window.__t('touchend', [{ x: pt.x + 90, y: pt.y + 40 }]);
  }, [p]);
  await page.waitForTimeout(400);
  const afterPan = await tf();
  R.touchPan = { before: xOf(beforePan), after: xOf(afterPan), moved: beforePan !== afterPan };

  // 2. Two fingers pinch the zoom.
  const beforePinch = await tf();
  await page.evaluate(([pt]) => {
    const a = { x: pt.x - 50, y: pt.y }, b = { x: pt.x + 50, y: pt.y };
    window.__t('touchstart', [a, b]);
    window.__t('touchmove', [{ x: pt.x - 110, y: pt.y }, { x: pt.x + 110, y: pt.y }]);
    window.__t('touchend', [{ x: pt.x - 110, y: pt.y }, { x: pt.x + 110, y: pt.y }]);
  }, [p]);
  await page.waitForTimeout(400);
  const afterPinch = await tf();
  R.pinch = { before: scaleOf(beforePinch), after: scaleOf(afterPinch), grew: scaleOf(afterPinch) > scaleOf(beforePinch) };

  // 3. Mouse drag still pans. Past the window that swallows the mouse events
  // synthesized after a tap, a real mouse has to work normally again.
  await page.waitForTimeout(600);
  const p2 = await empty();
  const beforeDrag = await tf();
  await page.mouse.move(p2.x, p2.y); await page.mouse.down();
  await page.mouse.move(p2.x + 70, p2.y + 25, { steps: 6 });
  await page.mouse.up(); await page.waitForTimeout(350);
  const afterDrag = await tf();
  R.mouseDrag = { dx: Math.round((xOf(afterDrag) - xOf(beforeDrag)) * 10) / 10, moved: beforeDrag !== afterDrag };

  // 4. Wheel still zooms. The pinch above leaves the canvas at the 2x ceiling,
  // so zoom out: zooming in further could not show a change.
  const beforeWheel = await tf();
  await page.mouse.move(p2.x, p2.y); await page.mouse.wheel(0, 240);
  await page.waitForTimeout(350);
  const afterWheel = await tf();
  R.wheel = { before: scaleOf(beforeWheel), after: scaleOf(afterWheel), shrank: scaleOf(afterWheel) < scaleOf(beforeWheel) };

  // 5. Control taps still land: a card opens its details drawer.
  await page.locator('.card').nth(3).click();
  await page.waitForTimeout(900);
  R.cardOpensDrawer = await page.evaluate(() => !!document.querySelector('.drawer.open'));

  const PASSIVE = 'Unable to preventDefault inside passive event listener';
  R.knownWarning = errors.filter(e => e.includes(PASSIVE)).length;
  R.errors = errors.filter(e => !e.includes(PASSIVE));
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
