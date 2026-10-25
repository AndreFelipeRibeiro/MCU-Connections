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
const PHASE_LABELS = { 1: 'PHASE 1', 2: 'PHASE 2', 3: 'PHASE 3', 4: 'PHASE 4', 5: 'PHASE 5', 6: 'PHASE 6' };

const CARD_W = 170;
const CARD_H = 270;

// Variant handling: a character may declare `prime`, pointing at the "through-line"
// identity it is a variant of (He Who Remains -> kang, Captain Carter -> peggy).
// Connections chain on the prime so the thread stays unbroken, while each segment is
// still drawn and labelled with the specific variant that appears in that title.
function primeOf(id) {
  const c = window.CHARACTERS[id];
  return (c && c.prime) || id;
}

// Deterministic jitter
function seedJitter(id, range) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  const r = (Math.sin(h) * 10000);
  return ((r - Math.floor(r)) - 0.5) * 2 * range;
}

// Compute floating layout positions per sort mode.
// Cards are arranged organically in a horizontally-scrollable canvas,
// with vertical bands per phase and chronological flow left-to-right.
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

const SORT_LABEL = { release: 'by release', chrono: 'chronological', phase: 'by phase', title: 'A–Z', imdb: 'by IMDb', rt: 'by Tomatometer' };

// Default direction per sort mode, chosen to match each mode's natural/prior default
// (e.g. ratings default to highest-first, dates/phase default to earliest-first).
const DEFAULT_SORT_DIR = { release: 'asc', chrono: 'asc', phase: 'asc', imdb: 'desc', rt: 'desc', title: 'asc' };

function sortDirectionLabels(sort) {
  if (sort === 'title') return ['A–Z', 'Z–A'];
  if (sort === 'release') return ['Oldest first', 'Newest first'];
  if (sort === 'chrono') return ['Earliest first', 'Latest first'];
  if (sort === 'phase') {
    const phases = window.TITLES.map(t => t.phase);
    const low = Math.min(...phases), high = Math.max(...phases);
    return [`Phase ${low} → ${high}`, `Phase ${high} → ${low}`];
  }
  return ['Lowest rated first', 'Highest rated first'];
}
window.sortDirectionLabels = sortDirectionLabels;

function sortLabelFor(sort, dir) {
  const direction = sortDirectionLabels(sort)[dir === 'desc' ? 1 : 0];
  return sort === 'title' ? direction : `${SORT_LABEL[sort]} · ${direction.toLowerCase()}`;
}

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
    if (sort === 'title') return mul * a.title.localeCompare(b.title);
    if (sort === 'phase') return mul * ((a.phase - b.phase) || a.release.localeCompare(b.release));
    return mul * a.release.localeCompare(b.release);
  });
}

function computeLayout(titles, sort, dir = DEFAULT_SORT_DIR[sort]) {
  const ordered = sortTitles(titles, sort, dir);
  const positions = {};
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
          x: 80 + col * colW + seedJitter(t.id + 'x', 22),
          y: y + row * rowH + seedJitter(t.id + 'y', 18),
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
        x: 80 + col * colW + seedJitter(t.id+'x', 26),
        y: 80 + row * rowH + seedJitter(t.id+'y', 22),
      };
    });
  } else {
    // Release or chronology flows left-to-right in the selected direction.
    // Place in timeline rows; phase determines vertical band
    const phaseRow = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
    // To avoid horizontal collisions, count along x and bump y when too close
    const lastXByRow = {0:-Infinity,1:-Infinity,2:-Infinity,3:-Infinity,4:-Infinity,5:-Infinity};
    ordered.forEach((t, i) => {
      const baseX = 80 + i * (CARD_W * 1.15);
      const row = phaseRow[t.phase];
      const y = 80 + row * (rowH * 1.25) + seedJitter(t.id+'y', 30);
      positions[t.id] = {
        x: baseX + seedJitter(t.id+'x', 24),
        y,
      };
      lastXByRow[row] = baseX;
    });
  }

  // Compute canvas bounds
  let maxX = 0, maxY = 0;
  Object.values(positions).forEach(p => {
    if (p.x + CARD_W > maxX) maxX = p.x + CARD_W;
    if (p.y + CARD_H > maxY) maxY = p.y + CARD_H;
  });
  return { positions, width: maxX + 120, height: maxY + 120 };
}

function Card({ title, pos, onClick, onHover, onDragStart, isSelected, isHighlighted, isDimmed, isCollDimmed, isDragging, matchedChars, searchQuery, scale }) {
  const phaseColor = PHASE_COLORS[title.phase];
  const downRef = useRef({ x: 0, y: 0, moved: false });
  const { statusOf } = window.useCollection();
  const status = statusOf(title.id);
  // Below TSA_MIN_SCALE the toggles are rendered smaller than a usable hit
  // target, so they withdraw and the seen state reads as a static marker only.
  const showActions = (scale || 1) >= window.TSA_MIN_SCALE;
  return (
    <div
      className={`card ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''} ${isCollDimmed ? 'coll-dim' : ''} ${status === 'seen' ? 'seen' : ''} ${status === 'watchlist' ? 'listed' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        '--phase-color': phaseColor,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
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
          <span className="badge type-badge">{title.type === 'film' ? 'FILM' : 'SERIES'}</span>
          <span className="badge phase-badge" style={{background: phaseColor, color:'#0a0c14'}}>{PHASE_LABELS[title.phase]}</span>
        </div>
        {showActions
          ? <window.TitleStatusActions title={title} className="card-tsa"/>
          : <span className="card-seen-mark"><window.SeenMarker seen={status === 'seen'}/></span>}
        <div className="rating-row">
          {title.imdb != null && (
            <div className="card-rating imdb" title={title.type === 'series' ? 'IMDb whole-series rating (shared across seasons)' : 'IMDb movie rating'}>
              <span className="imdb-tag">IMDb</span>
              {title.imdb.toFixed(1)}
            </div>
          )}
          {title.rt != null && (
            <div className="card-rating rt" title="Rotten Tomatoes Tomatometer">
              <span className="rt-tag">RT</span>
              {title.rt}%
            </div>
          )}
        </div>
      </div>
      <div className="card-meta">
        <div className="card-title"><window.Highlight text={title.title} query={searchQuery}/></div>
        <div className="card-year">
          <span>{title.year}</span>
          {title.budget != null && (
            <span className="card-budget">${title.budget < 1 ? title.budget : Math.round(title.budget)}M</span>
          )}
        </div>
        <window.StoryYear title={title} className="card-story"/>
        <window.MatchBadge matchedChars={matchedChars} query={searchQuery}/>
      </div>
    </div>
  );
}

function CastDrawer({ title, onClose, onCharacterClick, hoveredCharacter, onCharacterHover, activeChar }) {
  if (!title) return null;
  return (
    <aside className="drawer open">
      <header className="drawer-header">
        <div>
          <div className="drawer-eyebrow" style={{color: PHASE_COLORS[title.phase]}}>{PHASE_LABELS[title.phase]} · {title.type.toUpperCase()} · {title.year}</div>
          <h2 className="drawer-title">{title.title}</h2>
          <window.StoryYear title={title} detail className="drawer-story"/>
          <window.TitleStatusActions title={title} variant="inline" className="drawer-tsa"/>
        </div>
        <button className="drawer-close" onClick={onClose} aria-label="Close">×</button>
      </header>
      <div className="drawer-section-label">Featured cast · {title.cast.length}</div>
      <div className="cast-list">
        {title.cast.length === 0 && <div className="empty-cast">No major recurring cast tracked.</div>}
        {title.cast.map(ch => {
          const c = window.CHARACTERS[ch];
          if (!c) return null;
          const isActive = activeChar === ch;
          return (
            <button
              key={ch}
              className={`cast-row ${isActive ? 'active' : ''}`}
              onClick={() => onCharacterClick(ch)}
              onMouseEnter={() => onCharacterHover(ch)}
              onMouseLeave={() => onCharacterHover(null)}
            >
              <div className="portrait" style={{background:`linear-gradient(135deg, ${c.color}, ${c.color}88)`}}>
                {window.MEDIA && window.MEDIA.actors && window.MEDIA.actors[ch] ? (
                  <img src={window.mediaURL ? window.mediaURL('a', ch, window.MEDIA.profile_base + window.MEDIA.actors[ch]) : window.MEDIA.profile_base + window.MEDIA.actors[ch]} alt={c.name} loading="lazy"/>
                ) : (
                  <span>{c.initials}</span>
                )}
              </div>
              <div className="cast-text">
                <div className="char-name">{c.name}</div>
                <div className="actor-name">{c.actor}</div>
              </div>
              <div className="cast-color-dot" style={{background:c.color}}/>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

const SORT_OPTIONS = [
  ['release','Release','Release','▤'],
  ['chrono','Chronological','Chrono','⇄'],
  ['phase','By Phase','Phase','◫'],
  ['title','A–Z','A–Z','⇅'],
  ['imdb','IMDb Rating','IMDb','★'],
  ['rt','Tomatometer','RT','◉'],
];

function Toolbar({ sort, setSort, sortDir, setSortDir, phaseFilter, setPhaseFilter, typeFilter, setTypeFilter, budgetFilter, setBudgetFilter, collectionFilter, setCollectionFilter, search, setSearch, total, showing, onResetView }) {
  const [popOpen, setPopOpen] = useState(false);
  const popRef = useRef(null);
  const { progress } = window.useCollection();
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
  return (
    <div className="toolbar">
      <div className="tb-row tb-primary-row">
        <div className="brand">
          <div className="brand-mark"/>
          <div>
            <div className="brand-title">MCU Connections</div>
            <div className="brand-sub">
              {showing} of {total} titles
              {progress.seenReleased > 0 && ` · ${progress.seenReleased} seen`}
            </div>
          </div>
        </div>
        <div className="control-group tb-sort-controls">
          <div className="segmented">
            {SORT_OPTIONS.map(([v,l,s,ic])=>(
              <button key={v} className={sort===v?'on':''} onClick={()=>setSort(v)} aria-pressed={sort===v} title={l}>
                <span className="si">{ic}</span><span className="lg">{l}</span><span className="sm">{s}</span>
              </button>
            ))}
          </div>
          <div className="tb-order-control">
            <span className="tb-order-label">Order</span>
            <window.SortOrderMenu sort={sort} sortDir={sortDir} setSortDir={setSortDir}/>
          </div>
        </div>
      </div>
      <div className="tb-row tb-secondary-row">
        <div className="control-group tb-type-controls">
          <div className="segmented">
            {[['all','All'],['film','Films'],['series','Series']].map(([v,l])=>(
              <button key={v} className={typeFilter===v?'on':''} onClick={()=>setTypeFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
        <window.CollectionSwitch value={collectionFilter} onChange={setCollectionFilter}/>
        <div className="filters-pop-wrap" ref={popRef}>
          <button className={`filters-pill${popOpen?' open':''}${activeFilters?' active':''}`} onClick={()=>setPopOpen(o=>!o)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
            Filters{activeFilters ? <span className="fcount">{activeFilters}</span> : null}
          </button>
          {popOpen && (
            <div className="filters-pop">
              <div className="control-group">
                <label>Phase</label>
                <div className="segmented">
                  {['all','1','2','3','4','5','6'].map(p=>(
                    <button key={p} className={phaseFilter===p?'on':''} onClick={()=>setPhaseFilter(p)}
                      style={p!=='all' && phaseFilter===p ? {background:PHASE_COLORS[p],color:'#0a0c14',borderColor:PHASE_COLORS[p]} : {}}
                    >{p==='all'?'All':p}</button>
                  ))}
                </div>
              </div>
              <div className="control-group">
                <label>Budget</label>
                <div className="segmented">
                  {[['all','All'],['low','<$50M'],['mid','$50–200M'],['high','$200–300M'],['mega','$300M+']].map(([v,l])=>(
                    <button key={v} className={budgetFilter===v?'on':''} onClick={()=>setBudgetFilter(v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="control-group">
                <label>Order</label>
                <div className="segmented">
                  {sortDirectionLabels(sort).map((label, i) => (
                    <button key={label} className={sortDir===(i===0?'asc':'desc')?'on':''}
                      aria-pressed={sortDir===(i===0?'asc':'desc')}
                      onClick={()=>setSortDir(i===0?'asc':'desc')}>{label}</button>
                  ))}
                </div>
              </div>
              {activeFilters > 0 && (
                <button className="pop-clear" onClick={()=>{ setPhaseFilter('all'); setBudgetFilter('all'); }}>Clear filters</button>
              )}
            </div>
          )}
        </div>
        <div className="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
          <input aria-label="Search titles or characters" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search titles or characters…"/>
        </div>
        <button className="reset-view" onClick={onResetView} title="Recenter view" aria-label="Recenter view"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg><span className="reset-label">Recenter</span></button>
      </div>
      <window.AccountButton onPickCollection={setCollectionFilter}/>
    </div>
  );
}

// Connection layer with bolder lines and improved bezier control
function FloatingConnections({ visibleTitles, positions, hoveredTitle, activeChar, onHoverConnection, hoveredConnection, selectedId, focusId }) {
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

  function curve(p1, p2, offset) {
    const x1 = p1.x + CARD_W/2;
    const y1 = p1.y + CARD_H/2;
    const x2 = p2.x + CARD_W/2;
    const y2 = p2.y + CARD_H/2;
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.hypot(dx, dy) || 1;
    // Perpendicular offset
    const nx = -dy/dist, ny = dx/dist;
    // Sag based on distance
    const sag = Math.min(120, 30 + dist * 0.15);
    const mx = (x1+x2)/2 + nx * (sag*0.6 + offset);
    const my = (y1+y2)/2 + ny * (sag*0.6 + offset);
    return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  }

  // Compute label point along curve at parameter t (0..1)
  function pointOnCurve(p1, p2, offset, t) {
    const x1 = p1.x + CARD_W/2, y1 = p1.y + CARD_H/2;
    const x2 = p2.x + CARD_W/2, y2 = p2.y + CARD_H/2;
    const dx = x2-x1, dy = y2-y1;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = -dy/dist, ny = dx/dist;
    const sag = Math.min(120, 30 + dist * 0.15);
    const cx = (x1+x2)/2 + nx * (sag*0.6 + offset);
    const cy = (y1+y2)/2 + ny * (sag*0.6 + offset);
    // Quadratic bezier at t
    const u = 1 - t;
    return {
      x: u*u*x1 + 2*u*t*cx + t*t*x2,
      y: u*u*y1 + 2*u*t*cy + t*t*y2,
    };
  }

  // First pass: render lines + endpoints, collect labels for collision resolution
  const labels = [];

  const lineEls = connections.map(conn => {
    const p1 = positions[conn.a], p2 = positions[conn.b];
    if (!p1 || !p2) return null;
    const isHovered = hoveredConnection && hoveredConnection.a === conn.a && hoveredConnection.b === conn.b;
    const involvesFocus = focusId && (focusId === conn.a || focusId === conn.b);
    const involvesHoveredChar = activeChar && conn.characters.some(c => primeOf(c) === primeOf(activeChar));
    const anyFocus = focusId || hoveredConnection || activeChar;
    const emphasized = isHovered || involvesFocus || involvesHoveredChar;
    const dimmed = anyFocus && !emphasized;
    const N = conn.characters.length;

    return conn.characters.map((ch, i) => {
      const charObj = window.CHARACTERS[ch];
      if (!charObj) return null;
      const offsetIdx = i - (N - 1) / 2;
      const offset = offsetIdx * 14;
      const baseOpacity = dimmed ? 0.05 : (emphasized ? 1 : 0.55);
      const strokeW = emphasized ? 3 : 1.8;
      const showLabel = emphasized && involvesFocus;

      if (showLabel) {
        // Spread labels along the curve based on N: t in (0.15..0.85)
        const t = N === 1 ? 0.5 : 0.15 + (i / (N - 1)) * 0.7;
        const lp = pointOnCurve(p1, p2, offset, t);
        const labelText = charObj.name;
        const labelW = Math.max(60, labelText.length * 6.4 + 18);
        labels.push({ x: lp.x, y: lp.y, w: labelW, h: 22, color: charObj.color, text: labelText, key: conn.a + '__' + conn.b + '__' + ch });
      }

      return (
        <g key={ch+i+conn.a+conn.b}>
          {emphasized && (
            <path d={curve(p1,p2,offset)} fill="none" stroke={charObj.color} strokeWidth={strokeW + 6} opacity={0.25} filter="url(#strong-glow)" strokeLinecap="round"/>
          )}
          <path
            d={curve(p1,p2,offset)}
            fill="none"
            stroke={charObj.color}
            strokeWidth={strokeW}
            opacity={baseOpacity}
            strokeLinecap="round"
            filter={emphasized ? 'url(#line-glow)' : undefined}
            style={{transition:'opacity 220ms, stroke-width 220ms'}}
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
      <rect x={l.x - l.w/2} y={l.y - l.h/2} width={l.w} height={l.h} rx={l.h/2}
        fill="#0a0c14" stroke={l.color} strokeWidth="1.2" opacity="0.96"/>
      <circle cx={l.x - l.w/2 + 11} cy={l.y} r={3.5} fill={l.color}/>
      <text x={l.x - l.w/2 + 20} y={l.y + 3.6} fontSize="11" fontFamily="Inter, sans-serif" fontWeight="500" fill="#e6e8f0">{l.text}</text>
    </g>
  ));

  return (
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
      {labelEls}
      <style>{`.connection-layer path { pointer-events: stroke; }`}</style>
    </svg>
  );
}

// Display preferences (V3-SPEC D6): device-scoped, localStorage only, not tied to
// the account and not cleared on sign-out. Saves the mobile view mode, the sort
// mode and the order direction, on desktop and mobile. Filters, search and the
// spatial camera deliberately start fresh each visit, so nobody returns to a
// silently filtered catalog. Nothing is written until the visitor changes one of
// these, so first visits keep following the defaults below. Missing, malformed or
// unknown values fall back to those defaults.
const PREFS_KEY = 'mcu.prefs.v1';
const PREFS_VERSION = 1;
const VIEW_MODE_VALUES = ['list', 'grid', 'spatial'];

function readDisplayPrefs() {
  const prefs = { viewMode: 'list', sort: 'release', sortDir: DEFAULT_SORT_DIR.release };
  let parsed = null;
  try {
    parsed = JSON.parse(window.localStorage.getItem(PREFS_KEY) || 'null');
  } catch (e) {
    return prefs; // Storage disabled, or not valid JSON.
  }
  if (!parsed || typeof parsed !== 'object' || parsed.version !== PREFS_VERSION) return prefs;
  if (VIEW_MODE_VALUES.indexOf(parsed.viewMode) !== -1) prefs.viewMode = parsed.viewMode;
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
  // Mobile opens in List unless the visitor chose another view before; desktop
  // ignores viewMode (spatial only).
  const [viewMode, setViewMode] = useState(initialPrefs.viewMode);
  const prefsLoaded = useRef(false);
  useEffect(() => {
    if (!prefsLoaded.current) { prefsLoaded.current = true; return; }
    writeDisplayPrefs({ viewMode, sort, sortDir });
  }, [viewMode, sort, sortDir]);
  const [drawerId, setDrawerId] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredTitle, setHoveredTitle] = useState(null);
  const [hoveredCharacter, setHoveredCharacter] = useState(null);
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const [highlightedChar, setHighlightedChar] = useState(null);
  // Per-card position overrides from dragging
  const [overrides, setOverrides] = useState({});
  const [draggingId, setDraggingId] = useState(null);
  const dragRef = useRef(null);

  // Pan + zoom
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [zoomEdit, setZoomEdit] = useState(null);
  const ZOOM_MIN = 0.05;

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
      const chars = t.cast.filter(c => {
        const ch = window.CHARACTERS[c];
        return ch && (ch.name.toLowerCase().includes(q) || ch.actor.toLowerCase().includes(q));
      });
      if (t.title.toLowerCase().includes(q) || chars.length) m[t.id] = chars;
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
    return list;
  }, [phaseFilter, typeFilter, budgetFilter, searchCharMatches]);

  const layout = useMemo(() => computeLayout(filtered, sort, sortDir), [filtered, sort, sortDir]);
  const basePositions = layout.positions;
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
    const focusCast = new Set(focusTitle.cast);
    filtered.forEach(t => {
      if (t.id === focusId) return;
      if (t.cast.some(c => focusCast.has(c))) set.add(t.id);
    });
    return set;
  }, [focusId, filtered]);

  // Hover-focus is separate: used only for dimming/labels, not reflow.
  const hoverFocusId = hoveredTitle || selectedId;
  const hoverRelatedIds = useMemo(() => {
    if (!hoverFocusId) return null;
    const ft = window.TITLES.find(t => t.id === hoverFocusId);
    if (!ft) return null;
    const set = new Set([hoverFocusId]);
    const cast = new Set(ft.cast);
    filtered.forEach(t => {
      if (t.id === hoverFocusId) return;
      if (t.cast.some(c => cast.has(c))) set.add(t.id);
    });
    return set;
  }, [hoverFocusId, filtered]);

  // Effective positions: layout + focus reflow + per-card override
  const positions = useMemo(() => {
    const out = {};
    let focusLayout = null;
    if (focusId && relatedIds && relatedIds.size > 1) {
      const others = [...relatedIds].filter(id => id !== focusId);
      const focusTitle = window.TITLES.find(t => t.id === focusId);
      const focusCast = new Set(focusTitle.cast);
      const scored = others.map(id => {
        const t = window.TITLES.find(x => x.id === id);
        const shared = t.cast.filter(c => focusCast.has(c)).length;
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
  }, [basePositions, overrides, focusId, relatedIds, isTouch]);

  // Reset overrides when sort/filter changes the layout
  useEffect(() => { setOverrides({}); }, [sort, sortDir, phaseFilter, typeFilter, budgetFilter, search]);

  const selectedTitle = selectedId ? window.TITLES.find(t => t.id === selectedId) : null;
  const drawerTitle = drawerId ? window.TITLES.find(t => t.id === drawerId) : null;
  const ordered = useMemo(() => sortTitles(filtered, sort, sortDir), [filtered, sort, sortDir]);

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
    if (gridSort) {
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
      let y = 14 - minY * scale;
      if (isFinite(y0)) {
        if ((y1 - y0) * scale <= rect.height - 28) y = rect.height / 2 - ((y0 + y1) / 2) * scale;
        else {
          y = 14 - y0 * scale;
          if (leading && (leading.y + CARD_H) * scale + y > rect.height - 14) y = rect.height - 14 - (leading.y + CARD_H) * scale;
        }
      }
      setView({ x: 14 - minX * scale, y, scale });
    }
  }, [canvasW, canvasH, basePositions, sort, isTouch]);

  // Reset view whenever layout changes
  useLayoutEffect(() => { resetView(); }, [resetView]);

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
    if (selectedIdRef.current) return;
    resetView();
  }, [collectionFilter, highlightedChar, resetView]);

  // Entering Spatial on touch mounts a fresh canvas whose camera was never
  // framed (it previously opened at 100% on the top-left corner). Frame it,
  // unless a card is already selected (opened from a detail sheet): the
  // focus-ring auto-fit below owns the camera then.
  useLayoutEffect(() => {
    if (!isTouch) return;
    if (viewMode !== 'spatial') { cameraFramedRef.current = false; return; }
    if (!selectedIdRef.current) resetView();
  }, [viewMode, isTouch]);

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
  const onTouchEnd = () => {
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
      setSelectedId(null);
    }
  };

  const onCardTap = (id) => {
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
  const filterCount = (phaseFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (budgetFilter !== 'all' ? 1 : 0);
  // Spatial keeps every card on screen (dimmed), so it counts `filtered`; the
  // flat views actually drop non-matching rows and count what they render.
  const mobileShowing = viewMode === 'spatial' ? filtered.length : visible.length;
  const sharedCharCount = useMemo(() => {
    if (!selectedId) return 0;
    const t = window.TITLES.find(x => x.id === selectedId);
    if (!t) return 0;
    return t.cast.filter(c => charToTitleIds[primeOf(c)] && charToTitleIds[primeOf(c)].size > 1).length;
  }, [selectedId, charToTitleIds]);

  const charBanner = activeChar ? (
    <div className="char-banner">
      <div className="banner-dot" style={{background: window.CHARACTERS[activeChar].color}}/>
      <span>Highlighting <b>{window.CHARACTERS[activeChar].name}</b> · {highlightedIds ? highlightedIds.size : 0} visible titles</span>
      <button onClick={() => { setHighlightedChar(null); setHoveredCharacter(null); }}>Clear</button>
    </div>
  ) : null;

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
    >
      <div className="canvas-bg"/>
      <div
        className="canvas"
        style={{
          width: canvasW + 'px',
          height: canvasH + 'px',
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          transformOrigin: '0 0',
          transition: cameraGlide ? 'transform 600ms cubic-bezier(.2,.8,.2,1)' : undefined,
        }}
      >
        <FloatingConnections
          visibleTitles={filtered}
          positions={positions}
          hoveredTitle={hoveredTitle}
          activeChar={activeChar}
          onHoverConnection={setHoveredConnection}
          hoveredConnection={hoveredConnection}
          selectedId={selectedId}
          focusId={hoverFocusId}
        />
        {filtered.map(t => {
          const charHL = highlightedIds ? highlightedIds.has(t.id) : false;
          const charDim = highlightedIds ? !highlightedIds.has(t.id) : false;
          const hoverDim = hoverRelatedIds ? !hoverRelatedIds.has(t.id) : false;
          const isDimmed = charDim || hoverDim;
          const isHighlighted = charHL || (hoverFocusId === t.id);
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
              isDragging={draggingId === t.id}
              matchedChars={searchCharMatches ? searchCharMatches[t.id] : null}
              searchQuery={search}
              scale={view.scale}
            />
          );
        })}
      </div>
      <div className={`zoom-ctl${isTouch ? ' touch' : ''}`}>
        <button className="zoom-btn" onClick={()=>applyScale(s=>s/1.15)} disabled={view.scale <= ZOOM_MIN + 1e-4} aria-label="Zoom out">&minus;</button>
        {zoomEdit != null
          ? <input className="zoom-val edit" autoFocus value={zoomEdit} inputMode="decimal"
              onChange={e=>setZoomEdit(e.target.value)} onBlur={commitZoomEdit}
              onKeyDown={e=>{ if(e.key==='Enter') commitZoomEdit(); if(e.key==='Escape') setZoomEdit(null); }}/>
          : <button className="zoom-val"
              onClick={isTouch ? ()=>setZoomEdit(String(Math.round(view.scale*100))) : undefined}
              onDoubleClick={isTouch ? undefined : ()=>setZoomEdit(String(Math.round(view.scale*100)))}
              title={isTouch ? 'Tap to type a zoom level' : 'Double-click to type a zoom level'}>{Math.round(view.scale * 100)}%</button>}
        <button className="zoom-btn" onClick={()=>applyScale(s=>s*1.15)} disabled={view.scale >= 2 - 1e-4} aria-label="Zoom in">+</button>
      </div>
      {focusPop}
    </div>
  );

  if (isTouch) {
    return (
      <div className={`app touch ${device}`}>
        <window.MobileTopBar
          device={device}
          viewMode={viewMode} setViewMode={(v) => { setViewMode(v); if (v !== 'spatial') setSelectedId(null); }}
          search={search} setSearch={setSearch}
          onOpenFilters={() => setSheet('filters')}
          filterCount={filterCount}
          showing={mobileShowing} total={window.TITLES.length}
          sort={sort} sortDir={sortDir} setSortDir={setSortDir} sortLabel={sortLabelFor(sort, sortDir)}
          onOpenAccount={() => setSheet('account')}
          collectionFilter={collectionFilter} setCollectionFilter={setCollectionFilter}
        />
        {charBanner}
        <div className="m-main">
          {viewMode === 'grid' && <window.MobileGrid titles={visible} onSelect={onCardTap} searchCharMatches={searchCharMatches} search={search} empty={emptyCopy} orderKey={sort + ':' + sortDir}/>}
          {viewMode === 'list' && <window.MobileList titles={visible} sort={sort} onSelect={onCardTap} searchCharMatches={searchCharMatches} search={search} empty={emptyCopy} orderKey={sort + ':' + sortDir}/>}
          {viewMode === 'spatial' && (
            <div className="m-spatial-wrap">
              {canvasEl}
              <window.SpatialHint focused={!!selectedId} sharedCount={sharedCharCount}/>
            </div>
          )}
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
            onClose={() => setSheet(null)}
          />
        )}
        {sheet === 'account' && (
          <window.AccountSheet
            onClose={() => setSheet(null)}
            onPickCollection={setCollectionFilter}
          />
        )}
        {drawerTitle && (
          <window.CastSheet
            title={drawerTitle}
            inSpatial={viewMode === 'spatial'}
            onClose={() => setDrawerId(null)}
            onCharacterClick={(ch) => setHighlightedChar(highlightedChar === ch ? null : ch)}
            activeChar={activeChar}
            onGoSpatial={() => { setViewMode('spatial'); setSelectedId(drawerId); setDrawerId(null); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`app ${drawerTitle ? 'drawer-open' : ''}`}>
      <Toolbar
        sort={sort} setSort={changeSort} sortDir={sortDir} setSortDir={setSortDir}
        phaseFilter={phaseFilter} setPhaseFilter={setPhaseFilter}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        budgetFilter={budgetFilter} setBudgetFilter={setBudgetFilter}
        collectionFilter={collectionFilter} setCollectionFilter={setCollectionFilter}
        search={search} setSearch={setSearch}
        total={window.TITLES.length} showing={filtered.length}
        onResetView={resetView}
      />

      {charBanner}

      {canvasEl}

      {hoveredConnection && (
        <div className="line-tooltip" style={{left: hoveredConnection.x + 12, top: hoveredConnection.y + 12}}>
          <div className="tt-label">Shared characters</div>
          {hoveredConnection.characters.map(c => {
            const ch = window.CHARACTERS[c];
            return (
              <div key={c} className="tt-row">
                <span className="tt-dot" style={{background: ch.color}}/>
                <span>{ch.name}</span>
              </div>
            );
          })}
        </div>
      )}

      <CastDrawer
        title={drawerTitle}
        onClose={() => { setSelectedId(null); setDrawerId(null); }}
        onCharacterClick={(ch) => setHighlightedChar(highlightedChar === ch ? null : ch)}
        hoveredCharacter={hoveredCharacter}
        onCharacterHover={setHoveredCharacter}
        activeChar={activeChar}
      />
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
