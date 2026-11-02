// Link previews (Notion V4 Tasks, "Share 3/3").
//   - The build wrote dist/og/default.png and, for every title, character and
//     guide, a 1200×630 PNG and a page whose og: tags name it, point at
//     https://redthread.tv and differ from index.html in nothing else.
//   - index.html's own preview is the app-wide card on redthread.tv.
//   - middleware.ts, run here against the built files: /?title=, /?char= and
//     /?guide= get their page; an unknown or malformed id, a plain / and any
//     other parameter pass through (the app-wide card).
//   - The app boots from a preview page exactly as from index.html.
// Every failed expectation lands in `errors`, which is what regress.sh gates on.
const QA_PORT = +process.env.PORT || 8304;
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { pathToFileURL } = require('url');

const S = __dirname;
const ROOT = path.join(S, '..');
const SITE = process.env.SITE ? path.join(S, process.env.SITE) : path.join(ROOT, 'dist');
const PUBLIC = 'https://redthread.tv';
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
const NOWELCOME = "try { if (!localStorage.getItem('mcu.welcome.v1')) localStorage.setItem('mcu.welcome.v1', 'test'); localStorage.setItem('mcu.signInNudge.v1', '2'); } catch (e) {}";

const pngSize = (file) => { const b = fs.readFileSync(file); return b.slice(1, 4).toString() === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null; };
const meta = (html, prop) => { const m = html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`)); return m ? m[1] : null; };
const stripMeta = (html) => html.replace(/<meta (?:property="og:[a-z:]+"|name="description") content="[^"]*"\/>/g, '');

(async () => {
  await new Promise(r => server.listen(QA_PORT, r));
  const errors = [];
  const out = {};
  const expect = (ok, msg) => { if (!ok) errors.push(msg); };

  // ---- The build's files --------------------------------------------------
  const index = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  expect(meta(index, 'og:image') === PUBLIC + '/og/default.png', 'index.html: og:image is ' + meta(index, 'og:image'));
  expect(meta(index, 'og:url') === PUBLIC + '/', 'index.html: og:url is ' + meta(index, 'og:url'));
  const def = path.join(SITE, 'og', 'default.png');
  expect(fs.existsSync(def) && String(pngSize(def)) === '1200,630', 'og/default.png missing or not 1200×630');

  // The catalog, read the way the app's own files publish it.
  const vm = require('vm');
  const { transformWithOxc } = await import(pathToFileURL(path.join(ROOT, 'node_modules', 'vite', 'dist', 'node', 'index.js')).href);
  const win = {};
  for (const f of ['src/data/data.ts', 'src/data/guides.ts']) {
    const { code } = await transformWithOxc(fs.readFileSync(path.join(ROOT, f), 'utf8'), f, { lang: 'ts' });
    vm.runInNewContext(code.replace(/^export \{\};?\s*$/m, ''), { window: win, console });
  }
  const sets = {
    title: win.TITLES.map(t => [t.id, t.title]),
    char: Object.keys(win.CHARACTERS).map(id => [id, win.CHARACTERS[id].name]),
    guide: win.GUIDES.map(g => [g.id, g.name.en]),
  };
  const base = stripMeta(index);
  let checked = 0;
  for (const kind of Object.keys(sets)) {
    for (const [id, name] of sets[kind]) {
      const png = path.join(SITE, 'og', kind, id + '.png');
      const page = path.join(SITE, 'og', kind, id + '.html');
      if (!fs.existsSync(png) || !fs.existsSync(page)) { errors.push(`${kind} ${id}: no preview image or page`); continue; }
      if (String(pngSize(png)) !== '1200,630') errors.push(`${kind} ${id}: image is ${pngSize(png)}, not 1200×630`);
      const html = fs.readFileSync(page, 'utf8');
      const q = `${PUBLIC}/?${kind}=${id}`;
      if (meta(html, 'og:url') !== q) errors.push(`${kind} ${id}: og:url ${meta(html, 'og:url')}`);
      if (meta(html, 'og:image') !== `${PUBLIC}/og/${kind}/${id}.png`) errors.push(`${kind} ${id}: og:image ${meta(html, 'og:image')}`);
      if (!(meta(html, 'og:title') || '').includes(name.replace(/&/g, '&amp;'))) errors.push(`${kind} ${id}: og:title "${meta(html, 'og:title')}" does not name ${name}`);
      if (!meta(html, 'og:description') || !meta(html, 'og:image:alt')) errors.push(`${kind} ${id}: empty description or alt`);
      if (stripMeta(html) !== base) errors.push(`${kind} ${id}: the page differs from index.html beyond its preview tags`);
      checked++;
    }
  }
  out.pagesChecked = checked;

  // ---- The middleware, against the built files ------------------------------
  const { code: mw } = await transformWithOxc(fs.readFileSync(path.join(ROOT, 'middleware.ts'), 'utf8'), 'middleware.ts', { lang: 'ts' });
  const tmp = path.join(require('os').tmpdir(), 'mcu-middleware-' + process.pid + '.mjs');
  fs.writeFileSync(tmp, mw);
  const fetched = [];
  global.fetch = async (u) => {
    const p = new URL(u).pathname;
    fetched.push(p);
    const f = path.join(SITE, p);
    return f.startsWith(SITE) && fs.existsSync(f) ? new Response(fs.readFileSync(f), { status: 200 }) : new Response('', { status: 404 });
  };
  const middleware = (await import(pathToFileURL(tmp).href)).default;
  const config = (await import(pathToFileURL(tmp).href)).config;
  expect(config && config.matcher === '/', 'middleware: matcher is not the home page only');
  const run = async (q) => { const r = await middleware(new Request(PUBLIC + '/' + q)); return r ? { status: r.status, type: r.headers.get('content-type'), html: await r.text() } : null; };
  for (const [q, kind, id] of [['?title=iron-man', 'title', 'iron-man'], ['?char=peggy', 'char', 'peggy'], ['?guide=before-doomsday', 'guide', 'before-doomsday'], ['?title=iron-man&char=tony', 'title', 'iron-man'], ['?sort=phase&title=endgame', 'title', 'endgame']]) {
    const r = await run(q);
    expect(r && r.status === 200 && /text\/html/.test(r.type) && meta(r.html, 'og:image') === `${PUBLIC}/og/${kind}/${id}.png`, `middleware ${q}: did not serve the ${kind} ${id} preview`);
  }
  for (const q of ['', '?sort=phase', '?title=not-a-title', '?title=../index', '?char=%3Cscript%3E', '?guide=']) {
    expect(await run(q) === null, `middleware ${q || '/'}: should pass through, but answered`);
  }
  out.middlewareFetches = fetched.length;
  fs.unlinkSync(tmp);

  // ---- The app boots from a preview page ---------------------------------
  const browser = await chromium.launch();
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(NOWELCOME);
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    const preview = fs.readFileSync(path.join(SITE, 'og', 'title', 'iron-man.html'));
    await page.route('**/*', (r) => {
      const u = r.request().url();
      if (!u.startsWith('http://127.0.0.1')) return r.abort();
      if (new URL(u).pathname === '/' ) return r.fulfill({ status: 200, contentType: 'text/html', body: preview });
      return r.continue();
    });
    await page.goto(URL_BASE + '?title=iron-man');
    await require('./ready').appReady(page, 300);
    expect((await page.locator('#drawer-title').textContent()).trim() === 'Iron Man', 'preview page: the app did not open Iron Man');
    await ctx.close();
  }
  await browser.close();

  console.log(JSON.stringify({ ...out, errors: errors.slice(0, 40), errorCount: errors.length }, null, 1));
  server.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
