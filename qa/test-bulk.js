const QA_PORT = +process.env.PORT || 8222; // regress/quick give each check its own port
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

// Bulk marking: desktop List selection and its bar, phone section headers,
// the confirmation, Undo, and the rules every bulk action follows — exactly
// the right titles (never an unreleased one marked seen), one guest-storage
// write and one announcement per action, and Undo restoring each title as it
// was, a watchlist that a seen mark replaced included.
const KEY = 'mcu.collection.v1';
const seed = (states) => `localStorage.setItem('mcu.welcome.v1','test');localStorage.setItem('mcu.signInNudge.v1','9');` +
  `localStorage.setItem('${KEY}', JSON.stringify({ version: 1, states: ${JSON.stringify(states)} }));`;
// Counts writes of the collection to storage, and status announcements.
const SPY = `(() => {
  const set = Storage.prototype.setItem;
  window.__writes = 0;
  Storage.prototype.setItem = function (k, v) { if (k === '${KEY}') window.__writes += 1; return set.call(this, k, v); };
  window.__events = [];
  const hook = () => { if (window.onStatusChange) window.onStatusChange(e => window.__events.push(e.bulk ? 'bulk:' + e.to + ':' + e.ids.length : 'one')); else setTimeout(hook, 50); };
  hook();
})();`;

(async () => {
  await new Promise(r => server.listen(QA_PORT, r));
  const browser = await chromium.launch();
  const R = {}; const errors = [];

  // Iron Man starts on the Watchlist, so Undo has a replaced watchlist to restore.
  const { page } = await ctxPage(browser, DESKTOP, seed({ 'iron-man': 'watchlist' }) + SPY);
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(URL + '?view=list'); await require('./ready').appReady(page);
  const st = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{"states":{}}').states, KEY);

  // ---- Selecting ----------------------------------------------------------
  R.select = await page.evaluate(async () => {
    const boxes = () => [...document.querySelectorAll('.dl-row:not(.dl-head) .dl-check')];
    const head = document.querySelector('.dl-head .dl-check');
    boxes()[0].click(); await new Promise(r => setTimeout(r, 150));
    boxes()[4].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    await new Promise(r => setTimeout(r, 300));
    const range = boxes().filter(b => b.checked).length;
    const mixed = head.indeterminate;
    const drawer = !!document.querySelector('.drawer.open');
    head.click(); await new Promise(r => setTimeout(r, 300));
    const all = boxes().filter(b => b.checked).length;
    head.click(); await new Promise(r => setTimeout(r, 300));
    return { rows: boxes().length, range, mixed, drawer, all, none: boxes().filter(b => b.checked).length };
  });
  if (R.select.range !== 5) errors.push(`a Shift-click from row 1 to row 5 selected ${R.select.range} rows`);
  if (!R.select.mixed) errors.push('the header checkbox is not mixed with only some rows selected');
  if (R.select.drawer) errors.push('ticking a row opened its details');
  if (R.select.all !== R.select.rows) errors.push(`the header checkbox selected ${R.select.all} of ${R.select.rows} rows`);
  if (R.select.none !== 0) errors.push('the header checkbox did not clear the selection');

  // ---- Mark as seen: exactly the released, not-yet-seen selected titles ---
  // The first five rows (Phase 1) plus the last five (where the unreleased are).
  await page.evaluate(() => { window.__writes = 0; window.__events = []; });
  R.mark = await page.evaluate(async () => {
    const rows = [...document.querySelectorAll('.dl-row:not(.dl-head)')];
    const pick = rows.slice(0, 5).concat(rows.slice(-5));
    pick.forEach(r => r.querySelector('.dl-check').click());
    await new Promise(r => setTimeout(r, 300));
    const ids = pick.map(r => r.getAttribute('data-row-id'));
    const shown = Number((document.querySelector('.bulk-btn.primary .bulk-n') || {}).textContent);
    const expect = ids.filter(id => window.MCU_isReleased(window.TITLES.find(t => t.id === id))).length;
    document.querySelector('.bulk-btn.primary').click();
    await new Promise(r => setTimeout(r, 1200));
    return { ids, shown, expect, bar: !!document.querySelector('.bulk-bar'), toast: (document.querySelector('.mcu-toast b') || {}).textContent || null };
  });
  R.afterMark = await st();
  R.writes = await page.evaluate(() => window.__writes);
  R.events = await page.evaluate(() => window.__events);
  if (R.mark.shown !== R.mark.expect) errors.push(`the button promised ${R.mark.shown} but ${R.mark.expect} of the selection are released`);
  const marked = R.mark.ids.filter(id => R.afterMark[id] === 'seen');
  if (marked.length !== R.mark.expect) errors.push(`${marked.length} titles were marked seen; expected ${R.mark.expect}`);
  const unreleasedSeen = await page.evaluate((ids) => ids.filter(id => !window.MCU_isReleased(window.TITLES.find(t => t.id === id))), marked);
  if (unreleasedSeen.length) errors.push(`unreleased titles were marked seen in bulk: ${unreleasedSeen.join(', ')}`);
  if (R.mark.bar) errors.push('the selection did not end after the action');
  if (R.writes !== 1) errors.push(`the bulk action wrote the guest collection ${R.writes} times; expected once`);
  if (R.events.length !== 1 || !/^bulk:seen:/.test(R.events[0])) errors.push(`expected one bulk announcement, got ${JSON.stringify(R.events)}`);
  if (!/as seen/.test(R.mark.toast || '')) errors.push(`no bulk toast (${R.mark.toast})`);

  // ---- Undo restores each title, the replaced watchlist included ----------
  R.undo = await page.evaluate(async () => {
    const b = document.querySelector('.mcu-toast .mt-undo');
    if (!b) return { error: 'no Undo on the bulk toast' };
    b.click(); await new Promise(r => setTimeout(r, 900));
    return {};
  });
  R.afterUndo = await st();
  if (R.undo.error) errors.push(R.undo.error);
  else {
    if (R.afterUndo['iron-man'] !== 'watchlist') errors.push(`Undo left Iron Man as ${R.afterUndo['iron-man']}; it was on the Watchlist`);
    const left = R.mark.ids.filter(id => id !== 'iron-man' && R.afterUndo[id]);
    if (left.length) errors.push(`Undo left marks on ${left.join(', ')}`);
  }

  // ---- Over 20 titles, and Mark as unseen, ask first ----------------------
  R.confirm = await page.evaluate(async () => {
    const head = document.querySelector('.dl-head .dl-check');
    head.click(); await new Promise(r => setTimeout(r, 300));
    document.querySelector('.bulk-btn.primary').click(); await new Promise(r => setTimeout(r, 600));
    const dialog = document.querySelector('.bulk-dialog');
    const text = dialog ? dialog.textContent : null;
    const cancel = dialog && [...dialog.querySelectorAll('button')].find(b => /Cancel/.test(b.textContent));
    if (cancel) cancel.click();
    await new Promise(r => setTimeout(r, 500));
    // Cancelling keeps the selection: it ends only when an action runs.
    const kept = [...document.querySelectorAll('.dl-row:not(.dl-head) .dl-check')].filter(b => b.checked).length;
    return { asked: !!dialog, text, kept };
  });
  R.afterCancel = await st();
  if (!R.confirm.asked) errors.push('marking more than 20 titles did not ask first');
  if (R.confirm.kept !== 64) errors.push(`cancelling the confirmation left ${R.confirm.kept} of 64 rows selected`);
  if (Object.keys(R.afterCancel).filter(k => R.afterCancel[k] === 'seen').length) errors.push('Cancel still marked titles seen');

  // ---- Escape clears the selection first, then closes the details ---------
  // Real key presses (page.keyboard), not dispatched events: the hand-off
  // between layers relies on preventDefault, which a synthetic event created
  // without cancelable: true silently ignores.
  R.esc = {};
  R.esc.before = await page.evaluate(async () => {
    document.querySelector('.dl-row:not(.dl-head) .dl-open').click();
    await new Promise(r => setTimeout(r, 900));
    const boxes = [...document.querySelectorAll('.dl-row:not(.dl-head) .dl-check')];
    if (!boxes.some(b => b.checked)) boxes[1].click();
    await new Promise(r => setTimeout(r, 300));
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    return { selected: !!document.querySelector('.bulk-bar'), drawer: !!document.querySelector('.drawer.open') };
  });
  const layers = () => page.evaluate(() => ({ selected: !!document.querySelector('.bulk-bar'), drawer: !!document.querySelector('.drawer.open') }));
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  R.esc.first = await layers();
  await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  R.esc.second = await layers();
  if (!R.esc.before.drawer || !R.esc.before.selected) errors.push(`the Escape test did not start with both a selection and open details: ${JSON.stringify(R.esc.before)}`);
  if (R.esc.first.selected) errors.push('Escape did not clear the selection');
  if (!R.esc.first.drawer) errors.push('one Escape cleared the selection and closed the details too');
  if (R.esc.second.drawer) errors.push('the second Escape did not close the details');

  // ---- Phones: the section header action ----------------------------------
  const { page: m } = await ctxPage(browser, MOBILE, seed({}) + SPY);
  await m.goto(URL + '?sort=phase'); await require('./ready').appReady(m);
  R.phone = await m.evaluate(async () => {
    const p1div = [...document.querySelectorAll('.m-phase-divider')].find(d => /Phase 1/i.test(d.textContent));
    const btn = p1div && p1div.querySelector('.pgh-action');
    if (!btn) return { error: 'no action on the Phase 1 header' };
    const label = btn.textContent.trim();
    const p1 = window.TITLES.filter(t => t.phase === 1 && window.MCU_isReleased(t)).length;
    window.__events = [];
    btn.click(); await new Promise(r => setTimeout(r, 1200));
    const st = JSON.parse(localStorage.getItem('mcu.collection.v1')).states;
    const seen = window.TITLES.filter(t => t.phase === 1 && st[t.id] === 'seen').length;
    const after = p1div.querySelector('.pgh-action');
    return { label, p1, seen, events: window.__events, buttonAfter: after ? after.textContent.trim() : null };
  });
  if (R.phone.error) errors.push(R.phone.error);
  else {
    if (R.phone.label !== 'Mark all seen') errors.push(`the Phase 1 header reads "${R.phone.label}"`);
    if (R.phone.seen !== R.phone.p1) errors.push(`the Phase 1 action marked ${R.phone.seen} of ${R.phone.p1}`);
    if (R.phone.events.length !== 1) errors.push(`the Phase 1 action announced ${R.phone.events.length} times`);
    if (R.phone.buttonAfter) errors.push(`the Phase 1 header still offers "${R.phone.buttonAfter}" with nothing left to mark`);
  }
  // Release order: one All titles header; more than 20 to mark, so it asks.
  await m.goto(URL); await require('./ready').appReady(m);
  R.phoneAll = await m.evaluate(async () => {
    const btn = document.querySelector('.m-phase-divider.overall .pgh-action');
    if (!btn) return { error: 'no action on the All titles header' };
    const label = btn.textContent.trim();
    btn.click(); await new Promise(r => setTimeout(r, 900));
    const sheet = document.querySelector('.m-sheet');
    const go = sheet && [...sheet.querySelectorAll('button')].find(b => /^Mark \d+ as seen$/.test(b.textContent.trim()));
    if (!go) return { label, error: 'no confirmation sheet' };
    go.click(); await new Promise(r => setTimeout(r, 1500));
    const st = JSON.parse(localStorage.getItem('mcu.collection.v1')).states;
    const released = window.TITLES.filter(t => window.MCU_isReleased(t));
    const unreleased = window.TITLES.filter(t => !window.MCU_isReleased(t));
    return { label, allSeen: released.every(t => st[t.id] === 'seen'), unreleasedMarked: unreleased.filter(t => st[t.id]).map(t => t.id) };
  });
  if (R.phoneAll.error) errors.push(R.phoneAll.error);
  else {
    // The init script reseeds an empty collection on every load, so nothing is
    // seen yet here and the header offers to mark them all.
    if (R.phoneAll.label !== 'Mark all seen') errors.push(`the All titles header reads "${R.phoneAll.label}"`);
    if (!R.phoneAll.allSeen) errors.push('confirming did not mark every released title seen');
    if (R.phoneAll.unreleasedMarked.length) errors.push(`unreleased titles were marked: ${R.phoneAll.unreleasedMarked.join(', ')}`);
  }

  // ---- Desktop, By Phase: a phase at a time (Batch 9) -----------------------
  // The phase header's checkbox selects exactly that phase's rows, shows a
  // mixed state for part of it and clears them on a second click; its "Mark N
  // more seen" is the phones' button, marking only that phase's released,
  // unseen titles, with one announcement and Undo.
  const { page: d } = await ctxPage(browser, DESKTOP, seed({ 'iron-man-3': 'seen' }) + SPY);
  await d.goto(URL + '?view=list&sort=phase'); await require('./ready').appReady(d);
  R.deskPhase = await d.evaluate(async () => {
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    // Found by its checkbox's name: the visible text runs "PHASE 2" into "1/11".
    const head = (n) => { const c = document.querySelector(`.dl-phase-label .dl-check[aria-label="Select every title in Phase ${n}"]`); return c && c.closest('.dl-phase-divider'); };
    const rowsOf = (n) => [...document.querySelectorAll('.dl-row[data-row-id]')].filter(r => window.TITLES.find(t => t.id === r.dataset.rowId).phase === n);
    const checked = () => [...document.querySelectorAll('.dl-row[data-row-id] .dl-check')].filter(c => c.checked).map(c => c.closest('.dl-row').dataset.rowId);
    const p2 = head(2);
    if (!p2) return { error: 'no Phase 2 header' };
    const box = p2.querySelector('.dl-phase-label .dl-check');
    if (!box) return { error: 'no checkbox on the Phase 2 header' };
    const p2ids = rowsOf(2).map(r => r.dataset.rowId);
    box.click(); await wait(250);
    const picked = checked();
    rowsOf(2)[0].querySelector('.dl-check').click(); await wait(250);
    const mixed = box.indeterminate && !box.checked;
    box.click(); await wait(250);
    const refilled = checked().length;
    box.click(); await wait(250);
    const cleared = checked().length;
    // The button: Phase 2 has one title seen already.
    const btn = p2.querySelector('.pgh-action');
    const label = btn && btn.textContent.trim();
    const want = window.TITLES.filter(t => t.phase === 2 && window.MCU_isReleased(t) && t.id !== 'iron-man-3').map(t => t.id);
    window.__events = [];
    btn.click(); await wait(1200);
    const st = JSON.parse(localStorage.getItem('mcu.collection.v1')).states;
    const nowSeen = Object.keys(st).filter(k => st[k] === 'seen');
    const others = nowSeen.filter(k => window.TITLES.find(t => t.id === k).phase !== 2);
    const undo = document.querySelector('.mt-undo');
    if (undo) undo.click(); await wait(900);
    const st2 = JSON.parse(localStorage.getItem('mcu.collection.v1')).states;
    return { p2: p2ids.length, picked: picked.length, pickedOnly: picked.every(id => p2ids.includes(id)), mixed, refilled, cleared, label, want: want.length,
      marked: want.filter(id => st[id] === 'seen').length, others, events: window.__events.length,
      afterUndo: Object.keys(st2).filter(k => st2[k] === 'seen') };
  });
  {
    const x = R.deskPhase;
    if (x.error) errors.push(x.error);
    else {
      if (x.picked !== x.p2 || !x.pickedOnly) errors.push(`the Phase 2 checkbox selected ${x.picked} rows; Phase 2 has ${x.p2}`);
      if (!x.mixed) errors.push('the Phase 2 checkbox is not mixed with part of the phase selected');
      if (x.refilled !== x.p2) errors.push(`clicking the mixed Phase 2 checkbox selected ${x.refilled} rows, not the whole phase`);
      if (x.cleared !== 0) errors.push(`clicking the full Phase 2 checkbox left ${x.cleared} rows selected`);
      if (x.label !== `Mark ${x.want} more seen`) errors.push(`the Phase 2 button reads "${x.label}"; expected "Mark ${x.want} more seen"`);
      if (x.marked !== x.want) errors.push(`the Phase 2 button marked ${x.marked} of ${x.want}`);
      if (x.others.length) errors.push(`the Phase 2 button marked titles outside Phase 2: ${x.others.join(', ')}`);
      if (x.events !== 1) errors.push(`the Phase 2 button announced ${x.events} times`);
      if (x.afterUndo.join() !== 'iron-man-3') errors.push(`Undo left ${x.afterUndo.join(', ')} seen; only Iron Man 3 was`);
    }
  }
  // Release order: the All titles meter carries the button too (over 20, so
  // it asks first).
  await d.goto(URL + '?view=list'); await require('./ready').appReady(d);
  R.deskAll = await d.evaluate(() => {
    const btn = document.querySelector('.dl-phase-divider.lead .pgh-action');
    return { label: btn && btn.textContent.trim(), phaseChecks: document.querySelectorAll('.dl-phase-label .dl-check').length };
  });
  if (!/^Mark (all|\d+ more) seen$/.test(R.deskAll.label || '')) errors.push(`the desktop All titles meter has no "Mark … seen" button (${R.deskAll.label})`);
  if (R.deskAll.phaseChecks) errors.push('phase checkboxes appear outside By Phase');

  R.errors = errors;
  console.log(JSON.stringify(R, null, 1));
  await browser.close(); server.close();
})();
