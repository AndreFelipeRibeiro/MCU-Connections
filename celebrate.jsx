// Feedback when someone marks a title seen or adds it to the watchlist:
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

Object.assign(window, { StatusToast, burstConfetti });
