// MCU Explorer — Floating canvas layout

const { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } = React;

const PHASE_COLORS = {
  1: '#d4a05a',
  2: '#4a8de8',
  3: '#d04040',
  4: '#a05cd0',
  5: '#5fa856',
  6: '#c8384a',
};
window.PHASE_COLORS = PHASE_COLORS; // desktop-list.jsx
// Text goes through the i18n runtime (i18n.js); `tr` avoids clashing with the
// `t` used for titles throughout this file.
const I18N = window.MCU_I18N;
const tr = (key, vars) => I18N.tr(key, vars);
const phaseLabel = (n) => I18N.upper(tr('phase.label', { n }));
const typeLabel = (type) => tr(type === 'film' ? 'type.film.one' : 'type.series.one');

const CARD_W = 170;
const CARD_H = 270;
// Space between the two titles of the pair view (room for the labels).
const PAIR_GAP = 380;

// Variant handling: a character may declare `prime`, pointing at the "through-line"
// identity it is a variant of (He Who Remains -> kang, Captain Carter -> peggy).
// Connections chain on the prime so the thread stays unbroken, while each segment is
// still drawn and labelled with the specific variant that appears in that title.
function primeOf(id) {
  const c = window.CHARACTERS[id];
  return (c && c.prime) || id;
}

function useDevice() {
  const get = () => (window.innerWidth < 900 ? 'mobile' : 'desktop');
  const [device, setDevice] = useState(get);
  useEffect(() => {
    const on = () => setDevice(get());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return device;
}


// Default direction per sort mode, chosen to match each mode's natural/prior default
// (e.g. ratings default to highest-first, dates/phase default to earliest-first).
const DEFAULT_SORT_DIR = { release: 'asc', chrono: 'asc', phase: 'asc', imdb: 'desc', rt: 'desc', title: 'asc' };

// Full labels for both directions of a sort; `short` gives the compact form
// shown on the mobile order button.
function sortDirectionLabels(sort, short = false) {
  const sfx = short ? 'Short' : '';
  if (sort === 'title') return [tr('order.title.asc'), tr('order.title.desc')];
  if (sort === 'release') return [tr('order.release.asc' + sfx), tr('order.release.desc' + sfx)];
  if (sort === 'chrono') return [tr('order.chrono.asc' + sfx), tr('order.chrono.desc' + sfx)];
  if (sort === 'phase') {
    const phases = window.TITLES.map(t => t.phase);
    const low = Math.min(...phases), high = Math.max(...phases);
    const key = short ? 'order.phase.rangeShort' : 'order.phase.range';
    return [tr(key, { from: low, to: high }), tr(key, { from: high, to: low })];
  }
  return [tr('order.rating.asc' + sfx), tr('order.rating.desc' + sfx)];
}
window.sortDirectionLabels = sortDirectionLabels;

function sortTitles(list, sort, dir = 'asc') {
  const mul = dir === 'desc' ? -1 : 1;
  return list.slice().sort((a, b) => {
    if (sort === 'imdb' || sort === 'rt') {
      // Unrated titles are not low ratings: keep them last in either direction.
      if (a[sort] == null) return b[sort] == null ? 0 : 1;
      if (b[sort] == null) return -1;
      return mul * (a[sort] - b[sort]);
    }
    if (sort === 'chrono') return mul * (a.chronOrder - b.chronOrder);
    if (sort === 'title') return mul * I18N.compare(I18N.titleName(a), I18N.titleName(b));
    if (sort === 'phase') return mul * ((a.phase - b.phase) || a.release.localeCompare(b.release));
    return mul * a.release.localeCompare(b.release);
  });
}

// What the view is showing that the controls don't: how many titles match and,
// when filtering, which filters are on. The sort, order and collection already
// show on their own controls, so they are not repeated here. Variants:
//   'float' - desktop Spatial, top-left of the canvas: the count, one removable
//             chip per filter (search, collection, type, phase, budget) and
//             Clear all. With `inList` it sits at the top of the desktop List.
//   'line'  - top of the mobile List/Grid (scrolls away with it).
//   'pill'  - mobile Spatial, top-left of the canvas clear of the zoom control.
// Phones show the count and how many filters, plus Clear; the search box,
// collection switch and Filters badge already name them.
// `showing` counts titles matching every filter, including the collection one,
// which only dims cards in Spatial.
function ContextSummary({ variant, inList, showing, total, filters: f }) {
  const chips = [];
  const query = f.search.trim();
  if (query) chips.push(['search', `“${query}”`, () => f.setSearch('')]);
  if (f.collectionFilter !== 'all') chips.push(['collection', tr('collection.' + f.collectionFilter), () => f.setCollectionFilter('all')]);
  if (f.typeFilter !== 'all') chips.push(['type', tr(f.typeFilter === 'film' ? 'type.films' : 'type.series'), () => f.setTypeFilter('all')]);
  if (f.phaseFilter !== 'all') chips.push(['phase', tr('phase.label', { n: f.phaseFilter }), () => f.setPhaseFilter('all')]);
  if (f.budgetFilter !== 'all') chips.push(['budget', tr('budget.' + f.budgetFilter), () => f.setBudgetFilter('all')]);
  const clearAll = () => {
    f.setSearch(''); f.setCollectionFilter('all'); f.setTypeFilter('all');
    f.setPhaseFilter('all'); f.setBudgetFilter('all');
  };
  const count = showing === total ? tr('header.count', { n: total }) : tr('header.countOf', { shown: showing, total });
  // Keep the canvas pan/pinch handlers from treating a click here as a drag.
  const stop = e => e.stopPropagation();

  if (variant === 'float') {
    return (
      <div className={`ctx ctx-float${inList ? ' ctx-static' : ''}`} onMouseDown={stop} onWheel={stop}>
        <span className="ctx-count" role="status">{count}</span>
        {chips.map(([key, label, clear]) => (
          <button key={key} className="ctx-chip" onClick={clear} title={tr('context.remove', { label })}
            aria-label={tr('context.remove', { label })}>
            {label}<span aria-hidden="true">×</span>
          </button>
        ))}
        {chips.length > 1 && <button className="ctx-clear" onClick={clearAll}>{tr('filters.clearAll')}</button>}
      </div>
    );
  }

  return (
    <div className={`ctx ctx-${variant}`} onTouchStart={stop} onMouseDown={stop}>
      <span className="ctx-text" role="status">
        <span className="ctx-seg"><b>{count}</b></span>
        {chips.length > 0 && <>{' '}<span className="ctx-seg ctx-nfilters">· {tr('context.filters', { n: chips.length })}</span></>}
      </span>
      {chips.length > 0 && <button className="ctx-clear" onClick={clearAll}>{tr('context.clear')}</button>}
    </div>
  );
}

// Compute layout positions per sort mode on an even grid: cards in a row share
// a top edge and neighbours are a constant distance apart (a per-card random
// offset used to make gaps uneven and could make release neighbours overlap).
// Release/chronology flow left-to-right in phase bands; the others use rows.
// In-story eras for the Chrono rows. A title's era comes from the first year of
// its story; titles without one (Multiverse, outside time, unannounced) stay in
// the era of the title before them in story order, so rows only ever advance.
const ERA_STARTS = [2008, 2013, 2016, 2019, 2025, 2027];
function storyYear(t) {
  const m = /(\d{3,4})/.exec(t.story || '');
  if (!m) return null;
  return /BC/.test(t.story) ? -Number(m[1]) : Number(m[1]);
}
function chronoEras(titles) {
  const out = {};
  let era = 0;
  titles.slice().sort((a, b) => a.chronOrder - b.chronOrder).forEach(t => {
    const y = storyYear(t);
    if (y !== null) era = ERA_STARTS.filter(s => y >= s).length;
    out[t.id] = era;
  });
  return out;
}

function computeLayout(titles, sort, dir = DEFAULT_SORT_DIR[sort]) {
  const ordered = sortTitles(titles, sort, dir);
  const positions = {};
  let layoutBands = [];
  const colW = CARD_W + 60;
  const rowH = CARD_H + 70;

  if (sort === 'phase') {
    // Group by phase into vertical lanes
    const byPhase = {1:[],2:[],3:[],4:[],5:[],6:[]};
    ordered.forEach(t => byPhase[t.phase].push(t));
    let y = 60;
    Object.keys(byPhase).sort((a,b) => (dir === 'desc' ? -1 : 1) * (Number(a) - Number(b))).forEach(p => {
      const list = byPhase[p];
      const cols = Math.max(6, Math.ceil(Math.sqrt(list.length * 1.6)));
      list.forEach((t, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        positions[t.id] = {
          x: 80 + col * colW,
          y: y + row * rowH,
        };
      });
      const rows = Math.ceil(list.length / cols);
      y += rows * rowH + 80;
    });
  } else if (sort === 'imdb' || sort === 'rt' || sort === 'title') {
    // Use the same ordering as Grid/List; layout must not silently re-sort it.
    const cols = 7;
    ordered.forEach((t,i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions[t.id] = {
        x: 80 + col * colW,
        y: 80 + row * rowH,
      };
    });
  } else {
    // Release or chronology flows left-to-right in the selected direction, one
    // row per band: phases for Release, in-story eras for Chrono. Story order
    // rises through the eras the way release order rises through the phases,
    // so both read as a staircase (phase rows made Chrono zigzag, since e.g.
    // Captain Marvel is Phase 3 but set in 1995).
    const chrono = sort === 'chrono';
    const eraOf = chrono ? chronoEras(titles) : null;
    const bands = {};
    ordered.forEach((t, i) => {
      const x = 80 + i * (CARD_W * 1.15);
      const row = chrono ? eraOf[t.id] : t.phase - 1;
      const y = 80 + row * (rowH * 1.25);
      positions[t.id] = { x, y };
      const b = bands[row] || (bands[row] = { row, x, y, years: [] });
      if (x < b.x) b.x = x;
      if (chrono) { const yr = storyYear(t); if (yr !== null) b.years.push(yr); } else b.phase = t.phase;
    });
    layoutBands = Object.values(bands).map(b => chrono
      ? { x: b.x, y: b.y, era: b.row, from: b.years.length ? Math.min(...b.years) : null, to: b.years.length ? Math.max(...b.years) : null }
      : { x: b.x, y: b.y, phase: b.phase });
  }

  // Compute canvas bounds
  let maxX = 0, maxY = 0;
  Object.values(positions).forEach(p => {
    if (p.x + CARD_W > maxX) maxX = p.x + CARD_W;
    if (p.y + CARD_H > maxY) maxY = p.y + CARD_H;
  });
  return { positions, bands: layoutBands, width: maxX + 120, height: maxY + 120 };
}

function Card({ title, pos, onClick, onHover, onDragStart, isSelected, isHighlighted, isDimmed, isCollDimmed, isRingHidden, isDragging, isCurrent, curColor, matchedChars, searchQuery, scale }) {
  const phaseColor = PHASE_COLORS[title.phase];
  const downRef = useRef({ x: 0, y: 0, moved: false });
  const { statusOf } = window.useCollection();
  const status = statusOf(title.id);
  // Below TSA_MIN_SCALE the toggles are rendered smaller than a usable hit
  // target, so they withdraw and the seen state reads as a static marker only.
  const showActions = (scale || 1) >= window.TSA_MIN_SCALE;
  return (
    <div
      data-id={title.id}
      className={`card ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''} ${isCollDimmed ? 'coll-dim' : ''}${isRingHidden ? ' ring-hidden' : ''} ${status === 'seen' ? 'seen' : ''} ${status === 'watchlist' ? 'listed' : ''} ${isDragging ? 'dragging' : ''}${isCurrent ? ' current' : ''}`}
      style={{
        '--phase-color': phaseColor,
        ...(isCurrent && curColor ? { '--cur-color': curColor } : {}),
        // 2D on purpose: a 3D transform would give each of the 64 cards its own
        // GPU layer, which phones cannot afford when zoomed far out.
        transform: `translate(${pos.x}px, ${pos.y}px) scale(var(--lift, 1))`,
        width: CARD_W + 'px',
        height: CARD_H + 'px',
      }}
      onMouseDown={(e) => {
        downRef.current = { x: e.clientX, y: e.clientY, moved: false };
        onDragStart(e, title.id);
      }}
      onClick={(e) => {
        const dx = Math.abs(e.clientX - downRef.current.x);
        const dy = Math.abs(e.clientY - downRef.current.y);
        if (dx < 4 && dy < 4) onClick();
      }}
      onMouseEnter={() => onHover(title.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="card-poster">
        <PosterArt title={title}/>
        <div className="card-badges">
          <span className="badge type-badge">{I18N.upper(typeLabel(title.type))}</span>
          <span className="badge phase-badge" style={{background: phaseColor, color:'#0a0c14'}}>{phaseLabel(title.phase)}</span>
        </div>
        {showActions
          ? <window.TitleStatusActions title={title} className="card-tsa"/>
          : <span className="card-seen-mark"><window.SeenMarker seen={status === 'seen'}/></span>}
        <div className="rating-row">
          {title.imdb != null && (
            <div className="card-rating imdb" title={tr(title.type === 'series' ? 'score.imdbSeries' : 'score.imdbMovie')}>
              <span className="imdb-tag">IMDb</span>
              {title.imdb.toFixed(1)}
            </div>
          )}
          {title.rt != null && (
            <div className="card-rating rt" title={tr('score.rt')}>
              <span className="rt-tag">RT</span>
              {title.rt}%
            </div>
          )}
        </div>
      </div>
      <div className="card-meta">
        <div className="card-title"><window.Highlight text={I18N.titleName(title)} query={searchQuery}/></div>
        <div className="card-year">
          <span>{title.year}</span>
          {title.budget != null && (
            <span className="card-budget">{I18N.budget(title.budget)}</span>
          )}
        </div>
        <window.StoryYear title={title} className="card-story"/>
        <window.MatchBadge matchedChars={matchedChars} query={searchQuery}/>
      </div>
    </div>
  );
}

function CastDrawer({ title: current, onClose, onCharacterClick, hoveredCharacter, onCharacterHover, activeChar, search }) {
  // Slide in and out: mount closed and open on the next frame, and keep showing
  // the last title while it slides away. Switching titles swaps the content.
  const [title, setTitle] = useState(current);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!current) { setOpen(false); return; }
    setTitle(current);
    let inner = 0;
    const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(() => setOpen(true)); });
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
  }, [current]);
  if (!title) return null;
  return (
    <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open}
      onTransitionEnd={e => { if (!current && e.target === e.currentTarget) setTitle(null); }}>
      <header className="drawer-header">
        <div>
          <div className="drawer-eyebrow" style={{color: PHASE_COLORS[title.phase]}}>{phaseLabel(title.phase)} · {I18N.upper(typeLabel(title.type))} · {title.year}</div>
          <h2 className="drawer-title"><window.Highlight text={I18N.titleName(title)} query={search}/></h2>
          <window.StoryYear title={title} detail className="drawer-story"/>
          <window.Synopsis title={title} className="drawer-synopsis"/>
          <window.TitleStatusActions title={title} variant="inline" className="drawer-tsa"/>
        </div>
        <button className="drawer-close" onClick={onClose} aria-label={tr('details.close')}>×</button>
      </header>
      <div className="drawer-section-label">{tr('details.cast', { n: title.cast.length })}</div>
      <div className="cast-list">
        {title.cast.length === 0 && <div className="empty-cast">{tr('details.noCast')}</div>}
        {title.cast.map(ch => {
          const c = window.CHARACTERS[ch];
          if (!c) return null;
          const isActive = activeChar === ch;
          return (
            <button
              key={ch}
              data-char={ch}
              style={{ '--match-color': c.color }}
              className={`cast-row ${isActive ? 'active' : ''}`}
              onClick={() => onCharacterClick(ch)}
              onMouseEnter={() => onCharacterHover(ch)}
              onMouseLeave={() => onCharacterHover(null)}
            >
              <div className="portrait" style={{background:`linear-gradient(135deg, ${c.color}, ${c.color}88)`}}>
                <window.Portrait
                  url={window.MEDIA && window.MEDIA.actors && window.MEDIA.actors[ch] ? (window.mediaURL ? window.mediaURL('a', ch, window.MEDIA.profile_base + window.MEDIA.actors[ch]) : window.MEDIA.profile_base + window.MEDIA.actors[ch]) : null}
                  alt={I18N.charName(ch)} initials={c.initials}/>
              </div>
              <div className="cast-text">
                <div className="char-name"><window.Highlight text={I18N.charName(ch)} query={search}/></div>
                <div className="actor-name"><window.Highlight text={c.actor} query={search}/></div>
              </div>
              <div className="cast-color-dot" style={{background:c.color}}/>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// [sort, icon]; labels come from the active language (sort.* / sort.short.*).
const SORT_OPTIONS = [['release','▤'],['chrono','⇄'],['phase','◫'],['title','⇅'],['imdb','★'],['rt','◉']];

function Toolbar({ onAbout, onPickTitle, onPickPerson, desktopView, setDesktopView, sort, setSort, sortDir, setSortDir, phaseFilter, setPhaseFilter, typeFilter, setTypeFilter, budgetFilter, setBudgetFilter, collectionFilter, setCollectionFilter, search, setSearch }) {
  const [popOpen, setPopOpen] = useState(false);
  const popRef = useRef(null);
  // Collection has its own always-visible switch, so it is not counted here.
  const activeFilters = (phaseFilter !== 'all' ? 1 : 0) + (budgetFilter !== 'all' ? 1 : 0);
  useEffect(() => {
    if (!popOpen) return;
    const away = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setPopOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setPopOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [popOpen]);
  // Grouped like the mobile header. The top row holds the brand, then search,
  // order, filters and type, then language + account at the right edge; on
  // narrower desktops the search group wraps onto its own row (CSS). Below it:
  // sort modes and the collection switch.
  return (
    <div className="toolbar">
      <div className="tb-row tb-top-row">
        <div className="brand">
          <div className="brand-mark"/>
          <div className="brand-title">{tr('app.name')}</div>
        </div>
        <div className="tb-filter-row">
          <div className="search-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
            <window.SearchInput value={search} onChange={setSearch} onPickTitle={onPickTitle} onPickPerson={onPickPerson}
              ariaLabel={tr('search.aria')} placeholder={tr('search.placeholder')}/>
          </div>
          <div className="tb-order-control">
            <span className="tb-order-label">{tr('order.label')}</span>
            <window.SortOrderMenu sort={sort} sortDir={sortDir} setSortDir={setSortDir}/>
          </div>
          <div className="filters-pop-wrap" ref={popRef}>
            <button className={`filters-pill${popOpen?' open':''}${activeFilters?' active':''}`} onClick={()=>setPopOpen(o=>!o)}
              aria-label={activeFilters ? tr('filters.aria', { n: activeFilters }) : tr('filters.title')} title={tr('filters.title')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
              <span className="filters-label">{tr('filters.title')}</span>{activeFilters ? <span className="fcount">{activeFilters}</span> : null}
            </button>
            {popOpen && (
              <div className="filters-pop">
                <div className="control-group">
                  <label>{tr('filters.phase')}</label>
                  <div className="segmented">
                    {['all','1','2','3','4','5','6'].map(p=>(
                      <button key={p} className={phaseFilter===p?'on':''} onClick={()=>setPhaseFilter(p)}
                        style={p!=='all' && phaseFilter===p ? {background:PHASE_COLORS[p],color:'#0a0c14',borderColor:PHASE_COLORS[p]} : {}}
                      >{p==='all'?tr('filters.all'):p}</button>
                    ))}
                  </div>
                </div>
                <div className="control-group">
                  <label>{tr('filters.budget')}</label>
                  <div className="segmented">
                    {[['all','filters.all'],['low','budget.low'],['mid','budget.mid'],['high','budget.high'],['mega','budget.mega']].map(([v,k])=>(
                      <button key={v} className={budgetFilter===v?'on':''} onClick={()=>setBudgetFilter(v)}>{tr(k)}</button>
                    ))}
                  </div>
                </div>
                <div className="control-group">
                  <label>{tr('order.label')}</label>
                  <div className="segmented">
                    {sortDirectionLabels(sort).map((label, i) => (
                      <button key={label} className={sortDir===(i===0?'asc':'desc')?'on':''}
                        aria-pressed={sortDir===(i===0?'asc':'desc')}
                        onClick={()=>setSortDir(i===0?'asc':'desc')}>{label}</button>
                    ))}
                  </div>
                </div>
                {activeFilters > 0 && (
                  <button className="pop-clear" onClick={()=>{ setPhaseFilter('all'); setBudgetFilter('all'); }}>{tr('filters.clear')}</button>
                )}
              </div>
            )}
          </div>
          <div className="control-group tb-type-controls">
            <div className="segmented">
              {[['all','type.all'],['film','type.films'],['series','type.series']].map(([v,k])=>(
                <button key={v} className={typeFilter===v?'on':''} onClick={()=>setTypeFilter(v)}>{tr(k)}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="tb-end">
          <window.LanguageMenu/>
          <window.AccountButton onPickCollection={setCollectionFilter} onAbout={onAbout}/>
        </div>
      </div>
      <div className="tb-row tb-sort-row">
        <div className="control-group tb-sort-controls">
          <div className="segmented">
            {SORT_OPTIONS.map(([v,ic])=>(
              <button key={v} className={sort===v?'on':''} onClick={()=>setSort(v)} aria-pressed={sort===v} title={tr('sort.' + v)}>
                <span className="si">{ic}</span><span className="lg">{tr('sort.' + v)}</span><span className="sm">{tr('sort.short.' + v)}</span>
              </button>
            ))}
          </div>
        </div>
        <window.CollectionSwitch value={collectionFilter} onChange={setCollectionFilter}/>
        <div className="segmented tb-view-switch" role="group" aria-label={tr('view.label')}>
          {[['spatial', '◈'], ['list', '☰']].map(([v, ic]) => (
            <button key={v} className={desktopView === v ? 'on' : ''} aria-pressed={desktopView === v}
              title={tr('view.' + v)} aria-label={tr('view.' + v)} onClick={() => setDesktopView(v)}>
              <span className="vi" aria-hidden="true">{ic}</span><span className="vl">{tr('view.' + v)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Connection layer with bolder lines and improved bezier control
// Label pill width from the rendered name (11px Inter, dot + 20px on the
// left, 12px on the right), so short and long names get the same padding.
let labelMeasure = null;
function labelPillWidth(text) {
  try {
    if (!labelMeasure) labelMeasure = document.createElement('canvas').getContext('2d');
    labelMeasure.font = '500 11px Inter, sans-serif';
    return Math.ceil(labelMeasure.measureText(text).width) + 32;
  } catch (e) {
    return Math.ceil(text.length * 6.6) + 32;
  }
}

function FloatingConnections({ visibleTitles, positions, hoveredTitle, activeChar, onHoverConnection, hoveredConnection, selectedId, focusId, pair, onPickConnection, avoidIds }) {
  // Group appearances by prime identity so variants share one continuous thread,
  // but remember which specific variant appeared in each title.
  // One appearance per (prime, title): several variants of the same identity can share a
  // title (the three Peters in No Way Home) — that is not a connection between titles.
  const primeToAppearances = {};
  visibleTitles.forEach(t => {
    t.cast.forEach(c => {
      const p = primeOf(c);
      if (!primeToAppearances[p]) primeToAppearances[p] = {};
      if (!primeToAppearances[p][t.id]) {
        primeToAppearances[p][t.id] = { id: t.id, variant: c, release: t.release };
      }
    });
  });

  // Build pairs: connect consecutive (release-ordered) appearances of each prime identity
  const grouped = {};
  Object.values(primeToAppearances).forEach(byTitle => {
    const apps = Object.values(byTitle);
    if (apps.length < 2) return;
    const ordered = apps.sort((a,b) => a.release.localeCompare(b.release) || a.id.localeCompare(b.id));
    for (let i = 0; i < ordered.length - 1; i++) {
      const a = ordered[i], b = ordered[i+1];
      if (a.id === b.id) continue;
      const key = a.id + '__' + b.id;
      if (!grouped[key]) grouped[key] = { a: a.id, b: b.id, characters: [] };
      // Label/colour the segment by the variant present at the earlier title
      if (!grouped[key].characters.includes(a.variant)) grouped[key].characters.push(a.variant);
    }
  });
  const connections = Object.values(grouped);

  // Control point of a connection's curve. Titles on the same row (neighbours
  // on a timeline or grid) would be joined by a line hidden behind the cards,
  // so those arc below the row instead, one lane per character (`lane`).
  // The pair view keeps its two cards apart with nothing between, so it uses
  // the normal gentle curve.
  function control(p1, p2, offset, lane, straight) {
    const x1 = p1.x + CARD_W/2, y1 = p1.y + CARD_H/2;
    const x2 = p2.x + CARD_W/2, y2 = p2.y + CARD_H/2;
    const dx = x2 - x1, dy = y2 - y1;
    if (!straight && Math.abs(dy) < CARD_H * 0.5) {
      const depth = CARD_H / 2 + 34 + lane * 9 + Math.min(70, Math.abs(dx) * 0.04);
      return { x1, y1, x2, y2, cx: (x1 + x2) / 2, cy: Math.max(y1, y2) + depth * 2 };
    }
    const dist = Math.hypot(dx, dy) || 1;
    const nx = -dy/dist, ny = dx/dist;
    const sag = Math.min(120, 30 + dist * 0.15);
    return { x1, y1, x2, y2, cx: (x1+x2)/2 + nx * (sag*0.6 + offset), cy: (y1+y2)/2 + ny * (sag*0.6 + offset) };
  }
  function curve(p1, p2, offset, lane, straight) {
    const c = control(p1, p2, offset, lane, straight);
    return `M ${c.x1} ${c.y1} Q ${c.cx} ${c.cy} ${c.x2} ${c.y2}`;
  }

  // Compute label point along curve at parameter t (0..1)
  function pointOnCurve(p1, p2, offset, t, lane, straight) {
    const { x1, y1, x2, y2, cx, cy } = control(p1, p2, offset, lane, straight);
    // Quadratic bezier at t
    const u = 1 - t;
    return {
      x: u*u*x1 + 2*u*t*cx + t*t*x2,
      y: u*u*y1 + 2*u*t*cy + t*t*y2,
    };
  }

  // Card rectangles, so labels can avoid sitting on a card.
  const cardRects = visibleTitles.filter(t => !avoidIds || avoidIds.has(t.id)).map(t => positions[t.id]).filter(Boolean)
    .map(p => ({ x0: p.x - 6, y0: p.y - 6, x1: p.x + CARD_W + 6, y1: p.y + CARD_H + 6 }));
  const coveredBy = (x, y, w, h) => cardRects.find(r => x + w / 2 > r.x0 && x - w / 2 < r.x1 && y + h / 2 > r.y0 && y - h / 2 < r.y1);
  // Best spot for a label near point(t0) on its curve: the closest point along
  // the curve that no card covers; failing that, just above or below the card
  // in the way; failing that, the original point (labels draw above the cards
  // either way, so they stay readable).
  function placeLabel(point, t0, w, h) {
    let best = null, bestCost = Infinity;
    const steps = [0, -0.08, 0.08, -0.16, 0.16, -0.24, 0.24, -0.32, 0.32];
    steps.forEach(d => {
      const t = Math.min(0.92, Math.max(0.08, t0 + d));
      const p = point(t);
      const r = coveredBy(p.x, p.y, w, h);
      if (!r) {
        const cost = Math.abs(d);
        if (cost < bestCost) { best = p; bestCost = cost; }
        return;
      }
      [r.y0 - h / 2 - 2, r.y1 + h / 2 + 2].forEach(y => {
        if (coveredBy(p.x, y, w, h)) return;
        const cost = 0.4 + Math.abs(d) + Math.abs(y - p.y) / 400;
        if (cost < bestCost) { best = { x: p.x, y }; bestCost = cost; }
      });
    });
    return best || point(t0);
  }

  // First pass: render lines + endpoints, collect labels for collision resolution
  const labels = [];

  const lineEls = connections.map(conn => {
    const p1 = positions[conn.a], p2 = positions[conn.b];
    if (!p1 || !p2) return null;
    const isHovered = hoveredConnection && hoveredConnection.a === conn.a && hoveredConnection.b === conn.b;
    const isPair = pair && pair.a === conn.a && pair.b === conn.b;
    const involvesFocus = focusId && (focusId === conn.a || focusId === conn.b);
    const anyFocus = focusId || hoveredConnection || activeChar || pair;
    const N = conn.characters.length;

    return conn.characters.map((ch, i) => {
      const charObj = window.CHARACTERS[ch];
      if (!charObj) return null;
      const offsetIdx = i - (N - 1) / 2;
      const offset = offsetIdx * 14;
      // A hovered character narrows everything to that character's thread, so
      // no other line stays lit while leading into a dimmed card. Otherwise the
      // pair view, a hovered line or the focused title's lines are lit.
      const isChar = activeChar && primeOf(ch) === primeOf(activeChar);
      const emphasized = pair ? isPair : activeChar ? isChar : (isHovered || involvesFocus);
      const dimmed = anyFocus && !emphasized;
      const baseOpacity = dimmed ? 0.05 : (emphasized ? 1 : 0.55);
      const strokeW = emphasized ? 3 : 1.8;
      const showLabel = emphasized && (isPair || involvesFocus);

      if (showLabel) {
        // Spread labels along the curve based on N: t in (0.15..0.85), then
        // move each to the nearest spot not covered by a card (see placeLabel).
        const t0 = N === 1 ? 0.5 : 0.15 + (i / (N - 1)) * 0.7;
        const labelText = I18N.charName(ch);
        const labelW = labelPillWidth(labelText);
        const lp = placeLabel(t => pointOnCurve(p1, p2, offset, t, i, isPair), t0, labelW, 22);
        labels.push({ x: lp.x, y: lp.y, w: labelW, h: 22, color: charObj.color, text: labelText, key: conn.a + '__' + conn.b + '__' + ch });
      }

      return (
        <g key={ch+i+conn.a+conn.b}>
          {emphasized && (
            <path d={curve(p1,p2,offset,i,isPair)} fill="none" stroke={charObj.color} strokeWidth={strokeW + 6} opacity={0.25} filter="url(#strong-glow)" strokeLinecap="round"/>
          )}
          <path
            d={curve(p1,p2,offset,i,isPair)}
            data-a={conn.a} data-b={conn.b} data-ch={ch} data-em={emphasized ? '1' : '0'}
            onClick={(e) => { e.stopPropagation(); if (onPickConnection) onPickConnection({ a: conn.a, b: conn.b }); }}
            style={{transition:'opacity 220ms, stroke-width 220ms', cursor: 'pointer'}}
            fill="none"
            stroke={charObj.color}
            strokeWidth={strokeW}
            opacity={baseOpacity}
            strokeLinecap="round"
            filter={emphasized ? 'url(#line-glow)' : undefined}
            pointerEvents="stroke"
            onMouseEnter={(e)=>onHoverConnection({a:conn.a,b:conn.b,characters:conn.characters,x:e.clientX,y:e.clientY})}
            onMouseLeave={()=>onHoverConnection(null)}
          />
          {emphasized && (
            <>
              <circle cx={p1.x + CARD_W/2} cy={p1.y + CARD_H/2} r={5} fill={charObj.color} opacity={0.9} filter="url(#strong-glow)"/>
              <circle cx={p2.x + CARD_W/2} cy={p2.y + CARD_H/2} r={5} fill={charObj.color} opacity={0.9} filter="url(#strong-glow)"/>
            </>
          )}
        </g>
      );
    });
  });

  // Resolve label collisions: simple iterative push-apart
  // Sort by y then x for stable ordering
  labels.sort((a, b) => a.y - b.y || a.x - b.x);
  const padX = 14, padY = 10;
  for (let pass = 0; pass < 12; pass++) {
    let moved = false;
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const a = labels[i], b = labels[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDX = (a.w + b.w)/2 + padX;
        const minDY = (a.h + b.h)/2 + padY;
        if (Math.abs(dx) < minDX && Math.abs(dy) < minDY) {
          // Resolve along axis with smaller overlap
          const overlapX = minDX - Math.abs(dx);
          const overlapY = minDY - Math.abs(dy);
          if (overlapY <= overlapX) {
            const push = (overlapY / 2) + 1;
            const dir = dy >= 0 ? 1 : -1;
            a.y -= push * dir;
            b.y += push * dir;
          } else {
            const push = (overlapX / 2) + 1;
            const dir = dx >= 0 ? 1 : -1;
            a.x -= push * dir;
            b.x += push * dir;
          }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  const labelEls = labels.map(l => (
    <g key={'lbl_' + l.key} style={{pointerEvents:'none'}}>
      <rect x={l.x - l.w/2} y={l.y - l.h/2 + 2} width={l.w} height={l.h} rx={l.h/2} fill="#000" opacity="0.45"/>
      <rect x={l.x - l.w/2} y={l.y - l.h/2} width={l.w} height={l.h} rx={l.h/2}
        fill="#0a0c14" stroke={l.color} strokeWidth="1.2" opacity="0.97"/>
      <circle cx={l.x - l.w/2 + 11} cy={l.y} r={3.5} fill={l.color}/>
      <text x={l.x - l.w/2 + 20} y={l.y + 3.6} fontSize="11" fontFamily="Inter, sans-serif" fontWeight="500" fill="#e6e8f0">{l.text}</text>
    </g>
  ));

  return (
    <>
    <svg className="connection-layer" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', overflow:'visible'}}>
      <defs>
        <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="strong-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {lineEls}
      <style>{`.connection-layer path { pointer-events: stroke; }`}</style>
    </svg>
    {/* Labels above the cards (z-index in styles.css), so none hides behind one. */}
    <svg className="connection-labels" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', overflow:'visible'}}>
      {labelEls}
    </svg>
    </>
  );
}

// Display preferences (V3-SPEC D6): device-scoped, localStorage only, not tied to
// the account and not cleared on sign-out. Saves the mobile view mode, the
// desktop view (Spatial or List), the sort mode and the order direction. Filters, search and the
// spatial camera deliberately start fresh each visit, so nobody returns to a
// silently filtered catalog. Nothing is written until the visitor changes one of
// these, so first visits keep following the defaults below. Missing, malformed or
// unknown values fall back to those defaults.
const PREFS_KEY = 'mcu.prefs.v1';
const PREFS_VERSION = 1;
const VIEW_MODE_VALUES = ['list', 'grid', 'spatial'];
const DESKTOP_VIEW_VALUES = ['spatial', 'list'];

function readDisplayPrefs() {
  const prefs = { viewMode: 'list', desktopView: 'spatial', sort: 'release', sortDir: DEFAULT_SORT_DIR.release };
  let parsed = null;
  try {
    parsed = JSON.parse(window.localStorage.getItem(PREFS_KEY) || 'null');
  } catch (e) {
    return prefs; // Storage disabled, or not valid JSON.
  }
  if (!parsed || typeof parsed !== 'object' || parsed.version !== PREFS_VERSION) return prefs;
  if (VIEW_MODE_VALUES.indexOf(parsed.viewMode) !== -1) prefs.viewMode = parsed.viewMode;
  if (DESKTOP_VIEW_VALUES.indexOf(parsed.desktopView) !== -1) prefs.desktopView = parsed.desktopView;
  if (Object.prototype.hasOwnProperty.call(DEFAULT_SORT_DIR, parsed.sort)) {
    prefs.sort = parsed.sort;
    prefs.sortDir = parsed.sortDir === 'asc' || parsed.sortDir === 'desc' ? parsed.sortDir : DEFAULT_SORT_DIR[parsed.sort];
  }
  return prefs;
}

function writeDisplayPrefs(prefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ version: PREFS_VERSION, ...prefs }));
  } catch (e) { /* Quota or disabled storage: the choice lasts for this visit only. */ }
}

function App() {
  // Re-render the whole tree when the language changes.
  const { lang } = window.useI18n();
  const [initialPrefs] = useState(readDisplayPrefs);
  const [sort, setSort] = useState(initialPrefs.sort);
  const [sortDir, setSortDir] = useState(initialPrefs.sortDir);
  const changeSort = (v) => { if (v === sort) return; setSort(v); setSortDir(DEFAULT_SORT_DIR[v] || 'asc'); };
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mediaReady, setMediaReady] = useState(!!window.MEDIA);
  const { states: collectionStates } = window.useCollection();

  useEffect(() => { setMediaReady(true); }, []);
  const device = useDevice();
  const isTouch = device !== 'desktop';
  // Mobile opens in List unless the visitor chose another view before. Desktop
  // has its own choice (Spatial by default, or List) so the two never fight.
  const [viewMode, setViewMode] = useState(initialPrefs.viewMode);
  const [desktopView, setDesktopView] = useState(initialPrefs.desktopView);
  const prefsLoaded = useRef(false);
  useEffect(() => {
    if (!prefsLoaded.current) { prefsLoaded.current = true; return; }
    writeDisplayPrefs({ viewMode, desktopView, sort, sortDir });
  }, [viewMode, desktopView, sort, sortDir]);
  const [drawerId, setDrawerId] = useState(null);
  const [sheet, setSheet] = useState(null);
  // Desktop About dialog (phones use the 'about' sheet).
  const [aboutOpen, setAboutOpen] = useState(false);
  // First visit: the same About content as a one-time welcome (about.jsx).
  const [welcome, setWelcome] = useState(() => !!window.MCU_WELCOME);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredTitle, setHoveredTitle] = useState(null);
  const [hoveredCharacter, setHoveredCharacter] = useState(null);
  const [hoveredConnection, setHoveredConnection] = useState(null);
  // A clicked connection: its two titles are brought side by side.
  const [pair, setPair] = useState(null);
  const [highlightedChar, setHighlightedChar] = useState(null);
  // Pinned character: show only their titles (default) or everything, dimmed.
  const [charOnly, setCharOnly] = useState(true);
  // The title the highlight stepper (‹ ›) is on.
  const [stepId, setStepId] = useState(null);
  // Set while pinning a character: the canvas glides to this title (or '*' to
  // frame the set) once the new layout exists, instead of resetting first.
  const pendingStepRef = useRef(null);
  // Per-card position overrides from dragging
  const [overrides, setOverrides] = useState({});
  const [draggingId, setDraggingId] = useState(null);
  const dragRef = useRef(null);

  // Pan + zoom
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [zoomEdit, setZoomEdit] = useState(null);
  const ZOOM_MIN = 0.05;
  // Below this zoom the canvas is drawn at screen resolution instead of as one
  // GPU layer. As a layer it is rasterized at full size, and zoomed far out the
  // whole 12,000px-wide canvas is on screen at once: iOS Safari runs out of
  // memory and reloads the tab when it is panned.
  const LAYER_MIN_SCALE = 0.3;

  // Camera glide, for programmatic returns only (see the selection return
  // below). Manual pan and zoom must stay instant, so any pointer or wheel input
  // on the viewport cancels it.
  const [cameraGlide, setCameraGlide] = useState(false);
  const glideTimer = useRef(null);
  const glideTo = useCallback((next) => {
    clearTimeout(glideTimer.current);
    setCameraGlide(true);
    setView(next);
    glideTimer.current = setTimeout(() => { glideTimer.current = null; setCameraGlide(false); }, 650);
  }, []);
  const stopGlide = useCallback(() => {
    if (!glideTimer.current) return;
    clearTimeout(glideTimer.current);
    glideTimer.current = null;
    setCameraGlide(false);
  }, []);
  // Where the camera was before a card was selected, so closing its details can
  // return there instead of leaving the viewport on the focus ring (laid out
  // near the canvas origin, i.e. the Phase 1 end of the timeline layouts).
  const viewRef = useRef(view);
  viewRef.current = view;
  const selectionReturnRef = useRef(null);
  // False until resetView has framed the canvas; the mobile canvas only exists
  // while Spatial is showing, so its camera is unframed after each visit.
  const cameraFramedRef = useRef(false);
  const viewportRef = useRef(null);
  const panRef = useRef({ panning: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  // Maps title id -> array of cast character ids whose name/actor matched the
  // search text (empty array if the title only matched on its own title text).
  // null when there's no active search.
  const searchCharMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const m = {};
    window.TITLES.forEach(t => {
      // Names in every language match, whichever language is showing.
      // Character-name matches come before actor-name ones, so "Sam" shows Sam
      // Wilson ahead of Nick Fury (Samuel L. Jackson) in the match badge.
      const byName = c => I18N.charNames(c).some(n => n.toLowerCase().includes(q));
      const chars = t.cast.filter(c => {
        const ch = window.CHARACTERS[c];
        return ch && (byName(c) || ch.actor.toLowerCase().includes(q));
      }).sort((a, b) => byName(b) - byName(a));
      if (I18N.titleNames(t).some(n => n.toLowerCase().includes(q)) || chars.length) m[t.id] = chars;
    });
    return m;
  }, [search]);

  // NOTE: the collection filter (seen/watchlist/unseen) deliberately does NOT
  // belong in here. `filtered` feeds computeLayout -> basePositions -> resetView,
  // which runs from a useLayoutEffect — so anything added to this memo re-lays-out
  // the spatial canvas and recenters the viewport. With "Unseen" active, marking a
  // title seen would make the card vanish and yank the viewport out from under the
  // cursor mid-click. Collection is a dimming treatment on the canvas, and a
  // separate `visible` memo downstream of `ordered` for the flat mobile lists.
  const filtered = useMemo(() => {
    let list = window.TITLES.slice();
    if (phaseFilter !== 'all') list = list.filter(t => String(t.phase) === phaseFilter);
    if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter);
    if (budgetFilter !== 'all') {
      list = list.filter(t => {
        const b = t.budget;
        if (b == null) return false;
        if (budgetFilter === 'low') return b < 50;
        if (budgetFilter === 'mid') return b >= 50 && b < 200;
        if (budgetFilter === 'high') return b >= 200 && b < 300;
        if (budgetFilter === 'mega') return b >= 300;
        return true;
      });
    }
    if (searchCharMatches) list = list.filter(t => searchCharMatches[t.id] !== undefined);
    // "Their titles": a pinned character narrows the layout like search does.
    // Deliberate (the visitor pins or toggles it), so re-laying out is expected.
    if (highlightedChar && (charOnly || isTouch)) {
      const prime = primeOf(highlightedChar);
      list = list.filter(t => t.cast.some(c => primeOf(c) === prime));
    }
    return list;
  }, [phaseFilter, typeFilter, budgetFilter, searchCharMatches, highlightedChar, charOnly, isTouch]);

  const layout = useMemo(() => computeLayout(filtered, sort, sortDir), [filtered, sort, sortDir, sort === 'title' ? lang : '']);
  const basePositions = layout.positions;
  // A new layout (sort, order, filters, a pinned character) makes the cards
  // glide for 600ms while the lines would be drawn at their final places at
  // once: hide the lines until the cards have landed, then fade them back in.
  // A layout effect, so the new lines never paint before they are hidden.
  const [linesSettling, setLinesSettling] = useState(false);
  const laidOutRef = useRef(false);
  useLayoutEffect(() => {
    if (!laidOutRef.current) { laidOutRef.current = true; return undefined; }
    setLinesSettling(true);
    const id = setTimeout(() => setLinesSettling(false), 520);
    return () => clearTimeout(id);
  }, [basePositions]);
  const canvasW = layout.width;
  const canvasH = layout.height;

  // Compute focus + related titles BEFORE positions, since positions reflows around focus.
  // Only the SELECTED (clicked) card triggers the rearrangement, not hover (which would flicker).
  const focusId = selectedId;
  const relatedIds = useMemo(() => {
    if (!focusId) return null;
    const focusTitle = window.TITLES.find(t => t.id === focusId);
    if (!focusTitle) return null;
    const set = new Set([focusId]);
    // Matched on the character's core identity, as the connection lines are
    // (Captain Carter joins Peggy Carter's thread), so every lit line ends in a
    // lit title.
    const focusCast = new Set(focusTitle.cast.map(primeOf));
    filtered.forEach(t => {
      if (t.id === focusId) return;
      if (t.cast.some(c => focusCast.has(primeOf(c)))) set.add(t.id);
    });
    return set;
  }, [focusId, filtered]);

  // While a title's rings are showing, only it and its connected titles stay
  // on the canvas: the rest fade out in place (in the grids they would sit
  // under the rings), and the lines are drawn among the ring's titles alone.
  const ringIds = !pair && relatedIds && relatedIds.size > 1 ? relatedIds : null;
  const lineTitles = useMemo(() => ringIds ? filtered.filter(t => ringIds.has(t.id)) : filtered, [filtered, ringIds]);

  // Hover-focus is separate: used only for dimming/labels, not reflow.
  const hoverFocusId = hoveredTitle || selectedId;
  const hoverRelatedIds = useMemo(() => {
    if (!hoverFocusId) return null;
    const ft = window.TITLES.find(t => t.id === hoverFocusId);
    if (!ft) return null;
    const set = new Set([hoverFocusId]);
    const cast = new Set(ft.cast.map(primeOf));
    filtered.forEach(t => {
      if (t.id === hoverFocusId) return;
      if (t.cast.some(c => cast.has(primeOf(c)))) set.add(t.id);
    });
    return set;
  }, [hoverFocusId, filtered]);

  // Effective positions: layout + focus reflow + per-card override
  const positions = useMemo(() => {
    const out = {};
    let focusLayout = null;
    // Pair view: the two titles side by side where they meet, with room for the
    // shared characters' labels between them; everything else stays put, dimmed.
    if (pair && basePositions[pair.a] && basePositions[pair.b]) {
      const pa = basePositions[pair.a], pb = basePositions[pair.b];
      const mx = (pa.x + pb.x) / 2 + CARD_W / 2, my = (pa.y + pb.y) / 2 + CARD_H / 2;
      const gap = PAIR_GAP;
      focusLayout = { [pair.a]: { x: mx - gap / 2 - CARD_W / 2, y: my }, [pair.b]: { x: mx + gap / 2 + CARD_W / 2, y: my } };
    } else
    if (focusId && relatedIds && relatedIds.size > 1) {
      const others = [...relatedIds].filter(id => id !== focusId);
      const focusTitle = window.TITLES.find(t => t.id === focusId);
      const focusCast = new Set(focusTitle.cast.map(primeOf));
      const scored = others.map(id => {
        const t = window.TITLES.find(x => x.id === id);
        const shared = t.cast.filter(c => focusCast.has(primeOf(c))).length;
        return { id, shared };
      }).sort((a,b) => b.shared - a.shared);
      const cx = 800, cy = 560;
      const compact = isTouch;
      const ringCaps = compact ? [5, 9, 14, 20] : [6, 10, 16, 22];
      const ringRadii = compact ? [340, 600, 860, 1120] : [480, 800, 1120, 1440];
      const placed = { [focusId]: { x: cx, y: cy } };
      let idx = 0;
      for (let ring = 0; ring < ringCaps.length && idx < scored.length; ring++) {
        const cap = Math.min(ringCaps[ring], scored.length - idx);
        const r = ringRadii[ring];
        for (let k = 0; k < cap; k++) {
          const angle = (k / cap) * Math.PI * 2 + (ring % 2) * (Math.PI / cap);
          placed[scored[idx].id] = {
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r * 0.7,
          };
          idx++;
        }
      }
      focusLayout = placed;
    }

    Object.entries(basePositions).forEach(([id, p]) => {
      const o = overrides[id];
      const f = focusLayout && focusLayout[id];
      out[id] = o ? { x: o.x, y: o.y } : (f ? { x: f.x - CARD_W/2, y: f.y - CARD_H/2 } : p);
    });
    return out;
  }, [basePositions, overrides, focusId, relatedIds, isTouch, pair]);

  // Reset overrides when sort/filter changes the layout
  useEffect(() => { setOverrides({}); }, [sort, sortDir, phaseFilter, typeFilter, budgetFilter, search]);

  const selectedTitle = selectedId ? window.TITLES.find(t => t.id === selectedId) : null;
  const drawerTitle = drawerId ? window.TITLES.find(t => t.id === drawerId) : null;
  const ordered = useMemo(() => sortTitles(filtered, sort, sortDir), [filtered, sort, sortDir, sort === 'title' ? lang : '']);

  // Real filtering, but only for the flat mobile grid/list — they have no layout
  // or viewport to disturb. Derived from `ordered` so the canvas keeps every card.
  const visible = useMemo(() => {
    if (collectionFilter === 'all') return ordered;
    return ordered.filter(t => window.matchesCollection(collectionStates[t.id] || 'none', collectionFilter));
  }, [ordered, collectionFilter, collectionStates]);

  // Only speak in collection terms when the collection filter is what emptied
  // the list — otherwise the generic "clear a filter or the search box" is right.
  const emptyCopy = (ordered.length > 0 && visible.length === 0)
    ? window.collectionEmptyCopy(collectionFilter)
    : null;

  // Keyed by prime identity, so highlighting any variant lights the whole thread
  const charToTitleIds = useMemo(() => {
    const m = {};
    filtered.forEach(t => t.cast.forEach(c => {
      const p = primeOf(c);
      if (!m[p]) m[p] = new Set();
      m[p].add(t.id);
    }));
    return m;
  }, [filtered]);

  const activeChar = highlightedChar || hoveredCharacter;
  const activePrime = activeChar ? primeOf(activeChar) : null;
  const highlightedIds = activePrime && charToTitleIds[activePrime] ? charToTitleIds[activePrime] : null;

  // The ids the active canvas filters single out. Collection status and a pinned
  // character are both *dimming* treatments — the cards stay in the layout — so
  // without this, Recenter frames the whole graph including everything dimmed,
  // and a handful of matches sitting far apart on a timeline layout can end up
  // entirely off-screen. Only the pinned character counts, not the hovered one,
  // so passing the cursor over the cast list can't move the viewport.
  const pinnedCharIds = useMemo(() => {
    if (!highlightedChar) return null;
    return charToTitleIds[primeOf(highlightedChar)] || null;
  }, [highlightedChar, charToTitleIds]);

  const recenterFocusIds = useMemo(() => {
    const sets = [];
    if (collectionFilter !== 'all') {
      const s = new Set();
      filtered.forEach(t => {
        if (window.matchesCollection(collectionStates[t.id] || 'none', collectionFilter)) s.add(t.id);
      });
      sets.push(s);
    }
    if (pinnedCharIds) sets.push(pinnedCharIds);
    if (!sets.length) return null;
    const both = sets.reduce((a, b) => new Set([...a].filter(id => b.has(id))));
    return both.size ? both : null;
  }, [filtered, collectionFilter, collectionStates, pinnedCharIds]);

  // Read through a ref inside resetView rather than as a dependency. If the
  // match set were a dependency, marking a title seen while "Unseen" is active
  // would change resetView's identity, fire the layout effect and recenter the
  // canvas mid-click — the exact failure §7.1 exists to prevent.
  const recenterFocusRef = useRef(null);
  recenterFocusRef.current = recenterFocusIds;

  // Also read through a ref, and for the same reason: resetView must not gain a
  // selectedId dependency or selecting a card would recenter the canvas. While
  // a card is selected the canvas shows the focus ring layout, whose positions
  // are not basePositions — so framing a match set then would aim the viewport
  // at coordinates the cards are no longer at.
  const selectedIdRef = useRef(null);
  selectedIdRef.current = selectedId;

  // Card drag handler
  const onCardDragStart = (e, id) => {
    e.stopPropagation();
    const start = positions[id] || { x: 0, y: 0 };
    dragRef.current = {
      id,
      sx: e.clientX,
      sy: e.clientY,
      ox: start.x,
      oy: start.y,
      moved: false,
      scale: view.scale,
    };
    setDraggingId(id);
  };
  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = (e.clientX - d.sx) / d.scale;
      const dy = (e.clientY - d.sy) / d.scale;
      if (!d.moved && Math.hypot(dx, dy) < 3) return;
      d.moved = true;
      setOverrides(prev => ({ ...prev, [d.id]: { x: d.ox + dx, y: d.oy + dy } }));
    };
    const onUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        setDraggingId(null);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);
  useEffect(() => {
    const onMove = (e) => {
      if (!panRef.current.panning) return;
      const dx = e.clientX - panRef.current.sx;
      const dy = e.clientY - panRef.current.sy;
      setView(v => ({ ...v, x: panRef.current.ox + dx, y: panRef.current.oy + dy }));
    };
    const onUp = () => { panRef.current.panning = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // Pan handlers
  const onMouseDown = (e) => {
    if (e.target.closest('.card') || e.target.closest('.toolbar') || e.target.closest('.drawer')) return;
    panRef.current = { panning: true, sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
  };

  const onWheel = (e) => {
    e.preventDefault();
    const rect = viewportRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0015;
    setView(v => {
      const newScale = Math.min(2, Math.max(ZOOM_MIN, v.scale * (1 + delta)));
      const ratio = newScale / v.scale;
      // zoom toward cursor
      const nx = mx - (mx - v.x) * ratio;
      const ny = my - (my - v.y) * ratio;
      return { x: nx, y: ny, scale: newScale };
    });
  };

  // Zoom about the viewport centre (button + typed-value controls)
  const applyScale = useCallback((next) => {
    const rect = viewportRef.current && viewportRef.current.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 0, cy = rect ? rect.height / 2 : 0;
    setView(v => {
      const ns = Math.min(2, Math.max(ZOOM_MIN, typeof next === 'function' ? next(v.scale) : next));
      const ratio = ns / v.scale;
      return { x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio, scale: ns };
    });
  }, []);
  const commitZoomEdit = useCallback(() => {
    setZoomEdit(cur => {
      const n = parseFloat(String(cur).replace('%', ''));
      if (!isNaN(n)) applyScale(n / 100);
      return null;
    });
  }, [applyScale]);

  const resetView = useCallback(() => {
    if (!viewportRef.current) return;
    // A layout change or Recenter supersedes any remembered pre-selection view.
    selectionReturnRef.current = null;
    cameraFramedRef.current = true;
    const rect = viewportRef.current.getBoundingClientRect();
    const colW = CARD_W + 60;
    const gridSort = sort === 'phase' || sort === 'title' || sort === 'imdb' || sort === 'rt';

    // The scale this sort opens at with no filter applied. Used as the yardstick
    // below: framing a match set is only an improvement if it doesn't mean
    // zooming out past the view you'd have had anyway.
    const defaultScale = gridSort
      ? Math.min(1, isTouch
          ? Math.max((rect.width - 32) / canvasW, rect.width / (colW * 3))
          : (rect.width - 32) / canvasW)
      // Timeline layouts open at about 7.5 titles across on desktop and 2.5 on
      // touch (one title step is CARD_W * 1.15), capped at 100%.
      : Math.min(1, Math.max(ZOOM_MIN, rect.width / (CARD_W * 1.15 * (isTouch ? 2.5 : 7.5))));

    // A dimming filter is active: frame exactly what it matches. Card positions
    // are not touched — only the viewport moves — so this stays inside the rule
    // that the collection filter must never reflow the graph.
    const focus = recenterFocusRef.current;
    if (focus && focus.size && !selectedIdRef.current) {
      let fx0 = Infinity, fy0 = Infinity, fx1 = -Infinity, fy1 = -Infinity;
      focus.forEach(id => {
        const p = basePositions[id];
        if (!p) return;
        if (p.x < fx0) fx0 = p.x;
        if (p.y < fy0) fy0 = p.y;
        if (p.x + CARD_W > fx1) fx1 = p.x + CARD_W;
        if (p.y + CARD_H > fy1) fy1 = p.y + CARD_H;
      });
      if (isFinite(fx0)) {
        const pad = isTouch ? 28 : 70;
        const w = fx1 - fx0, h = fy1 - fy0;
        // Always fit the whole match set, however far apart it is. On the
        // release and chronological layouts two matches at opposite ends only
        // fit at around 9%, which is small — but seeing where everything is and
        // zooming in beats being shown a subset with no clue the rest exists.
        // ZOOM_MIN is the only floor.
        const scale = Math.min(1, Math.max(ZOOM_MIN, Math.min(
          (rect.width - pad * 2) / w,
          (rect.height - pad * 2) / h
        )));
        setView({
          x: rect.width / 2 - (fx0 + w / 2) * scale,
          y: rect.height / 2 - (fy0 + h / 2) * scale,
          scale,
        });
        return;
      }
    }

    // Left/top-most card in canvas coords, so we can pad from the real content edge
    let minX = Infinity, minY = Infinity;
    Object.values(basePositions).forEach(p => { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; });
    if (!isFinite(minX)) { minX = 0; minY = 0; }
    // Aim for a legible card size rather than fitting the whole canvas.
    if (gridSort && isTouch && canvasW * defaultScale > rect.width - 32) {
      // Phones: a grid that fits three columns exactly looks complete, so pick a
      // zoom and top offset where the next column and row visibly peek past the
      // right and bottom edges, signalling that the canvas pans. Three whole
      // columns stay on screen. The top offset also clears the count pill.
      const xs = [], ys = [];
      Object.values(basePositions).forEach(p => { if (!xs.includes(p.x)) xs.push(p.x); if (!ys.includes(p.y)) ys.push(p.y); });
      xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
      // The hint bar fades in over the bottom of the canvas and its text covers
      // most of it: count all but its faint top quarter as hidden.
      const hint = document.querySelector('.m-ghint');
      const hintH = hint && hint.getClientRects().length ? hint.getBoundingClientRect().height : 0;
      const bottom = rect.height - hintH * 0.75;
      // How much of the first card cut by an edge shows, as a share of the card
      // (0 when the edge falls in a gap, so nothing peeks).
      const peek = (starts, size, origin, s, edge) => {
        for (const v of starts) {
          const a = origin + (v - starts[0]) * s, b = a + size * s;
          if (b > edge) return Math.max(0, (edge - a) / (size * s));
        }
        return null; // everything fits: nothing needs to peek
      };
      const miss = (f, lo, hi) => f === null ? 0 : f < lo ? lo - f : f > hi ? f - hi : 0;
      const pill = 44;
      let best = null;
      for (let s = Math.min(1, defaultScale); s >= defaultScale * 0.8; s -= 0.0025) {
        if (xs.length > 3 && 14 + (xs[2] - xs[0]) * s + CARD_W * s > rect.width) continue;
        const ph = peek(xs, CARD_W, 14, s, rect.width);
        for (let top = pill + 6; top <= pill + 70; top += 2) {
          const pv = peek(ys, CARD_H, top, s, bottom);
          const score = miss(ph, 0.22, 0.6) * 4 + miss(pv, 0.25, 0.6) * 4
            + (1 - s / defaultScale) + (top - pill) / 400;
          if (!best || score < best.score) best = { score, s, top };
        }
      }
      const scale = best ? best.s : defaultScale;
      setView({ x: 14 - xs[0] * scale, y: (best ? best.top : 14) - ys[0] * scale, scale });
    } else if (gridSort) {
      // Grid layouts: match the grid's width (mobile keeps a legibility floor of ~3 columns)
      const scale = defaultScale;
      const zoomed = canvasW * scale > rect.width - 32;
      setView({
        x: zoomed ? 14 - minX * scale : (rect.width - canvasW * scale) / 2,
        y: canvasH * scale <= rect.height - 32 ? (rect.height - canvasH * scale) / 2 : 14 - minY * scale,
        scale,
      });
    } else {
      // Timeline layouts step down one phase band at a time as they move right,
      // so anchoring the top-left corner left most of the screen empty. Centre
      // vertically on the titles actually in view horizontally instead; if they
      // are taller than the viewport, top-align them but keep the leading title
      // (which may sit in a lower band in reverse order) on screen.
      const scale = defaultScale;
      const left = minX - 14 / scale, right = left + rect.width / scale;
      let y0 = Infinity, y1 = -Infinity, leading = null;
      Object.values(basePositions).forEach(p => {
        if (!leading || p.x < leading.x) leading = p;
        if (p.x + CARD_W < left || p.x > right) return;
        if (p.y < y0) y0 = p.y;
        if (p.y + CARD_H > y1) y1 = p.y + CARD_H;
      });
      // Each row has its label 40 units above it, and the count pill sits at the
      // top-left of the viewport: keep the first label clear of it.
      const pill = isTouch ? 44 : 52;
      const top = pill + 40 * scale;
      let y = top - minY * scale;
      if (isFinite(y0)) {
        const yTop = y0 - 40;
        if ((y1 - yTop) * scale <= rect.height - 28 - pill) {
          y = Math.max(rect.height / 2 - ((yTop + y1) / 2) * scale, pill - yTop * scale);
        } else {
          y = top - y0 * scale;
          if (leading && (leading.y + CARD_H) * scale + y > rect.height - 14) y = rect.height - 14 - (leading.y + CARD_H) * scale;
        }
      }
      setView({ x: 14 - minX * scale, y, scale });
    }
  }, [canvasW, canvasH, basePositions, sort, isTouch]);

  // Reset view whenever layout changes
  useLayoutEffect(() => { if (!pendingStepRef.current) resetView(); }, [resetView]);

  // Recentering because the user changed a filter is intentional. Recentering
  // because the *contents* of the match set changed — someone marked a title
  // seen — is the bug §7.1 describes, so this keys off the filter identity
  // only and never off the matched ids.
  const prevFocusKey = useRef(null);
  useEffect(() => {
    const key = `${collectionFilter}|${highlightedChar || ''}`;
    if (prevFocusKey.current === null) { prevFocusKey.current = key; return; }
    if (prevFocusKey.current === key) return;
    prevFocusKey.current = key;
    // A selected card owns the viewport — the ring-layout auto-fit below is
    // driving it, and stepping on that would fight it mid-animation.
    if (selectedIdRef.current || pendingStepRef.current) return;
    resetView();
  }, [collectionFilter, highlightedChar, resetView]);

  // Entering Spatial (from List or Grid on touch, from List on desktop) mounts a
  // fresh canvas whose camera was never framed (it would open at 100% on the
  // top-left corner). Frame it, unless a card is already selected (opened from a
  // detail sheet or the List's drawer): the focus-ring auto-fit owns it then.
  const spatialShown = isTouch ? viewMode === 'spatial' : desktopView === 'spatial';

  // The desktop details drawer opens below the toolbar (its height changes with
  // the width and language), so the view switch, language and account stay
  // usable while a title is open.
  useLayoutEffect(() => {
    if (isTouch) return;
    const bar = document.querySelector('.toolbar');
    if (!bar) return;
    const set = () => document.documentElement.style.setProperty('--tb-h', bar.offsetHeight + 'px');
    set();
    if (!window.ResizeObserver) return;
    const ro = new ResizeObserver(set);
    ro.observe(bar);
    return () => ro.disconnect();
  }, [isTouch]);
  useLayoutEffect(() => {
    if (!spatialShown) { cameraFramedRef.current = false; return; }
    if (!selectedIdRef.current && !pendingStepRef.current) resetView();
  }, [spatialShown]);

  // Remember the camera when a card becomes selected; when the selection clears,
  // glide back so the visitor returns to where they were (e.g. Phase 6) rather
  // than the focus ring's spot near Phase 1. If they moved on to another card
  // through the ring, centre that card's layout position at the original zoom.
  // An unframed camera (selection opened straight into Spatial) gets a normal
  // reset instead.
  const prevSelectedRef = useRef(null);
  useEffect(() => {
    const prev = prevSelectedRef.current;
    prevSelectedRef.current = selectedId;
    if (selectedId && !prev) {
      selectionReturnRef.current = { view: cameraFramedRef.current ? viewRef.current : null, id: selectedId };
      return;
    }
    if (selectedId || !prev) return;
    const back = selectionReturnRef.current;
    selectionReturnRef.current = null;
    if (!back || !viewportRef.current) return;
    if (!back.view) { resetView(); return; }
    const p = basePositions[prev];
    if (prev === back.id || !p) { glideTo(back.view); return; }
    const rect = viewportRef.current.getBoundingClientRect();
    const scale = back.view.scale;
    glideTo({
      x: rect.width / 2 - (p.x + CARD_W / 2) * scale,
      y: rect.height / 2 - (p.y + CARD_H / 2) * scale,
      scale,
    });
  }, [selectedId]);

  // Auto-fit view to focused layout when a card is selected
  useEffect(() => {
    if (!selectedId || !viewportRef.current || !relatedIds) return;
    const p0 = positions[selectedId];
    if (isTouch) {
      // Centre on the focused card at a scale that keeps the first ring reachable
      if (!p0) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const scale = Math.max(0.26, Math.min(0.62, rect.width / 920));
      setView({
        x: rect.width / 2 - (p0.x + CARD_W/2) * scale,
        y: rect.height / 2 - (p0.y + CARD_H/2) * scale,
        scale,
      });
      return;
    }
    const ids = [...relatedIds];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ids.forEach(id => {
      const p = positions[id];
      if (!p) return;
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x + CARD_W > maxX) maxX = p.x + CARD_W;
      if (p.y + CARD_H > maxY) maxY = p.y + CARD_H;
    });
    if (!isFinite(minX)) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const drawerOffset = 380;
    const availW = rect.width - drawerOffset - 80;
    const availH = rect.height - 80;
    const w = maxX - minX, h = maxY - minY;
    const scale = Math.min(availW / w, availH / h, 1.1);
    setView({
      x: (rect.width - drawerOffset) / 2 - (minX + w/2) * scale,
      y: rect.height / 2 - (minY + h/2) * scale,
      scale,
    });
  }, [selectedId, relatedIds, isTouch]);

  // Touch gestures for the spatial canvas: pan, pinch, double-tap zoom, tap-background clear
  const touchRef = useRef(null);
  const lastTapRef = useRef(null);
  const onTouchStart = (e) => {
    if (e.target instanceof Element && e.target.closest('.zoom-ctl')) { touchRef.current = null; return; }
    if (e.touches.length === 2) {
      const a = e.touches[0], b = e.touches[1];
      const rect = viewportRef.current.getBoundingClientRect();
      touchRef.current = {
        mode: 'pinch',
        d: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY) || 1,
        scale: view.scale, vx: view.x, vy: view.y,
        mx: (a.clientX + b.clientX) / 2 - rect.left,
        my: (a.clientY + b.clientY) / 2 - rect.top,
      };
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      const el = e.target instanceof Element ? e.target : null;
      touchRef.current = {
        mode: 'pan', sx: t.clientX, sy: t.clientY, vx: view.x, vy: view.y, moved: false,
        onCard: !!(el && el.closest('.card, .m-focuspop')),
      };
    }
  };
  const onTouchMove = (e) => {
    const s = touchRef.current;
    if (!s) return;
    if (s.mode === 'pinch' && e.touches.length === 2) {
      const a = e.touches[0], b = e.touches[1];
      const d = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY) || 1;
      const ns = Math.min(2, Math.max(ZOOM_MIN, s.scale * (d / s.d)));
      const ratio = ns / s.scale;
      setView({ x: s.mx - (s.mx - s.vx) * ratio, y: s.my - (s.my - s.vy) * ratio, scale: ns });
    } else if (s.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - s.sx, dy = t.clientY - s.sy;
      if (!s.moved && Math.hypot(dx, dy) < 6) return;
      s.moved = true;
      setView(v => ({ ...v, x: s.vx + dx, y: s.vy + dy }));
    }
  };
  const onTouchEnd = (e) => {
    const s = touchRef.current;
    touchRef.current = null;
    if (!s || s.mode !== 'pan' || s.moved) return;
    const now = Date.now();
    const last = lastTapRef.current;
    const isDouble = last && now - last.t < 300 && Math.hypot(s.sx - last.x, s.sy - last.y) < 34;
    lastTapRef.current = { t: now, x: s.sx, y: s.sy };
    if (s.onCard) return;
    if (isDouble) {
      const rect = viewportRef.current.getBoundingClientRect();
      const mx = s.sx - rect.left, my = s.sy - rect.top;
      setView(v => {
        const ns = Math.min(2, v.scale * 1.7);
        const r = ns / v.scale;
        return { x: mx - (mx - v.x) * r, y: my - (my - v.y) * r, scale: ns };
      });
    } else {
      // Closing a title's rings brings the hidden cards straight back; the
      // click the browser synthesizes after this tap would then land on
      // whichever card is under the finger, so cancel it.
      if (selectedIdRef.current && e && e.cancelable) e.preventDefault();
      setSelectedId(null);
      setPair(null);
    }
  };

  const onCardTap = (id) => {
    setPair(null);
    // With a character pinned the canvas keeps their layout: a tap makes the
    // title current (if it is theirs) and opens its details, without the
    // connections ring.
    if (highlightedChar) {
      if (pinnedCharIds && pinnedCharIds.has(id)) setStepId(id);
      setDrawerId(!isTouch && drawerId === id ? null : id);
      return;
    }
    if (!isTouch) {
      const next = selectedId === id ? null : id;
      setSelectedId(next);
      setDrawerId(next);
      return;
    }
    if (viewMode === 'spatial') {
      if (selectedId === id) setDrawerId(id);
      else setSelectedId(id);
    } else {
      setDrawerId(id);
    }
  };

  // Collection has its own switch in the header, so the Filters badge skips it.
  // Grid and List animate when any of these change: sort, order, collection,
  // phase, films/series and budget. Search is left out so typing stays calm.
  const flipKey = [sort, sortDir, collectionFilter, phaseFilter, typeFilter, budgetFilter].join(':');
  const filterCount = (phaseFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (budgetFilter !== 'all' ? 1 : 0);
  // Spatial keeps every card on screen (dimmed), so it counts `filtered`; the
  // flat views actually drop non-matching rows and count what they render.
  // Switching to Spatial with a title open in the drawer selects that card, so
  // the canvas opens on its connections; switching to List keeps the drawer.
  // A title picked from the search suggestions opens its details (and, in
  // desktop Spatial, selects its card so the canvas shows its connections).
  const pickTitle = (id) => {
    setDrawerId(id);
    if (!isTouch && desktopView === 'spatial' && !highlightedChar) setSelectedId(id);
  };
  // A character picked from the search suggestions opens the character view
  // (photo, Their titles / All titles, stepper) rather than a text search, as
  // if pinned from a cast list. An actor counts when they play one character
  // (variants included); otherwise (two roles) the pick stays a text search.
  const pickPerson = (item, how = {}) => {
    let ch = null;
    if (item.kind === 'character') ch = item.id;
    else if (item.kind === 'actor') {
      const primes = new Set(item.chars.map(primeOf));
      if (primes.size !== 1) return false;
      const prime = [...primes][0];
      ch = item.chars.includes(prime) ? prime : item.chars[0];
    }
    // Checked against the whole catalog: another character may be pinned (so
    // the current titles are theirs) when this one is picked.
    if (!ch || !window.TITLES.some(t => t.cast.some(c => primeOf(c) === primeOf(ch)))) return false;
    setSearch('');
    if (highlightedChar !== ch) pinCharacter(ch);
    // The search box lets go of focus; after a keyboard pick on desktop, hand
    // it to the stepper so keyboard users can carry on through the titles.
    if (!isTouch && how.viaKeyboard) requestAnimationFrame(() => requestAnimationFrame(() => {
      const next = document.querySelector('.char-banner.pinned .cb-step button:last-child');
      if (next) next.focus();
    }));
    return true;
  };
  const changeDesktopView = (v) => {
    if (v === desktopView) return;
    setSelectedId(v === 'spatial' && !highlightedChar ? drawerId : null);
    setDesktopView(v);
  };
  const contextSummary = (variant, inList) => (
    <ContextSummary variant={variant} inList={inList} showing={visible.length} total={window.TITLES.length}
      filters={{ search, setSearch, collectionFilter, setCollectionFilter, typeFilter, setTypeFilter,
        phaseFilter, setPhaseFilter, budgetFilter, setBudgetFilter }}/>
  );
  const mobileShowing = viewMode === 'spatial' ? filtered.length : visible.length;
  const sharedCharCount = useMemo(() => {
    if (!selectedId) return 0;
    const t = window.TITLES.find(x => x.id === selectedId);
    if (!t) return 0;
    return t.cast.filter(c => charToTitleIds[primeOf(c)] && charToTitleIds[primeOf(c)].size > 1).length;
  }, [selectedId, charToTitleIds]);

  // Character highlight. Pinning a character (from the details cast list) shows
  // their photo, a Their titles / All titles switch and a stepper that visits
  // each of their titles in the current order. Hovering a cast row previews the
  // same banner without the controls.
  const pinnedTitles = useMemo(() => {
    if (!pinnedCharIds) return [];
    return (spatialShown ? ordered : visible).filter(t => pinnedCharIds.has(t.id));
  }, [pinnedCharIds, ordered, visible, spatialShown]);
  // Pinning a character switches the canvas to their titles in the current
  // order (the connections ring belongs to a selected title) and starts the
  // stepper on the title it was pinned from. Phones close the sheet so the
  // change is visible.
  const pinCharacter = (ch) => {
    if (highlightedChar === ch) { unpinCharacter(); return; }
    const from = drawerId;
    const ids = charToTitleIds[primeOf(ch)];
    const start = from && ids && ids.has(from) ? from : null;
    setHighlightedChar(ch);
    setHoveredCharacter(null);
    setStepId(start);
    if (selectedIdRef.current) { selectionReturnRef.current = null; setSelectedId(null); }
    pendingStepRef.current = start || '*';
    if (isTouch) setDrawerId(null);
  };
  const unpinCharacter = () => {
    setHighlightedChar(null);
    setHoveredCharacter(null);
    setStepId(null);
    // Desktop details still open: back to that title's connections.
    if (!isTouch && spatialShown && drawerId) setSelectedId(drawerId);
  };
  const stepCurrent = stepId || drawerId;
  const stepIndex = stepCurrent ? pinnedTitles.findIndex(t => t.id === stepCurrent) : -1;
  const stepTo = (id) => {
    setStepId(id);
    // Desktop opens each title's details; on phones the sheet would cover the
    // view, so the step only moves to the title (tap it to open).
    if (!isTouch) setDrawerId(id);
    if (spatialShown && viewportRef.current) {
      // A selected card's focus ring would fight the glide: let it go without
      // its return trip.
      if (selectedIdRef.current) { selectionReturnRef.current = null; setSelectedId(null); }
      const p = basePositions[id];
      if (!p) return;
      const rect = viewportRef.current.getBoundingClientRect();
      // A camera that was never framed (Spatial just opened) sits at 100%.
      const floor = isTouch ? 0.6 : 0.7;
      const scale = cameraFramedRef.current ? Math.max(viewRef.current.scale, floor) : floor;
      cameraFramedRef.current = true;
      const drawerSpace = isTouch ? 0 : 380;
      glideTo({
        x: (rect.width - drawerSpace) / 2 - (p.x + CARD_W / 2) * scale,
        y: rect.height / 2 - (p.y + CARD_H / 2) * scale,
        scale,
      });
    } else {
      requestAnimationFrame(() => {
        const row = document.querySelector(`[data-row-id="${id}"]`);
        if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  };
  const stepBy = (dir) => {
    const n = pinnedTitles.length;
    if (!n) return;
    const i = stepIndex < 0 ? (dir > 0 ? 0 : n - 1) : (stepIndex + dir + n) % n;
    stepTo(pinnedTitles[i].id);
  };
  useEffect(() => {
    const id = pendingStepRef.current;
    if (!id) return;
    pendingStepRef.current = null;
    if (id !== '*' && pinnedTitles.some(t => t.id === id)) stepTo(id);
    else if (spatialShown) resetView();
  }, [pinnedTitles]);
  // Left/right arrows step too, unless typing or inside a menu.
  const stepRef = useRef(null);
  stepRef.current = highlightedChar ? stepBy : null;
  useEffect(() => {
    const onKey = (e) => {
      if (!stepRef.current || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.metaKey || e.ctrlKey) return;
      const el = e.target;
      if (el instanceof Element && el.closest('input, textarea, select, [contenteditable="true"], [role="listbox"], [role="group"]')) return;
      e.preventDefault();
      stepRef.current(e.key === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Clicking a connection line opens the pair view and glides to it.
  const pickConnection = (c) => {
    if (selectedIdRef.current) { selectionReturnRef.current = null; setSelectedId(null); }
    setHoveredConnection(null);
    setPair(c);
  };
  useEffect(() => {
    if (!pair || !viewportRef.current) return;
    const pa = basePositions[pair.a], pb = basePositions[pair.b];
    if (!pa || !pb) { setPair(null); return; }
    const rect = viewportRef.current.getBoundingClientRect();
    const side = !isTouch && drawerId ? 380 : 0;
    const span = PAIR_GAP + CARD_W * 2 + 80;
    const scale = Math.min(1, Math.max(viewRef.current.scale, 0.6), (rect.width - side) / span);
    const mx = (pa.x + pb.x) / 2 + CARD_W / 2, my = (pa.y + pb.y) / 2 + CARD_H / 2;
    cameraFramedRef.current = true;
    glideTo({ x: (rect.width - side) / 2 - mx * scale, y: rect.height / 2 - my * scale, scale });
  }, [pair]);
  // Row labels come back when a selection closes, while the cards glide home:
  // they wait for the glide, as they do after a new layout.
  const [bandsReturning, setBandsReturning] = useState(false);
  const hadSelectionRef = useRef(false);
  useLayoutEffect(() => {
    const had = hadSelectionRef.current;
    hadSelectionRef.current = !!selectedId;
    if (!had || selectedId) return undefined;
    setBandsReturning(true);
    const id = setTimeout(() => setBandsReturning(false), 520);
    return () => clearTimeout(id);
  }, [selectedId]);
  // Escape, or a new layout, leaves the pair view.
  useEffect(() => {
    if (!pair) return;
    const onKey = (e) => { if (e.key === 'Escape') setPair(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pair]);
  useEffect(() => { setPair(null); }, [basePositions]);
  // Labels steer clear of the cards that are lit; dimmed ones may sit under them.
  const labelAvoidIds = useMemo(() => {
    if (pair) return new Set([pair.a, pair.b]);
    if (activeChar && highlightedIds) return highlightedIds;
    return hoverRelatedIds;
  }, [pair, activeChar, highlightedIds, hoverRelatedIds]);

  const charBanner = activeChar ? (() => {
    const c = window.CHARACTERS[activeChar];
    const media = window.MEDIA;
    const path = media && media.actors && media.actors[activeChar];
    const photo = path && (window.mediaURL ? window.mediaURL('a', activeChar, media.profile_base + path) : media.profile_base + path);
    const pinned = !!highlightedChar && activeChar === highlightedChar;
    const count = (charToTitleIds[primeOf(activeChar)] || new Set()).size;
    return (
      <div className={`char-banner${pinned ? ' pinned' : ''}`} style={{ '--char-color': c.color }}>
        <span className="cb-photo" style={{ background: c.color }}>
          <window.Portrait url={photo} alt="" initials={c.initials}/>
        </span>
        <span className="cb-who">
          <b>{I18N.charName(activeChar)}</b>
          <span className="cb-sub">{c.actor} · {tr('header.count', { n: count })}</span>
        </span>
        {pinned && <>
          <div className="segmented cb-mode" role="group" aria-label={tr('highlight.modeAria')}>
            <button className={charOnly ? 'on' : ''} aria-pressed={charOnly} onClick={() => setCharOnly(true)}>{tr('highlight.only')}</button>
            <button className={!charOnly ? 'on' : ''} aria-pressed={!charOnly} onClick={() => setCharOnly(false)}>{tr('highlight.all')}</button>
          </div>
          <div className="cb-step">
            <button onClick={() => stepBy(-1)} aria-label={tr('highlight.prev')} disabled={!pinnedTitles.length}>‹</button>
            <span className="cb-pos" aria-live="polite">{stepIndex >= 0
              ? tr('highlight.position', { i: stepIndex + 1, n: pinnedTitles.length })
              : tr('header.count', { n: pinnedTitles.length })}</span>
            <button onClick={() => stepBy(1)} aria-label={tr('highlight.next')} disabled={!pinnedTitles.length}>›</button>
          </div>
        </>}
        <button className="cb-close" aria-label={tr('highlight.clear')} title={tr('highlight.clear')}
          onClick={unpinCharacter}>×</button>
      </div>
    );
  })() : null;

  // Phones: the pinned character floats as a pill near the bottom (thumb
  // reach) instead of a banner. Phones always show only their titles, so there
  // is no Their titles / All titles switch here.
  const charPill = isTouch && highlightedChar ? (() => {
    const ch = highlightedChar;
    const c = window.CHARACTERS[ch];
    const media = window.MEDIA;
    const path = media && media.actors && media.actors[ch];
    const photo = path && (window.mediaURL ? window.mediaURL('a', ch, media.profile_base + path) : media.profile_base + path);
    const n = pinnedTitles.length;
    return (
      <div className="char-pill" style={{ '--char-color': c.color }}>
        <div className="cp-bar">
          <span className="cp-who">
            <span className="cb-photo" style={{ background: c.color }}>
              <window.Portrait url={photo} alt="" initials={c.initials}/>
            </span>
            <span className="cp-text">
              <span className="cp-name">{I18N.charName(ch)}</span>
              <span className="cp-actor">{c.actor}</span>
            </span>
          </span>
          <div className="cb-step">
            <button onClick={() => stepBy(-1)} aria-label={tr('highlight.prev')} disabled={!n}>‹</button>
            {/* Before the first step just the number of titles (read out as
                "13 titles"), so the name keeps its space; then "1/13". */}
            <span className="cb-pos" aria-live="polite">{stepIndex >= 0
              ? tr('highlight.short', { i: stepIndex + 1, n })
              : <>{n}<span className="story-sr"> {tr('highlight.titlesWord', { n })}</span></>}</span>
            <button onClick={() => stepBy(1)} aria-label={tr('highlight.next')} disabled={!n}>›</button>
          </div>
          <button className="cb-close" aria-label={tr('highlight.clear')} title={tr('highlight.clear')} onClick={unpinCharacter}>×</button>
        </div>
      </div>
    );
  })() : null;

  const focusPop = (() => {
    if (!isTouch || viewMode !== 'spatial' || !selectedId) return null;
    const p = positions[selectedId];
    const t = window.TITLES.find(x => x.id === selectedId);
    if (!p || !t) return null;
    return (
      <window.FocusPop
        title={t}
        x={view.x + (p.x + CARD_W/2) * view.scale}
        y={view.y + (p.y + CARD_H/2) * view.scale}
        onOpenCast={() => setDrawerId(selectedId)}
      />
    );
  })();

  const canvasEl = (
    <div
      className="viewport"
      ref={viewportRef}
      onPointerDownCapture={stopGlide}
      onWheelCapture={stopGlide}
      onMouseDown={isTouch ? undefined : onMouseDown}
      onWheel={isTouch ? undefined : onWheel}
      onTouchStart={isTouch ? onTouchStart : undefined}
      onTouchMove={isTouch ? onTouchMove : undefined}
      onTouchEnd={isTouch ? onTouchEnd : undefined}
      onClick={(e) => {
        // A click on the background (not a drag) leaves the pair view.
        if (!pair || isTouch) return;
        const s = panRef.current;
        if (e.target.closest('.card') || e.target.closest('path') || (s && Math.hypot(e.clientX - s.sx, e.clientY - s.sy) > 4)) return;
        setPair(null);
      }}
    >
      <div className="canvas-bg"/>
      <div
        className={`canvas${linesSettling ? ' lines-settling' : ''}${bandsReturning ? ' bands-settling' : ''}`}
        style={{
          width: canvasW + 'px',
          height: canvasH + 'px',
          transform: view.scale >= LAYER_MIN_SCALE
            ? `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`
            : `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: '0 0',
          transition: cameraGlide ? 'transform 600ms cubic-bezier(.2,.8,.2,1)' : undefined,
        }}
      >
        {/* Row labels for the Release (phase) and Chrono (era) timelines. Hidden
            while a title is selected: its connection rings move the cards. */}
        {!selectedId && layout.bands.map(b => (
          <div key={b.phase ? 'p' + b.phase : 'e' + b.era} className={`band-label${b.phase ? ' phase' : ''}`}
            style={{ transform: `translate(${b.x}px, ${b.y - 40}px)`, ...(b.phase ? { '--band': PHASE_COLORS[b.phase] } : {}) }}>
            {b.phase ? tr('phase.label', { n: b.phase })
              : b.era === 0 ? tr('era.before', { year: ERA_STARTS[0] })
              : b.from === null ? '' : b.from === b.to ? String(b.from) : `${b.from}–${b.to}`}
          </div>
        ))}
        <FloatingConnections
          visibleTitles={lineTitles}
          positions={positions}
          hoveredTitle={hoveredTitle}
          activeChar={activeChar}
          onHoverConnection={setHoveredConnection}
          hoveredConnection={hoveredConnection}
          selectedId={selectedId}
          focusId={pair ? null : hoverFocusId}
          pair={pair}
          onPickConnection={pickConnection}
          avoidIds={labelAvoidIds}
        />
        {filtered.map(t => {
          const charHL = highlightedIds ? highlightedIds.has(t.id) : false;
          const charDim = highlightedIds ? !highlightedIds.has(t.id) : false;
          // A hovered connection line lights up the two titles it joins; the
          // pair view lights its two titles and dims everything else.
          const onLine = hoveredConnection && (hoveredConnection.a === t.id || hoveredConnection.b === t.id);
          const inPair = pair && (pair.a === t.id || pair.b === t.id);
          const hoverDim = hoveredConnection ? !onLine : hoverRelatedIds ? !hoverRelatedIds.has(t.id) : false;
          const isDimmed = pair ? !inPair : (charDim || hoverDim);
          const isHighlighted = pair ? !!inPair : (charHL || (hoverFocusId === t.id) || !!onLine);
          // Visual only — the card stays in the layout so nothing reflows.
          const isCollDimmed = collectionFilter !== 'all'
            && !window.matchesCollection(collectionStates[t.id] || 'none', collectionFilter);
          return (
            <Card
              key={t.id}
              title={t}
              pos={positions[t.id] || {x:0,y:0}}
              onClick={() => onCardTap(t.id)}
              onHover={isTouch ? (() => {}) : setHoveredTitle}
              onDragStart={isTouch ? (() => {}) : onCardDragStart}
              isSelected={selectedId === t.id}
              isHighlighted={isHighlighted}
              isDimmed={isDimmed}
              isCollDimmed={isCollDimmed}
              isRingHidden={!!ringIds && !ringIds.has(t.id)}
              isDragging={draggingId === t.id}
              isCurrent={!!highlightedChar && stepId === t.id}
              curColor={highlightedChar ? window.CHARACTERS[highlightedChar].color : null}
              matchedChars={searchCharMatches ? searchCharMatches[t.id] : null}
              searchQuery={search}
              scale={view.scale}
            />
          );
        })}
      </div>
      <div className={`zoom-ctl${isTouch ? ' touch' : ''}`}>
        <button className="zoom-btn" onClick={()=>applyScale(s=>s/1.15)} disabled={view.scale <= ZOOM_MIN + 1e-4} aria-label={tr('canvas.zoomOut')}>&minus;</button>
        {zoomEdit != null
          ? <input className="zoom-val edit" autoFocus value={zoomEdit} inputMode="decimal"
              onChange={e=>setZoomEdit(e.target.value)} onBlur={commitZoomEdit}
              onKeyDown={e=>{ if(e.key==='Enter') commitZoomEdit(); if(e.key==='Escape') setZoomEdit(null); }}/>
          : <button className="zoom-val"
              onClick={isTouch ? ()=>setZoomEdit(String(Math.round(view.scale*100))) : undefined}
              onDoubleClick={isTouch ? undefined : ()=>setZoomEdit(String(Math.round(view.scale*100)))}
              title={tr(isTouch ? 'canvas.zoomTypeTouch' : 'canvas.zoomTypeDesktop')}>{Math.round(view.scale * 100)}%</button>}
        <button className="zoom-btn" onClick={()=>applyScale(s=>s*1.15)} disabled={view.scale >= 2 - 1e-4} aria-label={tr('canvas.zoomIn')}>+</button>
      </div>
      {contextSummary(isTouch ? 'pill' : 'float')}
      {focusPop}
    </div>
  );

  if (isTouch) {
    return (
      <div className={`app touch ${device}`}>
        <window.MobileTopBar
          device={device}
          viewMode={viewMode} setViewMode={(v) => {
            if (v !== viewMode && v !== 'spatial' && viewMode !== 'spatial') window.captureViewFlip();
            setViewMode(v);
            if (v !== 'spatial') setSelectedId(null);
          }}
          search={search} setSearch={setSearch} onPickTitle={pickTitle} onPickPerson={pickPerson}
          onOpenFilters={() => { if (viewMode !== 'spatial') window.captureFlip(); setSheet('filters'); }}
          filterCount={filterCount}
          sort={sort} sortDir={sortDir} setSortDir={setSortDir}
          onOpenAccount={() => setSheet('account')}
          collectionFilter={collectionFilter} setCollectionFilter={setCollectionFilter}
        />
        <div className={`m-main${charPill ? ' has-pill' : ''}`}
          style={highlightedChar ? { '--cur-color': window.CHARACTERS[highlightedChar].color } : undefined}>
          {viewMode === 'grid' && <window.MobileGrid collapseSeen={collectionFilter === 'all' && !highlightedChar && !search} markWatch={collectionFilter !== 'watchlist'} header={contextSummary('line')} currentId={highlightedChar ? stepId : null} titles={visible} onSelect={onCardTap} searchCharMatches={searchCharMatches} search={search} empty={emptyCopy} orderKey={flipKey} flipPaused={sheet === 'filters'}/>}
          {viewMode === 'list' && <window.MobileList collapseSeen={collectionFilter === 'all' && !highlightedChar && !search} markWatch={collectionFilter !== 'watchlist'} header={contextSummary('line')} currentId={highlightedChar ? stepId : null} titles={visible} sort={sort} onSelect={onCardTap} searchCharMatches={searchCharMatches} search={search} empty={emptyCopy} orderKey={flipKey} flipPaused={sheet === 'filters'}/>}
          {viewMode === 'spatial' && (
            <div className="m-spatial-wrap">
              {canvasEl}
              <window.SpatialHint focused={!!selectedId} sharedCount={sharedCharCount}/>
            </div>
          )}
          {charPill}
        </div>
        {device === 'mobile' && <window.SortTabs sort={sort} setSort={changeSort}/>}
        {sheet === 'filters' && (
          <window.FilterSheet
            phaseFilter={phaseFilter} setPhaseFilter={setPhaseFilter}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            budgetFilter={budgetFilter} setBudgetFilter={setBudgetFilter}
            sort={sort}
            sortDir={sortDir} setSortDir={setSortDir}
            showing={mobileShowing}
            onClear={() => { setPhaseFilter('all'); setTypeFilter('all'); setBudgetFilter('all'); }}
            onClose={() => { setSheet(null); requestAnimationFrame(() => window.playPendingFlip()); }}
          />
        )}
        {sheet === 'account' && (
          <window.AccountSheet
            onClose={() => setSheet(null)}
            onPickCollection={setCollectionFilter}
            onAbout={() => setSheet('about')}
          />
        )}
        {sheet === 'about' && <window.AboutSheet onClose={() => setSheet(null)}/>}
        <window.StatusToast touch/>
        <window.SignInNudge touch/>
        {welcome && !sheet && !drawerTitle && <window.AboutSheet welcome onClose={() => setWelcome(false)}/>}
        {drawerTitle && (
          <window.CastSheet
            title={drawerTitle} search={search}
            inSpatial={viewMode === 'spatial'}
            onClose={() => setDrawerId(null)}
            onCharacterClick={pinCharacter}
            activeChar={activeChar}
            onGoSpatial={() => {
              setViewMode('spatial');
              if (highlightedChar) {
                if (pinnedCharIds && pinnedCharIds.has(drawerId)) { setStepId(drawerId); pendingStepRef.current = drawerId; }
              } else setSelectedId(drawerId);
              setDrawerId(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`app ${drawerTitle ? 'drawer-open' : ''}`}>
      <Toolbar
        onAbout={() => setAboutOpen(true)}
        onPickTitle={pickTitle} onPickPerson={pickPerson}
        desktopView={desktopView} setDesktopView={changeDesktopView}
        sort={sort} setSort={changeSort} sortDir={sortDir} setSortDir={setSortDir}
        phaseFilter={phaseFilter} setPhaseFilter={setPhaseFilter}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        budgetFilter={budgetFilter} setBudgetFilter={setBudgetFilter}
        collectionFilter={collectionFilter} setCollectionFilter={setCollectionFilter}
        search={search} setSearch={setSearch}
      />

      {charBanner}

      {desktopView === 'list'
        ? <window.DesktopList titles={visible} sort={sort} sortDir={sortDir} setSort={changeSort} setSortDir={setSortDir}
            search={search} searchCharMatches={searchCharMatches} openId={drawerId} activeChar={activeChar}
            onOpen={(id) => setDrawerId(drawerId === id ? null : id)}
            header={contextSummary('float', true)} empty={emptyCopy} orderKey={flipKey}/>
        : canvasEl}

      {hoveredConnection && (
        <div className="line-tooltip" style={{left: hoveredConnection.x + 12, top: hoveredConnection.y + 12}}>
          {(() => {
            const ta = window.TITLES.find(x => x.id === hoveredConnection.a), tb = window.TITLES.find(x => x.id === hoveredConnection.b);
            return ta && tb ? <div className="tt-titles">{I18N.titleName(ta)} <span aria-hidden="true">↔</span> {I18N.titleName(tb)}</div> : null;
          })()}
          <div className="tt-label">{tr('canvas.sharedCharacters')}</div>
          {hoveredConnection.characters.map(c => {
            const ch = window.CHARACTERS[c];
            return (
              <div key={c} className="tt-row">
                <span className="tt-dot" style={{background: ch.color}}/>
                <span>{I18N.charName(c)}</span>
              </div>
            );
          })}
        </div>
      )}

      <CastDrawer
        title={drawerTitle}
        onClose={() => { setSelectedId(null); setDrawerId(null); }}
        onCharacterClick={pinCharacter}
        hoveredCharacter={hoveredCharacter}
        onCharacterHover={setHoveredCharacter}
        activeChar={activeChar}
        search={search}
      />
      <window.StatusToast touch={false}/>
      <window.SignInNudge touch={false}/>
      {(aboutOpen || welcome) && <window.AboutDialog welcome={welcome && !aboutOpen}
        onClose={() => { setAboutOpen(false); setWelcome(false); }}/>}
    </div>
  );
}

// Account wraps collection: from Phase 3 the collection needs to know who is
// signed in before it can decide what to load.
ReactDOM.createRoot(document.getElementById('root')).render(
  <window.AccountProvider>
    <window.CollectionProvider><App/></window.CollectionProvider>
  </window.AccountProvider>
);
