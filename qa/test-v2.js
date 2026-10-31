const QA_PORT = +process.env.PORT || 8212; // regress/quick give each check its own port
const base = require('fs').readFileSync(__dirname + '/test-jit2-env.js', 'utf8');
const head = base.slice(0, base.indexOf('(async () => {'));
eval(head + `
const ART = "Object.defineProperty(window, 'MEDIA', { configurable: true, set(v) { v.posters = {}; this.__m = v; }, get() { return this.__m; } });";
// Count running flip animations shortly after an action, and whether a leaving layer exists (and where).
const probe = (page) => page.evaluate(() => new Promise(res => requestAnimationFrame(() => setTimeout(() => {
  const anims = document.getAnimations().filter(a => a.playState === 'running');
  const flips = anims.filter(a => a.id === 'm-flip').length;
  const layer = document.querySelector('.m-flip-layer');
  let ghostCols = null, liveCols = null;
  if (layer && layer.firstElementChild && layer.firstElementChild.classList.contains('dl-row')) {
    ghostCols = getComputedStyle(layer.firstElementChild).gridTemplateColumns.split(' ').length;
    const live = document.querySelector('.dl-table .dl-row:not(.dl-head)');
    liveCols = live && getComputedStyle(live).gridTemplateColumns.split(' ').length;
  }
  res({ flips, ghosts: layer ? layer.childElementCount : 0, layerIn: layer ? layer.parentElement.className.split(' ')[0] : null, ghostCols, liveCols });
}, 60))));
const settled = (page) => page.evaluate(() => ({ layer: !!document.querySelector('.m-flip-layer'), running: document.getAnimations().filter(a => a.playState === 'running' && a.id === 'm-flip').length }));
(async () => {
  await new Promise(r => server.listen(QA_PORT, r));
  const browser = await chromium.launch();
  const NOWELCOME = "try { localStorage.setItem('mcu.welcome.v1', 'test'); } catch (e) {}";
  const out = {};
  let { ctx, page, errors } = await ctxPage(browser, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, NOWELCOME + ART + SEED);
  await page.goto('http://127.0.0.1:' + QA_PORT + '/'); await require('./ready').appReady(page);
  // pill padding: right gap between text end and pill edge, per label
  const pads = () => page.evaluate(() => [...document.querySelectorAll('.connection-labels g')].map(g => { const r = g.querySelectorAll('rect')[1].getBBox(), t = g.querySelector('text').getBBox();
    return { name: g.querySelector('text').textContent, right: Math.round(r.x + r.width - (t.x + t.width)), left: Math.round(t.x - r.x) }; }));
  await page.locator('.card', { hasText: 'Iron Man 2' }).first().hover(); await page.waitForTimeout(500);
  out.pads1 = await pads();
  await page.screenshot({ path: path.join(S, 'shots', 'v2-hover-im2.png'), clip: { x: 0, y: 121, width: 1440, height: 560 } });
  await page.locator('.card', { hasText: 'Thor' }).first().hover(); await page.waitForTimeout(500);
  out.pads2 = await pads();
  await page.screenshot({ path: path.join(S, 'shots', 'v2-hover-thor.png'), clip: { x: 0, y: 121, width: 1440, height: 640 } });
  await page.mouse.move(5, 500); await page.waitForTimeout(300);
  // pair view: Fantastic Four <-> Doomsday
  await page.evaluate(() => { const p = document.querySelector('path[data-a="fantastic-four"][data-b="doomsday"]'); p.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await page.waitForTimeout(1200);
  out.pair = await page.evaluate(() => { const a = document.querySelector('.card[data-id="fantastic-four"]').getBoundingClientRect(), b = document.querySelector('.card[data-id="doomsday"]').getBoundingClientRect();
    return { sameRow: Math.abs(a.top - b.top) < 2, gap: Math.round(b.left - a.right), visible: a.left > 0 && b.right < innerWidth && a.top > 121 && a.bottom < innerHeight,
      dimmed: document.querySelectorAll('.card.dimmed').length, labels: [...document.querySelectorAll('.connection-labels text')].map(t => t.textContent) }; });
  await page.screenshot({ path: path.join(S, 'shots', 'v2-pair.png') });
  await page.mouse.move(1430, 130); await page.waitForTimeout(300);
  await page.keyboard.press('Escape'); await page.waitForTimeout(900);
  out.afterEsc = await page.evaluate(() => { const a = document.querySelector('.card[data-id="fantastic-four"]').getBoundingClientRect(), b = document.querySelector('.card[data-id="doomsday"]').getBoundingClientRect();
    return { dimmed: document.querySelectorAll('.card.dimmed').length, sameRow: Math.abs(a.top - b.top) < 2, gap: Math.round(b.left - a.right), hovered: !!document.querySelector('.line-tooltip') }; });
  // pair by real click on a visible line, then background click clears
  await page.evaluate(() => { const p = document.querySelector('path[data-a="iron-man"][data-b="incredible-hulk"]'); p.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await page.waitForTimeout(1200); out.pair2 = await page.evaluate(() => document.querySelectorAll('.card.dimmed').length);
  await page.mouse.click(700, 860); await page.waitForTimeout(600); out.afterBg = await page.evaluate(() => document.querySelectorAll('.card.dimmed').length);
  out.errors = errors;
  console.log(JSON.stringify(out));
  await browser.close(); server.close();
})();
`);
