// The link-preview tags of one page (Notion V4 Tasks, "Share 3/3"). The build
// writes a copy of the built index.html for each title, character and guide
// with these tags changed and nothing else, so the app on that page behaves
// exactly as on the home page; middleware.ts serves the copy to a shared link.

export interface PreviewTags {
  title: string;
  description: string;
  /** Absolute: crawlers fetch it without reading anything else. */
  url: string;
  image: string;
  alt: string;
}

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Sets one <meta> tag's content, by property or name. Throws if the tag is
 *  missing, so a change to index.html can't silently break every preview. */
function setMeta(html: string, key: 'property' | 'name', id: string, value: string): string {
  const re = new RegExp(`(<meta ${key}="${id.replace(/[.:]/g, '\\$&')}" content=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`share-card: index.html has no <meta ${key}="${id}">`);
  return html.replace(re, (_, a: string, b: string) => a + attr(value) + b);
}

export function applyPreviewTags(html: string, t: PreviewTags): string {
  let out = html;
  out = setMeta(out, 'property', 'og:title', t.title);
  out = setMeta(out, 'property', 'og:description', t.description);
  out = setMeta(out, 'name', 'description', t.description);
  out = setMeta(out, 'property', 'og:url', t.url);
  out = setMeta(out, 'property', 'og:image', t.image);
  out = setMeta(out, 'property', 'og:image:type', 'image/png');
  out = setMeta(out, 'property', 'og:image:alt', t.alt);
  return out;
}
