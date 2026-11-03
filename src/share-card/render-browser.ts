// The share card, drawn on the visitor's device (Notion V4 Tasks, "Share
// 2/3"). Loaded only when someone opens it (src/app/share-image.tsx imports
// this lazily), so Satori and the fonts never weigh on the app's first load.
//
// The same templates as the build's link previews (cards.ts): Satori turns the
// layout into an SVG whose text is already outlines, so the browser draws it
// without needing the fonts, and a canvas turns it into a PNG.
// The standalone build, given its layout engine (yoga) explicitly: the default
// build looks for yoga.wasm beside itself, which a bundle doesn't have.
import satori, { init } from 'satori/standalone';
import yogaURL from 'satori/yoga.wasm?url';
import css from '../index.css?raw';
import logoSvg from '../assets/logo-mark.svg?raw';
import w400 from '@fontsource/inter/files/inter-latin-400-normal.woff?url';
import w600 from '@fontsource/inter/files/inter-latin-600-normal.woff?url';
import w700 from '@fontsource/inter/files/inter-latin-700-normal.woff?url';
import { CARD, guideDoneCard, logoMark, progressCard } from './cards';
import type { Fonts, GuideDoneInput, Node, ProgressInput } from './cards';
import { cardColors, readDarkTokens } from './tokens';

let fonts: Promise<Fonts[]> | null = null;
function loadFonts(): Promise<Fonts[]> {
  if (!fonts) {
    fonts = Promise.all(([[400, w400], [600, w600], [700, w700]] as const).map(async ([weight, url]) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error('share card: font ' + url + ' ' + r.status);
      return { name: 'Inter', data: await r.arrayBuffer(), weight, style: 'normal' as const };
    }));
    fonts.catch(() => { fonts = null; });
  }
  return fonts;
}

let ready: Promise<void> | null = null;
function loadYoga(): Promise<void> {
  if (!ready) {
    ready = fetch(yogaURL).then((r) => { if (!r.ok) throw new Error('share card: yoga ' + r.status); return r.arrayBuffer(); }).then((b) => init(b));
    ready.catch(() => { ready = null; });
  }
  return ready;
}

const colors = cardColors(readDarkTokens(css));
const logo = logoMark(logoSvg, colors.logo);

async function toPNG(node: Node): Promise<Blob> {
  const [loaded] = await Promise.all([loadFonts(), loadYoga()]);
  const svg = await satori(node as unknown as Parameters<typeof satori>[0], { ...CARD, fonts: loaded });
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = CARD.width;
    canvas.height = CARD.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('share card: no 2d canvas');
    ctx.drawImage(img, 0, 0, CARD.width, CARD.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('share card: empty image'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

export const renderProgress = (p: ProgressInput) => toPNG(progressCard(p, colors, logo));
export const renderGuideDone = (g: GuideDoneInput) => toPNG(guideDoneCard(g, colors, logo));
export { colors as cardPalette };
