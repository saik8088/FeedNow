/* ============================================================
   FEEDNOW — SUPABASE CLIENT (Placeholder)
   Will be initialized in Round 2 with real credentials
   ============================================================ */

// Placeholder — Supabase client will be set up in Round 2
let supabase = null;

function initSupabase() {
  if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
    // supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    console.log('[FeedNow] Supabase initialized');
  } else {
    console.warn('[FeedNow] Supabase credentials not configured. Running in demo mode.');
  }
}
