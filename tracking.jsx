// Watch tracking — per-title collection state (seen / watchlist), guest
// persistence, and the shared status controls.
//
// Three mutually exclusive states per title: 'none' | 'watchlist' | 'seen'.
// 'none' is the absence of an entry, never a stored value — the same shape the
// database uses, where clearing a status is a DELETE rather than a third status.
//
// Phase 1 is local-only: everything lives in localStorage under a versioned key.
// The pending/error plumbing below is deliberately inert here; Phase 3 fills it
// in when writes become remote and can fail.

const STORAGE_KEY = 'mcu.collection.v1';
const STORAGE_VERSION = 1;

// Below this canvas scale the status buttons are smaller than a usable hit
// target, so they are withdrawn and only the (non-interactive) seen marker
// remains. Cards are laid out at view.scale, which resetView can land near
// 0.7–0.8 and the user can pinch down to ZOOM_MIN = 0.05.
const TSA_MIN_SCALE = 0.5;

// Local calendar date, not UTC — `new Date().toISOString()` rolls over early or
// late depending on the timezone, which would move the released-title
// denominator by a day for most of the world.
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isReleased(title, today) {
  return title.release <= (today || todayISO());
}

// The completion denominator. Computed from release dates every time rather
// than stored, so it moves on its own as the slate ships.
function releasedCount() {
  const today = todayISO();
  return (window.TITLES || []).filter((t) => isReleased(t, today)).length;
}

// ---------------------------------------------------------------------------
// Guest storage
// ---------------------------------------------------------------------------

// Tolerates absent, malformed, truncated and hand-edited JSON: anything it
// can't make sense of degrades to an empty collection rather than throwing on
// the first render.
function readGuestStates() {
  let raw;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return {}; // Storage disabled (Safari private mode, cookie blocking).
  }
  if (!raw) return {};
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn('[mcu] collection storage was not valid JSON; ignoring it');
    return {};
  }
  if (!parsed || typeof parsed !== 'object' || parsed.version !== STORAGE_VERSION) return {};
  const states = parsed.states;
  if (!states || typeof states !== 'object') return {};
  const out = {};
  Object.keys(states).forEach((id) => {
    const v = states[id];
    if (v === 'seen' || v === 'watchlist') out[id] = v;
  });
  return out;
}

function writeGuestStates(states) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, states }));
  } catch (e) {
    // Quota or disabled storage. Tracking still works for this session in
    // memory; losing it on reload beats breaking the toggle.
    console.warn('[mcu] could not persist collection to localStorage', e);
  }
}

function clearGuestStates() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* nothing to do */ }
}

const IS_DEV = ['localhost', '127.0.0.1', '[::1]', ''].indexOf(window.location.hostname) !== -1;

// A stored id with no catalog entry is inert, not garbage — it may be a title
// that was renamed or temporarily pulled. It is ignored by the UI and never
// deleted, because dropping it would turn a typo into permanent data loss.
function warnUnknownIds(states) {
  if (!IS_DEV) return;
  const known = new Set((window.TITLES || []).map((t) => t.id));
  const unknown = Object.keys(states).filter((id) => !known.has(id));
  if (unknown.length) {
    console.warn('[mcu] stored title ids with no catalog entry (kept, ignored in UI):', unknown);
  }
}

// ---------------------------------------------------------------------------
// Collection context
// ---------------------------------------------------------------------------

const CollectionContext = React.createContext(null);

function CollectionProvider({ children }) {
  const [states, setStates] = React.useState(() => {
    const initial = readGuestStates();
    warnUnknownIds(initial);
    return initial;
  });

  // Phase 3 populates these from the write queue; Phase 1 leaves them empty so
  // every consumer already renders the slots.
  const [pending] = React.useState({});
  const [errors] = React.useState({});

  const firstWrite = React.useRef(true);
  React.useEffect(() => {
    // Don't rewrite storage with what we just read out of it on mount.
    if (firstWrite.current) { firstWrite.current = false; return; }
    writeGuestStates(states);
  }, [states]);

  // Sets an explicit status. `next` of 'none' removes the entry entirely.
  const setStatus = React.useCallback((titleId, next) => {
    setStates((prev) => {
      const current = prev[titleId] || 'none';
      if (current === next) return prev;
      const out = { ...prev };
      if (next === 'none') delete out[titleId];
      else out[titleId] = next;
      return out;
    });
  }, []);

  // Un-seeing returns a title to 'none', never to 'watchlist' — the watchlist
  // entry was consumed when it was marked seen and there is nothing to restore.
  const toggleSeen = React.useCallback((titleId) => {
    setStates((prev) => {
      const out = { ...prev };
      if (prev[titleId] === 'seen') delete out[titleId];
      else out[titleId] = 'seen';
      return out;
    });
  }, []);

  const toggleWatchlist = React.useCallback((titleId) => {
    setStates((prev) => {
      const out = { ...prev };
      if (prev[titleId] === 'watchlist') delete out[titleId];
      else out[titleId] = 'watchlist';
      return out;
    });
  }, []);

  const clearAll = React.useCallback(() => {
    setStates({});
    clearGuestStates();
  }, []);

  // Unreleased titles can be watchlisted and even marked seen, but they never
  // enter the completion ratio in either position.
  const progress = React.useMemo(() => {
    const today = todayISO();
    let releasedTotal = 0;
    let seenReleased = 0;
    let seenTotal = 0;
    let watchlist = 0;
    (window.TITLES || []).forEach((t) => {
      const released = isReleased(t, today);
      if (released) releasedTotal += 1;
      const status = states[t.id];
      if (status === 'seen') {
        seenTotal += 1;
        if (released) seenReleased += 1;
      } else if (status === 'watchlist') {
        watchlist += 1;
      }
    });
    return { releasedTotal, seenReleased, seenTotal, watchlist };
  }, [states]);

  const value = React.useMemo(() => ({
    states,
    statusOf: (id) => states[id] || 'none',
    isSeen: (id) => states[id] === 'seen',
    isWatchlisted: (id) => states[id] === 'watchlist',
    pendingOf: (id) => !!pending[id],
    errorOf: (id) => errors[id] || null,
    setStatus,
    toggleSeen,
    toggleWatchlist,
    clearAll,
    progress,
  }), [states, pending, errors, setStatus, toggleSeen, toggleWatchlist, clearAll, progress]);

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

function useCollection() {
  const ctx = React.useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection() used outside <CollectionProvider>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Collection filter
// ---------------------------------------------------------------------------

const COLLECTION_OPTIONS = [
  ['all', 'All'],
  ['unseen', 'Unseen'],
  ['seen', 'Seen'],
  ['watchlist', 'Watchlist'],
];

// 'unseen' means "not marked seen", so watchlisted titles are still unseen.
function matchesCollection(status, filter) {
  if (filter === 'all') return true;
  if (filter === 'seen') return status === 'seen';
  if (filter === 'watchlist') return status === 'watchlist';
  if (filter === 'unseen') return status !== 'seen';
  return true;
}

// Copy for a list emptied by the collection filter rather than by phase/search.
function collectionEmptyCopy(filter) {
  if (filter === 'watchlist') {
    return { title: 'Your watchlist is empty', sub: 'Add titles with the bookmark button to plan what to watch next.' };
  }
  if (filter === 'seen') {
    return { title: 'Nothing marked as seen yet', sub: 'Mark a title with the check button to start tracking.' };
  }
  if (filter === 'unseen') {
    return { title: "You've seen everything", sub: 'Every title matching these filters is already marked seen.' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Status controls
// ---------------------------------------------------------------------------

function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg>;
}

function BookmarkIcon({ filled }) {
  return <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4.2-6 4.2z"/></svg>;
}

// Toggles, not checkboxes — so <button aria-pressed> rather than <input>.
//
// `variant` is 'overlay' (icon-only, sits on a poster) or 'inline' (icon plus
// text label, for drawers and sheets where there is room).
function TitleStatusActions({ title, variant, className }) {
  const { statusOf, pendingOf, errorOf, toggleSeen, toggleWatchlist } = useCollection();
  const status = statusOf(title.id);
  const seen = status === 'seen';
  const listed = status === 'watchlist';
  const pending = pendingOf(title.id);
  const error = errorOf(title.id);
  const inline = variant === 'inline';

  // The desktop Card starts a drag on mousedown and then decides "was that a
  // click?" by comparing mousedown/click coordinates. Stopping only the click
  // would still leave the card being dragged out from under the pointer, so
  // both have to be swallowed. Touch is stopped too, because the spatial
  // viewport begins a pan from touchstart.
  const swallow = (e) => { e.stopPropagation(); };
  const act = (fn) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    fn(title.id);
  };

  const cls = [
    'tsa',
    inline ? 'inline' : 'overlay',
    pending ? 'pending' : '',
    error ? 'has-error' : '',
    className || '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} onMouseDown={swallow} onClick={swallow} onTouchStart={swallow}>
      <button
        type="button"
        className={`tsa-btn seen${seen ? ' on' : ''}`}
        aria-pressed={seen}
        aria-label={seen ? `Mark ${title.title} as not seen` : `Mark ${title.title} as seen`}
        title={seen ? 'Marked as seen' : 'Mark as seen'}
        onMouseDown={swallow}
        onClick={act(toggleSeen)}
      >
        <CheckIcon/>
        {inline && <span className="tsa-lab">{seen ? 'Seen' : 'Mark seen'}</span>}
      </button>
      <button
        type="button"
        className={`tsa-btn watch${listed ? ' on' : ''}`}
        aria-pressed={listed}
        aria-label={listed ? `Remove ${title.title} from watchlist` : `Add ${title.title} to watchlist`}
        title={listed ? 'On your watchlist' : 'Add to watchlist'}
        onMouseDown={swallow}
        onClick={act(toggleWatchlist)}
      >
        <BookmarkIcon filled={listed}/>
        {inline && <span className="tsa-lab">{listed ? 'On watchlist' : 'Watchlist'}</span>}
      </button>
      {pending && <span className="tsa-spin" aria-hidden="true"/>}
      {error && <span className="tsa-err" role="status">{error}</span>}
    </div>
  );
}

// Non-interactive marker. Used where the controls themselves are too small to
// hit (deep zoom on the spatial canvas) but the state still needs to read.
function SeenMarker({ seen }) {
  if (!seen) return null;
  return <span className="seen-marker" title="Seen" aria-hidden="true"><CheckIcon/></span>;
}

Object.assign(window, {
  CollectionProvider,
  useCollection,
  TitleStatusActions,
  SeenMarker,
  matchesCollection,
  collectionEmptyCopy,
  COLLECTION_OPTIONS,
  releasedCount,
  todayISO,
  TSA_MIN_SCALE,
});
