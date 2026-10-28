// Feedback when someone marks a title seen or adds it to the watchlist (and,
// further down, the guest sign-in reminder):
// a toast with Undo (every time), and confetti for milestones (a whole phase,
// or every released title, newly completed). Status changes arrive through
// window.onStatusChange (tracking.jsx), which only fires for taps on the
// seen/watchlist buttons, never for sync or merges.
// Rendered into <body> so sheets and dialogs that make the app inert don't
// block its Undo button.

const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

// Newly completed milestone for a change to 'seen', judged on the states after
// the change: everything released ('all'), or everything released in the
// title's phase. Null when nothing was completed by this change.
function completedMilestone(e) {
  const released = window.MCU_isReleased;
  if (!released || !released(e.title)) return null;
  const all = (window.TITLES || []).filter(t => released(t));
  const seenAfter = t => (t.id === e.title.id ? 'seen' : e.states[t.id]) === 'seen';
  if (all.length && all.every(seenAfter)) return { kind: 'all' };
  const phase = all.filter(t => t.phase === e.title.phase);
  if (phase.length > 1 && phase.every(seenAfter)) return { kind: 'phase', phase: e.title.phase };
  return null;
}

// Lightweight confetti on a full-screen canvas that removes itself.
function burstConfetti() {
  if (reducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'mcu-confetti';
  canvas.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);
  const colors = Object.values(window.PHASE_COLORS || {}).concat(['#5fa856', '#d4a05a', '#ffffff']);
  const parts = [];
  [[0.25, -1], [0.75, 1]].forEach(([x, side]) => {
    for (let i = 0; i < 70; i++) {
      const a = (-90 + side * (8 + Math.random() * 30)) * Math.PI / 180;
      const v = 9 + Math.random() * 9;
      parts.push({ x: W * x, y: H + 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 1.35, w: 6 + Math.random() * 6, h: 4 + Math.random() * 6,
        r: Math.random() * 6, vr: (Math.random() - .5) * 0.4, c: colors[(Math.random() * colors.length) | 0] });
    }
  });
  const start = performance.now();
  const frame = (now) => {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    parts.forEach(p => {
      p.vy += 0.32; p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 1500) / 700);
      ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)) + 1);
      ctx.restore();
    });
    if (t < 2200) requestAnimationFrame(frame); else canvas.remove();
  };
  requestAnimationFrame(frame);
}

// Where the toast goes: clear of the desktop details drawer, above the phone
// sort bar and the character pill, or at the top while a phone sheet is open.
function toastPlacement(touch) {
  if (touch) {
    if (document.querySelector('.m-sheet')) return { top: 'calc(12px + env(safe-area-inset-top, 0px))' };
    let edge = window.innerHeight;
    ['.m-sort-footer', '.char-pill'].forEach(sel => {
      const el = document.querySelector(sel);
      if (el && el.getClientRects().length) edge = Math.min(edge, el.getBoundingClientRect().top);
    });
    return { bottom: (window.innerHeight - edge + 10) + 'px' };
  }
  const drawer = document.querySelector('.drawer.open');
  const right = drawer ? drawer.getBoundingClientRect().width : 0;
  return { bottom: '24px', left: ((window.innerWidth - right) / 2) + 'px' };
}

function StatusToast({ touch }) {
  const { setStatus } = window.useCollection();
  const { tr } = window.useI18n();
  const [toast, setToast] = React.useState(null);
  const timer = React.useRef(null);

  React.useEffect(() => window.onStatusChange((e) => {
    // Removals only update the counters.
    if (e.to === 'none') return;
    const milestone = e.to === 'seen' ? completedMilestone(e) : null;
    if (milestone) burstConfetti();
    setToast({ key: Date.now(), ...e, milestone, place: toastPlacement(touch) });
  }), [touch]);

  const life = toast && toast.milestone ? 6500 : 4500;
  const arm = React.useCallback((ms) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), ms);
  }, []);
  React.useEffect(() => {
    if (!toast) return undefined;
    arm(life);
    return () => clearTimeout(timer.current);
  }, [toast, life, arm]);

  const undo = () => {
    if (!toast) return;
    setStatus(toast.title.id, toast.from);
    setToast(null);
  };

  let body = null;
  if (toast) {
    const I = window.MCU_I18N;
    const m = toast.milestone;
    const head = m ? tr(m.kind === 'all' ? 'toast.allDone' : 'toast.phaseDone', { n: m.phase }) : I.titleName(toast.title);
    const sub = m ? tr(m.kind === 'all' ? 'toast.allDoneSub' : 'toast.phaseDoneSub', { n: m.phase })
      : tr(toast.to === 'seen' ? 'toast.seen' : 'toast.watch');
    body = (
      <div key={toast.key} className={`mcu-toast ${toast.to}${m ? ' milestone' : ''}${touch ? ' touch' : ''}`}
        style={toast.place} onMouseEnter={() => clearTimeout(timer.current)} onMouseLeave={() => arm(2500)}
        onFocus={() => clearTimeout(timer.current)} onBlur={() => arm(2500)}>
        <span className="mt-ic" aria-hidden="true">
          {m ? '★' : toast.to === 'seen' ? <window.CheckIcon/> : <window.BookmarkIcon filled/>}
        </span>
        <span className="mt-text"><b>{head}</b><span>{sub}</span></span>
        <button className="mt-undo" onClick={undo}>{tr('toast.undo')}</button>
        <button className="mt-x" onClick={() => setToast(null)} aria-label={tr('toast.dismiss')} title={tr('toast.dismiss')}>×</button>
      </div>
    );
  }
  return ReactDOM.createPortal(<div className="mcu-toast-live" role="status" aria-live="polite">{body}</div>, document.body);
}

// Sign-in reminder: a guest who has marked a few titles (seen or watchlist) is
// reminded that signing in saves them to an account and syncs them across
// devices. Shown right after the tap that reaches 3 marks, and once more at 10;
// either dismissal counts, and it never shows again after the second. Only
// when Google sign-in is available and the visitor is signed out.
const NUDGE_KEY = 'mcu.signInNudge.v1';
const NUDGE_AT = [3, 10];
function nudgeStage() {
  try { return Number(window.localStorage.getItem(NUDGE_KEY)) || 0; } catch (e) { return NUDGE_AT.length; }
}

function NudgeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4.5" width="13" height="9.5" rx="1.5"/><path d="M6 18h6M9 14v4"/>
      <rect x="16.5" y="8.5" width="5" height="11" rx="1.2"/><path d="M18.6 17.2h.8"/>
    </svg>
  );
}

function SignInNudge({ touch }) {
  const account = window.useAccount();
  const { tr } = window.useI18n();
  const accountRef = React.useRef(account);
  accountRef.current = account;
  const [pending, setPending] = React.useState(null);
  const [open, setOpen] = React.useState(null);
  // What is saved right now. The reminder waits before it shows, and the
  // toast's Undo puts the status back by calling setStatus directly, without
  // going through the status-change event, so the collection itself is the only
  // thing that can say whether the reminder is still warranted when it is due.
  const { states } = window.useCollection();
  const statesRef = React.useRef(states);
  statesRef.current = states;
  const markedNow = () => Object.values(statesRef.current || {}).filter(v => v && v !== 'none').length;

  React.useEffect(() => window.onStatusChange((e) => {
    if (e.to === 'none') return;
    // The event carries the marks as of this tap; the provider's state has not
    // re-rendered yet, so it cannot be used to decide the threshold here.
    const after = Object.assign({}, e.states, { [e.title.id]: e.to });
    const n = Object.values(after).filter(v => v && v !== 'none').length;
    const a = accountRef.current;
    if (a.status !== 'signed_out' || !a.syncAvailable) return;
    const stage = nudgeStage();
    if (stage >= NUDGE_AT.length) return;
    if (n < NUDGE_AT[stage]) return;
    // Remember it now, so a reload or a quick second tap doesn't repeat it.
    let next = stage;
    while (next < NUDGE_AT.length && n >= NUDGE_AT[next]) next += 1;
    try { window.localStorage.setItem(NUDGE_KEY, String(next)); } catch (err) { /* shown once this visit */ }
    setPending({ at: NUDGE_AT[stage], stage });
  }), []);

  // A moment after the tap, so the button's pop and the toast come first, and
  // only once no sheet, dialog or confetti is on screen.
  React.useEffect(() => {
    if (!pending) return undefined;
    let timer;
    const check = () => {
      if (document.querySelector('.m-sheet, .about-dialog, .mcu-confetti')) { timer = setTimeout(check, 700); return; }
      if (accountRef.current.status !== 'signed_out') { setPending(null); return; }
      // Undone back under the threshold during the wait: drop the reminder and
      // hand its stage back, rather than opening with a count that no longer
      // matches the collection.
      if (markedNow() < pending.at) {
        try { window.localStorage.setItem(NUDGE_KEY, String(pending.stage)); } catch (err) { /* stage stands for this visit */ }
        setPending(null);
        return;
      }
      setOpen({ n: markedNow() });
      setPending(null);
    };
    timer = setTimeout(check, 1400);
    return () => clearTimeout(timer);
  }, [pending]);

  if (!open) return null;
  const close = () => setOpen(null);
  const signIn = () => { setOpen(null); accountRef.current.signIn(); };
  const titleId = touch ? 'nudge-sheet-title' : 'nudge-title';
  const body = (
    <div className="about nudge">
      <div className="about-head">
        <span className="about-ic nudge-ic"><NudgeIcon/></span>
        <h2 id={titleId} className="about-title">{tr('nudge.title')}</h2>
      </div>
      <p className="about-lead">{tr('nudge.text', { n: open.n })}</p>
      <p className="nudge-note">{tr('nudge.merge')}</p>
      <div className="about-cta-row">
        <button className="about-cta" onClick={signIn}><window.GoogleMark/>{tr('account.signInGoogle')}</button>
        <button className="nudge-later" onClick={close}>{tr('nudge.later')}</button>
      </div>
    </div>
  );
  if (touch) return <window.Sheet onClose={close} label={tr('nudge.title')}>{body}</window.Sheet>;
  return <window.ModalDialog onClose={close} labelledBy={titleId} className="nudge-dialog">{body}</window.ModalDialog>;
}

Object.assign(window, { StatusToast, burstConfetti, SignInNudge });
