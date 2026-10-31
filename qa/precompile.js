// Loaded with `node --require ./qa/precompile.js` (regress.sh and quick.sh set
// it through NODE_OPTIONS). Every check starts its own little web server for
// the app; this wraps those servers so they hand the browser the app's .jsx
// files already compiled, instead of Babel compiling all of them in the page
// on every load.
//
// - The same pinned Babel (qa/vendor, 7.29.0) and the same settings Babel
//   standalone uses for <script type="text/babel"> (presets react + env and
//   its three default plugins), so the code that runs is the same.
// - index.html is served with those script tags turned into plain scripts,
//   in the same order.
// - Compiled files are cached in qa/.cache by file name, size and date, so a
//   whole run compiles each file once.
// - test-boot and perf2 run without this hook: they keep the real in-browser
//   Babel path, so production's way of loading is still checked every batch.
// Development-only, like everything in qa/; nothing in the app loads it.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const QA = __dirname;
const CACHE = path.join(QA, '.cache');
let babel = null;
const loadBabel = () => babel || (babel = require(path.join(QA, 'vendor', 'x-babel-standalone-7.29.0', 'package', 'babel.min.js')));
// Babel standalone's defaults for text/babel script tags (babel.min.js).
const OPTIONS = {
  presets: ['react', 'env'],
  plugins: ['transform-class-properties', 'transform-object-rest-spread', 'transform-flow-strip-types'],
  sourceMaps: false,
};

function siteRoot() {
  return process.env.SITE ? path.join(QA, process.env.SITE) : path.join(QA, '..');
}

function compiled(file) {
  const st = fs.statSync(file);
  const key = crypto.createHash('sha1').update(file + ':' + st.size + ':' + st.mtimeMs).digest('hex');
  const cached = path.join(CACHE, key + '.js');
  try { return fs.readFileSync(cached, 'utf8'); } catch (e) { /* not cached yet */ }
  const name = path.basename(file);
  const code = loadBabel().transform(fs.readFileSync(file, 'utf8'), { ...OPTIONS, filename: name }).code;
  try { fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(cached + '.tmp' + process.pid, code); fs.renameSync(cached + '.tmp' + process.pid, cached); } catch (e) { /* cache is optional */ }
  return code;
}

// The page as served: Babel script tags become plain scripts, same order.
//
// `defer` matters. In the real page Babel fetches and runs these after
// DOMContentLoaded, which is after any module script. Rewritten to plain
// classic scripts they would instead run during parsing, i.e. BEFORE the
// bundle, and the app would read globals the bundle has not set yet. Deferred
// scripts and module scripts share one queue in document order, so `defer`
// keeps the real order: bundle first, then these.
function rewriteIndex(html) {
  return html.replace(/<script type="text\/babel" src="([^"]+\.jsx)"><\/script>/g, '<script defer src="$1"></script>');
}

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.map': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain',
  '.sql': 'text/plain',
};

const original = http.createServer;
http.createServer = function (...args) {
  const handler = args.find(a => typeof a === 'function');
  if (!handler) return original.apply(this, args);
  const wrapped = (req, res) => {
    try {
      let p = decodeURIComponent((req.url || '/').split('?')[0]);
      if (p === '/') p = '/index.html';
      const root = siteRoot();
      const file = path.join(root, p);
      if (file.startsWith(root) && fs.existsSync(file)) {
        if (p.endsWith('.jsx')) {
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          return res.end(compiled(file));
        }
        if (p === '/index.html') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          return res.end(rewriteIndex(fs.readFileSync(file, 'utf8')));
        }
        // With SITE set the checks are pointed at a different tree (the built
        // site, qa/README.md), so everything has to come from there, not just
        // the two kinds above. Without SITE nothing changes: each check's own
        // server keeps serving the working tree exactly as before.
        if (process.env.SITE && fs.statSync(file).isFile()) {
          res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
          return res.end(fs.readFileSync(file));
        }
      }
    } catch (e) {
      // Fall through to the check's own handler (and Babel in the page).
      process.stderr.write('qa/precompile: ' + e.message + '\n');
    }
    return handler(req, res);
  };
  return original.apply(this, args.map(a => (a === handler ? wrapped : a)));
};
