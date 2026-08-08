// Creates the shared Supabase client as window.mcuSupabase, or sets it to null.
//
// This file must never throw. The catalog makes zero network calls at load and
// works offline, and V3 does not regress that: a blank config, a blocked CDN, a
// paused free-tier project or a malformed URL all have to degrade to guest mode
// rather than take the page down with them.
//
// window.MCU_SUPABASE_STATUS carries the reason so the account UI can say
// something more useful than "something went wrong".

(function () {
  function unavailable(reason) {
    window.mcuSupabase = null;
    window.MCU_SUPABASE_STATUS = { ok: false, reason: reason };
    // console.info, not error: running without a backend is a supported mode,
    // not a fault, and this file is loaded on every page view.
    console.info('[mcu] sync unavailable — ' + reason);
  }

  var cfg = window.MCU_CONFIG;

  if (!cfg || !cfg.supabaseUrl || !cfg.supabasePublishableKey) {
    unavailable('no Supabase project configured (config.js is blank)');
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    unavailable('supabase-js failed to load from the CDN');
    return;
  }

  try {
    window.mcuSupabase = window.supabase.createClient(
      cfg.supabaseUrl,
      cfg.supabasePublishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // On by default, but stated explicitly because the whole
          // no-callback-route sign-in flow depends on it: the user lands back
          // on index.html with a code in the URL and supabase-js completes the
          // exchange itself.
          detectSessionInUrl: true,
          flowType: 'pkce',
          // Namespaced so the auth session can be identified and cleared
          // independently of the collection keys.
          storageKey: 'mcu.auth.v1',
        },
      }
    );
    window.MCU_SUPABASE_STATUS = { ok: true };
  } catch (e) {
    unavailable('client init failed: ' + ((e && e.message) || e));
  }
})();
