// Auth state machine, session provider and account surfaces.
//
// There is no router in this app and V3 does not add one: sign-in is a full
// redirect to Google that lands back on index.html, where supabase-js completes
// the code exchange itself (detectSessionInUrl). The account UI reuses the
// existing popover (desktop) and Sheet (mobile) idioms.

// If session restoration hasn't resolved by this point, stop waiting and run as
// a guest. Supabase pauses free-tier projects after about a week of inactivity,
// so an unreachable backend is an expected state, not an exceptional one.
const AUTH_TIMEOUT_MS = 5000;

const AccountContext = React.createContext(null);

// Removes the OAuth leftovers from the address bar once the exchange is done,
// so a reload isn't messy and the code isn't sitting in history.
function stripAuthParams() {
  try {
    const url = new URL(window.location.href);
    let changed = false;
    ['code', 'state', 'error', 'error_code', 'error_description'].forEach((k) => {
      if (url.searchParams.has(k)) { url.searchParams.delete(k); changed = true; }
    });
    if (url.hash && /access_token|refresh_token|error/.test(url.hash)) { url.hash = ''; changed = true; }
    if (changed) {
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }
  } catch (e) { /* a tidy URL is not worth a crash */ }
}

function readOAuthError() {
  try {
    const p = new URLSearchParams(window.location.search);
    return p.get('error_description') || p.get('error') || null;
  } catch (e) { return null; }
}

function profileOf(user) {
  if (!user) return null;
  const m = user.user_metadata || {};
  const name = m.full_name || m.name || m.preferred_username || null;
  const email = user.email || m.email || null;
  return {
    name: name || email || 'Signed in',
    email,
    avatar: m.avatar_url || m.picture || null,
    initials: (name || email || '?').trim().slice(0, 1).toUpperCase(),
  };
}

// States: initializing | signed_out | signing_in | signed_in | error
function AccountProvider({ children }) {
  const client = window.mcuSupabase;
  // With no client there is nothing to restore, so never show a loading state.
  const [status, setStatus] = React.useState(client ? 'initializing' : 'signed_out');
  const [user, setUser] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [syncAvailable, setSyncAvailable] = React.useState(!!client);

  React.useEffect(() => {
    if (!client) return;
    let settled = false;

    const oauthError = readOAuthError();
    if (oauthError) setError(oauthError);

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn('[mcu] session restore timed out after ' + AUTH_TIMEOUT_MS + 'ms; running as guest');
      setSyncAvailable(false);
      setStatus('signed_out');
    }, AUTH_TIMEOUT_MS);

    client.auth.getSession().then(({ data, error: err }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      stripAuthParams();
      if (err) { setSyncAvailable(false); setStatus('signed_out'); return; }
      if (data && data.session) { setUser(data.session.user); setStatus('signed_in'); }
      else setStatus('signed_out');
    }).catch((e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      console.warn('[mcu] could not reach Supabase; running as guest', e);
      setSyncAvailable(false);
      setStatus('signed_out');
    });

    const res = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session ? session.user : null);
        setStatus('signed_in');
        setError(null);
        stripAuthParams();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setStatus('signed_out');
      } else if (event === 'TOKEN_REFRESHED') {
        // A refresh that comes back without a session means the refresh token
        // is spent or revoked. That degrades to signed out; it is not a crash.
        if (session) setUser(session.user);
        else { setUser(null); setStatus('signed_out'); }
      }
    });
    const sub = res && res.data && res.data.subscription;

    return () => { clearTimeout(timer); if (sub) sub.unsubscribe(); };
  }, [client]);

  // If the user starts Google sign-in and then backs out, they come back to a
  // page still sitting in 'signing_in'. Re-check on return so there is no
  // spinner stuck forever waiting for a redirect that is not coming.
  React.useEffect(() => {
    if (status !== 'signing_in' || !client) return;
    const recheck = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { data } = await client.auth.getSession();
        if (!data || !data.session) setStatus('signed_out');
      } catch (e) { setStatus('signed_out'); }
    };
    window.addEventListener('pageshow', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.removeEventListener('pageshow', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, [status, client]);

  const signIn = React.useCallback(async () => {
    if (!client) return;
    setError(null);
    setStatus('signing_in');
    try {
      const redirectTo = window.location.origin + window.location.pathname;
      const { error: err } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (err) { setError(err.message); setStatus('signed_out'); }
    } catch (e) {
      setError((e && e.message) || 'Sign-in failed');
      setStatus('signed_out');
    }
  }, [client]);

  const signOut = React.useCallback(async () => {
    if (!client) return;
    try {
      await client.auth.signOut();
    } catch (e) {
      // The local session is dropped either way; a failed network round-trip
      // must not leave someone apparently still signed in.
      console.warn('[mcu] sign-out request failed; clearing local session anyway', e);
    }
    setUser(null);
    setStatus('signed_out');
  }, [client]);

  const value = React.useMemo(() => ({
    status,
    user,
    profile: profileOf(user),
    error,
    syncAvailable,
    unavailableReason: (window.MCU_SUPABASE_STATUS && window.MCU_SUPABASE_STATUS.reason) || null,
    isSignedIn: status === 'signed_in',
    signIn,
    signOut,
  }), [status, user, error, syncAvailable, signIn, signOut]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

function useAccount() {
  const ctx = React.useContext(AccountContext);
  if (!ctx) throw new Error('useAccount() used outside <AccountProvider>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function Avatar({ profile, size }) {
  const px = size || 28;
  const style = { width: px + 'px', height: px + 'px' };
  if (profile && profile.avatar) {
    return <img className="acct-avatar" style={style} src={profile.avatar} alt="" referrerPolicy="no-referrer"/>;
  }
  return <span className="acct-avatar fallback" style={style} aria-hidden="true">{profile ? profile.initials : '?'}</span>;
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true">
      <path fill="#4285F4" d="M17.6 9.2c0-.6-.05-1.2-.16-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/>
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z"/>
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/>
    </svg>
  );
}

// The body shared by the desktop popover and the mobile sheet, so the two can
// never drift apart in what they say about the same account.
function AccountPanel({ onPickCollection, onClose }) {
  const { status, profile, error, syncAvailable, unavailableReason, signIn, signOut } = useAccount();
  const { progress } = window.useCollection();
  const signedIn = status === 'signed_in';

  const pick = (v) => () => { if (onPickCollection) onPickCollection(v); if (onClose) onClose(); };

  return (
    <div className="acct-panel">
      {signedIn && profile ? (
        <div className="acct-id">
          <Avatar profile={profile} size={40}/>
          <div className="acct-id-text">
            <div className="acct-name">{profile.name}</div>
            {profile.email && <div className="acct-email">{profile.email}</div>}
          </div>
        </div>
      ) : (
        <div className="acct-id guest">
          <div className="acct-id-text">
            <div className="acct-name">Not signed in</div>
            <div className="acct-email">
              {syncAvailable
                ? 'Saved on this device. Sign in to sync.'
                : 'Saved on this device. Sync unavailable.'}
            </div>
          </div>
        </div>
      )}

      <div className="acct-stats">
        <div className="acct-stat">
          <b>{progress.seenReleased}</b>
          <span>of {progress.releasedTotal} released seen</span>
        </div>
        <div className="acct-stat">
          <b>{progress.watchlist}</b>
          <span>on watchlist</span>
        </div>
      </div>

      <div className="acct-links">
        <button onClick={pick('unseen')}>Show unseen</button>
        <button onClick={pick('seen')}>Show seen</button>
        <button onClick={pick('watchlist')}>Show watchlist</button>
      </div>

      {error && <div className="acct-error" role="status">{error}</div>}

      {!syncAvailable && (
        <div className="acct-note">
          Sync unavailable{unavailableReason ? ` — ${unavailableReason}` : ''}. Your collection is
          still saved in this browser.
        </div>
      )}

      {syncAvailable && (
        signedIn
          ? <button className="acct-action" onClick={signOut}>Sign out</button>
          : (
            <button className="acct-action primary" onClick={signIn} disabled={status === 'signing_in'}>
              <GoogleMark/>
              {status === 'signing_in' ? 'Opening Google…' : 'Sign in with Google'}
            </button>
          )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop — a compact control at the right edge of tb-row
// ---------------------------------------------------------------------------

function AccountButton({ onPickCollection }) {
  const { status, profile, syncAvailable } = useAccount();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  // Click-outside + Escape, matching the filters popover exactly.
  React.useEffect(() => {
    if (!open) return;
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const signedIn = status === 'signed_in';
  // Icon-only, always. tb-row was already full before V3 and a text label here
  // squeezed the search box to ~30px and pushed this button off-screen between
  // 1361px and 1455px. The meaning lives in aria-label and the tooltip, and the
  // mobile shell uses the same person-icon affordance.
  const label = signedIn && profile
    ? `Account — ${profile.name}`
    : (syncAvailable ? 'Sign in with Google' : 'Account — sync unavailable');

  return (
    <div className="acct-wrap" ref={ref}>
      <button
        className={`acct-pill${open ? ' open' : ''}${signedIn ? ' signed-in' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={label}
        title={label}
      >
        {status === 'initializing'
          ? <span className="acct-dot loading" aria-hidden="true"/>
          : signedIn
            ? <Avatar profile={profile} size={26}/>
            : <PersonIcon/>}
        {!syncAvailable && status !== 'initializing' && <span className="acct-off" aria-hidden="true"/>}
      </button>
      {open && (
        <div className="acct-pop">
          <AccountPanel onPickCollection={onPickCollection} onClose={() => setOpen(false)}/>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile — avatar in the app bar, panel in a Sheet
// ---------------------------------------------------------------------------

function AccountAvatarButton({ onOpen }) {
  const { status, profile, syncAvailable } = useAccount();
  const signedIn = status === 'signed_in';
  return (
    <button
      className={`m-acct${signedIn ? ' signed-in' : ''}`}
      onClick={onOpen}
      aria-label={signedIn && profile ? `Account — ${profile.name}` : 'Account'}
    >
      {status === 'initializing'
        ? <span className="acct-dot loading" aria-hidden="true"/>
        : signedIn
          ? <Avatar profile={profile} size={30}/>
          : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>}
      {!syncAvailable && <span className="m-acct-off" aria-hidden="true"/>}
    </button>
  );
}

function AccountSheet({ onClose, onPickCollection }) {
  const Sheet = window.Sheet;
  return (
    <Sheet onClose={onClose}>
      <div className="m-sh-head">
        <div className="m-sh-title">Account</div>
      </div>
      <AccountPanel onPickCollection={onPickCollection} onClose={onClose}/>
    </Sheet>
  );
}

Object.assign(window, {
  AccountProvider,
  useAccount,
  AccountButton,
  AccountAvatarButton,
  AccountSheet,
  AccountPanel,
  MCU_AUTH_CONTEXT: AccountContext,
});
