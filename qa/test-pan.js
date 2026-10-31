// Checks saved display preferences (mcu.prefs.v1) on mobile and desktop.
const QA_PORT = +process.env.PORT || 8187; // regress/quick give each check its own port
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
const SEED = "localStorage.setItem('mcu.collection.v1', JSON.stringify({version:1, states:{'iron-man':'seen','incredible-hulk':'seen','iron-man-2':'seen','thor':'seen','cap-first-avenger':'seen','avengers':'seen','iron-man-3':'seen','thor-dark-world':'seen','cap-winter-soldier':'seen','gotg':'seen','aou':'seen','civil-war':'seen','loki-s1':'watchlist','shang-chi':'watchlist','thunderbolts':'watchlist','agatha':'watchlist'}}));";
(async () => {
  await new Promise(r => server.listen(QA_PORT, r));
  const browser = await chromium.launch();
  const out = {};
  for (const [label, scaleFactor] of [['dpr3', 3]]) {
    const init = "localStorage.setItem('mcu.welcome.v1','test');" + SEED + "localStorage.setItem('mcu.prefs.v1', JSON.stringify({version:1, viewMode:'spatial'}));";
    const { ctx, page, errors } = await ctxPage(browser, { ...MOBILE, deviceScaleFactor: scaleFactor }, init);
    await go(page);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('DOM.enable'); await cdp.send('DOM.getDocument'); await cdp.send('LayerTree.enable');
    let layers = [];
    cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) layers = e.layers; });
    const snap = async (tag) => {
      await page.waitForTimeout(400);
      const drawn = layers.filter(l => l.drawsContent);
      const area = drawn.reduce((a, l) => a + l.width * l.height, 0);
      const big = drawn.filter(l => l.width * l.height > 1e6).map(l => l.width + 'x' + l.height);
      const sc = await page.evaluate(() => { const c = document.querySelector('.canvas'); return c ? c.style.transform : null; });
      const ids = drawn.filter(l => l.backendNodeId).map(l => l.backendNodeId);
      const desc = {};
      for (const l of drawn) {
        let k = 'none';
        if (l.backendNodeId) { try { const r = await cdp.send('DOM.resolveNode', { backendNodeId: l.backendNodeId }); const d = await cdp.send('Runtime.callFunctionOn', { objectId: r.object.objectId, functionDeclaration: 'function(){ const e=this.nodeType===1?this:this.parentElement; return e ? (e.tagName.toLowerCase()+"."+(typeof e.className==="string"?e.className:(e.getAttribute("class")||"")).split(" ").slice(0,2).join(".")) : "?"; }', returnByValue: true }); k = d.result.value; } catch (e) { k = 'err'; } }
        const key = k; desc[key] = desc[key] || { n: 0, mpx: 0 }; desc[key].n++; desc[key].mpx += l.width * l.height / 1e6;
      }
      Object.values(desc).forEach(d => d.mpx = +d.mpx.toFixed(2));
      if (process.env.BY) out[label + ':' + tag + ':by'] = desc;
      out[label + ':' + tag] = { layers: drawn.length, areaMpx: +(area / 1e6).toFixed(1), big, transform: sc, cards: await page.locator('.card').count() };
    };
    
    const fps = async (tag) => {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.evaluate(() => { window.__f = 0; const t0 = performance.now(); window.__t0 = t0; (function loop(){ window.__f++; if (performance.now() - t0 < 1500) requestAnimationFrame(loop); })(); });
      for (let k = 0; k < 4; k++) {
        const dir = k % 2 ? -1 : 1;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 420 }] });
        for (let s = 1; s <= 10; s++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195 + dir * s * 14, y: 420 }] }); }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      await page.waitForTimeout(1600);
      out[label + ':' + tag + ':fps'] = await page.evaluate(() => Math.round(window.__f / 1.5));
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    };
    await snap('start'); await fps('start');
    // Zoom out to the floor with the − button.
    for (let i = 0; i < 40; i++) {
      const b = page.locator('.zoom-btn[aria-label]').first();
      if (await b.isDisabled()) break;
      // The phone zoom control rests hidden and shows while it holds focus.
      await b.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(30);
    }
    await snap('min'); await fps('min');
    // Pan sideways with touch, several strokes.
    for (let k = 0; k < 6; k++) {
      const dir = k % 2 ? -1 : 1;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 420 }] });
      for (let s = 1; s <= 12; s++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195 + dir * s * 14, y: 420 + s * 3 }] });
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }

    out[label + ':errors'] = errors;
    out[label + ':alive'] = await page.evaluate(() => !!document.querySelector('.canvas'));
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close(); server.close();
})();
