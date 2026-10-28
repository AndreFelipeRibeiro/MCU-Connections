const base = require('fs').readFileSync(__dirname + '/test-jit2-env.js', 'utf8');
const head = base.slice(0, base.indexOf('(async () => {'));
eval(head + `
const ART = "Object.defineProperty(window, 'MEDIA', { configurable: true, set(v) { v.posters = {}; this.__m = v; }, get() { return this.__m; } });";
const NOWELCOME = "try { localStorage.setItem('mcu.welcome.v1', 'test'); } catch (e) {}";
const PORT = +process.env.PORT || 8286;
const WATCH = "(() => { const sel = window.__sel; const mo = new MutationObserver(() => { if (!window.__first && document.querySelector(sel)) { window.__first = performance.now(); } }); document.addEventListener('DOMContentLoaded', () => { window.__dcl = performance.now(); mo.observe(document.body, { childList: true, subtree: true }); }); })();";
(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch();
  const out = [];
  for (const [name, opts, cpu, sel] of [['desktop', { viewport: { width: 1440, height: 900 } }, 1, '.canvas .card'], ['phone 4x CPU', { viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true }, 4, '.m-lrow']]) {
    const rs = [];
    for (let i = 0; i < 3; i++) {
      const { ctx, page } = await ctxPage(browser, opts, NOWELCOME + ART + "window.__sel = '" + sel + "';" + WATCH + "localStorage.setItem('mcu.prefs.v1', '" + JSON.stringify({version:1, viewMode:'list', desktopView:'spatial', sort:'release'}) + "');");
      const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
      await page.goto('http://127.0.0.1:' + PORT + '/'); await page.waitForSelector(sel, { timeout: 90000 }); await page.waitForTimeout(300);
      rs.push(await page.evaluate(() => ({ dcl: Math.round(window.__dcl), first: Math.round(window.__first), scriptsDone: Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventStart) })));
      await ctx.close();
    }
    out.push(name + ' ' + JSON.stringify(rs));
  }
  console.log(out.join('\\n'));
  await browser.close(); server.close();
})();
`);
