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
function MobileTopBar({ viewMode, setViewMode, search, setSearch, onOpenFilters, filterCount, showing, total, sortLabel, sort, sortDir, setSortDir, onOpenAccount, collectionFilter, setCollectionFilter }) {
  const { progress } = window.useCollection();
  return (
    <div className="m-appbar">
      <div className="m-appbar-top">
        <div className="m-brandrow">
          <div className="m-mark"/>
          <div>
            <div className="m-btitle">{mtr('app.name')}</div>
            <div className="m-bsub">
              {showing === total ? mtr('header.count', { n: total }) : mtr('header.countOf', { shown: showing, total })} · {sortLabel}
              {progress.seenReleased > 0 && ` · ${mtr('header.seen', { n: progress.seenReleased })}`}
            </div>
          </div>
        </div>
        <window.LanguageMenu compact/>
        <window.AccountAvatarButton onOpen={onOpenAccount}/>
      </div>
      <div className="m-searchrow">
        <div className="m-searchbar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
          <div className="m-search-input"><input aria-label={mtr('search.aria')} value={search} onChange={e=>setSearch(e.target.value)} placeholder={mtr('search.placeholder')}/></div>
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

// Shared disclosure: full wording in the popover, compact current value outside.
function SortOrderMenu({ sort, sortDir, setSortDir, mobile = false }) {
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef(null), trigger = React.useRef(null), choices = React.useRef(null);
  const id = React.useId();
  const labels = window.sortDirectionLabels(sort);
  const index = sortDir === 'desc' ? 1 : 0;
  const compact = window.sortDirectionLabels(sort, true)[index];
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
  // Close when keyboard focus moves to something outside the menu. Safari (iOS
  // and macOS) does not focus a tapped/clicked button: tapping an option blurs
  // the focused one with relatedTarget null, and closing then would unmount the
  // option before its click fires, so the choice was silently lost. A null
  // relatedTarget is therefore ignored here; outside taps are handled by the
  // pointerdown listener above, and Escape still closes.
  return <div className={`sort-order${mobile ? ' mobile-order' : ''}`} ref={wrap}
    onBlur={e => { if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} className="sort-order-trigger" aria-expanded={open} aria-controls={id}
      aria-label={mtr('order.aria', { label: labels[index] })} onClick={() => setOpen(v => !v)}>
      {compact}
      <svg className="sort-order-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>
    {open && <div id={id} ref={choices} className="sort-order-pop" role="group" aria-label={mtr('order.label')}>
      <div className="sort-order-heading">{mtr('order.label')}</div>
      {labels.map((label, i) => <button key={label} aria-pressed={index === i}
        onClick={() => { setSortDir(i === 0 ? 'asc' : 'desc'); setOpen(false); trigger.current?.focus(); }}>
        <span>{label}</span><span aria-hidden="true">{index === i ? '✓' : ''}</span>
      </button>)}
    </div>}
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
    <div className="card-match" style={{'--match-color': c.color}} title={matchedChars.map(mid => MI18N.charName(mid)).join(', ')}>
      <div className="card-match-portrait" style={{background:`linear-gradient(135deg, ${c.color}, ${c.color}88)`}}>
        {portrait ? <img src={portrait} alt={MI18N.charName(id)} loading="lazy"/> : <span>{c.initials}</span>}
      </div>
      <div className="card-match-text">
        <div className="card-match-char"><Highlight text={MI18N.charName(id)} query={query}/>{matchedChars.length > 1 ? ` +${matchedChars.length - 1}` : ''}</div>
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
      else groups.push({ key: 'p' + key + '#' + groups.length, label: mPhaseLabel(t.phase), color: MPHASE_COLORS[t.phase], items: [t] });
    });
  } else {
    groups.push({ key: 'all', label: null, items: titles });
  }
  let n = 0;
  return (
    <div className="m-scrollarea" ref={flipRef}>
      {groups.map(g => (
        <div className="m-group" key={g.key}>
          {g.label && <div className={`m-glabel${g.story ? ' story' : ''}`} data-flip-id={'g:' + g.key} style={g.color?{color:g.color}:null}>
            {g.story && <Hourglass/>}{g.label}
          </div>}
          <div className="m-list">
            {g.items.map(t => {
              n += 1;
              const matchedChars = searchCharMatches ? searchCharMatches[t.id] : null;
              const seen = statusOf(t.id) === 'seen';
              return (
                <div key={t.id} data-flip-id={t.id} className={`m-lrow${seen ? ' seen' : ''}`}>
                  <button className="m-lrow-open" onClick={()=>onSelect(t.id)}>
                    {ranked && <div className="m-rank">{n}</div>}
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
                      <MatchBadge matchedChars={matchedChars} query={search}/>
                    </div>
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
      <div className="m-empty-t">{title || mtr('empty.title')}</div>
      <div className="m-empty-s">{sub || mtr('empty.sub')}</div>
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
      <div ref={ref} className={`m-sheet${tall?' tall':''}`} role="dialog" aria-modal="true" aria-label={label || mtr('details.label')} tabIndex={-1}>
        <button className="m-grab" onClick={onClose} aria-label={mtr('details.close')}/>
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

function CastSheet({ title, onClose, onCharacterClick, activeChar, onGoSpatial, inSpatial }) {
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
      <div className="m-flab">{mtr('details.cast', { n: title.cast.length })}</div>
      <div className="m-castlist">
        {title.cast.length === 0 && <div className="m-empty-cast">{mtr('details.noCast')}</div>}
        {title.cast.map(ch => {
          const c = window.CHARACTERS[ch];
          if (!c) return null;
          return (
            <button key={ch} className={`m-crow${activeChar===ch?' on':''}`} onClick={()=>onCharacterClick(ch)}>
              <div className="m-port" style={{background:`linear-gradient(135deg, ${c.color}, ${c.color}88)`}}>
                {window.MEDIA && window.MEDIA.actors && window.MEDIA.actors[ch]
                  ? <img src={window.mediaURL ? window.mediaURL('a', ch, window.MEDIA.profile_base + window.MEDIA.actors[ch]) : window.MEDIA.profile_base + window.MEDIA.actors[ch]} alt={MI18N.charName(ch)} loading="lazy"/>
                  : <span>{c.initials}</span>}
              </div>
              <div className="m-ctext">
                <div className="m-cn">{MI18N.charName(ch)}</div>
                <div className="m-an">{c.actor}</div>
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

Object.assign(window, { MobileTopBar, SortTabs, MobileGrid, MobileList, FilterSheet, CastSheet, FocusPop, SpatialHint, ScoreBadges, Sheet, EmptyState, MatchBadge, Highlight, StoryYear });
