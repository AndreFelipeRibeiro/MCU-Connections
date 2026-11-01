// Runs the catalog in Node and hands back what it publishes.
//
// Three checks (test-nextup, test-pickperson, test-refocus) build their
// expectations from the same source the app loads, rather than from a copy
// that can drift. They used to read src/data/data.js and execute it directly;
// since the TypeScript conversion that file is src/data/data.ts and carries
// type annotations, which Node cannot execute, so it is transpiled first.
//
// TypeScript is already a pinned devDependency of the repository and resolves
// from here through the root node_modules, so this adds nothing to install.
const fs = require('fs');
const path = require('path');

const DATA_TS = path.join(__dirname, '..', 'src', 'data', 'data.ts');

/** `window` after data.ts has run: TITLES, CHARACTERS, MCU_credit and the rest. */
function loadCatalog() {
  const ts = require('typescript');
  const src = fs.readFileSync(DATA_TS, 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    fileName: 'data.ts',
  }).outputText;
  // data.ts has a type-only import, which makes it a module, so TypeScript
  // emits the CommonJS `exports.__esModule` marker whatever the module
  // setting. The catalog itself publishes on `window` and exports nothing, so
  // a throwaway `exports` is all that marker needs.
  const win = {};
  new Function('window', 'exports', js)(win, {});
  return win;
}

module.exports = { loadCatalog, DATA_TS };
