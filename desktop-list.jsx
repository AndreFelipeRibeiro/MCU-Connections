// Desktop List view: one row per title, in the current sort, as an alternative
// to Spatial for scanning and comparing. Rows follow `visible` (every filter,
// including the collection one, actually removes rows here). Column headers
// that match a sort mode change the sort; clicking the active one reverses it,
// so they stay in step with the sort row and the Order menu. A row opens the
// details drawer, and the list makes room for it.

// Column key -> sort mode it drives (null: not sortable).
const DL_SORT_FOR = { title: 'title', phase: 'phase', release: 'release', story: 'chrono', imdb: 'imdb', rt: 'rt' };
const DL_COLUMNS = ['poster', 'title', 'type', 'phase', 'release', 'story', 'budget', 'imdb', 'rt', 'cast', 'actions'];

// Group rows the way the mobile List does: by release year, in-story timeframe
// or phase. The other sorts are one ranked or alphabetical run.
function dlGroups(titles, sort) {
  const I = window.MCU_I18N;
  const groups = [];
  titles.forEach(t => {
    let key = 'all', label = null, extra = {};
    if (sort === 'release') { key = 'y' + t.year; label = String(t.year); }
    else if (sort === 'chrono') { key = 's' + (t.story || '-'); label = t.story ? I.storyLabel(t.story) : I.tr('story.tba'); extra = { story: true }; }
    else if (sort === 'phase') { key = 'p' + t.phase; label = I.upper(I.tr('phase.label', { n: t.phase })); extra = { color: window.PHASE_COLORS[t.phase], phase: t.phase }; }
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(t);
    else groups.push({ key, id: key + '#' + groups.length, label, ...extra, items: [t] });
  });
  // Release groups by year, so a phase spans several of them. Mark the group
  // that opens each phase: it gets a divider above its year, acting as a
  // super-header. Every phase is one continuous run in release order today, so
  // this fires once per phase; if a later catalog entry breaks that, the
  // divider simply appears again with the same whole-phase count rather than
  // splitting the phase in two.
  if (sort === 'release') {
    let seen = null;
    groups.forEach(g => {
      const phase = g.items[0].phase;
      if (phase !== seen) { g.phaseStart = phase; seen = phase; }
    });
  } else if (sort === 'phase') {
    // In Phase order every group IS a phase, so it carries the same divider
    // Release uses rather than a second header of its own — the phone views
    // were unified the same way.
    groups.forEach(g => { g.phaseStart = g.phase; g.label = null; });
  }
  return groups;
}

// Keyboard movement between rows ([data-row-id]: the List and the Guides
// table). A control is found again in another row by its column (the row's
// child that holds it) and its place inside that column, so the title moves to
// the title, the checkbox to the checkbox and Seen to Seen, even when one row
// carries an extra badge another doesn't.
const ROW_FOCUSABLE = 'input, button, a[href], [tabindex]:not([tabindex="-1"])';
// A column can itself be the control (the Guides table's title button), so
// it counts as well as anything inside it.
function rowControls(cell) {
  const own = cell.matches && cell.matches(ROW_FOCUSABLE) ? [cell] : [];
  return own.concat([...cell.querySelectorAll(ROW_FOCUSABLE)]).filter(el => !el.disabled && el.getClientRects().length > 0);
}
function sameControlIn(fromEl, toRow) {
  const from = fromEl && fromEl.closest && fromEl.closest('[data-row-id]');
  if (!from || from === toRow) return null;
  const cell = [...from.children].find(c => c.contains(fromEl));
  if (!cell) return null;
  const col = [...from.children].indexOf(cell);
  const k = Math.max(0, rowControls(cell).findIndex(el => el === fromEl || el.contains(fromEl)));
  const toCell = toRow.children[col];
  const there = toCell ? rowControls(toCell) : [];
  return there[Math.min(k, there.length - 1)] || rowControls(toRow)[0] || null;
}
// After a step to another title: when keyboard focus sat in a row, it moves
// to the same control in the new title's row (the caller scrolls).
window.MCU_followRowFocus = (toRow) => {
  const target = sameControlIn(document.activeElement, toRow);
  if (target) target.focus({ preventScroll: true });
};

// ↑ ↓ / Home / End in a desktop table of titles (the List, the Guides table).
// rowSelector picks the rows to land on (not headers or meters); openId is the
// title whose details are open; onFollow(id, n, total) opens another. Returns
// the table's ref and its keydown handler.
// - Focus in a row: ↑ ↓ move focus to the same control in the row above or
//   below, Home and End to the first and last row; they stop at the ends.
//   With the details open they follow the row, as in a mail app. Shift is left
//   free for a later range selection.
// - Details open but focus not in a row (after a mouse click focus is usually
//   on the page: Safari never focuses a clicked button, and a row itself is
//   not focusable): ↑ ↓ move from the open title to the row above or below and
//   open it, with n and total so the caller can announce the position. Focus
//   in the details, a field, a menu or the bulk bar keeps the keys.
function useRowKeys(rowSelector, openId, onFollow) {
  const tableRef = React.useRef(null);
  const latest = React.useRef(null);
  latest.current = { rowSelector, openId, onFollow };
  const rowsNow = () => [...tableRef.current.querySelectorAll(latest.current.rowSelector)];
  const onKeyDown = (e) => {
    if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Home' && e.key !== 'End') return;
    const row = e.target.closest && e.target.closest(rowSelector);
    if (!row || !tableRef.current) return;
    const rows = rowsNow();
    const i = rows.indexOf(row);
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? rows.length - 1 : i + (e.key === 'ArrowDown' ? 1 : -1);
    e.preventDefault();
    if (j < 0 || j >= rows.length || j === i) return;
    const to = rows[j];
    const target = sameControlIn(e.target, to);
    if (target) target.focus({ preventScroll: true });
    to.scrollIntoView({ block: 'nearest' });
    if (openId && onFollow) onFollow(to.getAttribute('data-row-id'));
  };
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.key !== 'ArrowUp' && e.key !== 'ArrowDown') || e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const { openId: id, onFollow: follow } = latest.current;
      if (!id || !follow || !tableRef.current) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t && t.closest('[data-row-id], input, textarea, select, [contenteditable="true"], [role="listbox"], [role="menu"], [role="group"], [role="dialog"], .drawer, .bulk-bar')) return;
      if (document.querySelector('.sort-order-pop, .acct-pop, .filters-pop, .ss-pop, .bulk-more-pop, .g-pop, [aria-modal="true"]')) return;
      const rows = rowsNow();
      const i = rows.findIndex(r => r.getAttribute('data-row-id') === id);
      if (i < 0) return;
      const j = i + (e.key === 'ArrowDown' ? 1 : -1);
      e.preventDefault();
      if (j < 0 || j >= rows.length) return;
      rows[j].scrollIntoView({ block: 'nearest' });
      follow(rows[j].getAttribute('data-row-id'), j + 1, rows.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return { tableRef, onKeyDown };
}
window.useRowKeys = useRowKeys;

// Character face: the actor photo when there is one, else initials on the
// character's colour. Matched search characters get a ring.
// Dark or white initials, whichever reads better on the character's colour
// (WCAG relative luminance; dark text wins on light colours).
function inkOn(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#fff';
  const ch = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255)
    .map(x => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  const lum = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  const dark = 0.0042; // #0a0c14
  return (lum + 0.05) / (dark + 0.05) >= 1.05 / (lum + 0.05) ? '#0a0c14' : '#fff';
}
function DlFace({ id, matched }) {
  const I = window.MCU_I18N;
  const c = window.CHARACTERS[id] || {};
  const media = window.MEDIA;
  const path = media && media.actors && media.actors[id];
  const name = I.charName(id);
  const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const url = path && (window.mediaURL ? window.mediaURL('a', id, media.profile_base + path) : media.profile_base + path);
  return (
    <span className={`dl-face${matched ? ' matched' : ''}`} title={name} style={{ background: c.color || '#555', color: inkOn(c.color || '#555') }}>
      <window.Portrait url={url} alt="" initials={initials}/>
    </span>
  );
}

function DlSortHeader({ col, label, sort, sortDir, setSort, setSortDir }) {
  const tr = window.MCU_I18N.tr;
  const mode = DL_SORT_FOR[col];
  if (!mode) return <span className={`dl-h c-${col}`} role="columnheader">{label}</span>;
  const active = sort === mode;
  const onClick = () => (active ? setSortDir(sortDir === 'asc' ? 'desc' : 'asc') : setSort(mode));
  return (
    <span className={`dl-h c-${col}${active ? ' on' : ''}`} role="columnheader"
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button onClick={onClick} title={tr(active ? 'list.reverse' : 'list.sortBy', { label })}>
        {label}
        <span className="dl-arrow" aria-hidden="true">{active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </span>
  );
}

// The bulk bar's "More" menu. Escape and a click outside close it; Escape is
// stopped here so the same press does not also clear the selection or close
// the details (one layer per press).
function BulkMore({ open, setOpen, label, children }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, [open]);
  return (
    <div className="bulk-more" ref={ref}
      onKeyDown={e => { if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); } }}>
      <button className="bulk-btn icon" aria-haspopup="menu" aria-expanded={open} aria-label={label} title={label}
        onClick={() => setOpen(!open)}>⋯</button>
      {open && <div className="bulk-more-pop" role="menu">{children}</div>}
    </div>
  );
}

// The checkbox on a phase header (By Phase): selects that phase's rows for the
// bulk bar, shows a mixed state when only some of them are selected, and
// clears them when they all are. The phase name is its visible label.
function DlPhaseCheck({ ids, selected, onToggle, group, label }) {
  const ref = React.useRef(null);
  const all = ids.length > 0 && ids.every(id => selected.has(id));
  const some = !all && ids.some(id => selected.has(id));
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = some; }, [some]);
  return (
    <span className="dl-phase-label">
      <input type="checkbox" ref={ref} className="dl-check" checked={all} onChange={() => onToggle(ids)}
        aria-label={window.MCU_I18N.tr('bulk.selectPhase', { group })} title={window.MCU_I18N.tr('bulk.selectPhase', { group })}/>
      <span>{label}</span>
    </span>
  );
}

function DesktopList({ titles, sort, sortDir, setSort, setSortDir, search, searchCharMatches, openId, onOpen, onFollow, activeChar, activeChars, header, empty, orderKey, progress, upNext }) {
  const I = window.MCU_I18N;
  const tr = I.tr;
  const { statusOf, states, requestBulk } = window.useCollection();
  const PosterArt = window.PosterArt;
  const ranked = sort === 'imdb' || sort === 'rt';

  // ---- Selection for bulk actions --------------------------------------
  // Ids of selected rows. Only rows on screen can be selected, so the set is
  // trimmed whenever the shown titles change (a filter, search or tab hides
  // some): an action never reaches a title the visitor cannot see.
  const [selected, setSelected] = React.useState(() => new Set());
  const anchorRef = React.useRef(null);     // last row clicked, for Shift-click ranges
  const shownIds = titles.map(t => t.id);
  const shownKey = shownIds.join(',');
  React.useEffect(() => {
    setSelected(prev => {
      if (!prev.size) return prev;
      const keep = new Set(shownIds.filter(id => prev.has(id)));
      return keep.size === prev.size ? prev : keep;
    });
  }, [shownKey]);
  const toggleRow = (id, e) => {
    // Read the anchor and the modifier now: the updater below runs later,
    // after the anchor has already moved to this row, so reading it in there
    // compared the row with itself and a Shift-click never made a range.
    const a = anchorRef.current;
    const range = !!(e && e.shiftKey);
    setSelected(prev => {
      const next = new Set(prev);
      const on = !prev.has(id);
      if (range && a && a !== id && shownIds.indexOf(a) !== -1) {
        // Shift-click sets the whole range to the state of the clicked row.
        const i = shownIds.indexOf(a), j = shownIds.indexOf(id);
        shownIds.slice(Math.min(i, j), Math.max(i, j) + 1).forEach(x => { if (on) next.add(x); else next.delete(x); });
      } else if (on) next.add(id); else next.delete(id);
      return next;
    });
    anchorRef.current = id;
  };
  const allOn = shownIds.length > 0 && shownIds.every(id => selected.has(id));
  const someOn = !allOn && shownIds.some(id => selected.has(id));
  // The first progress meter (All titles, or Phase 1 in By Phase) sits above
  // the column headers, which pin just beneath it; its height is measured so
  // the headers sit flush under it at any size or language.
  const [leadEl, setLeadEl] = React.useState(null);
  const [leadH, setLeadH] = React.useState(0);
  React.useLayoutEffect(() => {
    if (!leadEl) { setLeadH(0); return undefined; }
    const measure = () => setLeadH(leadEl.offsetHeight);
    measure();
    const ro = window.ResizeObserver ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(leadEl);
    return () => { if (ro) ro.disconnect(); };
  }, [leadEl]);
  const headCheck = React.useRef(null);
  React.useEffect(() => { if (headCheck.current) headCheck.current.indeterminate = someOn; }, [someOn]);
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(shownIds));
  // One phase at a time (By Phase): its header's checkbox adds the phase's
  // rows to the selection, or clears them when they are all selected already.
  const togglePhase = (ids) => setSelected(prev => {
    const next = new Set(prev);
    const all = ids.length > 0 && ids.every(id => prev.has(id));
    ids.forEach(id => { if (all) next.delete(id); else next.add(id); });
    return next;
  });
  const phaseIds = (phase) => titles.filter(t => t.phase === phase).map(t => t.id);
  const clearSelection = () => { setSelected(new Set()); anchorRef.current = null; };
  const selIds = shownIds.filter(id => selected.has(id));
  const counts = {
    seen: window.MCU_bulkTargets(selIds, 'seen', states).length,
    watchlist: window.MCU_bulkTargets(selIds, 'watchlist', states).length,
    none: window.MCU_bulkTargets(selIds, 'none', states).length,
  };
  const [moreOpen, setMoreOpen] = React.useState(false);
  // The selection ends when the action runs, not when it is asked for:
  // cancelling the confirmation keeps it.
  const act = (to) => { setMoreOpen(false); requestBulk(selIds, to, clearSelection); };
  // Escape clears the selection before it closes the details: an open menu,
  // popover or dialog goes first (their own handlers), then the selection,
  // then the details (app.jsx). preventDefault hands the press no further, so
  // one Escape never closes two layers. Registered once, on mount, so it stays
  // ahead of the app's handler, which re-registers as its state changes.
  const selRef = React.useRef(0);
  selRef.current = selected.size;
  // Back to home (the logo) clears the selection too.
  React.useEffect(() => {
    const onHome = () => { setSelected(new Set()); anchorRef.current = null; };
    window.addEventListener('mcu:home', onHome);
    return () => window.removeEventListener('mcu:home', onHome);
  }, []);
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || !selRef.current) return;
      if (document.querySelector('.sort-order-pop, .acct-pop, .filters-pop, .ss-pop, .bulk-more-pop, [role="dialog"], [aria-modal="true"]')) return;
      e.preventDefault();
      setSelected(new Set());
      anchorRef.current = null;
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
  const { tableRef, onKeyDown: onTableKey } = useRowKeys('.dl-row[data-row-id]', openId, onFollow);
  const groups = dlGroups(titles, sort);
  const labels = {
    poster: <span className="story-sr">{tr('list.col.poster')}</span>, title: tr('list.col.title'), type: tr('list.col.type'), phase: tr('list.col.phase'),
    release: tr('list.col.release'), story: tr('list.col.story'), budget: tr('list.col.budget'),
    imdb: 'IMDb', rt: 'RT', cast: tr('list.col.cast'), actions: <span className="story-sr">{tr('list.col.actions')}</span>,
  };
  const typeLabel = t => tr(t.type === 'film' ? 'type.film.one' : 'type.series.one');
  // Rows glide to their new places when the sort, order or collection filter
  // changes (same animation as the phone List and Grid).
  const flipRef = window.useReorderAnimation(orderKey, { inside: true });
  // One rowgroup per phase rather than per year, so the phase's sticky divider
  // stays pinned across all of that phase's year groups and hands over at the
  // next phase. Views with no phase headings keep a rowgroup each, as before.
  const blocks = [];
  groups.forEach((g) => {
    const startsPhase = !!(g.phaseStart && progress && progress.byPhase && progress.byPhase[g.phaseStart]);
    const last = blocks[blocks.length - 1];
    if (startsPhase || !last || !last.phased) blocks.push({ key: g.id, phased: startsPhase, groups: [g] });
    else last.groups.push(g);
  });
  let n = 0;
  // The meter above the column headers. In By Phase it is Phase 1's; each
  // later phase's meter pins in the same place at its boundary and covers the
  // one before it, so the current phase is always the one on top.
  const leadPhase = !(progress && progress.all) && blocks[0] && blocks[0].phased ? blocks[0].groups[0].phaseStart : null;
  // Each meter carries the phones' "Mark N more seen" (the same component, so
  // the same count rule, confirmation and Undo), and in By Phase a checkbox
  // that selects the phase for the bulk bar.
  const phaseMeter = (phase) => {
    const ids = phaseIds(phase);
    const group = I.tr('phase.label', { n: phase });
    return (
      <window.ProgressHeader color={window.PHASE_COLORS[phase]} {...progress.byPhase[phase]}
        label={<DlPhaseCheck ids={ids} selected={selected} onToggle={togglePhase} group={group} label={I.upper(group)}/>}
        action={<window.BulkHeaderAction ids={ids} group={group}/>}/>
    );
  };
  const leadMeter = progress && progress.all
    ? <window.ProgressHeader label={I.upper(I.tr('progress.all'))} {...progress.all}
        action={<window.BulkHeaderAction ids={shownIds} group={I.tr('progress.all')}/>}/>
    : leadPhase ? phaseMeter(leadPhase) : null;
  return (
    <div className={`dlist${ranked ? ' ranked' : ''}`} ref={flipRef} role="main" aria-label={tr('view.list')}>
      {header}
      {/* Up next: a strip above the table. The desktop List does not fold seen
          titles, so the suggestion can be far down; the strip brings it up. */}
      {upNext && <window.UpNextStrip info={upNext}/>}
      {!titles.length ? (
        <div className="dl-empty">
          <div className="dl-empty-t">{(empty && empty.title) || tr('empty.title')}</div>
          <div className="dl-empty-s">{(empty && empty.sub) || tr('empty.sub')}</div>
          {empty && empty.action && <button type="button" className="empty-action" onClick={empty.action.run}>{empty.action.label}</button>}
        </div>
      ) : (
        <>
        {/* Always present, so the count is announced as it changes (a region
            that appears together with its text is often not read out). */}
        <span className="story-sr" role="status" aria-live="polite">{selIds.length ? tr('bulk.selected', { n: selIds.length }) : ''}</span>
        {/* Before the table in reading order, so Shift+Tab from the header
            checkbox reaches it; drawn fixed at the bottom of the List. */}
        {selIds.length > 0 && (
          <div className="bulk-bar" role="region" aria-label={tr('bulk.selected', { n: selIds.length })}>
            <span className="bulk-count" aria-hidden="true">{tr('bulk.selected', { n: selIds.length })}</span>
            <button className="bulk-btn primary" disabled={!counts.seen} onClick={() => act('seen')}>
              {tr('bulk.markSeen')}<span className="bulk-n">{counts.seen}</span>
            </button>
            <button className="bulk-btn" disabled={!counts.watchlist} onClick={() => act('watchlist')}>
              {tr('bulk.addWatch')}<span className="bulk-n">{counts.watchlist}</span>
            </button>
            <BulkMore open={moreOpen} setOpen={setMoreOpen} label={tr('bulk.more')}>
              <button role="menuitem" disabled={!counts.none} onClick={() => act('none')}>
                {tr('bulk.markUnseen')}<span className="bulk-n">{counts.none}</span>
              </button>
            </BulkMore>
            <button className="bulk-btn ghost" onClick={clearSelection}>{tr('bulk.clear')}</button>
          </div>
        )}
        <div className="dl-table" role="table" aria-label={tr('view.list')} style={{ '--dl-lead-h': leadH + 'px' }}
          ref={tableRef} onKeyDown={onTableKey}>
          {/* A row owned directly by the table (a rowgroup holding no row is
              invalid ARIA), first so it reads and draws above the headers. */}
          {leadMeter && (
            <div role="row" ref={setLeadEl} className={`dl-phase-divider sticky lead${leadPhase ? '' : ' overall'}`}>
              <span role="cell" className="dl-overall-cell">{leadMeter}</span>
            </div>
          )}
          <div className="dl-row dl-head" role="row">
            <span className="dl-h c-check" role="columnheader">
              <input type="checkbox" ref={headCheck} className="dl-check" checked={allOn} onChange={toggleAll}
                aria-label={tr('bulk.selectAll')} title={tr('bulk.selectAll')}/>
            </span>
            {ranked && <span className="dl-h c-rank" role="columnheader">#</span>}
            {DL_COLUMNS.map(col => (
              <DlSortHeader key={col} col={col} label={labels[col]} sort={sort} sortDir={sortDir} setSort={setSort} setSortDir={setSortDir}/>
            ))}
          </div>
          {blocks.map((b, bi) => (
            <div key={b.key} role="rowgroup">
              {b.phased && !(bi === 0 && leadPhase) && (
                /* No data-flip-id: the reorder animation moves what it tracks
                   with a transform, and a sticky element is already positioned
                   from the scroll offset — together they leave the bar hanging
                   below the header instead of under it. */
                <div role="row" className="dl-phase-divider sticky">
                  <span role="cell" className="dl-overall-cell">{phaseMeter(b.groups[0].phaseStart)}</span>
                </div>
              )}
              {b.groups.map(g => (
                <React.Fragment key={g.id}>
              {g.label && (g.phase && progress && progress.byPhase[g.phase]
                ? <div className="dl-glabel" data-flip-id={'g:' + g.id} style={g.color ? { color: g.color } : null}>
                    <window.ProgressHeader label={g.label} color={g.color} {...progress.byPhase[g.phase]}/>
                  </div>
                : <div className={`dl-glabel${g.story ? ' story' : ''}`} data-flip-id={'g:' + g.id} style={g.color ? { color: g.color } : null}>{g.label}</div>)}
              {g.items.map(t => {
                n += 1;
                const seen = statusOf(t.id) === 'seen';
                const matched = searchCharMatches ? (searchCharMatches[t.id] || []) : [];
                // Matched characters first, then the rest of the cast.
                const cast = [...matched, ...t.cast.filter(c => !matched.includes(c))];
                // A pinned performer covers several characters: a row is only
                // dimmed when it holds none of them.
                const dim = activeChars ? !activeChars.some(c => t.cast.includes(c)) : (activeChar && !t.cast.includes(activeChar));
                return (
                  <div key={t.id} role="row" data-row-id={t.id} data-flip-id={t.id} onClick={() => onOpen(t.id)}
                    className={`dl-row${seen ? ' seen' : ''}${openId === t.id ? ' on' : ''}${dim ? ' dim' : ''}`}>
                    <span className="c-check" role="cell" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="dl-check" checked={selected.has(t.id)}
                        onClick={e => { e.stopPropagation(); toggleRow(t.id, e); }} onChange={() => {}}
                        aria-label={tr('bulk.selectRow', { title: I.titleName(t) })}/>
                    </span>
                    {ranked && <span className="c-rank" role="cell">{n}</span>}
                    <span className="c-poster" role="cell"><span className="dl-thumb"><PosterArt title={t}/></span></span>
                    <span className="c-title" role="cell">
                      <button className="dl-open" aria-expanded={openId === t.id}
                        onClick={e => { e.stopPropagation(); onOpen(t.id); }}>
                        <window.Highlight text={I.titleName(t)} query={search}/>
                      </button>
                      {/* Beside the title rather than in the narrow Released
                          column, where it wrapped under the year. */}
                      <window.ReleaseBadge title={t} className="dl-release"/>
                      {/* Which character matched the search, at every width
                          (the characters column drops on narrower lists). */}
                      <window.MatchBadge matchedChars={matched} query={search} title={t}/>
                    </span>
                    <span className="c-type" role="cell">{typeLabel(t)}</span>
                    <span className="c-phase" role="cell"><span className="dl-dot" style={{ background: window.PHASE_COLORS[t.phase] }}/>{t.phase}</span>
                    <span className="c-release" role="cell">{t.year}</span>
                    <span className="c-story" role="cell">{t.story ? I.storyLabel(t.story) : '—'}</span>
                    <span className="c-budget" role="cell">{t.budget != null ? I.budget(t.budget) : '—'}</span>
                    <span className="c-imdb" role="cell">{t.imdb != null
                      ? <span className="card-rating imdb" title={tr(t.type === 'series' ? 'score.imdbSeries' : 'score.imdbMovie')}><span className="imdb-tag">IMDb</span>{t.imdb.toFixed(1)}</span>
                      : <span className="dl-none">—</span>}</span>
                    <span className="c-rt" role="cell">{t.rt != null
                      ? <span className="card-rating rt" title={tr('score.rt')}><span className="rt-tag">RT</span>{t.rt}%</span>
                      : <span className="dl-none">—</span>}</span>
                    <span className="c-cast" role="cell">
                      {cast.slice(0, 5).map(c => <DlFace key={c} id={c} matched={matched.includes(c)}/>)}
                      {cast.length > 5 && <span className="dl-more">+{cast.length - 5}</span>}
                    </span>
                    <span className="c-actions" role="cell" onClick={e => e.stopPropagation()}>
                      <window.TitleStatusActions title={t} className="dl-tsa"/>
                    </span>
                  </div>
                );
              })}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
window.DesktopList = DesktopList;
