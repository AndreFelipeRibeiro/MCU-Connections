// One-minute smoke check against a deployed site: staging after each push,
// production after each merge (V3 Tasks, "Make testing faster").
//
//   SITE_URL=https://mcu-connections-git-version-30-afr-bfcd.vercel.app/ node qa/smoke.js
//   SITE_URL=https://mcu-connections.vercel.app/ node qa/smoke.js
//
// Loads the real deployment (real CDN libraries, real Babel in the page) as a
// returning visitor on desktop and phone: the page starts with no console or
// page errors, the first titles appear, desktop Spatial and List both open, a
// title's details open and close, and the phone List opens a details sheet.
// Prints JSON; `errors` lists every failure and the exit code is non-zero.
// It replaces the manual "does the deploy work" look, not a phone check.
const { chromium } = require('playwright');

const SITE_URL = process.env.SITE_URL;
if (!SITE_URL) { console.error('Set SITE_URL, for example SITE_URL=https://mcu-connections.vercel.app/'); process.exit(2); }
const base = SITE_URL.endsWith('/') ? SITE_URL : SITE_URL + '/';
const DESK = { viewport: { width: 1440, height: 900 } };
const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

(async () => {
  const browser = await chromium.launch();
  const out = { site: base };
  const errors = [];
  const expect = (ok, msg) => { if (!ok) errors.push(msg); };
  const open = async (opts) => {
    const ctx = await browser.newContext(opts);
    // A returning visitor with no reminders, so nothing covers the page.
    await ctx.addInitScript("try { localStorage.setItem('mcu.welcome.v1','smoke'); localStorage.setItem('mcu.signInNudge.v1','2'); localStorage.setItem('mcu.promoted.v1', JSON.stringify((window.GUIDES || []).map(g => g.id).concat(['before-doomsday','infinity-saga','animated']))); } catch (e) {}");
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 200)));
    return { ctx, page, errs };
  };
  const t0 = Date.now();
  try {
    // ---- Desktop: Spatial, details, List ----------------------------------
    let { ctx, page, errs } = await open(DESK);
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.card', { timeout: 30000 });
    out.desktopCards = await page.locator('.card').count();
    expect(out.desktopCards > 40, `desktop Spatial shows ${out.desktopCards} cards`);
    await page.goto(base + '?view=list', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dl-row[data-row-id] .dl-open', { timeout: 30000 });
    out.listRows = await page.locator('.dl-row[data-row-id]').count();
    expect(out.listRows > 40, `desktop List shows ${out.listRows} rows`);
    await page.locator('.dl-row[data-row-id] .dl-open').first().click();
    await page.waitForSelector('.drawer.open #drawer-title', { timeout: 10000 }).catch(() => {});
    out.details = await page.locator('.drawer.open #drawer-title').textContent().catch(() => null);
    expect(!!out.details, 'desktop details did not open');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    expect(!(await page.locator('.drawer.open').count()), 'desktop details did not close with Escape');
    out.desktopErrors = errs;
    errs.forEach(e => errors.push('desktop: ' + e));
    await ctx.close();

    // ---- Phone: List and a details sheet ----------------------------------
    ({ ctx, page, errs } = await open(PHONE));
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.m-lrow .m-lrow-open, .m-card .m-card-open', { timeout: 30000 });
    out.phoneRows = await page.locator('.m-lrow, .m-card').count();
    expect(out.phoneRows > 20, `phone list shows ${out.phoneRows} titles`);
    await page.locator('.m-lrow .m-lrow-open, .m-card .m-card-open').first().tap();
    await page.waitForSelector('.m-sheet', { timeout: 10000 }).catch(() => {});
    expect(await page.locator('.m-sheet').count() > 0, 'phone details sheet did not open');
    out.phoneErrors = errs;
    errs.forEach(e => errors.push('phone: ' + e));
    await ctx.close();
  } catch (e) {
    errors.push('smoke check stopped: ' + e.message.slice(0, 300));
  }
  out.seconds = Math.round((Date.now() - t0) / 1000);
  out.errors = errors;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
  process.exitCode = errors.length ? 1 : 0;
})();
