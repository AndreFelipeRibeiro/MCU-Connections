// About MCU Connections: what the app is, ways to explore it, and credits
// (TMDB requires its logo and notice in an About or Credits section).
// Desktop shows it as a centred dialog; phones reuse the bottom Sheet.
// Opened from the account menu/sheet footer, which is also where a future
// Settings entry will live. First-time visitors see it once as a welcome.

// Welcome: shown once per browser to visitors with no history here (no saved
// preferences, language, collection or sign-in). Decided when this file loads,
// before the app writes anything. "?welcome" in the address forces it, for
// testing (an incognito window also counts as a first visit).
const WELCOME_KEY = 'mcu.welcome.v1';
const RETURNING_KEYS = ['mcu.prefs.v1', 'mcu.lang.v1', 'mcu.collection.v1', 'mcu.auth.v1'];
function decideWelcome() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('welcome')) {
      url.searchParams.delete('welcome');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      return true;
    }
    const ls = window.localStorage;
    if (ls.getItem(WELCOME_KEY)) return false;
    const returning = RETURNING_KEYS.some(k => ls.getItem(k) !== null);
    ls.setItem(WELCOME_KEY, returning ? 'returning' : 'shown');
    return !returning;
  } catch (e) {
    // No storage: it couldn't be remembered, so don't show it on every visit.
    return false;
  }
}
window.MCU_WELCOME = decideWelcome();

function AboutIcon({ kind }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' };
  if (kind === 'connect') return (
    <svg {...common}><circle cx="6" cy="7" r="2.5"/><circle cx="18" cy="7" r="2.5"/><circle cx="12" cy="17" r="2.5"/><path d="M8.2 8.3 10.6 15M15.8 8.3 13.4 15M8.5 7h7"/></svg>
  );
  if (kind === 'follow') return (
    <svg {...common}><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>
  );
  if (kind === 'order') return (
    <svg {...common}><path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5"/></svg>
  );
  return (
    <svg {...common}><path d="m5 12.5 4.2 4.2L19 7"/></svg>
  );
}

function AboutContent({ titleId, welcome, onClose }) {
  const tr = window.MCU_I18N.tr;
  const ways = [['connect', 'about.connect'], ['follow', 'about.follow'], ['order', 'about.order'], ['track', 'about.track']];
  return (
    <div className="about">
      <div className="about-head">
        <div className="brand-mark" aria-hidden="true"/>
        <div>
          <h2 id={titleId} className="about-title">{tr(welcome ? 'about.welcomeTitle' : 'about.title')}</h2>
          <div className="about-tag">{tr('about.tagline')}</div>
        </div>
      </div>
      <p className="about-lead">{tr('about.lead')}</p>
      <h3 className="about-h">{tr('about.waysTitle')}</h3>
      <ul className="about-ways">
        {ways.map(([icon, key]) => (
          <li key={key}>
            <span className="about-ic"><AboutIcon kind={icon}/></span>
            <span><b>{tr(key + '.title')}</b><span>{tr(key + '.text')}</span></span>
          </li>
        ))}
      </ul>
      <h3 className="about-h">{tr('about.creditsTitle')}</h3>
      <div className="about-credits">
        <p>{tr('about.tmdb')} {tr('about.tmdbNotice')}</p>
        <p>{tr('about.ratings')}</p>
        <p>{tr('about.fan')}</p>
      </div>
      {welcome && (
        <div className="about-cta-row">
          <button className="about-cta" onClick={onClose}>{tr('about.start')}</button>
        </div>
      )}
    </div>
  );
}

// Desktop dialog: scrim, focus kept inside, Escape or × closes, focus returns
// to whatever opened it.
function AboutDialog({ onClose, welcome }) {
  const tr = window.MCU_I18N.tr;
  const ref = React.useRef(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  const titleId = 'about-title';
  React.useEffect(() => {
    const box = ref.current;
    const opener = document.activeElement;
    const siblings = Array.from(box.parentElement.children).filter(el => el !== box && !el.classList.contains('about-scrim'));
    const previous = siblings.map(el => [el, el.inert]);
    previous.forEach(([el]) => { el.inert = true; });
    const focusable = () => Array.from(box.querySelectorAll('button, a[href], [tabindex="0"]')).filter(el => el.getClientRects().length);
    // Focus the dialog itself (announced by screen readers, no ring on a
    // control the visitor didn't choose); Tab moves into it.
    box.focus();
    const keys = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const items = focusable();
      const first = items[0] || box, last = items[items.length - 1] || box;
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keys);
    return () => {
      document.removeEventListener('keydown', keys);
      previous.forEach(([el, inert]) => { el.inert = inert; });
      // Opened from the account menu, which closed behind it: return to its button.
      const back = opener && opener !== document.body && opener.isConnected ? opener : document.querySelector('.acct-pill');
      if (back) back.focus();
    };
  }, []);
  return (
    <>
      <div className="about-scrim" onClick={onClose} aria-hidden="true"/>
      <div ref={ref} className="about-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <button className="about-x" onClick={onClose} aria-label={tr('details.close')} title={tr('details.close')}>×</button>
        <AboutContent titleId={titleId} welcome={welcome} onClose={onClose}/>
      </div>
    </>
  );
}

function AboutSheet({ onClose, welcome }) {
  const Sheet = window.Sheet;
  return (
    <Sheet onClose={onClose} tall label={window.MCU_I18N.tr(welcome ? 'about.welcomeTitle' : 'about.title')}>
      <AboutContent titleId="about-sheet-title" welcome={welcome} onClose={onClose}/>
    </Sheet>
  );
}

Object.assign(window, { AboutDialog, AboutSheet });
