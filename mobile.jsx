const { useState: mUseState } = React;

const MPHASE_COLORS = { 1:'#d4a05a', 2:'#4a8de8', 3:'#d04040', 4:'#a05cd0', 5:'#5fa856', 6:'#c8384a' };
const MPHASE_LABELS = { 1:'PHASE 1', 2:'PHASE 2', 3:'PHASE 3', 4:'PHASE 4', 5:'PHASE 5', 6:'PHASE 6' };
const SORT_TABS = [['release','Release','▤'],['chrono','Chrono','⇄'],['phase','Phase','◫'],['title','A–Z','⇅'],['imdb','IMDb','★'],['rt','RT','◉']];
const VIEW_MODES = [['grid','Grid','▦'],['list','List','☰'],['spatial','Spatial','◈']];

function ScoreBadges({ title, lead, compact }) {
  const imdb = title.imdb != null ? <div className="m-sc imdb" key="i" title={title.type === 'series' ? 'IMDb whole-series rating (shared across seasons)' : 'IMDb movie rating'}><span className="tg">IMDb</span>{title.imdb.toFixed(1)}</div> : null;
  const rt = title.rt != null ? <div className="m-sc rt" key="r" title="Rotten Tomatoes Tomatometer (critics)"><span className="tg">RT</span>{title.rt}%</div> : null;
  if (!imdb && !rt) return <div className={`m-scores${compact?' compact':''}`}><div className="m-sc none">Not yet rated</div></div>;
  return <div className={`m-scores${compact?' compact':''}`}>{lead === 'rt' ? [rt, imdb] : [imdb, rt]}</div>;
}

// The app bar is already three rows deep on a phone, so the view switch moved
// off m-appbar-top (where the account avatar now sits) onto its own tight row
// rather than becoming a fourth control crammed into the brand row.
function MobileTopBar({ viewMode, setViewMode, search, setSearch, onOpenFilters, filterCount, showing, total, sortLabel, sort, sortDir, setSortDir, onOpenAccount }) {
  const { progress } = window.useCollection();
  return (
    <div className="m-appbar">
      <div className="m-appbar-top">
        <div className="m-brandrow">
          <div className="m-mark"/>
          <div>
            <div className="m-btitle">MCU Connections</div>
            <div className="m-bsub">
              {showing === total ? `${total} titles` : `${showing} of ${total}`} · {sortLabel}
              {progress.seenReleased > 0 && ` · ${progress.seenReleased} seen`}
            </div>
          </div>
        </div>
        <window.AccountAvatarButton onOpen={onOpenAccount}/>
      </div>
      <div className="m-searchrow">
        <div className="m-searchbar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
          <div className="m-search-input"><input aria-label="Search titles or characters" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search titles or characters…"/></div>
          {search && <button className="m-clear" onClick={()=>setSearch('')} aria-label="Clear search">×</button>}
        </div>
        <SortOrderMenu sort={sort} sortDir={sortDir} setSortDir={setSortDir} mobile/>
      </div>
      <div className="m-viewrow">
        <div className="m-viewswitch">
          {VIEW_MODES.map(([v,l,ic]) => (
            <button key={v} className={viewMode===v?'on':''} onClick={()=>setViewMode(v)} aria-label={l} aria-pressed={viewMode===v} title={l}>
              <span className="vi">{ic}</span><span className="vl">{l}</span>
            </button>
          ))}
        </div>
        <button className={`m-fpill${filterCount?' act':''}`} onClick={onOpenFilters}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
          Filters{filterCount ? <span className="m-fcount">{filterCount}</span> : null}
        </button>
      </div>
    </div>
  );
}

// Shared disclosure: full wording in the popover, compact current value outside.
function SortOrderMenu({ sort, sortDir, setSortDir, mobile = false }) {
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef(null), trigger = React.useRef(null), choices = React.useRef(null);
  const id = React.useId();
  const labels = window.sortDirectionLabels(sort);
  const index = sortDir === 'desc' ? 1 : 0;
  const compact = sort === 'phase' ? labels[index].replace('Phase ', '')
    : sort === 'title' ? labels[index]
    : sort === 'release' ? ['Oldest', 'Newest'][index]
    : sort === 'chrono' ? ['Earliest', 'Latest'][index]
    : ['Lowest', 'Highest'][index];
  React.useEffect(() => { setOpen(false); }, [sort]);
  React.useEffect(() => {
    if (!open) return;
    choices.current?.querySelector('[aria-pressed="true"]')?.focus();
    const away = e => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const escape = e => {
      if (e.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return <div className={`sort-order${mobile ? ' mobile-order' : ''}`} ref={wrap}
    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} className="sort-order-trigger" aria-expanded={open} aria-controls={id}
      aria-label={`Sort order: ${labels[index]}`} onClick={() => setOpen(v => !v)}>
      {mobile && <span className="sort-order-prefix">Order:</span>}{compact}
      <svg className="sort-order-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>
    {open && <div id={id} ref={choices} className="sort-order-pop" role="group" aria-label="Sort order">
      <div className="sort-order-heading">Order</div>
      {labels.map((label, i) => <button key={label} aria-pressed={index === i}
        onClick={() => { setSortDir(i === 0 ? 'asc' : 'desc'); setOpen(false); trigger.current?.focus(); }}>
        <span>{label}</span><span aria-hidden="true">{index === i ? '✓' : ''}</span>
      </button>)}
    </div>}
  </div>;
}
window.SortOrderMenu = SortOrderMenu;

function SortTabs({ sort, setSort }) {
  return (
    <div className="m-sort-footer">
    <nav className="m-tabs" aria-label="Sort titles by">
      {SORT_TABS.map(([v,l,ic])=>(
        <button key={v} className={`m-tab${sort===v?' on':''}`} onClick={()=>setSort(v)} aria-pressed={sort===v}>
          <span className="ti">{ic}</span>{l}
        </button>
      ))}
    </nav>
    </div>
  );
}

// Wraps the substring(s) of `text` matching `query` in a <mark> so the UI can
// show exactly what triggered a search result.
function Highlight({ text, query }) {
  if (text == null) return null;
  const str = String(text);
  const q = query && query.trim();
  if (!q) return str;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = str.split(new RegExp(`(${escaped})`, 'ig'));
  if (parts.length === 1) return str;
  return parts.map((part, i) => i % 2 === 1 ? <mark key={i} className="hl">{part}</mark> : part);
}

function MatchBadge({ matchedChars, query }) {
  if (!matchedChars || !matchedChars.length) return null;
  const id = matchedChars[0];
  const c = window.CHARACTERS[id];
  if (!c) return null;
  const portrait = window.MEDIA && window.MEDIA.actors && window.MEDIA.actors[id]
    ? (window.mediaURL ? window.mediaURL('a', id, window.MEDIA.profile_base + window.MEDIA.actors[id]) : window.MEDIA.profile_base + window.MEDIA.actors[id])
    : null;
  return (
    <div className="card-match" style={{'--match-color': c.color}} title={matchedChars.map(mid => window.CHARACTERS[mid].name).join(', ')}>
      <div className="card-match-portrait" style={{background:`linear-gradient(135deg, ${c.color}, ${c.color}88)`}}>
        {portrait ? <img src={portrait} alt={c.name} loading="lazy"/> : <span>{c.initials}</span>}
      </div>
      <div className="card-match-text">
        <div className="card-match-char"><Highlight text={c.name} query={query}/>{matchedChars.length > 1 ? ` +${matchedChars.length - 1}` : ''}</div>
        <div className="card-match-actor"><Highlight text={c.actor} query={query}/></div>
      </div>
    </div>
  );
}

// Reorder animation for the mobile grid and list (FLIP: first, last, invert,
// play). When the sort mode or order changes, each title's on-screen position is
// read during render, while the DOM still shows the old order. After React
// commits the new order, every visible title is shifted back to where it was and
// animated into its new slot, echoing the spatial view's card motion. Titles are
// tracked by data-flip-id rather than DOM identity because the list rebuilds its
// phase/year groups on every reorder.
// A phone screen shows only a few titles, so most of them change on a reorder:
// arrivals slide in from the side they came from, and departures leave as
// temporary copies (in a clipped, non-interactive layer) sliding toward their new
// slot. Travel is capped to part of the viewport. Skipped entirely for
// prefers-reduced-motion.
const FLIP_EASE = 'cubic-bezier(.2,.8,.2,1)';
const FLIP_MS = 520;
let flipLayer = null;

function measureFlip(root) {
  if (!root) return null;
  const view = root.getBoundingClientRect();
  const rects = new Map();
  const ghosts = new Map();
  root.querySelectorAll('[data-flip-id]').forEach(el => {
    const r = el.getBoundingClientRect();
    rects.set(el.dataset.flipId, r);
    if (r.bottom > view.top && r.top < view.bottom) ghosts.set(el.dataset.flipId, el.cloneNode(true));
  });
  return { view, rects, ghosts };
}

function playFlip(root, prev) {
  if (flipLayer) { flipLayer.remove(); flipLayer = null; }
  const view = root.getBoundingClientRect();
  const cap = view.height * 0.45;
  const clampY = dy => Math.max(-cap, Math.min(cap, dy));
  const shown = new Set();
  const next = new Map();
  let entering = 0;
  root.querySelectorAll('[data-flip-id]').forEach(el => {
    if (el.getAnimations) el.getAnimations().forEach(a => { if (a.id === 'm-flip') a.cancel(); });
    const id = el.dataset.flipId;
    const now = el.getBoundingClientRect();
    next.set(id, now);
    if (now.bottom <= view.top || now.top >= view.bottom) return;
    shown.add(id);
    const old = prev.rects.get(id);
    const wasVisible = prev.ghosts.has(id);
    let frames, delay = 0;
    if (wasVisible) {
      const dx = old.left - now.left, dy = old.top - now.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      frames = [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }];
    } else if (old) {
      frames = [
        { opacity: 0, transform: `translate(${old.left - now.left}px, ${clampY(old.top - now.top)}px)` },
        { opacity: 1, offset: 0.4 },
        { opacity: 1, transform: 'none' },
      ];
      delay = Math.min(entering++, 8) * 24;
    } else {
      frames = [{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }];
      delay = Math.min(entering++, 8) * 24;
    }
    const anim = el.animate(frames, { duration: FLIP_MS, easing: FLIP_EASE, delay, fill: 'backwards' });
    anim.id = 'm-flip';
  });

  const leaving = [...prev.ghosts].filter(([id]) => !shown.has(id));
  if (!leaving.length) return;
  const layer = document.createElement('div');
  layer.className = 'm-flip-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.inert = true;
  Object.assign(layer.style, { left: view.left + 'px', top: view.top + 'px', width: view.width + 'px', height: view.height + 'px' });
  const anims = leaving.map(([id, ghost]) => {
    const old = prev.rects.get(id);
    const to = next.get(id);
    ghost.removeAttribute('data-flip-id');
    Object.assign(ghost.style, { position: 'absolute', margin: '0', boxSizing: 'border-box',
      left: (old.left - view.left) + 'px', top: (old.top - view.top) + 'px', width: old.width + 'px', height: old.height + 'px' });
    layer.appendChild(ghost);
    const move = to ? `translate(${to.left - old.left}px, ${clampY(to.top - old.top)}px)` : 'scale(.97)';
    return ghost.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, offset: 0.75 }, { opacity: 0, transform: move }], { duration: FLIP_MS * 0.8, easing: FLIP_EASE, fill: 'forwards' });
  });
  document.body.appendChild(layer);
  flipLayer = layer;
  Promise.all(anims.map(a => a.finished)).catch(() => {}).then(() => {
    layer.remove();
    if (flipLayer === layer) flipLayer = null;
  });
}

function useReorderAnimation(orderKey) {
  const ref = React.useRef(null);
  const lastKey = React.useRef(orderKey);
  const before = React.useRef(null);
  if (orderKey !== lastKey.current) {
    lastKey.current = orderKey;
    before.current = measureFlip(ref.current);
  }
  React.useLayoutEffect(() => {
    const prev = before.current;
    before.current = null;
    if (!prev || !ref.current || typeof Element === 'undefined' || !Element.prototype.animate) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    playFlip(ref.current, prev);
  }, [orderKey]);
  return ref;
}

// The card is a <div> wrapping a dedicated open button rather than one big
// <button>, because the status toggles are buttons too and a nested <button>
// is invalid HTML. The open button still covers the whole poster + meta area,
// so tapping anywhere except the toggles opens the cast sheet exactly as before.
function MobileGrid({ titles, onSelect, searchCharMatches, search, empty, orderKey }) {
  const PosterArt = window.PosterArt;
  const { statusOf } = window.useCollection();
  const flipRef = useReorderAnimation(orderKey);
  if (!titles.length) return <EmptyState {...(empty || {})}/>;
  return (
    <div className="m-scrollarea" ref={flipRef}>
      <div className="m-grid">
        {titles.map(t => {
          const matchedChars = searchCharMatches ? searchCharMatches[t.id] : null;
          const seen = statusOf(t.id) === 'seen';
          return (
            <div key={t.id} data-flip-id={t.id} className={`m-card${seen ? ' seen' : ''}`}>
              <button className="m-card-open" onClick={()=>onSelect(t.id)}>
                <div className="m-pw">
                  <PosterArt title={t}/>
                  <span className="m-pbadge" style={{background:MPHASE_COLORS[t.phase]}}>PH {t.phase}</span>
                  <ScoreBadges title={t} compact/>
                </div>
                <div className="m-cmeta">
                  <div className="m-ctitle"><Highlight text={t.title} query={search}/></div>
                  <div className="m-cyear">
                    <span>{t.year}</span>
                    {t.budget != null && <b>${t.budget < 1 ? t.budget : Math.round(t.budget)}M</b>}
                  </div>
                  <MatchBadge matchedChars={matchedChars} query={search}/>
                </div>
              </button>
              <window.TitleStatusActions title={t} className="m-card-tsa"/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileList({ titles, sort, onSelect, searchCharMatches, search, empty, orderKey }) {
  const PosterArt = window.PosterArt;
  const { statusOf } = window.useCollection();
  const flipRef = useReorderAnimation(orderKey);
  if (!titles.length) return <EmptyState {...(empty || {})}/>;
  const ranked = sort === 'imdb' || sort === 'rt';
  const lead = sort === 'rt' ? 'rt' : 'imdb';
  // Group headers for the non-score sorts
  const groups = [];
  if (sort === 'release' || sort === 'chrono') {
    titles.forEach(t => {
      const key = String(t.year);
      const last = groups[groups.length-1];
      if (last && last.label === key) last.items.push(t);
      else groups.push({ key: key + '#' + groups.length, label: key, items: [t] });
    });
  } else if (sort === 'phase') {
    titles.forEach(t => {
      const key = String(t.phase);
      const last = groups[groups.length-1];
      if (last && last.key.startsWith('p' + key + '#')) last.items.push(t);
      else groups.push({ key: 'p' + key + '#' + groups.length, label: MPHASE_LABELS[t.phase], color: MPHASE_COLORS[t.phase], items: [t] });
    });
  } else {
    groups.push({ key: 'all', label: null, items: titles });
  }
  let n = 0;
  return (
    <div className="m-scrollarea" ref={flipRef}>
      {groups.map(g => (
        <div className="m-group" key={g.key}>
          {g.label && <div className="m-glabel" data-flip-id={'g:' + g.key} style={g.color?{color:g.color}:null}>{g.label}</div>}
          <div className="m-list">
            {g.items.map(t => {
              n += 1;
              const score = lead === 'rt' ? t.rt : (t.imdb != null ? t.imdb * 10 : null);
              const matchedChars = searchCharMatches ? searchCharMatches[t.id] : null;
              const seen = statusOf(t.id) === 'seen';
              return (
                <div key={t.id} data-flip-id={t.id} className={`m-lrow${seen ? ' seen' : ''}`}>
                  <button className="m-lrow-open" onClick={()=>onSelect(t.id)}>
                    {ranked && <div className="m-rank">{n}</div>}
                    <div className="m-lthumb"><PosterArt title={t}/></div>
                    <div className="m-ltext">
                      <div className="m-ltitle"><Highlight text={t.title} query={search}/></div>
                      <div className="m-lmeta">
                        {!ranked && <span>{t.type.toUpperCase()}</span>}
                        {ranked && <span>{t.year}</span>}
                        <span className="m-dot"/>
                        <span style={{color:MPHASE_COLORS[t.phase]}}>{MPHASE_LABELS[t.phase]}</span>
                        {t.budget != null && <><span className="m-dot"/><span>${t.budget < 1 ? t.budget : Math.round(t.budget)}M</span></>}
                      </div>
                      <MatchBadge matchedChars={matchedChars} query={search}/>
                      {ranked && score != null && (
                        <div className="m-barw"><div className="m-barf" style={{width:score+'%', background: lead==='rt' ? '#fa320a' : '#f5c518'}}/></div>
                      )}
                    </div>
                    <ScoreBadges title={t} lead={lead}/>
                  </button>
                  <window.TitleStatusActions title={t} className="m-lrow-tsa"/>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, sub, mark }) {
  return (
    <div className="m-empty">
      <div className="m-empty-mark">{mark || '◍'}</div>
      <div className="m-empty-t">{title || 'No titles match'}</div>
      <div className="m-empty-s">{sub || 'Try clearing a filter or the search box.'}</div>
    </div>
  );
}

function Sheet({ children, onClose, tall, label }) {
  const ref = React.useRef(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  React.useEffect(() => {
    const sheet = ref.current;
    const opener = document.activeElement;
    // The sheet lives inside #root, so make its app siblings inert, not #root.
    const siblings = Array.from(sheet.parentElement.children).filter((el) => el !== sheet && !el.classList.contains('m-scrim'));
    const previous = siblings.map((el) => [el, el.inert]);
    previous.forEach(([el]) => { el.inert = true; });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(sheet.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')).filter((el) => el.getClientRects().length);
    (focusable()[0] || sheet).focus();
    const keys = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key !== 'Tab') return;
      const items = focusable();
      const first = items[0] || sheet;
      const last = items[items.length - 1] || sheet;
      if (e.shiftKey && (document.activeElement === first || !sheet.contains(document.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !sheet.contains(document.activeElement))) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', keys);
    return () => {
      document.removeEventListener('keydown', keys);
      previous.forEach(([el, inert]) => { el.inert = inert; });
      document.body.style.overflow = overflow;
      if (opener && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <>
      <div className="m-scrim" onClick={onClose} aria-hidden="true"/>
      <div ref={ref} className={`m-sheet${tall?' tall':''}`} role="dialog" aria-modal="true" aria-label={label || 'Details'} tabIndex={-1}>
        <button className="m-grab" onClick={onClose} aria-label="Close"/>
        <div className="m-sheet-body">{children}</div>
      </div>
    </>
  );
}

function FilterSheet({ phaseFilter, setPhaseFilter, typeFilter, setTypeFilter, budgetFilter, setBudgetFilter, collectionFilter, setCollectionFilter, sort, sortDir, setSortDir, onClose, showing, onClear }) {
  const { progress } = window.useCollection();
  return (
    <Sheet onClose={onClose} tall label="Filters">
      <div className="m-sh-head">
        <div className="m-sh-title">Filters</div>
        <button className="m-sh-clear" onClick={onClear}>Clear all</button>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">Collection</div>
        <div className="m-chips">
          {window.COLLECTION_OPTIONS.map(([v,l])=>(
            <button key={v} className={`m-chip${collectionFilter===v?' on':''}`} aria-pressed={collectionFilter===v} onClick={()=>setCollectionFilter(v)}>{l}</button>
          ))}
        </div>
        <div className="m-progress">
          {progress.seenReleased} of {progress.releasedTotal} released titles seen
          {progress.watchlist > 0 && <> · {progress.watchlist} on watchlist</>}
        </div>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">Phase</div>
        <div className="m-chips">
          {['all','1','2','3','4','5','6'].map(p=>(
            <button key={p} className={`m-chip ph${phaseFilter===p?' on':''}`} onClick={()=>setPhaseFilter(p)}
              style={p!=='all' && phaseFilter===p ? {background:MPHASE_COLORS[p], borderColor:MPHASE_COLORS[p], color:'#0a0c14'} : null}>
              {p==='all'?'All':p}
            </button>
          ))}
        </div>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">Type</div>
        <div className="m-chips">
          {[['all','All'],['film','Films'],['series','Series']].map(([v,l])=>(
            <button key={v} className={`m-chip${typeFilter===v?' on':''}`} onClick={()=>setTypeFilter(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">Budget</div>
        <div className="m-chips">
          {[['all','All'],['low','<$50M'],['mid','$50–200M'],['high','$200–300M'],['mega','$300M+']].map(([v,l])=>(
            <button key={v} className={`m-chip${budgetFilter===v?' on':''}`} onClick={()=>setBudgetFilter(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">Order</div>
        <div className="m-chips">
          {window.sortDirectionLabels(sort).map((label, i) => {
            const dir = i === 0 ? 'asc' : 'desc';
            return <button key={dir} className={`m-chip${sortDir===dir?' on':''}`}
              aria-pressed={sortDir===dir} onClick={()=>setSortDir(dir)}>{label}</button>;
          })}
        </div>
      </div>
      <button className="m-apply" onClick={onClose}>Show {showing} {showing === 1 ? 'title' : 'titles'}</button>
    </Sheet>
  );
}

function CastSheet({ title, onClose, onCharacterClick, activeChar, onGoSpatial, inSpatial }) {
  if (!title) return null;
  const PosterArt = window.PosterArt;
  return (
    <Sheet onClose={onClose} tall label={`${title.title} details`}>
      <div className="m-cast-hero">
        <div className="m-hero-th"><PosterArt title={title}/></div>
        <div className="m-hero-text">
          <div className="m-eyebrow" style={{color:MPHASE_COLORS[title.phase]}}>{MPHASE_LABELS[title.phase]} · {title.type.toUpperCase()} · {title.year}</div>
          <h2 className="m-dtitle">{title.title}</h2>
          <ScoreBadges title={title}/>
          <window.TitleStatusActions title={title} variant="inline" className="m-hero-tsa"/>
        </div>
      </div>
      <div className="m-flab">Featured cast · {title.cast.length}</div>
      <div className="m-castlist">
        {title.cast.length === 0 && <div className="m-empty-cast">No major recurring cast tracked.</div>}
        {title.cast.map(ch => {
          const c = window.CHARACTERS[ch];
          if (!c) return null;
          return (
            <button key={ch} className={`m-crow${activeChar===ch?' on':''}`} onClick={()=>onCharacterClick(ch)}>
              <div className="m-port" style={{background:`linear-gradient(135deg, ${c.color}, ${c.color}88)`}}>
                {window.MEDIA && window.MEDIA.actors && window.MEDIA.actors[ch]
                  ? <img src={window.mediaURL ? window.mediaURL('a', ch, window.MEDIA.profile_base + window.MEDIA.actors[ch]) : window.MEDIA.profile_base + window.MEDIA.actors[ch]} alt={c.name} loading="lazy"/>
                  : <span>{c.initials}</span>}
              </div>
              <div className="m-ctext">
                <div className="m-cn">{c.name}</div>
                <div className="m-an">{c.actor}</div>
              </div>
              <span className="m-cdot" style={{background:c.color}}/>
            </button>
          );
        })}
      </div>
      {!inSpatial && (
        <button className="m-apply ghost" onClick={onGoSpatial}>◈ See connections in Spatial</button>
      )}
    </Sheet>
  );
}

// Unscaled overlay that "pops" the focused card out of the zoomed canvas so it stays legible
function FocusPop({ title, x, y, onOpenCast }) {
  const { statusOf } = window.useCollection();
  if (!title) return null;
  const PosterArt = window.PosterArt;
  const seen = statusOf(title.id) === 'seen';
  return (
    <div className={`m-focuspop${seen ? ' seen' : ''}`} style={{left:x+'px', top:y+'px'}}>
      <button className="m-fp-open" onClick={onOpenCast}>
        <div className="m-fp-poster">
          <PosterArt title={title}/>
          <span className="m-pbadge" style={{background:MPHASE_COLORS[title.phase]}}>PH {title.phase}</span>
        </div>
        <div className="m-fp-meta">
          <div className="m-fp-title">{title.title}</div>
          <ScoreBadges title={title}/>
          <div className="m-fp-cta">Tap for cast ›</div>
        </div>
      </button>
      <window.TitleStatusActions title={title} className="m-fp-tsa"/>
    </div>
  );
}

function SpatialHint({ focused, sharedCount }) {
  return (
    <div className="m-ghint">
      {focused
        ? <span><b>{sharedCount}</b> shared {sharedCount === 1 ? 'character' : 'characters'} · tap background to clear</span>
        : <span>Tap a title to focus · pinch to zoom · double-tap to zoom in</span>}
    </div>
  );
}

Object.assign(window, { MobileTopBar, SortTabs, MobileGrid, MobileList, FilterSheet, CastSheet, FocusPop, SpatialHint, ScoreBadges, Sheet, EmptyState, MatchBadge, Highlight });
