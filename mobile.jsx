const { useState: mUseState } = React;

const MPHASE_COLORS = { 1:'#d4a05a', 2:'#4a8de8', 3:'#d04040', 4:'#a05cd0', 5:'#5fa856', 6:'#c8384a' };
// Text comes from the i18n runtime (i18n.js); `mtr` avoids clashing with the
// `t` used for titles throughout this file.
const MI18N = window.MCU_I18N;
const mtr = (key, vars) => MI18N.tr(key, vars);
const mPhaseLabel = (n) => MI18N.upper(mtr('phase.label', { n }));
const mTypeLabel = (type) => MI18N.upper(mtr(type === 'film' ? 'type.film.one' : 'type.series.one'));
// [value, icon]; labels come from sort.short.* and view.* in the active language.
const SORT_TABS = [['release','▤'],['chrono','⇄'],['phase','◫'],['title','⇅'],['imdb','★'],['rt','◉']];
const VIEW_MODES = [['list','☰'],['grid','▦'],['spatial','◈']];

function ScoreBadges({ title, lead, compact }) {
  const imdb = title.imdb != null ? <div className="m-sc imdb" key="i" title={mtr(title.type === 'series' ? 'score.imdbSeries' : 'score.imdbMovie')}><span className="tg">IMDb</span>{title.imdb.toFixed(1)}</div> : null;
  const rt = title.rt != null ? <div className="m-sc rt" key="r" title={mtr('score.rt')}><span className="tg">RT</span>{title.rt}%</div> : null;
  if (!imdb && !rt) return <div className={`m-scores${compact?' compact':''}`}><div className="m-sc none">{mtr('score.none')}</div></div>;
  return <div className={`m-scores${compact?' compact':''}`}>{lead === 'rt' ? [rt, imdb] : [imdb, rt]}</div>;
}

// The app bar is already three rows deep on a phone, so the view switch moved
// off m-appbar-top (where the account avatar now sits) onto its own tight row
// rather than becoming a fourth control crammed into the brand row.
function MobileTopBar({ viewMode, setViewMode, search, setSearch, onPickTitle, onPickPerson, onOpenFilters, filterCount, sort, sortDir, setSortDir, onOpenAccount, collectionFilter, setCollectionFilter }) {
  // The suggestions list spans the whole search row (see SearchInput).
  const [searchRow, setSearchRow] = React.useState(null);
  return (
    <div className="m-appbar" role="banner">
      <div className="m-appbar-top">
        <div className="m-brandrow">
          <div className="m-mark"/>
          <h1 className="m-btitle">{mtr('app.name')}</h1>
        </div>
        <window.SyncStatus/>
        <window.LanguageMenu compact/>
        <window.AccountAvatarButton onOpen={onOpenAccount}/>
      </div>
      <div className="m-searchrow" ref={setSearchRow}>
        <div className="m-searchbar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
          <div className="m-search-input"><window.SearchInput value={search} onChange={setSearch} onPickTitle={onPickTitle} onPickPerson={onPickPerson}
            ariaLabel={mtr('search.aria')} placeholder={mtr('search.placeholder')} portalTo={searchRow}/></div>
          {search && <button className="m-clear" onClick={()=>setSearch('')} aria-label={mtr('search.clear')}>×</button>}
        </div>
        <SortOrderMenu sort={sort} sortDir={sortDir} setSortDir={setSortDir} mobile/>
        <button className={`m-fpill${filterCount?' act':''}`} onClick={onOpenFilters}
          aria-label={filterCount ? mtr('filters.aria', { n: filterCount }) : mtr('filters.title')} title={mtr('filters.title')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
          {filterCount ? <span className="m-fcount">{filterCount}</span> : null}
        </button>
      </div>
      <div className="m-viewrow">
        <window.CollectionSwitch value={collectionFilter} onChange={setCollectionFilter} variant="compact"/>
        <ViewMenu viewMode={viewMode} setViewMode={setViewMode}/>
      </div>
    </div>
  );
}

// Order: every sort has exactly two directions, so the control is a toggle
// (desktop toolbar and phone search row): a tap flips the order. It shows the
// current direction; its accessible name also says what a tap switches to.
// The icon is a down arrow (reading order) beside bars that grow down the list
// for the first direction (Oldest, Lowest, A–Z…) and shrink for the second;
// the bars flip over as the order changes.
function SortOrderMenu({ sort, sortDir, setSortDir, mobile = false }) {
  const labels = window.sortDirectionLabels(sort);
  const index = sortDir === 'desc' ? 1 : 0;
  const compact = window.sortDirectionLabels(sort, true)[index];
  const label = mtr('order.toggleAria', { label: labels[index], next: labels[1 - index] });
  return <div className={`sort-order${mobile ? ' mobile-order' : ''}`}>
    <button className="sort-order-trigger sort-order-toggle" aria-label={label} title={label}
      onClick={() => setSortDir(index === 0 ? 'desc' : 'asc')}>
      {compact}
      <svg className={`sort-order-flip${index ? ' desc' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M5 4v16M2 17l3 3 3-3" strokeLinejoin="round"/>
        <g className="bars"><path d="M11 6h4M11 12h7M11 18h10"/></g>
      </svg>
    </button>
  </div>;
}
window.SortOrderMenu = SortOrderMenu;

// Language picker in the header (desktop toolbar and mobile app bar). A menu
// rather than a two-way toggle so more languages fit without layout changes;
// each option is written in its own language. Same open/close behaviour as
// SortOrderMenu, including ignoring Safari's null-relatedTarget blur on tap.
function LanguageMenu({ compact = false }) {
  const { lang, setLang, languages, tr } = window.useI18n();
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef(null), trigger = React.useRef(null), choices = React.useRef(null);
  const id = React.useId();
  const list = languages();
  const current = list.find((l) => l.code === lang) || list[0];
  React.useEffect(() => {
    if (!open) return;
    choices.current?.querySelector('[aria-pressed="true"]')?.focus();
    const away = e => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const escape = e => { if (e.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  if (list.length < 2) return null;
  return <div className={`sort-order lang-menu${compact ? ' mobile-order' : ''}`} ref={wrap}
    onBlur={e => { if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} className="sort-order-trigger" aria-expanded={open} aria-controls={id}
      aria-label={tr('lang.aria', { name: current.name })} title={tr('lang.label')} onClick={() => setOpen(v => !v)}>
      <svg className="lang-globe" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>
      </svg>
      <span>{current.short}</span>
      <svg className="sort-order-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>
    {open && <div id={id} ref={choices} className="sort-order-pop" role="group" aria-label={tr('lang.label')}>
      <div className="sort-order-heading">{tr('lang.label')}</div>
      {list.map((l) => <button key={l.code} lang={l.code} aria-pressed={lang === l.code}
        onClick={() => { setLang(l.code); setOpen(false); trigger.current?.focus(); }}>
        <span>{l.name}</span><span aria-hidden="true">{lang === l.code ? '✓' : ''}</span>
      </button>)}
    </div>}
  </div>;
}
window.LanguageMenu = LanguageMenu;

// List / Grid / Spatial as one compact menu, so the second header row has room
// for the collection switch. Same open/close behaviour as SortOrderMenu,
// including ignoring Safari's null-relatedTarget blur on tap.
function ViewMenu({ viewMode, setViewMode }) {
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef(null), trigger = React.useRef(null), choices = React.useRef(null);
  const id = React.useId();
  const current = VIEW_MODES.find(([v]) => v === viewMode) || VIEW_MODES[0];
  const currentLabel = mtr('view.' + current[0]);
  React.useEffect(() => {
    if (!open) return;
    choices.current?.querySelector('[aria-pressed="true"]')?.focus();
    const away = e => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const escape = e => { if (e.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return <div className="sort-order mobile-order view-menu" ref={wrap}
    onBlur={e => { if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} className="sort-order-trigger" aria-expanded={open} aria-controls={id}
      aria-label={mtr('view.aria', { label: currentLabel })} onClick={() => setOpen(v => !v)}>
      <span className="vi" aria-hidden="true">{current[1]}</span>{currentLabel}
      <svg className="sort-order-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>
    {open && <div id={id} ref={choices} className="sort-order-pop" role="group" aria-label={mtr('view.label')}>
      <div className="sort-order-heading">{mtr('view.label')}</div>
      {VIEW_MODES.map(([v, ic]) => <button key={v} aria-pressed={viewMode === v}
        onClick={() => { setViewMode(v); setOpen(false); trigger.current?.focus(); }}>
        <span><span className="vi" aria-hidden="true">{ic}</span>{mtr('view.' + v)}</span><span aria-hidden="true">{viewMode === v ? '✓' : ''}</span>
      </button>)}
    </div>}
  </div>;
}

function SortTabs({ sort, setSort }) {
  return (
    <div className="m-sort-footer">
    <nav className="m-tabs" aria-label={mtr('sort.navAria')}>
      {SORT_TABS.map(([v,ic])=>(
        <button key={v} className={`m-tab${sort===v?' on':''}`} onClick={()=>setSort(v)} aria-pressed={sort===v}>
          <span className="ti">{ic}</span>{mtr('sort.short.' + v)}
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
  const q = query ? MI18N.fold(query.trim()) : '';
  if (!q) return str;
  // Fold one character at a time (case and accents, as the search does) and
  // remember where each folded character came from, so "capitao" marks the
  // "Capitão" it matched.
  let folded = '';
  const from = [];
  for (let i = 0; i < str.length; i++) {
    for (const ch of MI18N.fold(str[i])) { folded += ch; from.push(i); }
  }
  const out = [];
  let last = 0, at = folded.indexOf(q);
  while (at >= 0) {
    const start = from[at], end = from[at + q.length - 1] + 1;
    if (start > last) out.push(str.slice(last, start));
    out.push(<mark key={start} className="hl">{str.slice(start, end)}</mark>);
    last = end;
    at = folded.indexOf(q, at + q.length);
  }
  if (!out.length) return str;
  if (last < str.length) out.push(str.slice(last));
  return out;
}

// Synopsis for the details drawer (desktop) and sheet (mobile). Clamped to
// three lines so the cast list stays in view; "See more" appears only when the
// text is longer than that. Collapses again when the title changes.
function Synopsis({ title, className = '' }) {
  const text = MI18N.synopsis(title);
  const ref = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [long, setLong] = React.useState(false);
  React.useEffect(() => { setOpen(false); }, [title && title.id]);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    setLong(el.scrollHeight > el.clientHeight + 1);
  }, [text, open]);
  if (!text) return null;
  return (
    <div className={`synopsis ${className}`}>
      <p ref={ref} className={open ? 'open' : ''}>{text}</p>
      {(long || open) && <button className="synopsis-more" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        {mtr(open ? 'details.less' : 'details.more')}
      </button>}
    </div>
  );
}
window.Synopsis = Synopsis;

// One progress header for every surface that groups titles: desktop List
// (phase headers and Release phase dividers), phone List and Grid, and the
// Spatial band labels. Shared on purpose — five hand-made variants would drift
// apart, and the ticket asks for one visual language.
//
// `label` and `color` belong to the caller (a phase name in its colour, an era
// label in the accent). `action` is a slot the bulk-select ticket fills with
// "Mark the rest as seen", so that work needs no change here.
function ProgressHeader({ label, color, seen, released, upcoming, band, action }) {
  const tr = mtr;
  // Nothing released in this group yet: a bar would be a lie, so just the label.
  if (!released) {
    return (
      <div className={`pgh${band ? ' band' : ''}`} style={color ? { '--pm': color } : null}>
        <span className="pgh-top"><span className="pgh-label">{label}</span>
          {upcoming ? <span className="pgh-up">{tr('progress.upcoming', { n: upcoming })}</span> : null}
        </span>
      </div>
    );
  }
  const done = seen >= released;
  const pct = Math.round((seen / released) * 100);
  return (
    <div className={`pgh${band ? ' band' : ''}${done ? ' done' : ''}`} style={color ? { '--pm': color } : null}>
      <span className="pgh-top">
        <span className="pgh-label">{label}</span>
        {/* The glyph and the numbers are decoration; the sentence below is what
            a screen reader reads, so colour is never the only signal. */}
        <span className="pgh-count" aria-hidden="true">{done ? '✓' : `${seen}/${released}`}</span>
        {upcoming ? <span className="pgh-up" aria-hidden="true">{tr('progress.upcoming', { n: upcoming })}</span> : null}
        {action}
      </span>
      <span className="pgh-bar" aria-hidden="true"><span className="pgh-fill" style={{ width: pct + '%' }}/></span>
      <span className="story-sr">
        {tr('progress.seen', { seen, n: released })}
        {upcoming ? ' ' + tr('progress.upcomingLong', { n: upcoming }) : ''}
      </span>
    </div>
  );
}

// `title` is what makes the credit right: a card for The Incredible Hulk must
// name Edward Norton, not the character's default performer. Without it the
// badge was the last place still contradicting the details panel beside it.
function MatchBadge({ matchedChars, query, title }) {
  if (!matchedChars || !matchedChars.length) return null;
  const id = matchedChars[0];
  const c = window.CHARACTERS[id];
  if (!c) return null;
  const credited = title && window.MCU_credit ? window.MCU_credit(title, id) : c.actor;
  const portrait = title && window.castPortrait
    ? window.castPortrait(title, id)
    : (window.MEDIA && window.MEDIA.actors && window.MEDIA.actors[id]
      ? (window.mediaURL ? window.mediaURL('a', id, window.MEDIA.profile_base + window.MEDIA.actors[id]) : window.MEDIA.profile_base + window.MEDIA.actors[id])
      : null);
  return (
    <div className="card-match" style={{'--match-color': c.color}} title={matchedChars.map(mid => MI18N.charName(mid)).join(', ')}>
      <div className="card-match-portrait" style={{background:`linear-gradient(135deg, ${c.color}, ${c.color}88)`}}>
        <window.Portrait url={portrait} alt={MI18N.charName(id)} initials={c.initials}/>
      </div>
      <div className="card-match-text">
        <div className="card-match-char"><Highlight text={MI18N.charName(id)} query={query}/>{matchedChars.length > 1 ? ` +${matchedChars.length - 1}` : ''}</div>
        <div className="card-match-actor"><Highlight text={credited} query={query}/></div>
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
// The same animation runs when the collection filter (All/Unseen/Seen/
// Watchlist) changes, on the desktop List (its leaving copies stay inside the
// list, `inside`, so they keep its columns), and between List and Grid on
// phones (`morph`: titles move from their old spot while the old layout fades).
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

function playFlip(root, prev, opts = {}) {
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
    if (wasVisible && opts.morph) {
      // List <-> Grid: centre to centre, fading in over the old layout.
      const dx = (old.left + old.width / 2) - (now.left + now.width / 2);
      const dy = (old.top + old.height / 2) - (now.top + now.height / 2);
      frames = [{ opacity: 0, transform: `translate(${dx}px, ${clampY(dy)}px)` }, { opacity: 1, offset: 0.5 }, { opacity: 1, transform: 'none' }];
    } else if (wasVisible) {
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

  // On a List <-> Grid switch the whole old layout fades out in place.
  const leaving = [...prev.ghosts].filter(([id]) => opts.morph || !shown.has(id));
  if (!leaving.length) return;
  const layer = document.createElement('div');
  layer.className = 'm-flip-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.inert = true;
  // `inside`: the layer lives in the scrolling root (so the copies keep styles
  // that depend on their container) and covers its visible part.
  const at = opts.inside
    ? { position: 'absolute', left: '0px', top: root.scrollTop + 'px', width: root.clientWidth + 'px', height: root.clientHeight + 'px' }
    : { left: view.left + 'px', top: view.top + 'px', width: view.width + 'px', height: view.height + 'px' };
  Object.assign(layer.style, at);
  const anims = leaving.map(([id, ghost]) => {
    const old = prev.rects.get(id);
    const to = next.get(id);
    ghost.removeAttribute('data-flip-id');
    Object.assign(ghost.style, { position: 'absolute', margin: '0', boxSizing: 'border-box',
      left: (old.left - prev.view.left) + 'px', top: (old.top - prev.view.top) + 'px', width: old.width + 'px', height: old.height + 'px' });
    layer.appendChild(ghost);
    if (opts.morph) return ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FLIP_MS * 0.5, easing: 'ease-out', fill: 'forwards' });
    const move = to ? `translate(${to.left - old.left}px, ${clampY(to.top - old.top)}px)` : 'scale(.97)';
    return ghost.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, offset: 0.75 }, { opacity: 0, transform: move }], { duration: FLIP_MS * 0.8, easing: FLIP_EASE, fill: 'forwards' });
  });
  (opts.inside ? root : document.body).appendChild(layer);
  flipLayer = layer;
  Promise.all(anims.map(a => a.finished)).catch(() => {}).then(() => {
    layer.remove();
    if (flipLayer === layer) flipLayer = null;
  });
}

const flipAllowed = () => typeof Element !== 'undefined' && !!Element.prototype.animate
  && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// Phones: called just before switching between List and Grid, so the view that
// mounts next can animate from the one being replaced.
let pendingSwitch = null;
function captureViewFlip() {
  pendingSwitch = measureFlip(document.querySelector('.m-main .m-scrollarea'));
}

// Phones: the filter sheet covers the list while filters change, so the list
// is measured when the sheet opens (the view's flip is paused meanwhile) and
// animated once it closes.
let pendingFlip = null;
function captureFlip() {
  pendingFlip = measureFlip(document.querySelector('.m-main .m-scrollarea'));
}
function playPendingFlip() {
  const prev = pendingFlip;
  pendingFlip = null;
  const root = document.querySelector('.m-main .m-scrollarea');
  if (prev && root && flipAllowed()) playFlip(root, prev);
}

function useReorderAnimation(orderKey, opts = {}) {
  const ref = React.useRef(null);
  const lastKey = React.useRef(orderKey);
  const before = React.useRef(null);
  if (orderKey !== lastKey.current) {
    lastKey.current = orderKey;
    if (!opts.paused) before.current = measureFlip(ref.current);
  }
  React.useLayoutEffect(() => {
    const prev = pendingSwitch;
    pendingSwitch = null;
    if (prev && ref.current && flipAllowed()) playFlip(ref.current, prev, { morph: true });
  }, []);
  React.useLayoutEffect(() => {
    const prev = before.current;
    before.current = null;
    if (!prev || !ref.current || !flipAllowed()) return;
    playFlip(ref.current, prev, opts);
  }, [orderKey]);
  return ref;
}

// In-story timeframe (data.js `story`), shown alongside the release year on
// every card, row and detail view. The compact form is the label with an
// hourglass; `detail` reads "Set in …" (for years) plus any alternate-reality
// note. Titles
// without a sourced timeframe (unreleased) render nothing.
function Hourglass() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 22h14M5 2h14"/>
      <path d="M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22"/>
      <path d="M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>
    </svg>
  );
}

function StoryYear({ title, detail = false, className = '' }) {
  if (!title || !title.story) return null;
  const story = MI18N.storyLabel(title.story);
  const note = MI18N.storyNote(title);
  // "Set in 1995", but "Outside time" / "Multiverse" stand on their own.
  const isTime = /^(c\. )?\d/.test(title.story);
  const full = isTime ? mtr('story.setIn', { story }) : story;
  return (
    <span className={`story-year${detail ? ' detail' : ''}${className ? ' ' + className : ''}`}
      title={`${mtr('story.tooltip', { story })}${note ? ' · ' + note : ''}`}>
      <Hourglass/>
      {detail
        ? <span>{full}{note && <span className="story-note"> · {note}</span>}</span>
        : <span><span className="story-sr">{full}</span><span aria-hidden="true">{story}</span></span>}
    </span>
  );
}

// The card is a <div> wrapping a dedicated open button rather than one big
// <button>, because the status toggles are buttons too and a nested <button>
// is invalid HTML. The open button still covers the whole poster + meta area,
// so tapping anywhere except the toggles opens the cast sheet exactly as before.
function MobileGrid({ header, currentId, titles, onSelect, searchCharMatches, search, empty, orderKey, flipPaused, markWatch, collapseSeen }) {
  const PosterArt = window.PosterArt;
  const { statusOf } = window.useCollection();
  const folds = useSeenFolds();
  const settled = useSettled();
  // All tab: runs of seen titles sit under a full-width header and fold away.
  // Each run breaks the grid into sections; when runs form or split the cards
  // glide to their new cells (the run layout is part of the reorder key).
  const runs = collapseSeen ? seenRuns(titles, statusOf) : [];
  const runKey = runs.map(r => r[0].id + ':' + r.length).join(',');
  const flipRef = useReorderAnimation(orderKey + '|' + runKey, { paused: flipPaused });
  if (!titles.length) return <div className="m-scrollarea" ref={flipRef}>{header}<EmptyState {...(empty || {})}/></div>;
  const card = (t) => {
    const matchedChars = searchCharMatches ? searchCharMatches[t.id] : null;
    const seen = statusOf(t.id) === 'seen';
    const watch = markWatch && statusOf(t.id) === 'watchlist';
    return (
      <div key={t.id} data-flip-id={t.id} data-row-id={t.id} className={`m-card${seen ? ' seen' : ''}${watch ? ' watch' : ''}${currentId === t.id ? ' current' : ''}`}>
        <button className="m-card-open" onClick={()=>onSelect(t.id)}>
          <div className="m-pw">
            <PosterArt title={t}/>
            <span className="m-pbadge" style={{background:MPHASE_COLORS[t.phase]}}>{mtr('phase.short', { n: t.phase })}</span>
            <ScoreBadges title={t} compact/>
          </div>
          <div className="m-cmeta">
            <div className="m-ctitle"><Highlight text={MI18N.titleName(t)} query={search}/></div>
            <div className="m-cyear">
              <span>{t.year}</span>
              {t.budget != null && <b>{MI18N.budget(t.budget)}</b>}
            </div>
            <StoryYear title={t} className="m-cstory"/>
            <MatchBadge matchedChars={matchedChars} query={search} title={t}/>
          </div>
        </button>
        <window.TitleStatusActions title={t} className="m-card-tsa"/>
      </div>
    );
  };
  if (!runs.length) {
    return (
      <div className="m-scrollarea" ref={flipRef}>
        {header}
        <div className="m-grid">{titles.map(card)}</div>
      </div>
    );
  }
  // Sections: plain cards between runs, and each run (header + its cards).
  const sections = [];
  const runOf = new Map();
  runs.forEach(r => { const info = { key: r[0].id, items: r, shut: folds.isShut(r) }; r.forEach(t => runOf.set(t.id, info)); });
  titles.forEach(t => {
    const run = runOf.get(t.id) || null;
    const last = sections[sections.length - 1];
    if (last && last.run === run) last.items.push(t);
    else sections.push({ run, items: [t] });
  });
  return (
    <div className="m-scrollarea" ref={flipRef}>
      {header}
      <div className={`m-gflat${settled ? ' settled' : ''}`}>
        {sections.map(sec => sec.run ? (
          <React.Fragment key={'run:' + sec.run.key}>
            <Fx appear={settled}>
              <SeenRunHead items={sec.run.items} shut={sec.run.shut} onToggle={() => folds.toggle(sec.run.items)}/>
            </Fx>
            <Fx open={!sec.run.shut}><div className="m-grid">{sec.items.map(card)}</div></Fx>
          </React.Fragment>
        ) : (
          <Fx key={'cards:' + sec.items[0].id}><div className="m-grid">{sec.items.map(card)}</div></Fx>
        ))}
      </div>
    </div>
  );
}

// Runs of seen titles on the All tab: two or more consecutive seen titles in
// the current order. Order never changes; a run only groups neighbours.
function seenRuns(titles, statusOf) {
  const runs = [];
  let run = [];
  const close = () => { if (run.length >= 2) runs.push(run); run = []; };
  titles.forEach(t => { if (statusOf(t.id) === 'seen') run.push(t); else close(); });
  close();
  return runs;
}

// Folded runs, remembered on this device across visits and shared by List and
// Grid. Runs shift as titles are marked, so this keeps the titles that were
// folded rather than the runs: a run is folded when most of its titles were.
const SEEN_FOLDS_KEY = 'mcu.seenFolds.v1';
const seenFolds = (() => {
  try { return new Set(JSON.parse(window.localStorage.getItem(SEEN_FOLDS_KEY)) || []); } catch (e) { return new Set(); }
})();
const seenFoldListeners = new Set();
function useSeenFolds() {
  const [, bump] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => { seenFoldListeners.add(bump); return () => { seenFoldListeners.delete(bump); }; }, []);
  const isShut = (items) => items.filter(t => seenFolds.has(t.id)).length * 2 > items.length;
  const toggle = (items) => {
    const shut = !isShut(items);
    items.forEach(t => { if (shut) seenFolds.add(t.id); else seenFolds.delete(t.id); });
    try { window.localStorage.setItem(SEEN_FOLDS_KEY, JSON.stringify([...seenFolds])); } catch (e) { /* not remembered */ }
    seenFoldListeners.forEach(fn => fn());
  };
  return { isShut, toggle };
}

// Settles once the saved collection has loaded: lists only animate changes
// after that, so they open already compact and folded.
function useSettled() {
  const { ready } = window.useCollection();
  const [settled, setSettled] = React.useState(false);
  React.useEffect(() => {
    if (!ready || settled) return undefined;
    let b;
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setSettled(true)); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, [ready, settled]);
  return settled;
}

// A collapsible wrapper: animates its content's height to and from zero. With
// `appear`, it mounts closed and opens on the next frame (a row that just
// joined the list). The wrapper element stays put, so its content keeps its
// identity (and its own transitions) while opening or closing.
function Fx({ open = true, appear = false, children }) {
  const [ready, setReady] = React.useState(!appear);
  React.useEffect(() => {
    if (ready) return undefined;
    let b;
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setReady(true)); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, []);
  const shut = !(open && ready);
  // Content is clipped only while closed or opening/closing, so open content
  // can glide across sections (Grid reorder) and keep its rings unclipped.
  const was = React.useRef(shut);
  const [moving, setMoving] = React.useState(false);
  React.useEffect(() => {
    if (was.current === shut) return undefined;
    was.current = shut;
    setMoving(true);
    const id = setTimeout(() => setMoving(false), 420);
    return () => clearTimeout(id);
  }, [shut]);
  return (
    <div className={`m-fx${shut ? ' shut' : ''}${moving ? ' moving' : ''}`} aria-hidden={shut || undefined}>
      <div className="m-fx-in">{children}</div>
    </div>
  );
}

// Header of a run of seen titles on the All tab: a slim bar while the run is
// open, a summary row (stacked posters, count, first and last title) while it
// is folded. One element morphs between the two.
function SeenRunHead({ items, shut, onToggle }) {
  const PosterArt = window.PosterArt;
  const n = items.length;
  const first = MI18N.titleName(items[0]), last = MI18N.titleName(items[n - 1]);
  return (
    <button className={`m-run${shut ? ' shut' : ''}`} onClick={onToggle} aria-expanded={!shut}
      aria-label={mtr(shut ? 'list.seenRunShow' : 'list.seenRunHide', { n })}>
      <span className="m-run-stack" aria-hidden="true">
        {items.slice(0, 3).map(t => <span key={t.id} className="m-run-thumb"><PosterArt title={t}/></span>)}
      </span>
      <span className="m-run-text">
        <b><window.CheckIcon/>{mtr('list.seenRun', { n })}</b>
        <span className="m-run-range">{first} – {last}</span>
      </span>
      <span className="m-run-chev" aria-hidden="true">›</span>
    </button>
  );
}

function MobileList({ header, currentId, titles, sort, onSelect, searchCharMatches, search, empty, orderKey, flipPaused, collapseSeen, markWatch, progress }) {
  const PosterArt = window.PosterArt;
  const { statusOf } = window.useCollection();
  const flipRef = useReorderAnimation(orderKey, { paused: flipPaused });
  const folds = useSeenFolds();
  // The collection arrives after the first paint: rows only animate (shrink,
  // fold, appear) once it has loaded, so the list opens already compact.
  const settled = useSettled();
  if (!titles.length) return <div className="m-scrollarea" ref={flipRef}>{header}<EmptyState {...(empty || {})}/></div>;
  const ranked = sort === 'imdb' || sort === 'rt';
  const lead = sort === 'rt' ? 'rt' : 'imdb';
  // Group headers for the non-score sorts. Chrono groups by in-story timeframe
  // (headers carry the hourglass, so rows show their release year instead).
  const groups = [];
  const chrono = sort === 'chrono';
  if (chrono) {
    titles.forEach(t => {
      const label = t.story ? MI18N.storyLabel(t.story) : mtr('story.tba');
      const last = groups[groups.length-1];
      if (last && last.label === label) last.items.push(t);
      else groups.push({ key: 's:' + label + '#' + groups.length, label, story: true, items: [t] });
    });
  } else if (sort === 'release') {
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
      else groups.push({ key: 'p' + key + '#' + groups.length, label: mPhaseLabel(t.phase), color: MPHASE_COLORS[t.phase], phase: t.phase, items: [t] });
    });
  } else {
    groups.push({ key: 'all', label: null, items: titles });
  }
  // Release groups by year here too, so each phase opens with a divider above
  // its first year — the same super-header the desktop List uses.
  if (sort === 'release') {
    let lastPhase = null;
    groups.forEach(g => {
      const phase = g.items[0].phase;
      if (phase !== lastPhase) { g.phaseStart = phase; lastPhase = phase; }
    });
  }
  const row = (t, rank, compact) => {
    const matchedChars = searchCharMatches ? searchCharMatches[t.id] : null;
    const seen = statusOf(t.id) === 'seen';
    const watch = markWatch && statusOf(t.id) === 'watchlist';
    return (
      <div data-flip-id={t.id} data-row-id={t.id} className={`m-lrow${seen ? ' seen' : ''}${compact ? ' compact' : ''}${watch ? ' watch' : ''}${currentId === t.id ? ' current' : ''}`}>
        <button className="m-lrow-open" onClick={()=>onSelect(t.id)}>
          {ranked && <div className="m-rank">{rank}</div>}
          <div className="m-lthumb"><PosterArt title={t}/></div>
          <div className="m-ltext">
            <div className="m-ltitle"><Highlight text={MI18N.titleName(t)} query={search}/></div>
            <div className="m-lmeta">
              {!ranked && <span>{mTypeLabel(t.type)}</span>}
              {chrono && <><span className="m-dot"/><span title={mtr('story.releaseYear')}>{t.year}</span></>}
              {ranked && <span>{t.year}</span>}
              <span className="m-dot"/>
              <span style={{color:MPHASE_COLORS[t.phase]}}>{mPhaseLabel(t.phase)}</span>
              {t.budget != null && <><span className="m-dot"/><span>{MI18N.budget(t.budget)}</span></>}
              {t.story && !chrono && <><span className="m-dot"/><StoryYear title={t}/></>}
            </div>
            <ScoreBadges title={t} lead={lead}/>
            <MatchBadge matchedChars={matchedChars} query={search} title={t}/>
          </div>
        </button>
        <window.TitleStatusActions title={t} className="m-lrow-tsa"/>
      </div>
    );
  };
  const pg = (phase) => (progress && progress.byPhase && progress.byPhase[phase]) || null;
  const label = (g) => {
    const p = g.phase ? pg(g.phase) : null;
    return (
      <div className={`m-glabel${g.story ? ' story' : ''}`} data-flip-id={'g:' + g.key} style={g.color?{color:g.color}:null}>
        {p ? <ProgressHeader label={g.label} color={g.color} {...p}/> : <>{g.story && <Hourglass/>}{g.label}</>}
      </div>
    );
  };
  const phaseDivider = (g) => {
    const p = g.phaseStart ? pg(g.phaseStart) : null;
    if (!p) return null;
    return (
      <div className="m-phase-divider" data-flip-id={'pd:' + g.key}>
        <ProgressHeader label={mPhaseLabel(g.phaseStart)} color={MPHASE_COLORS[g.phaseStart]} {...p}/>
      </div>
    );
  };

  if (collapseSeen) {
    // All tab: seen titles are compact rows, and each run of two or more
    // consecutive seen titles (with any headings between them) gets a header
    // that folds the run into one row. Everything is one flat column of
    // collapsible wrappers so rows keep their element while they shrink, grow,
    // join a run or fold away.
    const entries = [];
    groups.forEach(g => {
      // The phase divider sits above its year heading and, unlike the heading,
      // is never folded into a seen run: it is the super-header for the whole
      // phase, so it has to stay put while runs underneath it collapse.
      if (g.phaseStart) entries.push({ kind: 'divider', g, key: 'pd:' + g.key });
      if (g.label) entries.push({ kind: 'label', g, key: 'g:' + g.key });
      g.items.forEach(t => entries.push({ kind: 'row', t, g, key: t.id }));
    });
    const rowOf = new Map(entries.filter(e => e.kind === 'row').map(e => [e.t.id, e]));
    seenRuns(entries.filter(e => e.kind === 'row').map(e => e.t), statusOf).forEach(items => {
      const r = items.map(t => rowOf.get(t.id));
      const info = { key: items[0].id, items, shut: folds.isShut(items) };
      const a = entries.indexOf(r[0]), b = entries.indexOf(r[r.length - 1]);
      for (let i = a; i <= b; i++) entries[i].run = info;
      r[0].head = info;
      // A heading folded inside the run whose group carries on after it is
      // repeated after the run while the run is folded.
      const next = entries[b + 1];
      if (next && next.kind === 'row' && next.g.label && entries.indexOf(entries.find(e => e.kind === 'label' && e.g === next.g)) > a) {
        next.repeatLabel = info;
      }
    });
    const appear = settled;
    let rank = 0;
    return (
      <div className="m-scrollarea" ref={flipRef}>
        {header}
        <div className={`m-flat${settled ? ' settled' : ''}`}>
          {entries.map(e => {
            const shut = e.run && e.run.shut;
            if (e.kind === 'divider') return <React.Fragment key={e.key}>{phaseDivider(e.g)}</React.Fragment>;
            if (e.kind === 'label') return <Fx key={e.key} open={!shut}>{label(e.g)}</Fx>;
            rank += 1;
            return (
              <React.Fragment key={e.key}>
                {e.repeatLabel && <Fx key={'again:' + e.key} open={e.repeatLabel.shut}>{label(e.g)}</Fx>}
                {e.head && (
                  <Fx key={'run:' + e.head.key} appear={appear}>
                    <SeenRunHead items={e.head.items} shut={e.head.shut} onToggle={() => folds.toggle(e.head.items)}/>
                  </Fx>
                )}
                <Fx open={!shut}>{row(e.t, rank, statusOf(e.t.id) === 'seen')}</Fx>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  let n = 0;
  return (
    <div className="m-scrollarea" ref={flipRef}>
      {header}
      {groups.map(g => (
        <div className="m-group" key={g.key}>
          {phaseDivider(g)}
          {g.label && label(g)}
          <div className="m-list">
            {g.items.map(t => {
              n += 1;
              return <React.Fragment key={t.id}>{row(t, n, false)}</React.Fragment>;
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
      <div className="m-empty-t">{title || mtr('empty.title')}</div>
      <div className="m-empty-s">{sub || mtr('empty.sub')}</div>
    </div>
  );
}

// Browser Back closes the open sheet instead of leaving the app. Each sheet
// owns one history entry: opening adds it (or takes over the entry of a sheet
// that is handing off to it, such as Account → About), Back removes it and
// closes the sheet, and closing any other way (×, scrim, swipe, Escape) steps
// back over it so no stale entries pile up. A sheet entry left in history by
// Forward or a reload is reused by the next sheet rather than duplicated.
const sheetHistory = (() => {
  let active = null;      // { token, onBack } for the sheet that owns the entry
  let ignorePops = 0;     // pops caused by our own history.back()
  let seq = 0;
  const isSheetEntry = (st) => !!(st && st.mcuSheet);
  window.addEventListener('popstate', (e) => {
    if (ignorePops > 0) {
      ignorePops--;
      // A sheet opened while our own step back was still in flight: give it
      // its entry again so the next Back closes it rather than leaving.
      if (active && !(e.state && e.state.mcuSheet === active.token)) {
        try { history.pushState({ ...(history.state || {}), mcuSheet: active.token }, ''); } catch (err) {}
      }
      return;
    }
    if (active && !(e.state && e.state.mcuSheet === active.token)) {
      const { onBack } = active;
      active = null;
      onBack();
    }
  });
  return {
    open(onBack) {
      const token = 's' + (++seq) + '-' + Date.now();
      const st = { ...(history.state || {}), mcuSheet: token };
      try {
        if (isSheetEntry(history.state)) history.replaceState(st, '');
        else history.pushState(st, '');
      } catch (e) { return null; }
      active = { token, onBack };
      return token;
    },
    close(token) {
      if (!token || !active || active.token !== token) return;
      active = null;
      // Wait a tick: a sheet opening in the same render takes over the entry.
      setTimeout(() => {
        if (active || !history.state || history.state.mcuSheet !== token) return;
        ignorePops++;
        history.back();
      }, 0);
    },
  };
})();

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
    const focusable = () => Array.from(sheet.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')).filter((el) => el.tabIndex >= 0 && el.getClientRects().length);
    // Focus the sheet itself: screen readers announce it, Tab moves into it, and
    // no focus ring appears on a control the visitor didn't choose.
    sheet.focus();
    const keys = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key !== 'Tab') return;
      const items = focusable();
      const first = items[0] || sheet;
      const last = items[items.length - 1] || sheet;
      if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet || !sheet.contains(document.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !sheet.contains(document.activeElement))) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', keys);
    const entry = sheetHistory.open(() => closeRef.current());
    return () => {
      sheetHistory.close(entry);
      document.removeEventListener('keydown', keys);
      previous.forEach(([el, inert]) => { el.inert = inert; });
      document.body.style.overflow = overflow;
      if (opener && opener.isConnected) opener.focus();
    };
  }, []);
  // Swipe down to close: from the handle or header, or from the content once
  // it is scrolled to the top. Past about a third of the sheet (or a quick
  // flick) it slides away; otherwise it springs back.
  React.useEffect(() => {
    const sheet = ref.current;
    const body = sheet.querySelector('.m-sheet-body');
    const scrim = sheet.previousElementSibling;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let s = null;
    const place = (y, animate) => {
      const tr = animate && !reduce ? '200ms cubic-bezier(.2,.8,.2,1)' : '';
      sheet.style.transition = tr ? 'transform ' + tr : 'none';
      sheet.style.transform = y ? `translateY(${y}px)` : '';
      if (scrim) {
        scrim.style.transition = tr ? 'opacity ' + tr : 'none';
        scrim.style.opacity = y ? String(Math.max(0, 1 - y / sheet.offsetHeight)) : '';
      }
    };
    const start = (e) => {
      if (e.touches.length !== 1) { s = null; return; }
      const t = e.touches[0];
      s = { x: t.clientX, y: t.clientY, t: performance.now(), inBody: body.contains(e.target), drag: false, dy: 0 };
    };
    const move = (e) => {
      if (!s) return;
      const t = e.touches[0];
      const dy = t.clientY - s.y;
      if (!s.drag) {
        if (Math.abs(t.clientX - s.x) > Math.abs(dy) + 2 || dy < -6 || (s.inBody && body.scrollTop > 0)) { s = null; return; }
        if (dy < 8) return;
        s.drag = true;
      }
      e.preventDefault();
      s.dy = Math.max(0, dy);
      place(s.dy, false);
    };
    const end = () => {
      const d = s;
      s = null;
      if (!d || !d.drag) return;
      const fast = d.dy > 40 && d.dy / (performance.now() - d.t) > 0.6;
      if (fast || d.dy > Math.min(160, sheet.offsetHeight * 0.33)) {
        place(sheet.offsetHeight, true);
        setTimeout(() => closeRef.current(), reduce ? 0 : 190);
      } else place(0, true);
    };
    sheet.addEventListener('touchstart', start, { passive: true });
    sheet.addEventListener('touchmove', move, { passive: false });
    sheet.addEventListener('touchend', end);
    sheet.addEventListener('touchcancel', end);
    return () => {
      sheet.removeEventListener('touchstart', start);
      sheet.removeEventListener('touchmove', move);
      sheet.removeEventListener('touchend', end);
      sheet.removeEventListener('touchcancel', end);
    };
  }, []);
  return (
    <>
      <div className="m-scrim" onClick={onClose} aria-hidden="true"/>
      <div ref={ref} className={`m-sheet${tall?' tall':''}`} role="dialog" aria-modal="true" aria-label={label || mtr('details.label')} tabIndex={-1}>
        <button className="m-grab" onClick={onClose} aria-label={mtr('details.close')} tabIndex={-1}/>
        <button className="m-sheet-x" onClick={onClose} aria-label={mtr('details.close')} title={mtr('details.close')}>×</button>
        <div className="m-sheet-body">{children}</div>
      </div>
    </>
  );
}

function FilterSheet({ phaseFilter, setPhaseFilter, typeFilter, setTypeFilter, budgetFilter, setBudgetFilter, sort, sortDir, setSortDir, onClose, showing, onClear }) {
  return (
    <Sheet onClose={onClose} tall label={mtr('filters.title')}>
      <div className="m-sh-head">
        <div className="m-sh-title">{mtr('filters.title')}</div>
        <button className="m-sh-clear" onClick={onClear}>{mtr('filters.clearAll')}</button>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">{mtr('filters.phase')}</div>
        <div className="m-chips">
          {['all','1','2','3','4','5','6'].map(p=>(
            <button key={p} className={`m-chip ph${phaseFilter===p?' on':''}`} onClick={()=>setPhaseFilter(p)}
              style={p!=='all' && phaseFilter===p ? {background:MPHASE_COLORS[p], borderColor:MPHASE_COLORS[p], color:'#0a0c14'} : null}>
              {p==='all'?mtr('filters.all'):p}
            </button>
          ))}
        </div>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">{mtr('filters.type')}</div>
        <div className="m-chips">
          {[['all','type.all'],['film','type.films'],['series','type.series']].map(([v,k])=>(
            <button key={v} className={`m-chip${typeFilter===v?' on':''}`} onClick={()=>setTypeFilter(v)}>{mtr(k)}</button>
          ))}
        </div>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">{mtr('filters.budget')}</div>
        <div className="m-chips">
          {[['all','filters.all'],['low','budget.low'],['mid','budget.mid'],['high','budget.high'],['mega','budget.mega']].map(([v,k])=>(
            <button key={v} className={`m-chip${budgetFilter===v?' on':''}`} onClick={()=>setBudgetFilter(v)}>{mtr(k)}</button>
          ))}
        </div>
      </div>
      <div className="m-fgroup">
        <div className="m-flab">{mtr('order.label')}</div>
        <div className="m-chips">
          {window.sortDirectionLabels(sort).map((label, i) => {
            const dir = i === 0 ? 'asc' : 'desc';
            return <button key={dir} className={`m-chip${sortDir===dir?' on':''}`}
              aria-pressed={sortDir===dir} onClick={()=>setSortDir(dir)}>{label}</button>;
          })}
        </div>
      </div>
      <button className="m-apply" onClick={onClose}>{mtr('filters.show', { n: showing })}</button>
    </Sheet>
  );
}

function CastSheet({ title, onClose, onCharacterClick, activeChar, activeChars, onGoSpatial, inSpatial, search }) {
  if (!title) return null;
  const PosterArt = window.PosterArt;
  return (
    <Sheet onClose={onClose} tall label={mtr('details.sheetLabel', { title: MI18N.titleName(title) })}>
      <div className="m-cast-hero">
        <div className="m-hero-th"><PosterArt title={title}/></div>
        <div className="m-hero-text">
          <div className="m-eyebrow" style={{color:MPHASE_COLORS[title.phase]}}>{mPhaseLabel(title.phase)} · {mTypeLabel(title.type)} · {title.year}</div>
          <h2 className="m-dtitle">{MI18N.titleName(title)}</h2>
          <StoryYear title={title} detail className="m-hero-story"/>
          <ScoreBadges title={title}/>
          <window.TitleStatusActions title={title} variant="inline" className="m-hero-tsa"/>
        </div>
      </div>
      <Synopsis title={title} className="m-synopsis"/>
      <div className="m-flab">{mtr('details.cast', { n: title.cast.length })}</div>
      <div className="m-castlist">
        {title.cast.length === 0 && <div className="m-empty-cast">{mtr('details.noCast')}</div>}
        {title.cast.map(ch => {
          const c = window.CHARACTERS[ch];
          if (!c) return null;
          return (
            <button key={ch} className={`m-crow${(activeChars?activeChars.indexOf(ch)!==-1:activeChar===ch)?' on':''}`} style={{'--match-color': c.color}} onClick={()=>onCharacterClick(ch)}>
              <div className="m-port" style={{background:`linear-gradient(135deg, ${c.color}, ${c.color}88)`}}>
                <window.Portrait
                  url={window.castPortrait(title, ch)}
                  alt={MI18N.charName(ch)} initials={c.initials}/>
              </div>
              <div className="m-ctext">
                <div className="m-cn"><Highlight text={MI18N.charName(ch)} query={search}/></div>
                <div className="m-an"><Highlight text={window.MCU_credit(title, ch)} query={search}/></div>
              </div>
              <span className="m-cdot" style={{background:c.color}}/>
            </button>
          );
        })}
      </div>
      {!inSpatial && (
        <button className="m-apply ghost" onClick={onGoSpatial}>{mtr('details.goSpatial')}</button>
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
          <span className="m-pbadge" style={{background:MPHASE_COLORS[title.phase]}}>{mtr('phase.short', { n: title.phase })}</span>
        </div>
        <div className="m-fp-meta">
          <div className="m-fp-title">{MI18N.titleName(title)}</div>
          <StoryYear title={title} className="m-fp-story"/>
          <ScoreBadges title={title}/>
          <div className="m-fp-cta">{mtr('details.tapForCast')}</div>
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
        ? <span><b>{sharedCount}</b> {mtr('canvas.hintShared', { n: sharedCount })} · {mtr('canvas.hintClear')}</span>
        : <span>{mtr('canvas.hintIdle')}</span>}
    </div>
  );
}

Object.assign(window, { useReorderAnimation, captureViewFlip, captureFlip, playPendingFlip, MobileTopBar, SortTabs, MobileGrid, MobileList, FilterSheet, CastSheet, FocusPop, SpatialHint, ScoreBadges, Sheet, EmptyState, MatchBadge, ProgressHeader, Highlight, StoryYear });
