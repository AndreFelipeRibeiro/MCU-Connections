// Where to watch: the details section that lists the services offering a title
// in the visitor's country (stream, free, rent or buy). It reads the dated
// snapshot in watch-data.js (window.WATCH, written by tools/refresh-watch.js
// from TMDB watch providers, data from JustWatch); the app makes no API calls.
// It fills the "watch" slot of TitleDetailsBody (mobile.jsx), so the desktop
// drawer and the phone sheet show it in the same place.
//
// Region is separate from language: the first guess is the region part of the
// browser's languages (en-US -> US, pt-BR -> BR), then the time zone, then US.
// It is shown in the section header, can be changed there, and is kept per
// device (mcu.region.v1); it is not synced.

const WI18N = window.MCU_I18N;
const wtr = (key, vars) => WI18N.tr(key, vars);
const REGION_KEY = 'mcu.region.v1';
// Offered in the picker. Supported ones come from the snapshot; the rest show
// "not available yet" plus TMDB's own page for that country.
const REGION_CHOICES = ['US', 'BR', 'CA', 'GB', 'PT', 'MX', 'AR', 'ES', 'FR', 'DE', 'IT', 'AU', 'IN', 'JP'];
const STALE_DAYS = 30;

// Time zones that settle the guess when the language list has no region.
const BR_ZONES = /^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Maceio|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Noronha|Araguaina|Santarem|Eirunepe)$/;

function guessRegion() {
  const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
  for (const l of langs) {
    const m = /^[a-z]{2,3}-([A-Z]{2})\b/i.exec(l || '');
    if (m) return m[1].toUpperCase();
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (BR_ZONES.test(tz)) return 'BR';
  } catch (e) { /* no time zone */ }
  return 'US';
}

const regionStore = (() => {
  let value = null;
  try { value = window.localStorage.getItem(REGION_KEY); } catch (e) { value = null; }
  if (!/^[A-Z]{2}$/.test(value || '')) value = guessRegion();
  const listeners = new Set();
  return {
    get: () => value,
    set: (v) => {
      value = v;
      try { window.localStorage.setItem(REGION_KEY, v); } catch (e) { /* this visit only */ }
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
})();
function useRegion() {
  const region = React.useSyncExternalStore(regionStore.subscribe, regionStore.get);
  return [region, regionStore.set];
}

const pageLang = () => document.documentElement.lang || 'en-US';
function countryName(code) {
  try { return new Intl.DisplayNames([pageLang()], { type: 'region' }).of(code) || code; } catch (e) { return code; }
}
function longDate(iso) {
  if (!iso) return '';
  try { return new Intl.DateTimeFormat(pageLang(), { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z')); } catch (e) { return iso; }
}
const daysSince = (iso) => Math.floor((Date.now() - Date.parse(iso + 'T00:00:00Z')) / 86400000);

// TMDB's watch page for a title in one country, which lists every option with
// its price and links on to each service. No affiliate or tracking parameters.
function tmdbWatchLink(titleId, region) {
  const W = window.WATCH || {};
  const id = W.ids && W.ids[titleId];
  if (!id) return null;
  return `https://www.themoviedb.org/${id.type}/${id.id}/watch?locale=${region}`;
}

// A provider: its logo as received from TMDB, with the name beside it. If the
// logo fails, the name alone stays (the same idea as the poster fallbacks).
function Provider({ p }) {
  const W = window.WATCH || {};
  const [failed, setFailed] = React.useState(false);
  return (
    <li className="wtw-provider">
      {p.logo && !failed
        ? <img className="wtw-logo" src={(W.logoBase || 'https://image.tmdb.org/t/p/w92') + p.logo} alt="" width="28" height="28" loading="lazy" onError={() => setFailed(true)}/>
        : <span className="wtw-logo none" aria-hidden="true">{p.name.slice(0, 1)}</span>}
      <span className="wtw-name">{p.name}</span>
    </li>
  );
}

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>
    </svg>
  );
}

function RegionPicker({ region, setRegion, onDone }) {
  const W = window.WATCH || {};
  const supported = W.regions || [];
  const choices = [...supported, ...REGION_CHOICES.filter((c) => supported.indexOf(c) === -1)];
  if (choices.indexOf(region) === -1) choices.push(region);
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current) ref.current.focus(); }, []);
  return (
    <label className="wtw-picker">
      <span className="story-sr">{wtr('watch.regionLabel')}</span>
      <select ref={ref} value={region} onChange={(e) => { setRegion(e.target.value); onDone(); }} onBlur={onDone}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onDone(); } }}>
        {choices.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
      </select>
    </label>
  );
}

function WhereToWatch({ title }) {
  window.useI18n();
  const [region, setRegion] = useRegion();
  const [picking, setPicking] = React.useState(false);
  // Not out yet: the release line already says when, and "not streaming here"
  // must never be confused with "not released".
  if (!window.MCU_isReleased || !window.MCU_isReleased(title)) return null;
  const W = window.WATCH || {};
  const country = countryName(region);
  const supported = (W.regions || []).indexOf(region) !== -1;
  const entry = W.titles && W.titles[title.id];
  const offers = supported && entry ? entry[region] : null;
  const link = (offers && offers.link) || tmdbWatchLink(title.id, region);
  const name = WI18N.titleName(title);

  let body;
  if (!supported) {
    body = <p className="wtw-note">{wtr('watch.unsupported', { country })}</p>;
  } else if (!entry) {
    body = <p className="wtw-note">{wtr('watch.notChecked')}</p>;
  } else {
    const stream = offers.stream || [], free = offers.free || [];
    const others = [];
    [...(offers.rent || []), ...(offers.buy || [])].forEach((p) => { if (!others.some((q) => q.id === p.id)) others.push(p); });
    if (!stream.length && !free.length && !others.length) {
      body = <p className="wtw-note">{wtr('watch.none', { country, date: longDate(W.checkedAt) })}</p>;
    } else {
      const shown = others.slice(0, 2).map((p) => p.name);
      const more = others.length - shown.length;
      body = (
        <>
          {!stream.length && !free.length && <p className="wtw-note">{wtr('watch.noSubscription', { country })}</p>}
          {stream.length > 0 && (
            <div className="wtw-group">
              <div className="wtw-kind">{wtr('watch.stream')}</div>
              <ul className="wtw-list">{stream.map((p) => <Provider key={p.id} p={p}/>)}</ul>
            </div>
          )}
          {free.length > 0 && (
            <div className="wtw-group">
              <div className="wtw-kind">{wtr('watch.free')}</div>
              <ul className="wtw-list">{free.map((p) => <Provider key={p.id} p={p}/>)}</ul>
            </div>
          )}
          {others.length > 0 && (
            <p className="wtw-also">{more > 0
              ? wtr('watch.alsoMore', { names: shown.join(', '), n: more })
              : wtr('watch.also', { names: shown.join(wtr('watch.and')) })}</p>
          )}
        </>
      );
    }
  }
  const stale = W.checkedAt && daysSince(W.checkedAt) > STALE_DAYS;
  return (
    <section className="wtw" aria-labelledby={`wtw-h-${title.id}`}>
      <div className="wtw-head">
        <h3 className="wtw-title" id={`wtw-h-${title.id}`}>{wtr('watch.title', { country })}</h3>
        {picking
          ? <RegionPicker region={region} setRegion={setRegion} onDone={() => setPicking(false)}/>
          : <button type="button" className="wtw-change" onClick={() => setPicking(true)}
              aria-label={wtr('watch.changeAria', { country })}>{wtr('watch.change')}</button>}
      </div>
      {title.type === 'series' && entry && supported && <p className="wtw-series">{wtr('watch.wholeSeries')}</p>}
      {body}
      {link && (
        <a className="wtw-link" href={link} target="_blank" rel="noopener noreferrer"
          aria-label={wtr('watch.linkAria', { title: name, country })}>
          {wtr('watch.link')}<ExternalIcon/>
        </a>
      )}
      {/* Only when this title was in the snapshot: "not checked yet" must
          not sit next to a "Checked" date. */}
      {W.checkedAt && supported && entry && (
        <p className="wtw-credit">
          {stale ? wtr('watch.checkedStale', { date: longDate(W.checkedAt) }) : wtr('watch.checked', { date: longDate(W.checkedAt) })}
          {' · '}{wtr('watch.credit')}
        </p>
      )}
    </section>
  );
}

window.MCU_detailSlots = Object.assign(window.MCU_detailSlots || {}, { watch: WhereToWatch });
Object.assign(window, { WhereToWatch, MCU_region: regionStore, MCU_guessRegion: guessRegion });
