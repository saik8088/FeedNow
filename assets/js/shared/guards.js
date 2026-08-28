/* ============================================================
   FEEDNOW — ROUTE GUARDS (Placeholder for Round 2)
   ============================================================ */

const Guards = {
  // Will check Supabase session in Round 2
  requireAuth() {
    // Placeholder — no-op in Round 1
    console.log('[Guards] Auth check — will enforce in Round 2');
  },

  requireRole(role) {
    console.log(`[Guards] Role check for ${role} — will enforce in Round 2`);
  },

  redirectIfLoggedIn() {
    console.log('[Guards] Redirect if logged in — will enforce in Round 2');
  },
};
