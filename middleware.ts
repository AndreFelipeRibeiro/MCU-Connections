// Link previews per shared link (Notion V4 Tasks, "Share 3/3").
//
// Chat apps and social networks read a link's preview from the page's tags
// without running scripts, so every /?title=… would show the app-wide card.
// The build writes, for each title, character and guide, a copy of the built
// index.html with that preview's tags (scripts/og-previews.js); this Vercel
// Routing Middleware serves the copy to a shared link. The copy differs from
// index.html only in its <meta> tags, so the app behaves exactly as on the
// home page.
//
// Scope, deliberately narrow:
//   - only the home page (`matcher`), and only with ?title=, ?guide= or ?char=
//     holding a well-formed id; every other request passes through untouched;
//   - an id with no preview (unknown, removed, misspelt) passes through too,
//     and gets index.html with the app-wide card, never an error page.
// Configured here and in vercel.json only: dashboard settings apply to every
// branch, including main (docs/V4-PLAN.md).

export const config = { matcher: '/' };

// The project's own *.vercel.app production address, kept by Vercel through
// the project rename (red-thread.vercel.app belongs to someone else), sends
// visitors to the public one. vercel.json redirects every path on it; this
// covers the home page again in case Vercel runs middleware first, so a shared
// /?title=… link on the old address still lands on redthread.tv.
const PUBLIC = 'https://redthread.tv';
const OLD_HOSTS = ['mcu-connections.vercel.app'];

// In the order the app gives them precedence: a title link may also pin a
// character, and then it is the title that was shared.
const KINDS = ['title', 'guide', 'char'] as const;
const ID = /^[a-z0-9-]{1,80}$/;

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (OLD_HOSTS.includes(url.hostname)) return Response.redirect(PUBLIC + url.pathname + url.search, 308);
  for (const kind of KINDS) {
    const id = url.searchParams.get(kind);
    if (id === null) continue;
    if (!ID.test(id)) return undefined;
    const page = await fetch(new URL(`/og/${kind}/${id}.html`, url.origin));
    if (!page.ok) return undefined;
    return new Response(page.body, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        // As for index.html: always revalidated, so a new deploy shows at once.
        'cache-control': 'public, max-age=0, must-revalidate',
      },
    });
  }
  return undefined;
}
