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
// Order matters and matches the order index.html used:
import './config.js';          // window.MCU_CONFIG, read by supabase-client
import './supabase-client.js'; // window.mcuSupabase, window.MCU_SUPABASE_STATUS
import './data/data.js';       // window.TITLES, CHARACTERS, BUDGETS, ratings, credits
import './data/guides.js';     // window.GUIDES, window.CONTINUITY
import './data/media-data.js'; // window.MEDIA, window.mediaURL
