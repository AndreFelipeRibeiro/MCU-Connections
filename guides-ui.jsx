// Guides (guides.js): short, curated paths through the catalogue. This file
// holds the helpers every surface shares and the guide's own pieces of UI:
// the Guides menu (desktop popover and phone sheet), the desktop module, the
// phone pill, the flat guide view (phone List/Grid, desktop List) and "Part of"
// in a title's details. The app shell (app.jsx) owns the state: which guide is
// open, Include optional and the stepper. A guide shows only its own titles
// (no "All titles" switch): closing it brings back the whole catalogue.

const GI18N = window.MCU_I18N;
const gtr = (key, vars) => GI18N.tr(key, vars);
const gloc = (o) => (o ? (o[GI18N.lang] || o.en || '') : '');

const MCU_GUIDE = {
  all: () => window.GUIDES || [],
  get: (id) => (window.GUIDES || []).find(g => g.id === id) || null,
  name: (g) => gloc(g.name),
  short: (g) => gloc(g.short) || gloc(g.name),
  blurb: (g) => gloc(g.blurb),
  why: (s) => gloc(s.why),
  title: (id) => (window.TITLES || []).find(t => t.id === id) || null,
  // The stops with their titles and numbers. Essential stops are numbered
  // 1..n in order; optional ones carry no number, so switching them on never
  // shifts the essential numbers.
  stops(g, includeOptional) {
    let n = 0;
    return g.stops.map(s => {
      const title = MCU_GUIDE.title(s.id);
      const optional = s.weight !== 'essential';
      return { ...s, title, optional, n: optional ? null : ++n };
    }).filter(s => s.title && (includeOptional || !s.optional));
  },
  // Released stops only: a title not out yet is never a gap in what you have
  // seen (the event guide's target is not a stop at all). A skipped stop is
  // out of the count too, unless it was seen anyway (seen wins). `total` keeps
  // every stop, for "Stop 2 of 5".
  progress(g, statusOf) {
    const count = (list) => {
      const counted = list.filter(s => !MCU_GUIDE.skippedNow(g, s.id, statusOf));
      const released = counted.filter(s => window.MCU_isReleased(s.title));
      return { total: list.length, released: released.length, upcoming: counted.length - released.length,
        seen: released.filter(s => statusOf(s.id) === 'seen').length, skipped: list.length - counted.length };
    };
    const all = MCU_GUIDE.stops(g, true);
    const ess = count(all.filter(s => !s.optional));
    const opt = count(all.filter(s => s.optional));
    return { ess, opt, complete: ess.released > 0 && ess.seen === ess.released };
  },
  // The next stop: the first released, unseen stop in guide order (optional
  // ones only when they are shown). The same rule as Up next, scoped.
  next(g, includeOptional, statusOf) {
    return MCU_GUIDE.stops(g, includeOptional).find(s => window.MCU_isReleased(s.title) && statusOf(s.id) !== 'seen'
      && !MCU_GUIDE.isSkipped(g, s.id)) || null;
  },
  forTitle: (id) => (window.GUIDES || []).filter(g => g.stops.some(s => s.id === id)),
  forChar: (ch) => (window.GUIDES || []).find(g => g.kind === 'character' && g.character === ch) || null,
  kind: (g) => gtr('guide.kind.' + (g.group || 'stories')),
  targetDate(g) {
    const t = g.target && MCU_GUIDE.title(g.target);
    if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(t.release)) return '';
    try {
      return new Intl.DateTimeFormat(document.documentElement.lang || 'en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
        .format(new Date(t.release + 'T00:00:00Z'));
    } catch (e) { return t.release; }
  },
  // "5 stops + 3 optional"
  size(g) {
    const all = MCU_GUIDE.stops(g, true);
    const e = all.filter(s => !s.optional).length, o = all.length - e;
    const base = gtr('guide.stops', { n: e });
    return o ? gtr('guide.plusOptional', { base, n: o }) : base;
  },
};
window.MCU_GUIDE = MCU_GUIDE;

// ---- Skipped stops (V3 Tasks, "Guides: skip a stop, and bring it back").
// Per guide, remembered on this device (mcu.guideSkips.v1: { guideId: [ids] }).
// A skipped stop stays listed but leaves the path: progress, the next stop,
// the stepper, Up next and "Mark N more seen" pass over it. Seen wins: a
// skipped stop marked seen counts as seen (app.jsx then drops the skip).
const SKIPS_KEY = 'mcu.guideSkips.v1';
let skipsMap = null;
const skipListeners = new Set();
const skipsNow = () => {
  if (skipsMap) return skipsMap;
  try { const v = JSON.parse(localStorage.getItem(SKIPS_KEY) || '{}'); skipsMap = v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch (e) { skipsMap = {}; }
  return skipsMap;
};
Object.assign(MCU_GUIDE, {
  isSkipped: (g, id) => (skipsNow()[g.id] || []).indexOf(id) !== -1,
  // Skipped and not seen: what every count and the path leave out.
  skippedNow: (g, id, statusOf) => MCU_GUIDE.isSkipped(g, id) && statusOf(id) !== 'seen',
  setSkipped(g, id, on) {
    const map = { ...skipsNow() };
    const list = (map[g.id] || []).filter(x => x !== id);
    if (on) list.push(id);
    if (list.length) map[g.id] = list; else delete map[g.id];
    skipsMap = map;
    try { localStorage.setItem(SKIPS_KEY, JSON.stringify(map)); } catch (e) { /* this visit only */ }
    skipListeners.forEach(fn => fn());
  },
  // Drops the skip on stops that have been seen since (seen wins).
  dropSeenSkips(statusOf) {
    const map = skipsNow();
    Object.keys(map).forEach(gid => {
      const g = MCU_GUIDE.get(gid);
      (map[gid] || []).filter(id => statusOf(id) === 'seen').forEach(id => g && MCU_GUIDE.setSkipped(g, id, false));
    });
  },
  onSkips(fn) { skipListeners.add(fn); return () => skipListeners.delete(fn); },
});
// Re-renders a component when any skip changes; returns a version number.
function useGuideSkips() {
  const [v, bump] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => MCU_GUIDE.onSkips(bump), []);
  return v;
}
window.useGuideSkips = useGuideSkips;

// ---- Remembering and promoting guides (V3 Tasks, "Promote guide: Coming
// soon"). Both are per device, like the display preferences.
// mcu.guide.v1: the guide being followed, reopened on the home page.
// mcu.promoted.v1: guides already promoted; each is promoted once.
const GUIDE_MEMORY_KEY = 'mcu.guide.v1';
const PROMOTED_KEY = 'mcu.promoted.v1';
const PROMO_LEAD_DAYS = 60;
const readIdList = (key) => {
  try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
};
Object.assign(MCU_GUIDE, {
  remembered() { try { return localStorage.getItem(GUIDE_MEMORY_KEY) || null; } catch (e) { return null; } },
  remember(id) { try { localStorage.setItem(GUIDE_MEMORY_KEY, id); } catch (e) { /* this visit only */ } },
  // Forgets the remembered guide; with an id, only if that one is remembered.
  forget(id) {
    try { if (!id || localStorage.getItem(GUIDE_MEMORY_KEY) === id) localStorage.removeItem(GUIDE_MEMORY_KEY); } catch (e) { /* nothing stored */ }
  },
  markPromoted(id) {
    const list = readIdList(PROMOTED_KEY);
    if (list.indexOf(id) === -1) { try { localStorage.setItem(PROMOTED_KEY, JSON.stringify(list.concat(id))); } catch (e) { /* this visit only */ } }
  },
  // The upcoming title a guide leads to: an event guide's target, or the title
  // it prepares for. Only a day-precision date counts.
  upcomingTitle(g) {
    const t = MCU_GUIDE.title(g.target || g.preparesFor);
    return t && /^\d{4}-\d{2}-\d{2}$/.test(t.release) ? t : null;
  },
  // Whole days from one calendar date to another (both YYYY-MM-DD).
  daysBetween(from, to) {
    const d = (iso) => { const [y, m, dd] = iso.split('-').map(Number); return Date.UTC(y, m - 1, dd); };
    return Math.round((d(to) - d(from)) / 86400000);
  },
  // Which guide to promote today: one leading to a release in the next 60 days
  // (the sooner release first), else the evergreen guide. Guides already
  // promoted on this device or already complete are skipped.
  promotion(statusOf, today) {
    const shown = readIdList(PROMOTED_KEY);
    const ok = (g) => shown.indexOf(g.id) === -1 && !MCU_GUIDE.progress(g, statusOf).complete;
    const coming = MCU_GUIDE.all()
      .map(g => ({ guide: g, title: MCU_GUIDE.upcomingTitle(g) }))
      .filter(x => x.title)
      .map(x => ({ ...x, days: MCU_GUIDE.daysBetween(today, x.title.release) }))
      .filter(x => x.days >= 1 && x.days <= PROMO_LEAD_DAYS && ok(x.guide))
      .sort((a, b) => a.days - b.days);
    if (coming.length) return coming[0];
    const ever = MCU_GUIDE.all().find(g => g.evergreen && ok(g));
    return ever ? { guide: ever, title: null, days: null } : null;
  },
});

function GuideArt({ guide, size = 44, round = false }) {
  return (
    <span className={`g-art${round ? ' round' : ''}`} aria-hidden="true"
      style={{ width: size, height: size, flex: `0 0 ${size}px`, background: `linear-gradient(150deg, ${guide.color || '#4a6da3'}, #14121a)` }}>
      <i/>
    </span>
  );
}

// Progress beside a guide in the menu: "2/5" and a small bar, or a check.
function GuideMenuProgress({ guide }) {
  const { statusOf } = window.useCollection();
  useGuideSkips();
  const p = MCU_GUIDE.progress(guide, statusOf);
  if (p.complete) return <span className="g-done" role="img" aria-label={gtr('guide.complete')}><window.CheckIcon/></span>;
  const pct = p.ess.released ? Math.round(p.ess.seen / p.ess.released * 100) : 0;
  return (
    <span className="g-prog">
      <span className="g-n" aria-label={gtr('guide.progressAria', { seen: p.ess.seen, n: p.ess.released })}>{p.ess.seen}/{p.ess.released}</span>
      <span className="g-bar" aria-hidden="true"><span style={{ width: pct + '%' }}/></span>
    </span>
  );
}

// The Guides menu: grouped like the mockups (Coming up, Stories, Characters,
// Animation), each guide with its size and progress. Shared by the desktop
// popover and the phone sheet.
const GUIDE_GROUPS = ['coming', 'stories', 'characters', 'animation'];
function GuideMenu({ onPick, currentId }) {
  window.useI18n();
  const all = MCU_GUIDE.all();
  return (
    <div className="g-menu">
      <p className="g-menu-sub">{gtr('guide.menuSub')}</p>
      {GUIDE_GROUPS.map(grp => {
        const list = all.filter(g => g.group === grp);
        if (!list.length) return null;
        return (
          <section key={grp} className="g-group" aria-label={gtr('guide.group.' + grp)}>
            <h3 className="g-group-h">{gtr('guide.group.' + grp)}</h3>
            {list.map(g => {
              const date = MCU_GUIDE.targetDate(g);
              const who = g.character && window.CHARACTERS[g.character] ? window.CHARACTERS[g.character].actor : null;
              return (
                <button key={g.id} type="button" className={`g-row${currentId === g.id ? ' on' : ''}`} onClick={() => onPick(g.id)}
                  aria-current={currentId === g.id ? 'true' : undefined}>
                  <GuideArt guide={g} size={40}/>
                  <span className="g-row-text">
                    <span className="g-row-name">{MCU_GUIDE.name(g)}{date && <span className="g-ev">{GI18N.upper(date)}</span>}</span>
                    <span className="g-row-sub">{who ? `${who} · ` : ''}{MCU_GUIDE.size(g)}</span>
                  </span>
                  <GuideMenuProgress guide={g}/>
                </button>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

// The guide's meter: the shared ProgressHeader over its essential stops, with
// the optional count beside it while optional stops are shown.
// In the List and Grid it also offers "Mark N more seen" for the stops shown
// (the bulk action, with its Undo and its confirmation above 20).
function GuideMeter({ guide, includeOptional, className = '', bulk = false }) {
  const { statusOf } = window.useCollection();
  useGuideSkips();
  const p = MCU_GUIDE.progress(guide, statusOf);
  // "Mark N more seen" leaves skipped stops alone.
  const ids = MCU_GUIDE.stops(guide, includeOptional).filter(s => !MCU_GUIDE.skippedNow(guide, s.id, statusOf)).map(s => s.id);
  const action = bulk && window.BulkHeaderAction ? <window.BulkHeaderAction ids={ids} group={MCU_GUIDE.name(guide)}/> : null;
  const skipped = p.ess.skipped + (includeOptional ? p.opt.skipped : 0);
  return (
    <div className={`g-meter ${className}${p.complete ? ' done' : ''}`}>
      <window.ProgressHeader label={GI18N.upper(MCU_GUIDE.short(guide))} seen={p.ess.seen} released={p.ess.released} upcoming={p.ess.upcoming} action={action}/>
      {includeOptional && p.opt.total > 0 && (
        <span className="g-opt-count">{gtr('guide.optCount', { seen: p.opt.seen, n: p.opt.released })}</span>
      )}
      {skipped > 0 && <span className="g-opt-count g-skip-count">{gtr('guide.skippedCount', { n: skipped })}</span>}
    </div>
  );
}

// Desktop: the guide's module (V3 Tasks, "Desktop guide: one taller module for
// the guide, and compact rows for seen stops"), the phone dock's sibling. One
// card holds what the banner, the intro row and the meter row used to spread
// over three bands, each control once:
// - List (layout "list"), at the top of the guide's table: the guide on the
//   left (art, kind, name, two-line blurb), where you are on the right (the
//   segment meter with its count, then the next stop with Seen and Open), and
//   a footer strip (Include optional, Mark N more seen, the stepper, ×). Once
//   complete it turns green and shows where the guide leads.
// - Spatial (layout "spatial"), one row floating over the top of the canvas:
//   art, short name, the next stop with Seen, the meter, Include optional as
//   an icon button, the stepper and ×.
// It keeps the banner's hooks (guide-banner, cb-step, cb-pos, cb-close,
// g-optcheck) so the stepper and close read the same everywhere.
function GuideSegments({ guide, statusOf, next }) {
  // One segment per essential stop that counts (released, not skipped), in
  // order: seen ones lit, the next one outlined.
  const segs = MCU_GUIDE.stops(guide, false)
    .filter(s => window.MCU_isReleased(s.title) && !MCU_GUIDE.skippedNow(guide, s.id, statusOf))
    .map(s => <i key={s.id} className={statusOf(s.id) === 'seen' ? 'on' : next && next.id === s.id ? 'cur' : ''}/>);
  return <span className="gm-segs" aria-hidden="true">{segs}</span>;
}

function GuideModule({ guide, layout = 'list', includeOptional, setIncludeOptional, stepIndex, stepCount, onOpenNext, onPrev, onNext, onClose }) {
  window.useI18n();
  const { statusOf, states } = window.useCollection();
  useGuideSkips();
  const PosterArt = window.PosterArt;
  const p = MCU_GUIDE.progress(guide, statusOf);
  const complete = p.complete;
  const next = complete ? null : MCU_GUIDE.next(guide, includeOptional, statusOf);
  const all = MCU_GUIDE.stops(guide, true);
  const nOpt = all.filter(s => s.optional).length;
  const target = guide.target && MCU_GUIDE.title(guide.target);
  const release = target ? GI18N.release(target) : null;
  const date = MCU_GUIDE.targetDate(guide);
  const spatial = layout === 'spatial';
  const pos = stepIndex >= 0 && stepIndex >= stepCount
    ? gtr('guide.destPos')
    : stepIndex >= 0
    ? gtr(spatial ? 'guide.stepShort' : 'guide.stepOf', { i: stepIndex + 1, n: stepCount })
    : gtr('guide.stops', { n: stepCount });
  const step = (
    <div className="cb-step">
      <button type="button" onClick={onPrev} aria-label={gtr('guide.prev')} disabled={!stepCount}>‹</button>
      <span className="cb-pos" aria-live="polite">{pos}</span>
      <button type="button" onClick={onNext} aria-label={gtr('guide.next')} disabled={!stepCount}>›</button>
    </div>
  );
  const close = <button type="button" className="cb-close" aria-label={gtr('guide.close')} title={gtr('guide.close')} onClick={onClose}>×</button>;
  const meterLabel = gtr('guide.partSeen', { seen: p.ess.seen, n: p.ess.released });
  const nextTag = next && (next.optional ? gtr('guide.nextStop') : gtr('guide.nextTag', { i: next.n, n: p.ess.total }));
  const doneLine = date ? gtr('guide.pillDoneDate', { date }) : gtr('guide.complete');
  const vr = <span className="gm-vr" aria-hidden="true"/>;
  const cls = `guide-banner g-module ${spatial ? 'spatial' : 'list'}${complete ? ' done' : ''}`;
  const region = gtr('guide.regionAria', { name: MCU_GUIDE.name(guide) });
  // Clicks and drags on the floating row never reach the canvas behind it.
  const stop = (e) => e.stopPropagation();

  if (spatial) {
    return (
      <section className={cls} aria-label={region} onMouseDown={stop} onClick={stop} onWheel={stop}>
        <GuideArt guide={guide} size={38}/>
        <span className="gm-who">
          <b>{MCU_GUIDE.short(guide)}</b>
          <span className="gm-kind">{MCU_GUIDE.kind(guide)}{date ? ` · ${date}` : ''}</span>
        </span>
        {vr}
        <span className="gm-next">
          {next ? <>
            <button type="button" className="gm-nextopen" onClick={() => onOpenNext && onOpenNext(next.id)}>
              <span className="gm-nthumb"><PosterArt title={next.title}/></span>
              <span className="gm-ntext">
                <span className="gm-ntag">{gtr('guide.dockNextTag')}</span>
                <span className="gm-ntitle">{GI18N.titleName(next.title)}</span>
              </span>
            </button>
            <window.TitleStatusActions title={next.title} variant="inline" className="gm-tsa"/>
          </> : complete ? <span className="gm-doneline">{doneLine}</span> : null}
        </span>
        {vr}
        <span className="gm-meter" role="img" aria-label={meterLabel}>
          <span className="gm-mtop"><span className="gm-mlabel">{gtr('guide.progressLabel')}</span><span className="gm-count">{p.ess.seen}/{p.ess.released}</span></span>
          <GuideSegments guide={guide} statusOf={statusOf} next={next}/>
        </span>
        {vr}
        {nOpt > 0 && (
          <button type="button" className={`gm-optbtn${includeOptional ? ' on' : ''}`} aria-pressed={includeOptional}
            aria-label={gtr('guide.includeOptional', { n: nOpt })} title={gtr('guide.includeOptional', { n: nOpt })}
            onClick={() => setIncludeOptional(!includeOptional)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="8" strokeDasharray="3 3"/><path d="M12 8v8M8 12h8"/>
            </svg>
          </button>
        )}
        {step}
        {vr}
        {close}
      </section>
    );
  }

  const sub = [MCU_GUIDE.size(guide)];
  if (release && release.date) sub.push(release.date);
  const ids = MCU_GUIDE.stops(guide, includeOptional).filter(s => !MCU_GUIDE.skippedNow(guide, s.id, statusOf)).map(s => s.id);
  const bulkN = window.BulkHeaderAction && window.MCU_bulkTargets ? window.MCU_bulkTargets(ids, 'seen', states).length : 0;
  const skipped = p.ess.skipped + (includeOptional ? p.opt.skipped : 0);
  const notes = [];
  if (includeOptional && p.opt.total > 0) notes.push(gtr('guide.optCount', { seen: p.opt.seen, n: p.opt.released }));
  if (skipped > 0) notes.push(gtr('guide.skippedCount', { n: skipped }));
  const done = gloc(guide.done);
  return (
    <section className={cls} aria-label={region}>
      <div className="gm-top">
        <div className="gm-guide">
          <GuideArt guide={guide} size={64}/>
          <div className="gm-gtext">
            <div className={`gm-kind${complete ? ' done' : ''}`}>{complete ? gtr('guide.complete') : MCU_GUIDE.kind(guide)} <span>· {sub.join(' · ')}</span></div>
            <h2 className="gm-name">{MCU_GUIDE.name(guide)}</h2>
            <p className="gm-blurb">{MCU_GUIDE.blurb(guide)}</p>
          </div>
        </div>
        <div className="gm-where">
          <div className="gm-meter" role="img" aria-label={meterLabel}>
            <span className="gm-mtop">
              <span className="gm-mlabel">{complete ? (done || gtr('guide.complete')).replace(/\.$/, '') : GI18N.upper(MCU_GUIDE.short(guide))}</span>
              {complete
                ? <span className="gm-check" aria-hidden="true"><window.CheckIcon/></span>
                : <span className="gm-count">{p.ess.seen}/{p.ess.released}</span>}
            </span>
            <GuideSegments guide={guide} statusOf={statusOf} next={next}/>
            {notes.length > 0 && <span className="gm-notes">{notes.join(' · ')}</span>}
          </div>
          {next ? (
            <div className="gm-nextrow">
              <span className="gm-nthumb big"><PosterArt title={next.title}/></span>
              <span className="gm-ntext">
                <span className="gm-ntag">{nextTag}</span>
                <span className="gm-ntitle">{GI18N.titleName(next.title)}</span>
                <span className="gm-nmeta">{gtr(next.title.type === 'film' ? 'type.film.one' : 'type.series.one')} · {next.title.year}</span>
              </span>
              <window.TitleStatusActions title={next.title} variant="inline" className="gm-tsa"/>
              <button type="button" className="gm-open" onClick={() => onOpenNext && onOpenNext(next.id)}
                aria-label={gtr('guide.openNextAria', { title: GI18N.titleName(next.title) })}>{gtr('guide.open')} ›</button>
            </div>
          ) : complete && target ? (
            <div className="gm-nextrow">
              <span className="gm-nthumb big"><PosterArt title={target}/></span>
              <span className="gm-ntext">
                <span className="gm-ntag done">{gtr('guide.completeLeads')}</span>
                <span className="gm-ntitle">{GI18N.titleName(target)}</span>
                <window.ReleaseLine title={target} className="gm-nmeta"/>
              </span>
              <window.TitleStatusActions title={target} variant="inline" className="gm-tsa gm-watch"/>
            </div>
          ) : complete ? (
            <p className="gm-ready">{gtr('guide.allEssentialSeen')}</p>
          ) : null}
        </div>
      </div>
      <div className="gm-foot">
        {nOpt > 0 && (
          <label className="g-optcheck gm-switch">
            <input type="checkbox" role="switch" checked={includeOptional} onChange={e => setIncludeOptional(e.target.checked)}/>
            <i aria-hidden="true"/>
            <span>{gtr('guide.includeOptional', { n: nOpt })}</span>
          </label>
        )}
        {nOpt > 0 && bulkN > 0 && vr}
        {bulkN > 0 && <window.BulkHeaderAction ids={ids} group={MCU_GUIDE.name(guide)}/>}
        <span className="gm-fill"/>
        {step}
        {vr}
        {close}
      </div>
    </section>
  );
}

// Phones: the guide's dock at the bottom (V3 Tasks, "Phone guide: one bar for
// progress, next stop and stepper"), in every view. It replaces the floating
// meter, the Up next card and the old pill: the guide and its next stop, with
// Seen, on top; the progress segments, the count, the stepper and close below.
// Once complete it turns green and says what the guide was for.
function GuidePill({ guide, stepIndex, stepCount, current, next, onOpenNext, onPrev, onNext, onClose }) {
  const { statusOf } = window.useCollection();
  window.useI18n();
  useGuideSkips();
  const p = MCU_GUIDE.progress(guide, statusOf);
  const date = MCU_GUIDE.targetDate(guide);
  const showNext = !p.complete && next;
  const sub = p.complete
    ? (date ? gtr('guide.pillDoneDate', { date }) : gtr('guide.complete'))
    : showNext ? gtr('guide.dockNext', { title: GI18N.titleName(next) }) : MCU_GUIDE.size(guide);
  const segs = [];
  for (let i = 0; i < p.ess.released; i++) segs.push(<i key={i} className={i < p.ess.seen ? 'on' : ''}/>);
  // The List and Grid behind the dock keep their last card clear of it: the
  // dock publishes the room it takes (its height plus its gap to the bottom)
  // as --dock-h on the phone's main area.
  const dockRef = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = dockRef.current;
    const main = el && el.closest('.m-main');
    if (!main) return undefined;
    const set = () => main.style.setProperty('--dock-h', Math.ceil(el.offsetHeight + (parseFloat(getComputedStyle(el).bottom) || 0)) + 'px');
    set();
    const ro = window.ResizeObserver ? new ResizeObserver(set) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); main.style.removeProperty('--dock-h'); };
  }, []);
  const text = (
    <>
      <span className="g-dock-name">{MCU_GUIDE.short(guide)}</span>
      <span className="g-dock-sub">{sub}</span>
    </>
  );
  return (
    <div ref={dockRef} className={`char-pill guide-pill g-dock${p.complete ? ' done' : ''}`} role="group" aria-label={gtr('guide.regionAria', { name: MCU_GUIDE.name(guide) })}>
      <div className="g-dock-card">
        <div className="g-dock-top">
          <GuideArt guide={guide} size={36} round/>
          {showNext
            ? <button type="button" className="g-dock-text g-dock-next" onClick={() => onOpenNext && onOpenNext(next.id)}>{text}</button>
            : <span className="g-dock-text">{text}</span>}
          {showNext && <window.TitleStatusActions title={next} className="g-dock-tsa"/>}
        </div>
        <div className="g-dock-bottom">
          <span className="g-dock-meter" role="img" aria-label={gtr('guide.partSeen', { seen: p.ess.seen, n: p.ess.released })}>{segs}</span>
          <span className="g-dock-count" aria-hidden="true">{p.ess.seen}/{p.ess.released}</span>
          <div className="cb-step">
            <button onClick={onPrev} aria-label={gtr('guide.prev')} disabled={!stepCount}>‹</button>
            <span className="cb-pos story-sr" aria-live="polite">{stepIndex >= stepCount
              ? gtr('guide.destLabel', { title: current ? GI18N.titleName(current) : '' })
              : stepIndex >= 0
              ? gtr('guide.stepLabel', { i: stepIndex + 1, title: current ? GI18N.titleName(current) : '' })
              : `${stepCount} ${gtr('guide.stopsWord', { n: stepCount })}`}</span>
            <button onClick={onNext} aria-label={gtr('guide.next')} disabled={!stepCount}>›</button>
          </div>
          <button className="cb-close" aria-label={gtr('guide.close')} title={gtr('guide.close')} onClick={onClose}>×</button>
        </div>
      </div>
    </div>
  );
}

// The stop's number badge: a check once seen, its number (or + for an
// optional stop) otherwise, highlighted for the next stop.
// Skip or Unskip on a Spatial card (desktop) or the phone's tapped-card popup.
// `info` is { state: 'can' | 'skipped', stop } from app.jsx. The wrapper keeps
// a press from starting a card drag or selecting the card.
function GuideSkipControl({ guide, info, className = '', onDone }) {
  if (!guide || !info) return null;
  const swallow = (e) => e.stopPropagation();
  return (
    <span className={`g-skipctl ${className}`} onMouseDown={swallow} onTouchStart={swallow} onClick={swallow}>
      {info.state === 'skipped'
        ? <UnskipButton guide={guide} stop={info.stop} onDone={onDone}/>
        : <SkipButton guide={guide} stop={info.stop} onDone={onDone}/>}
    </span>
  );
}

// Skip or Unskip in the details (desktop drawer and phone sheet), under Seen
// and Watchlist, when the title is a stop of the open guide. It works at any
// zoom, including in Spatial where the card's own buttons hide when small.
function GuideDetailsSkip({ title }) {
  useGuideSkips();
  const { statusOf } = window.useCollection();
  const [said, setSaid] = React.useState('');
  const ref = React.useRef(null);
  const guide = window.MCU_activeGuideId ? MCU_GUIDE.get(window.MCU_activeGuideId) : null;
  const stop = guide ? MCU_GUIDE.stops(guide, true).find(s => s.id === title.id) : null;
  if (!stop) return null;
  const skipped = MCU_GUIDE.skippedNow(guide, stop.id, statusOf);
  const can = !skipped && statusOf(stop.id) !== 'seen' && window.MCU_isReleased(stop.title);
  if (!skipped && !can) return null;
  const name = GI18N.titleName(stop.title);
  const set = (on) => {
    const viaKeys = ref.current && ref.current.contains(document.activeElement);
    MCU_GUIDE.setSkipped(guide, stop.id, on);
    setSaid(gtr(on ? 'guide.skippedSaid' : 'guide.unskippedSaid', { title: name }));
    if (viaKeys) requestAnimationFrame(() => { const b = ref.current && ref.current.querySelector('button'); if (b) b.focus(); });
  };
  return (
    <div className="g-dskip" ref={ref}>
      {skipped ? <>
        <span className="g-dskip-note">{gtr('guide.skippedInGuide')}</span>
        <button type="button" className="g-unskip" aria-label={gtr('guide.unskipAria', { title: name })} onClick={() => set(false)}>{gtr('guide.unskip')}</button>
      </> : (
        <button type="button" className="g-dskip-btn" aria-label={gtr('guide.skipAria', { title: name })} onClick={() => set(true)}>
          <SkipIcon/>{gtr('guide.skipInGuide')}
        </button>
      )}
      <span className="story-sr" aria-live="polite">{said}</span>
    </div>
  );
}

function GuideNum({ stop, seen, next, skipped }) {
  const label = stop.optional
    ? gtr(seen ? 'guide.optSeenAria' : skipped ? 'guide.optSkippedAria' : 'guide.optAria')
    : gtr(seen ? 'guide.stopSeenAria' : skipped ? 'guide.stopSkippedAria' : 'guide.stopAria', { i: stop.n });
  return (
    <span className={`g-num${seen ? ' done' : ''}${next ? ' cur' : ''}${stop.optional ? ' o' : ''}${skipped ? ' skip' : ''}`} role="img" aria-label={label}>
      {seen ? <window.CheckIcon/> : stop.optional ? '+' : stop.n}
    </span>
  );
}

// Skip and Unskip for one stop. Skip is an icon button beside Seen and
// Watchlist on desktop, under the stop's number in the phone List and on the
// poster's corner in the Grid; Unskip is a text button in the
// minimized row. Focus follows to the other button, since the one pressed goes.
function SkipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 5l9 7-9 7z"/><path d="M18 5v14"/>
    </svg>
  );
}
function SkipButton({ guide, stop, className = '', onDone }) {
  return (
    <button type="button" className={`g-skip ${className}`} title={gtr('guide.skip')}
      aria-label={gtr('guide.skipAria', { title: GI18N.titleName(stop.title) })}
      onClick={(e) => { e.stopPropagation(); MCU_GUIDE.setSkipped(guide, stop.id, true); onDone && onDone(stop, true); }}>
      <SkipIcon/>
    </button>
  );
}
function UnskipButton({ guide, stop, className = '', onDone }) {
  return (
    <button type="button" className={`g-unskip ${className}`}
      aria-label={gtr('guide.unskipAria', { title: GI18N.titleName(stop.title) })}
      onClick={(e) => { e.stopPropagation(); MCU_GUIDE.setSkipped(guide, stop.id, false); onDone && onDone(stop, false); }}>
      {gtr('guide.unskip')}
    </button>
  );
}

// The flat view of an open guide: the phone List and Grid, and the desktop
// List (`surface`). Stops in guide order with their numbers and reasons, the
// next stop marked, and the event's destination last.
function GuideView({ guide, includeOptional, setIncludeOptional, surface, layout = 'list', currentId, openId, onOpen, onFollow, onContinue, module }) {
  const { statusOf } = window.useCollection();
  window.useI18n();
  // Desktop table: ↑ ↓ / Home / End between stops, as in the List (the
  // destination row below the stops is not one of them).
  const rowKeys = window.useRowKeys('.g-stop[data-row-id]:not(.dest)', surface === 'desktop' ? openId : null, onFollow);
  useGuideSkips();
  // After Skip or Unskip: say so, and put focus on the button that replaced
  // the one pressed (only if focus was on it, so a mouse user sees nothing).
  const [said, setSaid] = React.useState('');
  const afterSkip = (stop, on) => {
    const name = GI18N.titleName(stop.title);
    setSaid(gtr(on ? 'guide.skippedSaid' : 'guide.unskippedSaid', { title: name }));
    const hadFocus = document.activeElement && document.activeElement.closest && document.activeElement.closest('.g-skip, .g-unskip');
    if (hadFocus) requestAnimationFrame(() => {
      const el = document.querySelector(`[data-row-id="${stop.id}"] ${on ? '.g-unskip' : '.g-skip'}`);
      if (el) el.focus();
    });
  };
  const announcer = <span className="story-sr" aria-live="polite">{said}</span>;
  const isSkipped = (s) => MCU_GUIDE.skippedNow(guide, s.id, statusOf);
  // Skip is offered on released stops not yet seen.
  const canSkip = (s) => window.MCU_isReleased(s.title) && statusOf(s.id) !== 'seen' && !isSkipped(s);
  const PosterArt = window.PosterArt;
  const stops = MCU_GUIDE.stops(guide, includeOptional);
  const p = MCU_GUIDE.progress(guide, statusOf);
  const next = MCU_GUIDE.next(guide, includeOptional, statusOf);
  const nOpt = MCU_GUIDE.stops(guide, true).filter(s => s.optional).length;
  const target = guide.target && MCU_GUIDE.title(guide.target);
  const date = MCU_GUIDE.targetDate(guide);
  const done = gloc(guide.done);
  const meta = (t) => [GI18N.upper(gtr(t.type === 'film' ? 'type.film.one' : 'type.series.one')), t.year, GI18N.upper(gtr('phase.label', { n: t.phase }))].join(' · ');

  const header = surface === 'phone' ? (
    <section className="g-head" aria-label={MCU_GUIDE.name(guide)}>
      <div className="g-head-top">
        <GuideArt guide={guide} size={44}/>
        <div className="g-head-text">
          <div className={`g-kind${p.complete ? ' done' : ''}`}>{p.complete ? gtr('guide.complete') : MCU_GUIDE.kind(guide)}{!p.complete && date && <span> · {gtr('guide.targetOn', { date })}</span>}</div>
          <h2 className="g-name">{MCU_GUIDE.name(guide)}</h2>
        </div>
      </div>
      {p.complete
        ? <p className="g-ready"><b>{done || gtr('guide.complete')}</b> {gtr('guide.allEssentialSeen')}</p>
        : <p className="g-blurb">{MCU_GUIDE.blurb(guide)}</p>}
      {nOpt > 0 && (
        <div className="g-optrow">
          <span>{gtr('guide.includeOptional', { n: nOpt })}{includeOptional && <small>{gtr('guide.optSeen', { seen: p.opt.seen, n: p.opt.released })}</small>}</span>
          <button type="button" role="switch" className={`g-switch${includeOptional ? ' on' : ''}`} aria-checked={includeOptional}
            aria-label={gtr('guide.optionalAria')} onClick={() => setIncludeOptional(!includeOptional)}><i/></button>
        </div>
      )}
    </section>
  ) : null;

  const why = (s) => MCU_GUIDE.why(s);
  const destRow = target && (
    <div className={`g-stop dest${currentId === target.id ? ' current' : ''}`} data-row-id={target.id} role={surface === 'desktop' ? 'row' : undefined}>
      <span className="g-num dest" aria-hidden="true">→</span>
      <button type="button" className="g-open" onClick={() => onOpen(target.id)}>
        <span className="g-thumb"><PosterArt title={target}/></span>
        <span className="g-text">
          <span className="g-title">{GI18N.titleName(target)}</span>
          <span className="g-why">{gtr('guide.dest')}</span>
          <window.ReleaseLine title={target} className="g-release"/>
        </span>
      </button>
      {/* The same buttons as the stops: Watchlist always, Seen from a week
          before release (canMarkSeen). */}
      <span className="g-acts"><window.TitleStatusActions title={target} className="g-tsa"/></span>
    </div>
  );

  if (surface === 'phone' && layout === 'grid') {
    return (
      <div className="m-scrollarea g-scroll">
        {header}
        <GuideMeter guide={guide} includeOptional={includeOptional} bulk/>
        <div className="g-grid">
          {stops.map(s => {
            const seen = statusOf(s.id) === 'seen';
            const skipped = isSkipped(s);
            const isNext = next && next.id === s.id;
            return (
              <div key={s.id} data-row-id={s.id} className={`g-card${isNext ? ' next' : ''}${seen ? ' seen' : ''}${s.optional ? ' optional' : ''}${skipped ? ' skipped' : ''}${currentId === s.id ? ' current' : ''}`}>
                <button type="button" className="g-open" onClick={() => onOpen(s.id)}>
                  <span className="g-poster"><PosterArt title={s.title}/><GuideNum stop={s} seen={seen} next={isNext} skipped={skipped}/>
                    {skipped && <span className="g-skiptag" aria-hidden="true">{gtr('guide.skippedTag')}</span>}</span>
                  <span className="g-text">
                    {isNext && <span className="un-tag">{gtr('guide.nextStop')}</span>}
                    <span className="g-title">{GI18N.titleName(s.title)}{s.optional && <span className="g-otag">{gtr('guide.optionalTag')}</span>}</span>
                    {!seen && !skipped && <span className="g-why">{why(s)}</span>}
                  </span>
                </button>
                {skipped
                  ? <UnskipButton guide={guide} stop={s} className="g-card-unskip" onDone={afterSkip}/>
                  : <>
                      <window.TitleStatusActions title={s.title} className="g-card-tsa"/>
                      {canSkip(s) && <SkipButton guide={guide} stop={s} className="g-card-skip" onDone={afterSkip}/>}
                    </>}
              </div>
            );
          })}
        </div>
        {destRow}
        {announcer}
      </div>
    );
  }

  const rows = stops.map(s => {
    const seen = statusOf(s.id) === 'seen';
    const skipped = isSkipped(s);
    const isNext = next && next.id === s.id;
    const t = s.title;
    // A skipped stop is minimized: a shorter row with a small poster, no
    // reason, a "Skipped" tag and Unskip in place of Seen and Watchlist.
    // A seen stop is compact, like seen titles in the Release and Chrono
    // lists: a small faded poster and the title (no reason, meta or scores),
    // with Seen and Watchlist side by side. It keeps its place in the guide.
    const compact = seen && !skipped;
    return (
      <div key={s.id} data-row-id={s.id} role={surface === 'desktop' ? 'row' : undefined}
        className={`g-stop${isNext ? ' next' : ''}${seen ? ' seen' : ''}${compact ? ' compact' : ''}${s.optional ? ' optional' : ''}${skipped ? ' skipped' : ''}${currentId === s.id ? ' current' : ''}`}>
        <span role={surface === 'desktop' ? 'cell' : undefined} className="g-numcell">
          <GuideNum stop={s} seen={seen} next={isNext} skipped={skipped}/>
          {surface === 'phone' && canSkip(s) && <SkipButton guide={guide} stop={s} onDone={afterSkip}/>}
        </span>
        <button type="button" className="g-open" onClick={() => onOpen(s.id)}>
          <span className="g-thumb"><PosterArt title={t}/></span>
          <span className="g-text">
            {isNext && <span className="un-tag">{gtr('guide.nextStop')}</span>}
            <span className="g-title">{GI18N.titleName(t)}{s.optional && <span className="g-otag">{gtr('guide.optionalTag')}</span>}
              {skipped && <span className="g-otag g-skiptag-inline">{gtr('guide.skippedTag')}</span>}</span>
            {surface === 'phone' && !seen && !skipped && <span className="g-meta">{meta(t)}</span>}
            {!skipped && !compact && <span className="g-why">{why(s)}</span>}
          </span>
        </button>
        {surface === 'desktop' && <>
          <span role="cell" className="g-col">{gtr(t.type === 'film' ? 'type.film.one' : 'type.series.one')}</span>
          <span role="cell" className="g-col">{gtr('phase.label', { n: t.phase })}</span>
          <span role="cell" className="g-col mono">{t.year}</span>
          <span role="cell" className="g-col">{!compact && <window.ScoreBadges title={t}/>}</span>
        </>}
        <span role={surface === 'desktop' ? 'cell' : undefined} className="g-acts">
          {skipped ? <UnskipButton guide={guide} stop={s} onDone={afterSkip}/> : <>
            {surface === 'desktop' && canSkip(s) && <SkipButton guide={guide} stop={s} onDone={afterSkip}/>}
            <window.TitleStatusActions title={t} className="g-tsa"/>
          </>}
        </span>
      </div>
    );
  });

  if (surface === 'phone') {
    return (
      <div className="m-scrollarea g-scroll">
        {header}
        <GuideMeter guide={guide} includeOptional={includeOptional} bulk/>
        <div className="g-stops">{rows}{destRow}</div>
        {announcer}
      </div>
    );
  }
  return (
    <div className="dlist g-desk" role="main" aria-label={MCU_GUIDE.name(guide)}>
      {module}
      <div className="g-table" role="table" aria-label={MCU_GUIDE.name(guide)} ref={rowKeys.tableRef} onKeyDown={rowKeys.onKeyDown}>
        <div className="g-stop g-headrow" role="row">
          <span role="columnheader" className="g-numcell">#</span>
          <span role="columnheader" className="g-colhead">{gtr('guide.colTitle')}</span>
          <span role="columnheader" className="g-col">{gtr('list.col.type')}</span>
          <span role="columnheader" className="g-col">{gtr('list.col.phase')}</span>
          <span role="columnheader" className="g-col">{gtr('list.col.release')}</span>
          <span role="columnheader" className="g-col">{gtr('guide.colScores')}</span>
          <span role="columnheader" className="g-acts"><span className="story-sr">{gtr('guide.colStatus')}</span></span>
        </div>
        {rows}
        {destRow}
      </div>
      {announcer}
    </div>
  );
}

// "Part of" in a title's details (the shared details body's "guides" slot):
// each guide the title is a stop in, with its place and progress. Opening one
// opens the guide.
// "Part of": the guides a title belongs to, as a collapsible details section
// like Where to watch. It starts closed while a guide is open (the banner
// already shows the stop) and open otherwise; each context remembers its own
// open/closed state for the visit.
function GuidePartOf({ title }) {
  const { statusOf } = window.useCollection();
  useGuideSkips();
  window.useI18n();
  const list = MCU_GUIDE.forTitle(title.id);
  if (!list.length || !window.MCU_openGuide) return null;
  return (
    <window.DetailSection id="guides" stateKey={window.MCU_activeGuideId ? 'guidesInGuide' : 'guides'}
      className="g-partof" labelClass="g-partof-title" bodyClass="g-partof-body"
      label={gtr('guide.partOfCount', { n: list.length })}>
      {list.map(g => {
        const stop = MCU_GUIDE.stops(g, true).find(s => s.id === title.id);
        const p = MCU_GUIDE.progress(g, statusOf);
        const place = stop.optional ? gtr('guide.partOptional') : gtr('guide.stepOf', { i: stop.n, n: p.ess.total });
        const state = p.complete ? gtr('guide.partComplete') : gtr('guide.partSeen', { seen: p.ess.seen, n: p.ess.released });
        return (
          <button key={g.id} type="button" className="g-partof-row" onClick={() => window.MCU_openGuide(g.id, title.id)}>
            <GuideArt guide={g} size={30}/>
            <span className="g-row-text">
              <span className="g-row-name">{MCU_GUIDE.name(g)}</span>
              <span className="g-row-sub">{place} · {state}</span>
            </span>
            <span className="g-chev" aria-hidden="true">›</span>
          </button>
        );
      })}
    </window.DetailSection>
  );
}
GuidePartOf.has = (title) => !!window.MCU_openGuide && MCU_GUIDE.forTitle(title.id).length > 0;
window.MCU_detailSlots = Object.assign(window.MCU_detailSlots || {}, { guides: GuidePartOf });

// The route icon from the mockups: two stops joined by a path.
function GuideIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><path d="M7 19h7a3.5 3.5 0 0 0 0-7h-4a3.5 3.5 0 0 1 0-7h7"/>
    </svg>
  );
}

// Desktop: the Guides button in the toolbar's top row (before the language
// menu) and its popover, the same grouped list as the phone sheet. Closes on a
// pick, an outside click or Escape (one layer: the app's Escape stands back
// while .g-pop is open).
// Controls an open guide doesn't use (V3 Tasks, "Guide disables other view
// options"): dimmed and inert, with a tooltip, but still reachable by keyboard
// and screen readers, which hear why (aria-disabled plus the hint below).
// Their values are kept for when the guide closes. The wrapper takes no space
// (display: contents), so toolbar layouts are untouched.
const GUIDE_OFF_HINT_ID = 'guide-off-hint';
function GuideOff({ off, children }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hint = gtr('guide.offHint');
    el.querySelectorAll('button').forEach(b => {
      if (off) {
        // Keep the button's own title for later; React may have just set a
        // new one (a language change), which replaces the kept copy.
        const own = b.getAttribute('title');
        if (!b.hasAttribute('data-guide-off') || own !== hint) b.setAttribute('data-guide-off', own || '');
        b.setAttribute('aria-disabled', 'true');
        b.setAttribute('aria-describedby', GUIDE_OFF_HINT_ID);
        b.setAttribute('title', hint);
      } else if (b.hasAttribute('data-guide-off')) {
        const t = b.getAttribute('data-guide-off');
        if (t) b.setAttribute('title', t); else b.removeAttribute('title');
        b.removeAttribute('data-guide-off');
        b.removeAttribute('aria-disabled');
        b.removeAttribute('aria-describedby');
      }
    });
  });
  const block = (e) => { if (off) { e.preventDefault(); e.stopPropagation(); } };
  return <div ref={ref} className={`guide-off-wrap${off ? ' guide-off' : ''}`} onClickCapture={block}>{children}</div>;
}
// The text the dimmed controls point to; rendered once while a guide is open.
function GuideOffHint() {
  return <span id={GUIDE_OFF_HINT_ID} className="story-sr">{gtr('guide.offHint')}</span>;
}

function GuidesButton({ currentId, onPick }) {
  window.useI18n();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="g-btn-wrap" ref={ref}>
      <button type="button" className={`filters-pill g-btn${open || currentId ? ' active' : ''}${currentId ? ' on' : ''}`} aria-expanded={open} aria-haspopup="dialog"
        aria-label={currentId && MCU_GUIDE.get(currentId) ? gtr('guide.buttonOpen', { name: MCU_GUIDE.name(MCU_GUIDE.get(currentId)) }) : undefined}
        onClick={() => setOpen(o => !o)}>
        <GuideIcon/><span className="filters-label">{gtr('guide.button')}</span>
      </button>
      {open && (
        <div className="g-pop" role="dialog" aria-label={gtr('guide.menuTitle')}>
          <h2 className="g-pop-title">{gtr('guide.menuTitle')}</h2>
          <GuideMenu currentId={currentId} onPick={(id) => { setOpen(false); onPick(id); }}/>
        </div>
      )}
    </div>
  );
}

// ---- The promotion (Option C, chosen 2026-10-30) ------------------------
// A returning visitor is offered one guide: a countdown band tinted with the
// guide's colour, its essential stops as numbered covers overlapping the
// band's lower edge, ending at a dated tile for the upcoming title; then the
// name, blurb, size and Start (or Continue, with the meter, once started).
// The evergreen guide has a label instead of the countdown and no tile.
// A dialog on desktop, a sheet on phones; app.jsx decides when it appears.

// Covers on phones get one line, so they use a short name: a season becomes
// "S2" ("Loki: Season 2" → "Loki S2", "Loki – Temporada 2" → "Loki T2"), and
// otherwise the part after a colon is kept ("Captain America: Brave New World"
// → "Brave New World"). The full title is always in the accessible name.
const promoCoverName = (t, short) => {
  const n = GI18N.titleName(t);
  if (!short) return n;
  const season = n.match(/^(.*?)[\s:–-]*\b(Season|Temporada)\s+(\d+)$/);
  if (season) return `${season[1]} ${season[2][0]}${season[3]}`;
  const i = n.indexOf(': ');
  return i > 0 ? n.slice(i + 2) : n;
};
function promoDateParts(iso, longMonth) {
  const d = new Date(iso + 'T00:00:00Z');
  const lang = document.documentElement.lang || 'en-US';
  try {
    const full = new Intl.DateTimeFormat(lang, { month: longMonth ? 'long' : 'short', day: 'numeric', timeZone: 'UTC' }).format(d);
    const mon = new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' }).format(d).replace('.', '');
    return { full, mon, day: String(d.getUTCDate()) };
  } catch (e) { return { full: iso, mon: iso.slice(5, 7), day: iso.slice(8, 10) }; }
}

function GuidePromo({ promo, touch, onStart, onClose }) {
  const { statusOf } = window.useCollection();
  useGuideSkips();
  window.useI18n();
  const PosterArt = window.PosterArt;
  const g = promo.guide, target = promo.title, days = promo.days;
  const p = MCU_GUIDE.progress(g, statusOf);
  const started = p.ess.seen > 0;
  const next = started ? MCU_GUIDE.next(g, false, statusOf) : null;
  const ess = MCU_GUIDE.stops(g, false);
  // Covers share the width: five and the tile with a countdown, six without;
  // a longer guide shows the first ones and a "+n" tile.
  const cap = target ? 5 : 6;
  const shown = ess.length > cap ? ess.slice(0, cap - 1) : ess;
  const more = ess.length - shown.length;
  const date = target ? promoDateParts(target.release, !touch) : null;
  const when = days === 1 ? gtr('guide.promoTomorrow') : gtr('guide.promoIn', { n: days });
  const later = <button type="button" className="nudge-later gp-later" onClick={onClose}>{gtr('guide.promoLater')}</button>;
  const body = (
    <div className={`gp${touch ? ' touch' : ''}`} style={{ '--gc': g.color || '#4a6da3' }}>
      <div className="gp-band">
        {target ? (
          <div className="gp-cd" id="gp-cd">
            <span className={`gp-big${days === 1 ? ' word' : ''}`}>{days === 1 ? gtr('guide.promoTomorrow') : days}</span>{' '}
            <span className="gp-cdt">
              {days !== 1 && <><b>{gtr('guide.promoDays', { n: days })}</b>{' '}</>}
              {gtr('guide.promoUntil', { title: GI18N.titleName(target), date: date.full })}
            </span>
          </div>
        ) : (
          <div className="gp-cd" id="gp-cd"><span className="gp-lab"><i aria-hidden="true"/>{gtr('guide.promoEvergreen')}</span></div>
        )}
      </div>
      <ol className="gp-strip" aria-label={gtr('guide.promoStops')}>
        {shown.map(s => {
          const seen = statusOf(s.id) === 'seen';
          const isNext = !!(next && next.id === s.id);
          return (
            <li key={s.id} className={`gp-st${seen ? ' seen' : ''}${isNext ? ' next' : ''}${MCU_GUIDE.skippedNow(g, s.id, statusOf) ? ' skipped' : ''}`}>
              <span className="gp-p" aria-hidden="true">
                <span className="gp-art"><PosterArt title={s.title}/></span>
                <span className={`gp-n${seen ? ' done' : isNext ? ' cur' : ''}`}>{seen ? <window.CheckIcon/> : s.n}</span>
              </span>
              <span className="gp-t" aria-hidden="true">{promoCoverName(s.title, touch)}</span>
              <span className="story-sr">{gtr(seen ? 'guide.promoStopSeenAria' : 'guide.promoStopAria', { title: GI18N.titleName(s.title), i: s.n })}</span>
            </li>
          );
        })}
        {more > 0 && (
          <li className="gp-st more">
            <span className="gp-p" aria-hidden="true">+{more}</span>
            <span className="story-sr">{gtr('guide.promoMore', { n: more })}</span>
          </li>
        )}
        {target && <li className="gp-arr" aria-hidden="true">→</li>}
        {target && (
          <li className="gp-st dest">
            <span className="gp-p" aria-hidden="true"><b>{GI18N.upper(date.mon)}</b><b>{date.day}</b><small>{GI18N.upper(when)}</small></span>
            <span className="gp-t" aria-hidden="true">{promoCoverName(target, touch)}</span>
            <span className="story-sr">{gtr('guide.promoDestAria', { title: GI18N.titleName(target), date: date.full, when })}</span>
          </li>
        )}
      </ol>
      <div className="gp-body">
        {started && <GuideMeter guide={g} includeOptional={false} className="gp-meter"/>}
        <h2 id="gp-title" className="gp-h">{MCU_GUIDE.name(g)}</h2>
        <p className="gp-b">{MCU_GUIDE.blurb(g)}</p>
        <div className="gp-foot">
          <span className="gp-meta">{MCU_GUIDE.size(g)}</span>
          {!touch && later}
          <button type="button" className="picker-go gp-go" onClick={onStart}>
            {next ? gtr('guide.continue', { title: promoCoverName(next.title, true) }) : gtr('guide.promoStart')}
          </button>
          {touch && later}
        </div>
      </div>
    </div>
  );
  if (touch) return <window.Sheet onClose={onClose} labelledBy="gp-title" describedBy="gp-cd" className="promo-sheet">{body}</window.Sheet>;
  return <window.ModalDialog onClose={onClose} labelledBy="gp-title" describedBy="gp-cd" className="promo-dialog">{body}</window.ModalDialog>;
}

Object.assign(window, { GuideMenu, GuideModule, GuidePill, GuideView, GuideMeter, GuideArt, GuidePartOf, GuideIcon, GuidesButton, GuidePromo, GuideOff, GuideOffHint, GuideSkipControl, GuideDetailsSkip });
