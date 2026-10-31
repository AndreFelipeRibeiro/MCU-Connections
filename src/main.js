// The app's bundled entry, introduced by Phase 2 step 2/3 of docs/V4-PLAN.md.
//
// These modules are imported for their side effects on purpose. Each one still
// publishes its data on `window` exactly as it did when index.html loaded it as
// a classic script, because every reader is still a `.jsx` file compiled by
// Babel in the browser. Changing the delivery (a bundle instead of five script
// tags) and the sharing mechanism (imports instead of globals) at the same time
// would be two changes at once, and the regression could not tell which one
// caused a failure. The exports come later, per file, as each reader converts.
//
// Those same `window` names are also what 15 of the QA checks read inside the
// page (docs/V4-PLAN.md §5.3): the documented test surface. It is deliberate
// and unconditional, not a leftover.
//
// i18n.js stays a classic script because the startup screen has to speak the
// visitor's language before the bundle arrives, and its useI18n() hook calls
// React.useSyncExternalStore as a global — which it got from the CDN UMD build
// until this commit. It runs at render time, long after this line.
import React from 'react';
window.React = React;

// Order matters and matches the order index.html used:
import './config.js';          // window.MCU_CONFIG, read by supabase-client
import './supabase-client.js'; // window.mcuSupabase, window.MCU_SUPABASE_STATUS
import './data/data.js';       // window.TITLES, CHARACTERS, BUDGETS, ratings, credits
import './data/guides.js';     // window.GUIDES, window.CONTINUITY
import './data/media-data.js'; // window.MEDIA, window.mediaURL

// The app itself: every view and component, in the order index.html loaded
// them as `text/babel` scripts. They are imported for their side effects for
// the same reason the data above is, and the comment at the top of this file
// applies unchanged — each file still publishes its components on `window`,
// and its readers still pick them up from there.
//
// All thirteen had to convert in one step rather than one at a time as
// docs/V4-PLAN.md §3.3 planned, because React cannot be split across the two
// loading paths: a component from the bundled copy calling a hook inside a
// tree rendered by the CDN UMD copy reads that copy's null dispatcher and
// throws. docs/V4-PLAN.md §5.7.
import './app/poster.jsx';
import './app/tracking.jsx';
import './app/celebrate.jsx';
import './app/account.jsx';
import './app/about.jsx';
import './app/search-suggest.jsx';
import './app/mobile.jsx';
import './app/desktop-list.jsx';
import './app/upnext.jsx';
import './app/watch.jsx';
import './app/guides-ui.jsx';
import './app/picker.jsx';
// Last, and it must stay last: this one mounts the app, so everything it
// renders has to be on `window` by the time it runs.
import './app/app.jsx';
