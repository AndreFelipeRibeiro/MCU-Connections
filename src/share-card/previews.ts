// What each link preview says (Notion V4 Tasks, "Share 3/3"): one entry per
// title, character and guide, plus the app-wide card, with the tag text
// (og:title, og:description, alt) and the image's layout. The build turns
// these into /og/… images and pages (vite.config.js); this file only reads the
// catalog and the locale tables it is given, so it stays plain data in, plain
// data out.
import type { Character, Guide, Title } from '../types/catalog';
import type { Art, ArtCard, PreviewInput } from './cards';
import type { CardColors } from './tokens';

type Plural = { one?: string; other: string };
export interface LocaleTables {
  strings: Record<string, string | Plural>;
  titles?: Record<string, string>;
  characters?: Record<string, string>;
  synopses?: Record<string, string>;
}

/** The app's tr() (i18n.js), for a build that has no page: plain strings
 *  with {placeholders}, or { one, other } chosen by n. English only. */
export function makeTr(loc: LocaleTables) {
  return (key: string, vars: Record<string, string | number> = {}): string => {
    let v = loc.strings[key];
    if (v === undefined) throw new Error('share-card: missing locale key ' + key);
    if (typeof v === 'object') v = (vars.n === 1 && v.one) || v.other;
    return String(v).replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] != null ? String(vars[k]) : m));
  };
}

export interface PreviewEntry {
  kind: 'default' | 'title' | 'char' | 'guide';
  id: string;
  /** og:title */
  title: string;
  /** og:description */
  description: string;
  /** og:image:alt */
  alt: string;
  input: PreviewInput;
}

export interface Catalog {
  titles: Title[];
  characters: Record<string, Character>;
  guides: Guide[];
}

const shorten = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…');

export function previewEntries(cat: Catalog, loc: LocaleTables, colors: CardColors, site: string): PreviewEntry[] {
  const tr = makeTr(loc);
  const app = tr('app.name');
  const titleName = (t: Title) => (loc.titles && loc.titles[t.id]) || t.title;
  const charName = (id: string) => (loc.characters && loc.characters[id]) || (cat.characters[id] ? cat.characters[id].name : id);
  const phase = (t: Title) => colors.phases[t.phase - 1] || colors.brand;
  const byRelease = [...cat.titles].sort((a, b) => (a.release < b.release ? -1 : a.release > b.release ? 1 : 0));
  const prime = (id: string) => (cat.characters[id] && cat.characters[id].prime) || id;
  const page = (name: string) => tr('og.pageTitle', { name, app });
  const out: PreviewEntry[] = [];

  // The app-wide card: a little network of cards in every phase's colour, tied
  // together by the brand's red thread (the app's name, drawn).
  out.push({
    kind: 'default', id: 'default',
    title: tr('og.defaultTitle', { app }),
    description: tr('og.defaultSub'),
    alt: tr('og.defaultAlt'),
    input: {
      appName: app, site, eyebrow: tr('about.tagline'), heading: tr('share.appText'), sub: tr('og.defaultSub'),
      art: { layout: 'hub', cards: [...colors.phases.map((c, i): ArtCard => ({ color: c, hi: i === 0 })), { color: colors.phases[2] }],
        lines: colors.phases.map(() => colors.brand) },
    },
  });

  // A title: it in the middle, the titles its characters connect it to around.
  for (const t of cat.titles) {
    const links = new Map<string, { t: Title; shared: string[] }>();
    for (const o of cat.titles) {
      if (o.id === t.id) continue;
      const shared = t.cast.filter((ch) => o.cast.some((x) => prime(x) === prime(ch)));
      if (shared.length) links.set(o.id, { t: o, shared });
    }
    const around = [...links.values()].sort((a, b) => b.shared.length - a.shared.length || (a.t.release < b.t.release ? -1 : 1)).slice(0, 6);
    const name = titleName(t);
    const n = links.size;
    const art: Art = {
      layout: 'hub',
      cards: [{ color: phase(t), hi: true }, ...around.map((l) => ({ color: phase(l.t) }))],
      lines: around.map((l) => (cat.characters[l.shared[0]] ? cat.characters[l.shared[0]].color : colors.brand)),
    };
    const kindWord = tr(t.type === 'film' ? 'type.film.one' : 'type.series.one');
    out.push({
      kind: 'title', id: t.id,
      title: page(`${name} (${t.year})`),
      description: shorten((loc.synopses && loc.synopses[t.id]) || tr('og.titleSub', { n }), 200),
      alt: tr('og.titleAlt', { title: name }),
      input: {
        appName: app, site, art,
        eyebrow: `${tr('phase.label', { n: t.phase })} · ${kindWord} · ${t.year}`, eyebrowColor: phase(t),
        heading: name, sub: tr('og.titleSub', { n }),
      },
    });
  }

  // A character: its identity's titles in release order, down one thread.
  for (const id of Object.keys(cat.characters)) {
    const c = cat.characters[id];
    const titles = byRelease.filter((t) => t.cast.some((x) => prime(x) === prime(id)));
    if (!titles.length) continue;
    const name = charName(id);
    const n = titles.length;
    const first = `${titleName(titles[0])} (${titles[0].year})`;
    out.push({
      kind: 'char', id,
      title: page(name),
      description: tr('og.charDesc', { name, n, first }),
      alt: tr('og.charAlt', { name }),
      input: {
        appName: app, site,
        // Character and guide colours can be too dark for text on the card: the
        // line above the name keeps the brand colour, the thread takes theirs.
        eyebrow: tr('og.charEyebrow', { actor: c.actor }),
        heading: name, sub: tr('og.charSub', { n, first }),
        art: { layout: 'chain', cards: titles.map((t) => ({ color: phase(t) })), lines: titles.map(() => c.color) },
      },
    });
  }

  // A guide: its essential stops in order.
  for (const g of cat.guides) {
    const ess = g.stops.filter((s) => s.weight === 'essential')
      .map((s) => cat.titles.find((t) => t.id === s.id)).filter((t): t is Title => !!t);
    const name = g.name.en;
    out.push({
      kind: 'guide', id: g.id,
      title: page(name),
      description: shorten(g.blurb.en, 200),
      alt: tr('og.guideAlt', { name }),
      input: {
        appName: app, site,
        eyebrow: `${tr('guide.kind.' + (g.group || 'stories'))} · ${tr('guide.stops', { n: ess.length })}`,
        heading: name, sub: shorten(g.blurb.en, 110),
        art: { layout: 'chain', cards: ess.map((t) => ({ color: phase(t) })), lines: ess.map(() => colors.brand) },
      },
    });
  }
  return out;
}
