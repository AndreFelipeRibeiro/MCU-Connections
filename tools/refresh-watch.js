#!/usr/bin/env node
// Refreshes watch-data.js: where each released title can be watched in each
// supported country, from TMDB's watch providers (data from JustWatch).
//
//   TMDB_READ_TOKEN=... node tools/refresh-watch.js
//
// Maintainer tool only: the app never loads anything from tools/ and makes no
// TMDB API calls. The token is a TMDB "API Read Access Token" (v4) and lives
// only in your environment; it is never written to any file.
//
// What it does:
//   1. Finds each released title's TMDB id from its IMDb id
//      (docs/CATALOG-SOURCES.json) and checks it against the title and year.
//      Seasons of one show share the show's id: TMDB reports availability per
//      show, not per season.
//   2. Fetches the providers for every supported region and keeps them in the
//      app's own buckets: stream (flatrate), free (free + ads), rent, buy.
//   3. Writes watch-data.js and prints what changed since the last run.
// Node 18+ (built-in fetch). No packages.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'watch-data.js');
// Adding a country is adding its code here (and nothing in the app).
const REGIONS = ['US', 'BR'];
const API = 'https://api.themoviedb.org/3';

const token = process.env.TMDB_READ_TOKEN;
if (!token) {
  console.error('Set TMDB_READ_TOKEN (a TMDB API Read Access Token) in your environment first.');
  process.exit(1);
}

function load(file, name) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox);
  return sandbox.window[name];
}

const titles = load(path.join(ROOT, 'data.js'), 'TITLES');
const sources = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'CATALOG-SOURCES.json'), 'utf8')).titles;
const previous = fs.existsSync(OUT) ? (load(OUT, 'WATCH') || {}) : {};

// The local date, as the app's release test uses: a UTC date would stamp an
// evening run in the Americas with tomorrow.
const today = new Date().toLocaleDateString('en-CA');
const released = (t) => /^\d{4}-\d{2}-\d{2}$/.test(t.release) && t.release <= today;

async function get(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error(`${res.status} for ${url.replace(API, '')}`);
    return res.json();
  }
  throw new Error(`rate limited: ${url.replace(API, '')}`);
}

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// Providers sorted as TMDB ranks them, reduced to what the app shows.
const pick = (list) => (list || [])
  .slice()
  .sort((a, b) => (a.display_priority || 0) - (b.display_priority || 0))
  .map((p) => ({ id: p.provider_id, name: p.provider_name, logo: p.logo_path || null }));
const dedupe = (list) => list.filter((p, i) => list.findIndex((q) => q.id === p.id) === i);

(async () => {
  const warnings = [];
  const ids = {};
  const byImdb = {};
  const out = {};

  for (const t of titles) {
    if (!released(t)) continue;
    const imdb = ((sources[t.id] && sources[t.id].imdbUrl) || '').match(/tt\d+/);
    if (!imdb) { warnings.push(`${t.id}: no IMDb id in docs/CATALOG-SOURCES.json, skipped`); continue; }
    const want = t.type === 'film' ? 'movie' : 'tv';

    // 1. TMDB id from the IMDb id, checked against the title and year.
    if (!byImdb[imdb[0]]) {
      const found = await get(`${API}/find/${imdb[0]}?external_source=imdb_id`);
      const hit = ((want === 'movie' ? found.movie_results : found.tv_results) || [])[0];
      if (!hit) { warnings.push(`${t.id}: TMDB has no ${want} for ${imdb[0]}, skipped`); continue; }
      byImdb[imdb[0]] = { type: want, id: hit.id, name: hit.title || hit.name, date: hit.release_date || hit.first_air_date || '' };
    }
    const m = byImdb[imdb[0]];
    ids[t.id] = { type: m.type, id: m.id };
    const base = norm(t.title).replace(/ season \d+$/, '');
    if (!norm(m.name).startsWith(base.split(' ').slice(0, 2).join(' '))) warnings.push(`${t.id}: TMDB calls ${m.type}/${m.id} "${m.name}"; check it is "${t.title}"`);
    // Films must match their year; a later season of a show will not.
    if (m.type === 'movie' && m.date.slice(0, 4) !== String(t.year)) warnings.push(`${t.id}: TMDB year ${m.date.slice(0, 4)} vs catalogue ${t.year}`);

    // 2. Providers per region.
    const data = await get(`${API}/${m.type}/${m.id}/watch/providers`);
    out[t.id] = {};
    for (const region of REGIONS) {
      const r = (data.results || {})[region];
      out[t.id][region] = r ? {
        link: r.link || null,
        stream: pick(r.flatrate),
        free: dedupe([...pick(r.free), ...pick(r.ads)]),
        rent: pick(r.rent),
        buy: pick(r.buy),
      } : { link: null, stream: [], free: [], rent: [], buy: [] };
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  const watch = {
    checkedAt: today,
    source: 'JustWatch via TMDB',
    regions: REGIONS,
    logoBase: 'https://image.tmdb.org/t/p/w92',
    ids,
    titles: out,
  };
  const header = '// Where to watch: a dated snapshot written by tools/refresh-watch.js from\n'
    + '// TMDB watch providers (data from JustWatch). Do not edit by hand; run the\n'
    + '// script again. The app makes no TMDB API calls of its own.\n';
  fs.writeFileSync(OUT, header + 'window.WATCH = ' + JSON.stringify(watch, null, 1) + ';\n');

  // 3. What changed since the last snapshot.
  const changes = [];
  const prevTitles = (previous && previous.titles) || {};
  for (const [id, regions] of Object.entries(out)) {
    for (const region of REGIONS) {
      for (const bucket of ['stream', 'free', 'rent', 'buy']) {
        const before = new Set((((prevTitles[id] || {})[region] || {})[bucket] || []).map((p) => p.name));
        const after = new Set((regions[region][bucket] || []).map((p) => p.name));
        after.forEach((n) => { if (!before.has(n)) changes.push(`+ ${id} ${region} ${bucket}: ${n}`); });
        before.forEach((n) => { if (!after.has(n)) changes.push(`- ${id} ${region} ${bucket}: ${n}`); });
      }
    }
  }
  console.log(`watch-data.js: ${Object.keys(out).length} titles, ${REGIONS.join(' + ')}, checked ${today}`);
  console.log(changes.length ? changes.join('\n') : 'No changes since the last snapshot.');
  if (warnings.length) { console.log('\nCheck these:'); console.log(warnings.join('\n')); }
})().catch((e) => { console.error(e.message); process.exit(1); });
