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

function sortTitles(list, sort) {
  const out = list.slice();
  if (sort === 'chrono') out.sort((a,b) => a.chronOrder - b.chronOrder);
  else if (sort === 'title') out.sort((a,b) => a.title.localeCompare(b.title));
  else if (sort === 'imdb') out.sort((a,b) => (b.imdb ?? -1) - (a.imdb ?? -1));
  else if (sort === 'rt') out.sort((a,b) => (b.rt ?? -1) - (a.rt ?? -1));
  else if (sort === 'phase') out.sort((a,b) => a.phase - b.phase || a.release.localeCompare(b.release));
  else out.sort((a,b) => a.release.localeCompare(b.release));
  return out;
}

function computeLayout(titles, sort) {
  const positions = {};
  const colW = CARD_W + 60;
  const rowH = CARD_H + 70;

  if (sort === 'phase') {
    // Group by phase into vertical lanes
    const byPhase = {1:[],2:[],3:[],4:[],5:[],6:[]};
    titles.forEach(t => byPhase[t.phase].push(t));
    Object.keys(byPhase).forEach(p => byPhase[p].sort((a,b)=>a.release.localeCompare(b.release)));
    let y = 60;
    Object.keys(byPhase).sort().forEach(p => {
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
  } else if (sort === 'imdb') {
    // Highest-rated first, flowing grid
    const sorted = titles.slice().sort((a,b)=> (b.imdb ?? -1) - (a.imdb ?? -1));
    const cols = 7;
    sorted.forEach((t,i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions[t.id] = {
        x: 80 + col * colW + seedJitter(t.id+'x', 26),
        y: 80 + row * rowH + seedJitter(t.id+'y', 22),
      };
    });
  } else if (sort === 'rt') {
    // Highest Tomatometer first, flowing grid
    const sorted = titles.slice().sort((a,b)=> (b.rt ?? -1) - (a.rt ?? -1));
    const cols = 7;
    sorted.forEach((t,i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions[t.id] = {
        x: 80 + col * colW + seedJitter(t.id+'x', 26),
        y: 80 + row * rowH + seedJitter(t.id+'y', 22),
      };
    });
  } else if (sort === 'title') {
    // Alphabetical flow
    const sorted = titles.slice().sort((a,b)=>a.title.localeCompare(b.title));
    const cols = 7;
    sorted.forEach((t,i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions[t.id] = {
        x: 80 + col * colW + seedJitter(t.id+'x', 26),
        y: 80 + row * rowH + seedJitter(t.id+'y', 22),
      };
    });
  } else {
    // release or chrono — horizontal timeline with phase as vertical band
    const sorted = titles.slice().sort((a,b)=>{
      if (sort === 'chrono') return a.chronOrder - b.chronOrder;
      return a.release.localeCompare(b.release);
    });
    // Place in timeline rows; phase determines vertical band
    const phaseRow = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
    // To avoid horizontal collisions, count along x and bump y when too close
    const lastXByRow = {0:-Infinity,1:-Infinity,2:-Infinity,3:-Infinity,4:-Infinity,5:-Infinity};
    sorted.forEach((t, i) => {
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

function Card({ title, pos, onClick, onHover, onDragStart, isSelected, isHighlighted, isDimmed, isDragging }) {
  const phaseColor = PHASE_COLORS[title.phase];
  const downRef = useRef({ x: 0, y: 0, moved: false });
  return (
    <div
      className={`card ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''} ${isDragging ? 'dragging' : ''}`}
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
        <div className="rating-row">
          {title.imdb != null && (
            <div className="card-rating imdb" title="IMDb rating">
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
        <div className="card-title">{title.title}</div>
        <div className="card-year">
          <span>{title.year}</span>
          {title.budget != null && (
            <span className="card-budget">${title.budget < 1 ? title.budget : Math.round(title.budget)}M</span>
          )}
        </div>
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

function Toolbar({ sort, setSort, phaseFilter, setPhaseFilter, typeFilter, setTypeFilter, budgetFilter, setBudgetFilter, search, setSearch, total, showing, onResetView }) {
  const [popOpen, setPopOpen] = useState(false);
  const popRef = useRef(null);
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
      <div className="tb-row">
        <div className="brand">
          <div className="brand-mark"/>
          <div>
            <div className="brand-title">MCU Connections</div>
            <div className="brand-sub">{showing} of {total} titles</div>
          </div>
        </div>
        <div className="control-group">
          <div className="segmented">
            {SORT_OPTIONS.map(([v,l,s,ic])=>(
              <button key={v} className={sort===v?'on':''} onClick={()=>setSort(v)} title={l}>
                <span className="si">{ic}</span><span className="lg">{l}</span><span className="sm">{s}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <div className="segmented">
            {[['all','All'],['film','Films'],['series','Series']].map(([v,l])=>(
              <button key={v} className={typeFilter===v?'on':''} onClick={()=>setTypeFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
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
              {activeFilters > 0 && (
                <button className="pop-clear" onClick={()=>{ setPhaseFilter('all'); setBudgetFilter('all'); }}>Clear filters</button>
              )}
            </div>
          )}
        </div>
        <div className="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"/>
        </div>
        <button className="reset-view" onClick={onResetView} title="Reset view">⊙<span className="lg"> Reset</span></button>
      </div>
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

function App() {
  const [sort, setSort] = useState('release');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mediaReady, setMediaReady] = useState(!!window.MEDIA);

  useEffect(() => { setMediaReady(true); }, []);
  const device = useDevice();
  const isTouch = device !== 'desktop';
  const [viewMode, setViewMode] = useState('grid');
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
  const viewportRef = useRef(null);
  const panRef = useRef({ panning: false, sx: 0, sy: 0, ox: 0, oy: 0 });

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
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q));
    }
    return list;
  }, [phaseFilter, typeFilter, budgetFilter, search]);

  const layout = useMemo(() => computeLayout(filtered, sort), [filtered, sort]);
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
  useEffect(() => { setOverrides({}); }, [sort, phaseFilter, typeFilter, budgetFilter, search]);

  const selectedTitle = selectedId ? window.TITLES.find(t => t.id === selectedId) : null;
  const drawerTitle = drawerId ? window.TITLES.find(t => t.id === drawerId) : null;
  const ordered = useMemo(() => sortTitles(filtered, sort), [filtered, sort]);

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
    const rect = viewportRef.current.getBoundingClientRect();
    const colW = CARD_W + 60;
    const gridSort = sort === 'phase' || sort === 'title' || sort === 'imdb' || sort === 'rt';
    // Left/top-most card in canvas coords, so we can pad from the real content edge
    let minX = Infinity, minY = Infinity;
    Object.values(basePositions).forEach(p => { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; });
    if (!isFinite(minX)) { minX = 0; minY = 0; }
    // Aim for a legible card size rather than fitting the whole canvas.
    if (gridSort) {
      // Grid layouts: match the grid's width (mobile keeps a legibility floor of ~3 columns)
      const fit = (rect.width - 32) / canvasW;
      const floor = rect.width / (colW * 3);
      const scale = Math.min(1, isTouch ? Math.max(fit, floor) : fit);
      const zoomed = canvasW * scale > rect.width - 32;
      setView({
        x: zoomed ? 14 - minX * scale : (rect.width - canvasW * scale) / 2,
        y: canvasH * scale <= rect.height - 32 ? (rect.height - canvasH * scale) / 2 : 14 - minY * scale,
        scale,
      });
    } else {
      // Timeline layouts: start at the beginning, showing a handful of cards at readable size
      const cols = isTouch ? 3.4 : 8.5;
      const scale = Math.min(1, Math.max(ZOOM_MIN, rect.width / (colW * cols)));
      setView({
        x: 14 - minX * scale,
        y: canvasH * scale <= rect.height - 32 ? (rect.height - canvasH * scale) / 2 : 14 - minY * scale,
        scale,
      });
    }
  }, [canvasW, canvasH, basePositions, sort, isTouch]);

  // Reset view whenever layout changes
  useLayoutEffect(() => { resetView(); }, [resetView]);

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

  const filterCount = (phaseFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (budgetFilter !== 'all' ? 1 : 0);
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
              isDragging={draggingId === t.id}
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
          showing={filtered.length} total={window.TITLES.length}
          sort={sort} setSort={setSort} sortLabel={SORT_LABEL[sort]}
        />
        {charBanner}
        <div className="m-main">
          {viewMode === 'grid' && <window.MobileGrid titles={ordered} onSelect={onCardTap}/>}
          {viewMode === 'list' && <window.MobileList titles={ordered} sort={sort} onSelect={onCardTap}/>}
          {viewMode === 'spatial' && (
            <div className="m-spatial-wrap">
              {canvasEl}
              <window.SpatialHint focused={!!selectedId} sharedCount={sharedCharCount}/>
            </div>
          )}
        </div>
        {device === 'mobile' && <window.SortTabs sort={sort} setSort={setSort}/>}        {sheet === 'filters' && (
          <window.FilterSheet
            phaseFilter={phaseFilter} setPhaseFilter={setPhaseFilter}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            budgetFilter={budgetFilter} setBudgetFilter={setBudgetFilter}
            sort={sort} setSort={setSort}
            showing={filtered.length}
            onClear={() => { setPhaseFilter('all'); setTypeFilter('all'); setBudgetFilter('all'); }}
            onClose={() => setSheet(null)}
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
        sort={sort} setSort={setSort}
        phaseFilter={phaseFilter} setPhaseFilter={setPhaseFilter}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        budgetFilter={budgetFilter} setBudgetFilter={setBudgetFilter}
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

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
