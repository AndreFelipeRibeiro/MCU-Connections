// "What have you seen?" (V3 Tasks, First-visit picker): a poster grid of every
// released title, grouped by phase in release order, to mark many as seen in
// one go. Offered by the first-visit welcome, the account menu/sheet and the
// Seen tab's empty state (window.MCU_openPicker, set in app.jsx).
//
// Picks live in this component until Save; nothing else is stored. Titles
// already seen start ticked (with a "Seen" label) and can be unticked, which
// marks them unseen as part of the same change. Save goes through
// applyPicks (tracking.jsx): one change, one toast with Undo, one celebration
// at most, one write per title when signed in. No extra confirmation: the
// button names the numbers. Closing with unsaved picks asks first.
// A full-height sheet on phones, a wide dialog on desktop.

const PkI18N = window.MCU_I18N;
const pktr = (key, vars) => PkI18N.tr(key, vars);

// Smaller posters than the app's w342: 60 of them stay light on a phone.
function PickPoster({ title }) {
  const media = window.MEDIA;
  const path = media && media.posters && media.posters[title.id];
  const url = path ? (window.mediaURL ? window.mediaURL('p', title.id, media.poster_base.replace('/w342', '/w185') + path) : media.poster_base + path) : null;
  const [failed, setFailed] = React.useState(false);
  if (url && !failed) return <img src={url} alt="" loading="lazy" onError={() => setFailed(true)}/>;
  return <window.PosterArt title={title}/>;
}

function SeenPicker({ touch, onClose }) {
  const { states, applyPicks } = window.useCollection();
  window.useI18n();
  // The released titles by phase, in release order. Worked out once per open:
  // the list does not reshuffle while picking.
  const groups = React.useMemo(() => {
    const released = (window.TITLES || []).filter(t => window.MCU_isReleased(t))
      .sort((a, b) => (a.release < b.release ? -1 : a.release > b.release ? 1 : 0));
    const by = {};
    released.forEach(t => { (by[t.phase] = by[t.phase] || []).push(t); });
    return Object.keys(by).map(Number).sort((a, b) => a - b).map(p => ({ phase: p, titles: by[p] }));
  }, []);
  // What was seen when the picker opened; picks start from that.
  const initial = React.useMemo(() => new Set(groups.flatMap(g => g.titles).filter(t => states[t.id] === 'seen').map(t => t.id)), []);
  const later = initial.size > 0;
  const [picks, setPicks] = React.useState(() => new Set(initial));
  const [asking, setAsking] = React.useState(false);
  const askRef = React.useRef(null);

  const toSeen = [...picks].filter(id => !initial.has(id));
  const toUnseen = [...initial].filter(id => !picks.has(id));
  const dirty = toSeen.length + toUnseen.length > 0;
  const hasWatch = groups.some(g => g.titles.some(t => states[t.id] === 'watchlist'));

  const toggle = (id) => setPicks(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const setPhase = (ids, on) => setPicks(prev => { const n = new Set(prev); ids.forEach(id => (on ? n.add(id) : n.delete(id))); return n; });

  const save = () => {
    const s = toSeen, u = toUnseen;
    onClose();
    // After the picker has gone, so the toast and the sign-in reminder are
    // placed for the page underneath rather than for the sheet.
    setTimeout(() => applyPicks(s, u), 0);
  };
  // ×, Escape, Back, the scrim or a swipe. Returns false while it stays open
  // (Sheet keeps its history entry that way).
  const requestClose = () => {
    if (asking) { setAsking(false); return false; }
    if (!dirty) { onClose(); return true; }
    setAsking(true);
    return false;
  };
  const closeRef = React.useRef(requestClose);
  closeRef.current = requestClose;
  const onShellClose = () => closeRef.current();

  // While the leave prompt is up, the grid and footer behind it are inert
  // and the prompt takes focus.
  const gridRef = React.useRef(null);
  const footRef = React.useRef(null);
  React.useEffect(() => {
    [gridRef.current, footRef.current].forEach(el => { if (el) el.inert = asking; });
    if (asking && askRef.current) askRef.current.focus();
  }, [asking]);

  const goLabel = later ? pktr('picker.save') : pktr('picker.go', { n: toSeen.length });
  const countLine = later ? (
    <>
      <span><b>{toSeen.length}</b> {pktr('picker.toSeenWord', { n: toSeen.length })}</span>
      {toUnseen.length > 0 && <span><b>{toUnseen.length}</b> {pktr('picker.toUnseenWord', { n: toUnseen.length })}</span>}
    </>
  ) : <span><b>{toSeen.length}</b> {pktr('picker.pickedWord', { n: toSeen.length })}</span>;

  const body = (
    <div className={`pk${touch ? ' touch' : ''}`}>
      <div className="pk-head">
        <h2 id="pk-title" className="pk-title">{pktr('picker.title')}</h2>
        <p className="pk-sub">{later ? pktr('picker.subLater') : pktr(touch ? 'picker.subTouch' : 'picker.sub')}</p>
        {hasWatch && <p className="pk-note"><window.BookmarkIcon filled/><span>{pktr('picker.watchNote')}</span></p>}
      </div>
      <div className="pk-body" ref={gridRef}>
        {groups.map(g => {
          const ids = g.titles.map(t => t.id);
          const n = ids.filter(id => picks.has(id)).length;
          const all = n === ids.length;
          const name = pktr('phase.label', { n: g.phase });
          const action = all ? 'clear' : n > 0 && later ? 'rest' : 'all';
          return (
            <section key={g.phase} className="pk-phase" aria-labelledby={`pk-ph-${g.phase}`}>
              <div className="pk-ph">
                <h3 id={`pk-ph-${g.phase}`} className="pk-pl">{PkI18N.upper(name)}<span>{n}/{ids.length}</span></h3>
                <button type="button" className={`pk-pa${all ? ' clr' : ''}`} onClick={() => setPhase(ids, !all)}
                  aria-label={pktr(action === 'clear' ? 'picker.clearAria' : action === 'rest' ? 'picker.restAria' : 'picker.allAria', { group: name })}>
                  {pktr(action === 'clear' ? 'picker.clear' : action === 'rest' ? 'picker.rest' : 'picker.all')}
                </button>
              </div>
              <div className="pk-grid">
                {g.titles.map(t => {
                  const on = picks.has(t.id);
                  const had = initial.has(t.id);
                  const watch = states[t.id] === 'watchlist';
                  const name = PkI18N.titleName(t);
                  const label = had && !on ? pktr('picker.ariaUnmark', { title: name })
                    : had ? pktr('picker.ariaSeen', { title: name })
                    : watch ? pktr('picker.ariaWatch', { title: name }) : name;
                  return (
                    <button key={t.id} type="button" data-pick={t.id} aria-pressed={on} aria-label={label}
                      className={`pk-p${on ? ' on' : ''}${had && !on ? ' un' : ''}`} onClick={() => toggle(t.id)}>
                      <span className="pk-art" aria-hidden="true"><PickPoster title={t}/></span>
                      <span className="pk-name" aria-hidden="true">{name}</span>
                      <span className="pk-tick" aria-hidden="true">{on && <window.CheckIcon/>}</span>
                      {had && <span className={`pk-tag${on ? '' : ' ul'}`} aria-hidden="true">{pktr(on ? 'picker.seenTag' : 'picker.unmarkTag')}</span>}
                      {!had && watch && !on && <span className="pk-wl" aria-hidden="true"><window.BookmarkIcon filled/></span>}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <div className="pk-foot" ref={footRef}>
        <div className="pk-count" role="status" aria-live="polite">{countLine}</div>
        {!touch && <button type="button" className="nudge-later pk-skip" onClick={onShellClose}>{pktr(later ? 'picker.cancel' : 'picker.skip')}</button>}
        <button type="button" className="picker-go pk-go" disabled={!dirty} onClick={save}>{goLabel}</button>
      </div>
      {asking && (
        <div className="pk-ask-wrap">
          <div className="pk-ask" role="alertdialog" aria-modal="true" aria-labelledby="pk-ask-t" aria-describedby="pk-ask-d" tabIndex={-1} ref={askRef}>
            <h3 id="pk-ask-t" className="pk-ask-t">{later ? pktr('picker.leaveTitleLater') : pktr('picker.leaveTitle', { n: toSeen.length })}</h3>
            <p id="pk-ask-d" className="pk-ask-d">{pktr('picker.leaveText')}</p>
            <div className="about-cta-row">
              <button type="button" className="picker-go" onClick={save}>{goLabel}</button>
              <button type="button" className="nudge-later" onClick={() => { setAsking(false); onClose(); }}>{pktr('picker.leave')}</button>
              <button type="button" className="pk-keep" onClick={() => setAsking(false)}>{pktr('picker.keep')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  if (touch) return <window.Sheet onClose={onShellClose} tall className="pk-sheet" label={pktr('picker.title')}>{body}</window.Sheet>;
  return <window.ModalDialog onClose={onShellClose} labelledBy="pk-title" className="pk-dialog">{body}</window.ModalDialog>;
}

window.SeenPicker = SeenPicker;
