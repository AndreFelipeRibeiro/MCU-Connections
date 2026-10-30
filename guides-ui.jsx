// Guides (guides.js): short, curated paths through the catalogue. This file
// holds the helpers every surface shares and the guide's own pieces of UI:
// the Guides menu (desktop popover and phone sheet), the desktop banner, the
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
  // seen (the event guide's target is not a stop at all).
  progress(g, statusOf) {
    const count = (list) => {
      const released = list.filter(s => window.MCU_isReleased(s.title));
      return { total: list.length, released: released.length, upcoming: list.length - released.length,
        seen: released.filter(s => statusOf(s.id) === 'seen').length };
    };
    const all = MCU_GUIDE.stops(g, true);
    const ess = count(all.filter(s => !s.optional));
    const opt = count(all.filter(s => s.optional));
    return { ess, opt, complete: ess.released > 0 && ess.seen === ess.released };
  },
  // The next stop: the first released, unseen stop in guide order (optional
  // ones only when they are shown). The same rule as Up next, scoped.
  next(g, includeOptional, statusOf) {
    return MCU_GUIDE.stops(g, includeOptional).find(s => window.MCU_isReleased(s.title) && statusOf(s.id) !== 'seen') || null;
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
  const p = MCU_GUIDE.progress(guide, statusOf);
  const action = bulk && window.BulkHeaderAction
    ? <window.BulkHeaderAction ids={MCU_GUIDE.stops(guide, includeOptional).map(s => s.id)} group={MCU_GUIDE.name(guide)}/> : null;
  return (
    <div className={`g-meter ${className}`}>
      <window.ProgressHeader label={GI18N.upper(MCU_GUIDE.short(guide))} seen={p.ess.seen} released={p.ess.released} upcoming={p.ess.upcoming} action={action}/>
      {includeOptional && p.opt.total > 0 && (
        <span className="g-opt-count">{gtr('guide.optCount', { seen: p.opt.seen, n: p.opt.released })}</span>
      )}
    </div>
  );
}

// Desktop: the banner in the character banner's place, with the same controls.
function GuideBanner({ guide, includeOptional, setIncludeOptional, stepIndex, stepCount, onPrev, onNext, onClose }) {
  window.useI18n();
  const all = MCU_GUIDE.stops(guide, true);
  const nOpt = all.filter(s => s.optional).length;
  const target = guide.target && MCU_GUIDE.title(guide.target);
  const release = target ? GI18N.release(target) : null;
  const sub = [MCU_GUIDE.kind(guide), MCU_GUIDE.size(guide)];
  if (target && release && release.date) sub.push(`${GI18N.titleName(target)} ${release.date}`);
  return (
    <div className="char-banner pinned guide-banner" role="region" aria-label={gtr('guide.regionAria', { name: MCU_GUIDE.name(guide) })}>
      <GuideArt guide={guide} size={36} round/>
      <span className="cb-who">
        <b>{MCU_GUIDE.name(guide)}</b>
        <span className="cb-sub">{sub.join(' · ')}</span>
      </span>
      {nOpt > 0 && (
        <label className="g-optcheck">
          <input type="checkbox" className="dl-check" checked={includeOptional} onChange={e => setIncludeOptional(e.target.checked)}/>
          <span>{gtr('guide.includeOptional', { n: nOpt })}</span>
        </label>
      )}
      <div className="cb-step">
        <button onClick={onPrev} aria-label={gtr('guide.prev')} disabled={!stepCount}>‹</button>
        <span className="cb-pos" aria-live="polite">{stepIndex >= 0
          ? gtr('guide.stepOf', { i: stepIndex + 1, n: stepCount })
          : gtr('guide.stops', { n: stepCount })}</span>
        <button onClick={onNext} aria-label={gtr('guide.next')} disabled={!stepCount}>›</button>
      </div>
      <button className="cb-close" aria-label={gtr('guide.close')} title={gtr('guide.close')} onClick={onClose}>×</button>
    </div>
  );
}

// Phones: the pill at the bottom, like the pinned character's.
function GuidePill({ guide, stepIndex, stepCount, current, onPrev, onNext, onClose }) {
  const { statusOf } = window.useCollection();
  window.useI18n();
  const p = MCU_GUIDE.progress(guide, statusOf);
  const date = MCU_GUIDE.targetDate(guide);
  const line = p.complete
    ? (date ? gtr('guide.pillDoneDate', { date }) : gtr('guide.complete'))
    : current ? gtr('guide.stepLabel', { i: stepIndex + 1, title: GI18N.titleName(current) }) : MCU_GUIDE.size(guide);
  return (
    <div className="char-pill guide-pill" role="group" aria-label={gtr('guide.regionAria', { name: MCU_GUIDE.name(guide) })}>
      <div className="cp-bar">
        <span className="cp-who">
          <GuideArt guide={guide} size={36} round/>
          <span className="cp-text">
            <span className="cp-name">{MCU_GUIDE.short(guide)}</span>
            <span className="cp-actor">{line}</span>
          </span>
        </span>
        <div className="cb-step">
          <button onClick={onPrev} aria-label={gtr('guide.prev')} disabled={!stepCount}>‹</button>
          <span className="cb-pos" aria-live="polite">{stepIndex >= 0
            ? gtr('highlight.short', { i: stepIndex + 1, n: stepCount })
            : <>{stepCount}<span className="story-sr"> {gtr('guide.stopsWord', { n: stepCount })}</span></>}</span>
          <button onClick={onNext} aria-label={gtr('guide.next')} disabled={!stepCount}>›</button>
        </div>
        <button className="cb-close" aria-label={gtr('guide.close')} title={gtr('guide.close')} onClick={onClose}>×</button>
      </div>
    </div>
  );
}

// The stop's number badge: a check once seen, its number (or + for an
// optional stop) otherwise, highlighted for the next stop.
function GuideNum({ stop, seen, next }) {
  const label = stop.optional
    ? gtr(seen ? 'guide.optSeenAria' : 'guide.optAria')
    : gtr(seen ? 'guide.stopSeenAria' : 'guide.stopAria', { i: stop.n });
  return (
    <span className={`g-num${seen ? ' done' : ''}${next ? ' cur' : ''}${stop.optional ? ' o' : ''}`} role="img" aria-label={label}>
      {seen ? <window.CheckIcon/> : stop.optional ? '+' : stop.n}
    </span>
  );
}

// The flat view of an open guide: the phone List and Grid, and the desktop
// List (`surface`). Stops in guide order with their numbers and reasons, the
// next stop marked, and the event's destination last.
function GuideView({ guide, includeOptional, setIncludeOptional, surface, layout = 'list', currentId, onOpen, onContinue }) {
  const { statusOf } = window.useCollection();
  window.useI18n();
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
          <div className="g-kind">{p.complete ? gtr('guide.complete') : MCU_GUIDE.kind(guide)}{!p.complete && date && <span> · {gtr('guide.targetOn', { date })}</span>}</div>
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
  ) : (
    <div className="g-intro">
      {p.complete
        ? <p className="g-ready"><b>{done || gtr('guide.complete')}</b> {gtr('guide.allEssentialSeen')}</p>
        : <p className="g-blurb">{MCU_GUIDE.blurb(guide)}</p>}
      {next && <button type="button" className="un-btn g-continue" onClick={() => onContinue(next.id)}>{gtr('guide.continue', { title: GI18N.titleName(next.title) })} ›</button>}
    </div>
  );

  const why = (s) => MCU_GUIDE.why(s);
  const destRow = target && (
    <div className="g-stop dest" data-row-id={target.id} role={surface === 'desktop' ? 'row' : undefined}>
      <span className="g-num dest" aria-hidden="true">→</span>
      <button type="button" className="g-open" onClick={() => onOpen(target.id)}>
        <span className="g-thumb"><PosterArt title={target}/></span>
        <span className="g-text">
          <span className="g-title">{GI18N.titleName(target)}</span>
          <span className="g-why">{gtr('guide.dest')}</span>
          <window.ReleaseLine title={target} className="g-release"/>
        </span>
      </button>
      {p.complete && <window.TitleStatusActions title={target} variant="inline" className="g-dest-tsa"/>}
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
            const isNext = next && next.id === s.id;
            return (
              <div key={s.id} data-row-id={s.id} className={`g-card${isNext ? ' next' : ''}${seen ? ' seen' : ''}${s.optional ? ' optional' : ''}${currentId === s.id ? ' current' : ''}`}>
                <button type="button" className="g-open" onClick={() => onOpen(s.id)}>
                  <span className="g-poster"><PosterArt title={s.title}/><GuideNum stop={s} seen={seen} next={isNext}/></span>
                  <span className="g-text">
                    {isNext && <span className="un-tag">{gtr('guide.nextStop')}</span>}
                    <span className="g-title">{GI18N.titleName(s.title)}{s.optional && <span className="g-otag">{gtr('guide.optionalTag')}</span>}</span>
                    {!seen && <span className="g-why">{why(s)}</span>}
                  </span>
                </button>
                {!seen && <window.TitleStatusActions title={s.title} className="g-card-tsa"/>}
              </div>
            );
          })}
        </div>
        {destRow}
      </div>
    );
  }

  const rows = stops.map(s => {
    const seen = statusOf(s.id) === 'seen';
    const isNext = next && next.id === s.id;
    const t = s.title;
    return (
      <div key={s.id} data-row-id={s.id} role={surface === 'desktop' ? 'row' : undefined}
        className={`g-stop${isNext ? ' next' : ''}${seen ? ' seen' : ''}${s.optional ? ' optional' : ''}${currentId === s.id ? ' current' : ''}`}>
        <span role={surface === 'desktop' ? 'cell' : undefined} className="g-numcell"><GuideNum stop={s} seen={seen} next={isNext}/></span>
        <button type="button" className="g-open" onClick={() => onOpen(s.id)}>
          <span className="g-thumb"><PosterArt title={t}/></span>
          <span className="g-text">
            {isNext && <span className="un-tag">{gtr('guide.nextStop')}</span>}
            <span className="g-title">{GI18N.titleName(t)}{s.optional && <span className="g-otag">{gtr('guide.optionalTag')}</span>}</span>
            {surface === 'phone' && !seen && <span className="g-meta">{meta(t)}</span>}
            <span className="g-why">{why(s)}</span>
          </span>
        </button>
        {surface === 'desktop' && <>
          <span role="cell" className="g-col">{gtr(t.type === 'film' ? 'type.film.one' : 'type.series.one')}</span>
          <span role="cell" className="g-col">{gtr('phase.label', { n: t.phase })}</span>
          <span role="cell" className="g-col mono">{t.year}</span>
          <span role="cell" className="g-col"><window.ScoreBadges title={t}/></span>
        </>}
        <span role={surface === 'desktop' ? 'cell' : undefined} className="g-acts"><window.TitleStatusActions title={t} className="g-tsa"/></span>
      </div>
    );
  });

  if (surface === 'phone') {
    return (
      <div className="m-scrollarea g-scroll">
        {header}
        <GuideMeter guide={guide} includeOptional={includeOptional} bulk/>
        <div className="g-stops">{rows}{destRow}</div>
      </div>
    );
  }
  return (
    <div className="dlist g-desk" role="main" aria-label={MCU_GUIDE.name(guide)}>
      {header}
      <GuideMeter guide={guide} includeOptional={includeOptional} className="desk" bulk/>
      <div className="g-table" role="table" aria-label={MCU_GUIDE.name(guide)}>
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
    </div>
  );
}

// "Part of" in a title's details (the shared details body's "guides" slot):
// each guide the title is a stop in, with its place and progress. Opening one
// opens the guide.
function GuidePartOf({ title }) {
  const { statusOf } = window.useCollection();
  window.useI18n();
  const list = MCU_GUIDE.forTitle(title.id);
  if (!list.length || !window.MCU_openGuide) return null;
  return (
    <div className="g-partof">
      <h3 className="g-partof-h">{gtr('guide.partOf')}</h3>
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
    </div>
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
      <button type="button" className={`filters-pill g-btn${open || currentId ? ' active' : ''}`} aria-expanded={open} aria-haspopup="dialog"
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

Object.assign(window, { GuideMenu, GuideBanner, GuidePill, GuideView, GuideMeter, GuideArt, GuidePartOf, GuideIcon, GuidesButton });
