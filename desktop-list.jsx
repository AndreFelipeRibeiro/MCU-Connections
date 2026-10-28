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
    else if (sort === 'phase') { key = 'p' + t.phase; label = I.upper(I.tr('phase.label', { n: t.phase })); extra = { color: window.PHASE_COLORS[t.phase] }; }
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(t);
    else groups.push({ key, id: key + '#' + groups.length, label, ...extra, items: [t] });
  });
  return groups;
}

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

function DesktopList({ titles, sort, sortDir, setSort, setSortDir, search, searchCharMatches, openId, onOpen, activeChar, header, empty, orderKey }) {
  const I = window.MCU_I18N;
  const tr = I.tr;
  const { statusOf } = window.useCollection();
  const PosterArt = window.PosterArt;
  const ranked = sort === 'imdb' || sort === 'rt';
  const groups = dlGroups(titles, sort);
  const labels = {
    poster: '', title: tr('list.col.title'), type: tr('list.col.type'), phase: tr('list.col.phase'),
    release: tr('list.col.release'), story: tr('list.col.story'), budget: tr('list.col.budget'),
    imdb: 'IMDb', rt: 'RT', cast: tr('list.col.cast'), actions: '',
  };
  const typeLabel = t => tr(t.type === 'film' ? 'type.film.one' : 'type.series.one');
  // Rows glide to their new places when the sort, order or collection filter
  // changes (same animation as the phone List and Grid).
  const flipRef = window.useReorderAnimation(orderKey, { inside: true });
  let n = 0;
  return (
    <div className={`dlist${ranked ? ' ranked' : ''}`} ref={flipRef}>
      {header}
      {!titles.length ? (
        <div className="dl-empty">
          <div className="dl-empty-t">{(empty && empty.title) || tr('empty.title')}</div>
          <div className="dl-empty-s">{(empty && empty.sub) || tr('empty.sub')}</div>
        </div>
      ) : (
        <div className="dl-table" role="table" aria-label={tr('view.list')}>
          <div className="dl-row dl-head" role="row">
            {ranked && <span className="dl-h c-rank" role="columnheader">#</span>}
            {DL_COLUMNS.map(col => (
              <DlSortHeader key={col} col={col} label={labels[col]} sort={sort} sortDir={sortDir} setSort={setSort} setSortDir={setSortDir}/>
            ))}
          </div>
          {groups.map(g => (
            <div key={g.id} role="rowgroup">
              {g.label && <div className={`dl-glabel${g.story ? ' story' : ''}`} data-flip-id={'g:' + g.id} style={g.color ? { color: g.color } : null}>{g.label}</div>}
              {g.items.map(t => {
                n += 1;
                const seen = statusOf(t.id) === 'seen';
                const matched = searchCharMatches ? (searchCharMatches[t.id] || []) : [];
                // Matched characters first, then the rest of the cast.
                const cast = [...matched, ...t.cast.filter(c => !matched.includes(c))];
                const dim = activeChar && !t.cast.includes(activeChar);
                return (
                  <div key={t.id} role="row" data-row-id={t.id} data-flip-id={t.id} onClick={() => onOpen(t.id)}
                    className={`dl-row${seen ? ' seen' : ''}${openId === t.id ? ' on' : ''}${dim ? ' dim' : ''}`}>
                    {ranked && <span className="c-rank" role="cell">{n}</span>}
                    <span className="c-poster" role="cell"><span className="dl-thumb"><PosterArt title={t}/></span></span>
                    <span className="c-title" role="cell">
                      <button className="dl-open" aria-expanded={openId === t.id}
                        onClick={e => { e.stopPropagation(); onOpen(t.id); }}>
                        <window.Highlight text={I.titleName(t)} query={search}/>
                      </button>
                      {/* Which character matched the search, at every width
                          (the characters column drops on narrower lists). */}
                      <window.MatchBadge matchedChars={matched} query={search}/>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
window.DesktopList = DesktopList;
