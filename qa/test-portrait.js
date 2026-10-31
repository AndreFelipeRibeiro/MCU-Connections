// A recast cast row must never show the default performer's face. External
// images are blocked in these runs, so this asserts on the resolver that
// chooses the URL rather than on rendered pixels.
const QA_PORT = +process.env.PORT || 8215; // regress/quick give each check its own port
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
const settle = page => require('./ready').appReady(page);
const go = async page => { await page.goto(URL); await settle(page); };
const reload = async page => { await page.reload(); await settle(page); };

(async () => {
  await new Promise(r => server.listen(QA_PORT, r));
  const browser = await chromium.launch();
  const R = {}; const errors = [];
  const { page } = await ctxPage(browser, DESKTOP, "localStorage.setItem('mcu.welcome.v1','test');");
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await go(page);

  R.cases = await page.evaluate(() => {
    const T = id => window.TITLES.find(t => t.id === id);
    const A = window.MEDIA.actors;
    const has = (url, path) => !!url && !!path && url.indexOf(path) !== -1;
    const P = window.MEDIA.performers || {};
    const cast = (tid, ch) => window.castPortrait(T(tid), ch);
    return {
      // A part that changed hands shows the credited performer, or nobody.
      ironManRhodes: { isHoward: has(cast('iron-man', 'rhodey'), P['Terrence Howard']), isCheadle: has(cast('iron-man', 'rhodey'), A.rhodey) },
      hulkBanner: { isNorton: has(cast('incredible-hulk', 'bruce'), P['Edward Norton']), isRuffalo: has(cast('incredible-hulk', 'bruce'), A.bruce) },
      hulkRoss: { isHurt: has(cast('incredible-hulk', 'ross'), P['William Hurt']), isFord: has(cast('incredible-hulk', 'ross'), A.ross) },
      spideyRoss: { isWillingham: has(cast('friendly-spidey', 'ross'), P['Travis Willingham']), isFord: has(cast('friendly-spidey', 'ross'), A.ross) },
      // No portrait is known for Mike McGill, so What If…? shows none at all
      // rather than Harrison Ford's.
      whatIfRoss: { url: cast('what-if', 'ross'), isFord: has(cast('what-if', 'ross'), A.ross) },
      // Unchanged where the default is the right person.
      ironMan2Rhodes: { ok: has(cast('iron-man-2', 'rhodey'), A.rhodey) },
      avengersBanner: { ok: has(cast('avengers', 'bruce'), A.bruce) },
      braveNewWorldRoss: { ok: has(cast('cap-brave', 'ross'), A.ross) },
      // A pinned performer keeps their face when the character's portrait is them.
      majorsPin: { ok: has(window.performerPortrait('Jonathan Majors', 'kang'), A.kang) },
      howardPin: { isHoward: has(window.performerPortrait('Terrence Howard', 'rhodey'), P['Terrence Howard']), isCheadle: has(window.performerPortrait('Terrence Howard', 'rhodey'), A.rhodey) },
    };
  });

  const c = R.cases;
  if (c.ironManRhodes.isCheadle) errors.push('Iron Man shows Don Cheadle under Terrence Howard');
  if (!c.ironManRhodes.isHoward) errors.push('Iron Man does not show Terrence Howard');
  if (c.hulkBanner.isRuffalo) errors.push('The Incredible Hulk shows Mark Ruffalo under Edward Norton');
  if (!c.hulkBanner.isNorton) errors.push('The Incredible Hulk does not show Edward Norton');
  if (c.hulkRoss.isFord) errors.push('The Incredible Hulk shows Harrison Ford under William Hurt');
  if (!c.hulkRoss.isHurt) errors.push('The Incredible Hulk does not show William Hurt');
  if (c.spideyRoss.isFord) errors.push('Friendly Neighborhood Spider-Man shows Harrison Ford');
  if (!c.spideyRoss.isWillingham) errors.push('Friendly Neighborhood Spider-Man does not show Travis Willingham');
  if (c.whatIfRoss.isFord) errors.push('What If…? shows Harrison Ford under Mike McGill');
  if (c.whatIfRoss.url !== null) errors.push('What If…? resolved a portrait for Mike McGill, who has none');
  if (c.howardPin.isCheadle) errors.push('a Terrence Howard pin shows Don Cheadle');
  if (!c.howardPin.isHoward) errors.push('a Terrence Howard pin does not show his own portrait');
  if (!c.ironMan2Rhodes.ok) errors.push('Iron Man 2 lost Don Cheadle, who is correct there');
  if (!c.avengersBanner.ok) errors.push('Avengers lost Mark Ruffalo, who is correct there');
  if (!c.braveNewWorldRoss.ok) errors.push('Brave New World lost Harrison Ford, who is correct there');
  if (!c.majorsPin.ok) errors.push('a Jonathan Majors pin lost his portrait');

  await page.locator('.card', { hasText: 'Iron Man' }).first().click();
  await page.waitForTimeout(1200);
  R.ironManRow = await page.evaluate(() => {
    const row = [...document.querySelectorAll('.cast-row')].find(r => r.dataset.char === 'rhodey');
    if (!row) return null;
    return { name: row.querySelector('.actor-name').textContent.trim(), initials: (row.querySelector('.portrait span') || {}).textContent };
  });
  if (!R.ironManRow || R.ironManRow.name !== 'Terrence Howard') errors.push('the Iron Man cast row does not read Terrence Howard');

  R.errors = errors;
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
