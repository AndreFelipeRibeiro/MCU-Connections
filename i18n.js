// Language support (no build step). Each language is one file in locales/
// that registers itself on window.MCU_LOCALES; English (locales/en.js) is the
// complete base every other language falls back to, key by key. This runtime
// picks the visitor's language (saved choice, then the browser/phone language,
// then English), looks strings up with plural and {placeholder} support, and
// lets React components re-render when the language changes.
//
// To add a language: copy locales/pt-BR.js to locales/<code>.js, translate it,
// and add its <script> tag to index.html before this file. Missing keys fall
// back to English and are reported once in the console on localhost.
(function () {
  const LOCALES = window.MCU_LOCALES || (window.MCU_LOCALES = {});
  const BASE = 'en';
  const STORAGE_KEY = 'mcu.lang.v1';
  const DEV = ['localhost', '127.0.0.1', '[::1]', ''].indexOf(window.location.hostname) !== -1;
  const listeners = new Set();
  const warned = new Set();

  const codes = () => Object.keys(LOCALES);
  const meta = (code) => (LOCALES[code] && LOCALES[code].meta) || {};
  const tag = (code) => meta(code).htmlLang || code;

  // 'pt', 'pt-PT' or 'pt-BR' all map to the pt-BR catalog via meta.match.
  function matchTag(value) {
    if (!value) return null;
    const lower = String(value).toLowerCase();
    const exact = codes().find((c) => c.toLowerCase() === lower);
    if (exact) return exact;
    const primary = lower.split('-')[0];
    return codes().find((c) => (meta(c).match || [c.split('-')[0]])
      .some((m) => m.toLowerCase() === primary)) || null;
  }

  function stored() {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      return v && LOCALES[v] ? v : null;
    } catch (e) { return null; }
  }

  function detect() {
    const prefs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language];
    for (const p of prefs) { const m = matchTag(p); if (m) return m; }
    return BASE;
  }

  let lang = stored() || detect();
  if (!LOCALES[lang]) lang = BASE;

  function apply() {
    document.documentElement.lang = tag(lang);
  }

  function setLang(next) {
    if (!LOCALES[next] || next === lang) return;
    lang = next;
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* this visit only */ }
    apply();
    listeners.forEach((fn) => fn());
  }

  function warn(key, kind) {
    if (!DEV || warned.has(lang + ':' + key)) return;
    warned.add(lang + ':' + key);
    console.warn(`[mcu i18n] ${kind} "${key}" for ${lang}`);
  }

  function raw(code, key) {
    const s = LOCALES[code] && LOCALES[code].strings;
    return s ? s[key] : undefined;
  }

  // tr('header.count', { n: 64 }) — strings may be plain text with {name}
  // placeholders, or { one, other, ... } objects chosen by Intl.PluralRules on n.
  function tr(key, vars) {
    let v = raw(lang, key);
    if (v === undefined) {
      v = raw(BASE, key);
      if (v === undefined) { warn(key, 'unknown key'); return key; }
      if (lang !== BASE) warn(key, 'missing translation');
    }
    if (v && typeof v === 'object') {
      const n = vars && typeof vars.n === 'number' ? vars.n : 0;
      let form = 'other';
      try { form = new Intl.PluralRules(tag(lang)).select(n); } catch (e) { /* default */ }
      v = v[form] != null ? v[form] : v.other;
    }
    if (!vars) return v;
    return String(v).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  }

  const table = (code, name) => (LOCALES[code] && LOCALES[code][name]) || {};

  function titleName(title) {
    if (!title) return '';
    return table(lang, 'titles')[title.id] || title.title;
  }

  // Every known name for a title in every language, so search finds "Os
  // Vingadores" while browsing in English and "The Avengers" in Portuguese.
  function titleNames(title) {
    const names = [title.title];
    codes().forEach((c) => {
      const n = table(c, 'titles')[title.id];
      if (n) names.push(n);
      (table(c, 'titleAliases')[title.id] || []).forEach((a) => names.push(a));
    });
    return names;
  }

  function charName(id) {
    const c = window.CHARACTERS && window.CHARACTERS[id];
    return table(lang, 'characters')[id] || (c ? c.name : id);
  }

  function charNames(id) {
    const c = window.CHARACTERS && window.CHARACTERS[id];
    const names = c ? [c.name] : [];
    codes().forEach((code) => { const n = table(code, 'characters')[id]; if (n) names.push(n); });
    return names;
  }

  // data.js story labels are English ("Outside time", "1260 BC–1896").
  function storyLabel(story) {
    if (!story) return story;
    const words = table(lang, 'storyWords');
    return Object.keys(words).reduce((s, k) => s.split(k).join(words[k]), story);
  }

  function storyNote(title) {
    return table(lang, 'storyNotes')[title.id] || title.storyNote || null;
  }

  // Synopsis in the current language, falling back to English.
  function synopsis(title) {
    if (!title) return null;
    return table(lang, 'synopses')[title.id] || table('en', 'synopses')[title.id] || null;
  }

  function budget(millions) {
    const n = millions < 1 ? millions : Math.round(millions);
    return tr('budget.format', { n: n.toLocaleString(tag(lang)) });
  }

  const upper = (s) => String(s).toLocaleUpperCase(tag(lang));
  const compare = (a, b) => String(a).localeCompare(String(b), tag(lang));

  function languages() {
    return codes().map((code) => ({ code, name: meta(code).name || code, short: meta(code).short || code }));
  }

  const api = {
    get lang() { return lang; },
    setLang, tr, titleName, titleNames, charName, charNames, storyLabel, storyNote, synopsis,
    budget, upper, compare, languages, detect,
  };

  const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

  // Components call useI18n() to re-render when the language changes.
  function useI18n() {
    React.useSyncExternalStore(subscribe, () => lang);
    return api;
  }

  apply();
  window.MCU_I18N = api;
  window.useI18n = useI18n;
})();
