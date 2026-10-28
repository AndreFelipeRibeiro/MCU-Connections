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
const URL = 'http://127.0.0.1:8188/';
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
  await new Promise(r => server.listen(8188, r));
  const browser = await chromium.launch();
  const R = {};
  const sheets = p => p.locator('.m-sheet').count();
  const back = async p => { await p.evaluate(() => history.back()); await p.waitForTimeout(500); };
  const fwd = async p => { await p.evaluate(() => history.forward()); await p.waitForTimeout(500); };
  const info = async p => p.evaluate(() => ({ url: location.href, len: history.length, st: history.state && history.state.mcuSheet ? 'sheet' : 'base' }));
  // Phone, welcome already seen; arrive from a previous page so leaving is visible.
  const { ctx, page, errors } = await ctxPage(browser, MOBILE, "localStorage.setItem('mcu.welcome.v1','test');");
  await page.goto('data:text/html,<p>previous page</p>');
  await go(page);
  const base = await info(page);
  // 1. Details: Back closes it and stays in the app.
  await page.locator('.m-lrow-open').first().click(); await page.waitForTimeout(500);
  R.detailsOpen = await sheets(page);
  await back(page);
  R.afterBack = { sheets: await sheets(page), ...(await info(page)) };
  // 2. Forward onto the old entry: nothing reopens, no error.
  await fwd(page);
  R.afterForward = { sheets: await sheets(page), ...(await info(page)) };
  // 3. Close with × five times: history does not grow.
  for (let i = 0; i < 5; i++) {
    await page.locator('.m-lrow-open').nth(i).click(); await page.waitForTimeout(400);
    await page.locator('.m-sheet-x').click(); await page.waitForTimeout(400);
  }
  R.afterXLoop = { sheets: await sheets(page), ...(await info(page)) };
  // 4. Escape and swipe-free close via scrim also step back.
  await page.locator('.m-fpill').click(); await page.waitForTimeout(400);
  R.filtersOpen = await sheets(page);
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  R.afterEsc = { sheets: await sheets(page), ...(await info(page)) };
  // 5. Filters → Back.
  await page.locator('.m-fpill').click(); await page.waitForTimeout(400);
  await back(page);
  R.filtersBack = { sheets: await sheets(page), ...(await info(page)) };
  // 6. Account → About hands off one entry; Back closes About; next Back leaves.
  await page.locator('.m-acct').click(); await page.waitForTimeout(500);
  R.acctOpen = await sheets(page);
  await page.locator('.acct-foot-link').first().click(); await page.waitForTimeout(600);
  R.aboutOpen = { sheets: await sheets(page), about: await page.locator('.m-sheet .about-body, .m-sheet [class*="about"]').count(), ...(await info(page)) };
  await back(page);
  R.aboutBack = { sheets: await sheets(page), ...(await info(page)) };
  await page.evaluate(() => history.back()); await page.waitForTimeout(1200);
  R.leftApp = await page.evaluate(() => location.href.slice(0, 30));
  R.base = base; R.errors = errors;
  await ctx.close();
  // 7. First visit: Back closes the welcome sheet.
  const w = await ctxPage(browser, MOBILE);
  await w.page.goto('data:text/html,<p>previous</p>');
  await go(w.page);
  R.welcomeOpen = await sheets(w.page);
  await back(w.page);
  R.welcomeBack = { sheets: await sheets(w.page), ...(await info(w.page)) };
  R.welcomeErrors = w.errors;
  // 8. Desktop is unaffected.
  const d = await ctxPage(browser, DESKTOP, "localStorage.setItem('mcu.welcome.v1','test');");
  await go(d.page);
  R.desktop = { ...(await info(d.page)), errors: d.errors };
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
