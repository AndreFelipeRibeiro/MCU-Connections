// Supabase connection settings.
//
// Both values below are PUBLIC BY DESIGN and are meant to be committed. The
// publishable ("anon") key is intended to ship in client code; what protects
// the data is Row Level Security, not secrecy of this key. See schema.sql.
//
// NEVER put any of these in this file, or anywhere else in the repo:
//   * the service_role key      (bypasses RLS entirely)
//   * the Google OAuth client secret  (lives only in the Supabase dashboard,
//     under Authentication -> Providers -> Google)
//   * any database password or connection string
//
// Leaving both values blank is a supported mode: the app falls back to guest
// mode, tracks to localStorage only, and shows "Sync unavailable" in the
// account menu. Nothing white-screens.
//
// Fill these in from Supabase -> Project Settings -> Data API:
//   supabaseUrl             -> "Project URL"
//   supabasePublishableKey  -> "Publishable key" (formerly "anon public")

window.MCU_CONFIG = {
  supabaseUrl: 'https://wauhmmftltlxzrcwpdvp.supabase.co',
  supabasePublishableKey: 'sb_publishable_OwIOrYejq0AXJbCaK2DN9A_0kojL_pi',
};
