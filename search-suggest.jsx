// Search input with suggestions (desktop toolbar and mobile app bar). From two
// characters it previews matching actors, characters and titles under the box,
// matching names in every language. Picking an actor or character searches for
// that name; picking a title also opens its details. Typing without picking
// keeps today's free-text search. Combobox pattern: arrows move, Enter picks,
// Escape closes.

const SS_LIMIT = { actor: 4, character: 4, title: 4 };

// Lower-case and strip accents, keeping the length so match offsets map back
// onto the displayed (NFC) name.
const ssFold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// 0: the name or one of its words starts with the query ("vinga" matches
// "Os Vingadores"), 1: it appears inside a word.
function ssScore(name, q) {
  const f = ssFold(name);
  const i = f.indexOf(q);
  if (i < 0) return null;
  return i === 0 || /[\s\-:'’(.]/.test(f[i - 1]) ? 0 : 1;
}

function ssBest(names, q) {
  let best = null;
  names.forEach(n => { const s = ssScore(n, q); if (s !== null && (best === null || s < best)) best = s; });
  return best;
}

function ssBuild(query) {
  const I = window.MCU_I18N;
  const q = ssFold(query.trim());
  if (q.length < 2) return [];
  const titlesOf = {};
  window.TITLES.forEach(t => t.cast.forEach(c => { (titlesOf[c] = titlesOf[c] || new Set()).add(t.id); }));
  const actors = {};
  Object.keys(window.CHARACTERS).forEach(id => {
    const c = window.CHARACTERS[id];
    if (!titlesOf[id]) return;
    const a = actors[c.actor] || (actors[c.actor] = { name: c.actor, chars: [], titles: new Set() });
    a.chars.push(id);
    titlesOf[id].forEach(t => a.titles.add(t));
  });
  const out = [];
  Object.values(actors).forEach(a => {
    const s = ssScore(a.name, q);
    if (s !== null) out.push({ kind: 'actor', key: 'a:' + a.name, label: a.name, score: s, n: a.titles.size, chars: a.chars });
  });
  Object.keys(window.CHARACTERS).forEach(id => {
    if (!titlesOf[id]) return;
    const s = ssBest(I.charNames(id), q);
    if (s !== null) out.push({ kind: 'character', key: 'c:' + id, id, label: I.charName(id), score: s, n: titlesOf[id].size });
  });
  window.TITLES.forEach(t => {
    const s = ssBest(I.titleNames(t), q);
    if (s !== null) out.push({ kind: 'title', key: 't:' + t.id, id: t.id, title: t, label: I.titleName(t), score: s, n: 0, year: t.year });
  });
  // People: best match, then most titles. Titles: best match, then release order.
  const rank = (a, b) => a.score - b.score || (a.kind === 'title' ? a.year - b.year : b.n - a.n) || I.compare(a.label, b.label);
  const people = ['actor', 'character'].flatMap(kind => out.filter(o => o.kind === kind).sort(rank).slice(0, SS_LIMIT[kind]));
  // Titles get the room people don't use, up to eight rows in all.
  const titles = out.filter(o => o.kind === 'title').sort(rank).slice(0, Math.max(SS_LIMIT.title, 8 - people.length));
  return people.concat(titles);
}

// Bold the matched part; when the shown name matched only in another language,
// show it plain.
function SsLabel({ text, query }) {
  const q = ssFold(query.trim());
  const i = ssFold(text).indexOf(q);
  if (!q || i < 0) return text;
  return <>{text.slice(0, i)}<b>{text.slice(i, i + q.length)}</b>{text.slice(i + q.length)}</>;
}

function SsThumb({ item }) {
  const media = window.MEDIA;
  const [failed, setFailed] = React.useState(false);
  if (item.kind === 'title') return <span className="ss-thumb poster"><window.PosterArt title={item.title}/></span>;
  const id = item.kind === 'actor' ? item.chars[0] : item.id;
  const c = window.CHARACTERS[id] || {};
  const path = media && media.actors && media.actors[id];
  const url = path && (window.mediaURL ? window.mediaURL('a', id, media.profile_base + path) : media.profile_base + path);
  return (
    <span className="ss-thumb face" style={{ background: c.color || '#555' }}>
      {url && !failed ? <img src={url} alt="" loading="lazy" onError={() => setFailed(true)}/> : <span aria-hidden="true">{c.initials}</span>}
    </span>
  );
}

// `portalTo` (optional element) renders the list there instead of beside the
// input: the mobile box is too small to anchor it, so it spans the search row.
function SearchInput({ value, onChange, onPickTitle, onPickPerson, placeholder, ariaLabel, portalTo }) {
  const I = window.MCU_I18N;
  const { tr, lang } = window.useI18n();
  const [focused, setFocused] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const inputRef = React.useRef(null);
  const listId = React.useId();
  const items = React.useMemo(() => ssBuild(value), [value, lang]);
  const open = focused && !dismissed && items.length > 0;
  React.useEffect(() => { setActive(-1); }, [value]);

  const pick = (item, viaKeyboard = false) => {
    // A character (or an actor who plays one) opens the character view, with
    // its stepper, instead of becoming a text search; the box is cleared.
    if (item.kind !== 'title' && onPickPerson && onPickPerson(item, { viaKeyboard })) {
      onChange('');
      if (inputRef.current) inputRef.current.blur();
      setDismissed(true);
      setActive(-1);
      return;
    }
    onChange(item.label);
    if (item.kind === 'title' && onPickTitle) {
      onPickTitle(item.id);
      // Details open now: let go of the box (and the phone keyboard).
      if (inputRef.current) inputRef.current.blur();
    }
    setDismissed(true);
    setActive(-1);
  };
  const onKeyDown = (e) => {
    if (e.key === 'Escape') { if (open) { e.preventDefault(); setDismissed(true); } return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!items.length) return;
      e.preventDefault();
      setDismissed(false);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      // Cycle through the options and back to the box itself (-1).
      setActive(i => {
        const next = i + step;
        if (next >= items.length) return -1;
        if (next < -1) return items.length - 1;
        return next;
      });
      return;
    }
    if (e.key === 'Enter' && open && active >= 0) { e.preventDefault(); pick(items[active], true); }
  };
  const secondary = (item) => {
    if (item.kind === 'actor') return tr('suggest.as', { names: item.chars.map(id => I.charName(id)).join(', ') });
    if (item.kind === 'character') return window.CHARACTERS[item.id].actor;
    return `${tr(item.title.type === 'film' ? 'type.film.one' : 'type.series.one')} · ${item.year}`;
  };

  let lastKind = null;
  const pop = open ? (
    <ul className="ss-pop" id={listId} role="listbox" aria-label={tr('suggest.label')}>
      {items.map((item, i) => {
        const head = item.kind !== lastKind ? tr('suggest.' + item.kind + 's') : null;
        lastKind = item.kind;
        return (
          <React.Fragment key={item.key}>
            {head && <li className="ss-head" role="presentation">{head}</li>}
            <li id={`${listId}-${i}`} role="option" aria-selected={i === active}
              className={`ss-item${i === active ? ' on' : ''}`}
              onMouseDown={e => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(item)}>
              <SsThumb item={item}/>
              <span className="ss-text">
                <span className="ss-main"><SsLabel text={item.label} query={value}/></span>
                <span className="ss-sub">{secondary(item)}</span>
              </span>
              {item.kind !== 'title' && <span className="ss-count">{tr('header.count', { n: item.n })}</span>}
            </li>
          </React.Fragment>
        );
      })}
    </ul>
  ) : null;
  return (
    <>
      <input ref={inputRef} value={value} placeholder={placeholder} aria-label={ariaLabel}
        role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={e => { onChange(e.target.value); setDismissed(false); }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onKeyDown={onKeyDown}/>
      {portalTo ? ReactDOM.createPortal(pop, portalTo) : pop}
    </>
  );
}
window.SearchInput = SearchInput;
