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
    name: name || email || window.MCU_I18N.tr('account.signedIn'),
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
  const [offlineReason, setOfflineReason] = React.useState(null);
  const offlineRef = React.useRef(false);
  const attemptRef = React.useRef(0);
  const continueAsGuest = React.useCallback((reason) => {
    offlineRef.current = true;
    attemptRef.current += 1;
    setOfflineReason(reason || window.MCU_I18N.tr('error.connection'));
    setUser(null);
    setSyncAvailable(false);
    setStatus('signed_out');
  }, []);

  React.useEffect(() => {
    if (!client) return;
    let settled = false;
    let active = true;
    let sub;

    const oauthError = readOAuthError();
    if (oauthError) setError(oauthError);

    const settle = () => {
      settled = true;
      clearTimeout(timer);
    };
    const applySession = (session) => {
      if (offlineRef.current) return;
      attemptRef.current += 1;
      const nextUser = session && session.user;
      setUser(nextUser || null);
      setStatus(nextUser ? 'signed_in' : 'signed_out');
      setSyncAvailable(true);
      if (nextUser) setError(null);
      stripAuthParams();
    };
    const unavailable = () => {
      settle();
      continueAsGuest(window.MCU_I18N.tr('error.restore'));
    };
    const timer = setTimeout(() => {
      if (!active || settled) return;
      console.warn('[mcu] session restore timed out; running as guest');
      unavailable();
    }, AUTH_TIMEOUT_MS);

    try {
      // Subscribe first. An auth event is newer than the initial getSession
      // snapshot: cancel its timeout and ignore its eventual stale result.
      const res = client.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        if (!['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(event)) return;
        // A late initial snapshot must not overwrite a newer auth event or
        // the deliberate guest fallback after a timeout.
        if (event === 'INITIAL_SESSION' && settled) return;
        settle();
        applySession(event === 'SIGNED_OUT' ? null : session);
      });
      sub = res && res.data && res.data.subscription;

      Promise.resolve(client.auth.getSession()).then(({ data, error: err }) => {
        if (!active || settled) return;
        settle();
        if (err) { unavailable(); return; }
        applySession(data && data.session);
      }).catch(() => {
        if (active && !settled) unavailable();
      });
    } catch (e) {
      if (!settled) unavailable();
    }

    return () => {
      active = false;
      settle();
      if (sub) sub.unsubscribe();
    };
  }, [client, continueAsGuest]);

  // If the user starts Google sign-in and then backs out, they come back to a
  // page still sitting in 'signing_in'. Re-check on return so there is no
  // spinner stuck forever waiting for a redirect that is not coming.
  React.useEffect(() => {
    if (status !== 'signing_in' || !client) return;
    let active = true;
    let timer;
    const recheck = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(timer);
      const attempt = attemptRef.current;
      const finish = (session) => {
        if (!active || attemptRef.current !== attempt) return;
        clearTimeout(timer);
        setUser(session ? session.user : null);
        setStatus(session ? 'signed_in' : 'signed_out');
      };
      timer = setTimeout(() => finish(null), AUTH_TIMEOUT_MS);
      Promise.resolve(client.auth.getSession()).then(({ data }) => {
        finish(data && data.session);
      }).catch(() => finish(null));
    };
    window.addEventListener('pageshow', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener('pageshow', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, [status, client]);

  const signIn = React.useCallback(async () => {
    if (!client) return;
    setError(null);
    setStatus('signing_in');
    const attempt = ++attemptRef.current;
    const timer = setTimeout(() => {
      if (attemptRef.current !== attempt) return;
      attemptRef.current += 1;
      setError(window.MCU_I18N.tr('error.signIn'));
      setStatus('error');
    }, AUTH_TIMEOUT_MS);
    try {
      const redirectTo = window.location.origin + window.location.pathname;
      const { error: err } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, queryParams: { prompt: 'select_account' } },
      });
      if (err && attemptRef.current === attempt) { setError(err.message); setStatus('error'); }
    } catch (e) {
      if (attemptRef.current === attempt) {
        setError((e && e.message) || 'Sign-in failed');
        setStatus('error');
      }
    } finally {
      clearTimeout(timer);
    }
  }, [client]);

  const signOut = React.useCallback(async () => {
    if (!client) return;
    setError(null);
    try {
      const { error: err } = await client.auth.signOut({ scope: 'local' });
      if (err) throw err;
      setUser(null);
      setStatus('signed_out');
    } catch (e) {
      // The SDK may still have a persisted session on failure. Do not claim
      // sign-out succeeded or switch account data into guest mode.
      setError(window.MCU_I18N.tr('error.signOut'));
    }
  }, [client]);

  const value = React.useMemo(() => ({
    status,
    user,
    profile: profileOf(user),
    error,
    syncAvailable,
    continueAsGuest,
    unavailableReason: offlineReason || (window.MCU_SUPABASE_STATUS && window.MCU_SUPABASE_STATUS.reason) || null,
    isSignedIn: status === 'signed_in',
    signIn,
    signOut,
  }), [status, user, error, syncAvailable, offlineReason, continueAsGuest, signIn, signOut]);

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
function AccountPanel({ onPickCollection, onClose, onAbout }) {
  const { tr } = window.useI18n();
  const { status, profile, error, syncAvailable, unavailableReason, signIn, signOut } = useAccount();
  const { progress, loading: collectionLoading, syncError, retrySync } = window.useCollection();
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
            <div className="acct-name">{tr('account.notSignedIn')}</div>
            <div className="acct-email">
              {tr(syncAvailable ? 'account.savedSync' : 'account.savedNoSync')}
            </div>
          </div>
        </div>
      )}

      {collectionLoading ? <div className="acct-note" role="status">{tr(syncError ? 'account.collectionUnavailable' : 'account.loading')}</div> : (
      <div className="acct-stats">
        <div className="acct-stat">
          <b>{progress.seenReleased}</b>
          <span>{tr('account.seenStat', { total: progress.releasedTotal })}</span>
        </div>
        <div className="acct-stat">
          <b>{progress.watchlist}</b>
          <span>{tr('account.watchStat')}</span>
        </div>
      </div>

      )}

      <div className="acct-links">
        <button disabled={collectionLoading} onClick={pick('unseen')}><span className="coll-ic"><window.CollectionIcon kind="unseen"/></span>{tr('account.showUnseen')}</button>
        <button disabled={collectionLoading} onClick={pick('seen')}><span className="coll-ic"><window.CollectionIcon kind="seen"/></span>{tr('account.showSeen')}</button>
        <button disabled={collectionLoading} onClick={pick('watchlist')}><span className="coll-ic"><window.CollectionIcon kind="watchlist"/></span>{tr('account.showWatchlist')}</button>
      </div>

      {syncError && (
        <div className="acct-error" role="status">
          {tr('account.syncError', { error: syncError })}
          <button className="acct-action" onClick={retrySync}>{tr('account.retrySync')}</button>
        </div>
      )}

      {error && <div className="acct-error" role="status">{error}</div>}

      {!syncAvailable && (
        <div className="acct-note">
          {tr('account.unavailable', { reason: unavailableReason ? ` — ${unavailableReason}` : '' })}
          {window.mcuSupabase && <button className="acct-action" onClick={() => window.location.reload()}>{tr('account.retryConnection')}</button>}
        </div>
      )}

      {syncAvailable && (
        signedIn
          ? <button className="acct-action" onClick={signOut}>{tr('account.signOut')}</button>
          : (
            <button className="acct-action primary" onClick={signIn} disabled={status === 'initializing' || status === 'signing_in'}>
              <GoogleMark/>
              {tr(status === 'initializing' ? 'account.checking' : status === 'signing_in' ? 'account.opening' : 'account.signInGoogle')}
            </button>
          )
      )}

      {/* App-level links, for guests too. A future Settings entry joins About here. */}
      {onAbout && (
        <div className="acct-foot">
          <button className="acct-foot-link" onClick={() => { if (onClose) onClose(); onAbout(); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/></svg>
            {tr('about.link')}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop — a compact control at the right edge of tb-row
// ---------------------------------------------------------------------------

function AccountButton({ onPickCollection, onAbout }) {
  const { status, profile, syncAvailable } = useAccount();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  // Click-outside + Escape, matching the filters popover exactly.
  React.useEffect(() => {
    if (!open) return;
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector('.acct-pill')?.focus(); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const signedIn = status === 'signed_in';
  // Read the desktop label from the live profile. Keep email in the account
  // panel rather than using it as the compact navigation label.
  const { tr } = window.useI18n();
  const accountName = profile?.name && profile.name !== profile.email ? profile.name : tr('account.title');
  const visibleLabel = signedIn ? accountName
    : status === 'signing_in' ? tr('account.signingIn')
    : status === 'initializing' || !syncAvailable ? tr('account.title') : tr('account.signIn');
  const label = signedIn && profile
    ? tr('account.named', { name: profile.name })
    : tr(syncAvailable ? 'account.signInGoogle' : 'account.noSync');

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
        <span className="acct-nav-label">{visibleLabel}</span>
        {!syncAvailable && status !== 'initializing' && <span className="acct-off" aria-hidden="true"/>}
      </button>
      {open && (
        <div className="acct-pop">
          <AccountPanel onPickCollection={onPickCollection} onClose={() => setOpen(false)} onAbout={onAbout}/>
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
      aria-label={signedIn && profile ? window.MCU_I18N.tr('account.named', { name: profile.name }) : window.MCU_I18N.tr('account.title')}
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

function AccountSheet({ onClose, onPickCollection, onAbout }) {
  const Sheet = window.Sheet;
  return (
    <Sheet onClose={onClose} label={window.MCU_I18N.tr('account.title')}>
      <div className="m-sh-head">
        <div className="m-sh-title">{window.MCU_I18N.tr('account.title')}</div>
      </div>
      <AccountPanel onPickCollection={onPickCollection} onClose={onClose} onAbout={onAbout}/>
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
