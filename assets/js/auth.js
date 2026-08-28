/* ============================================================
   FEEDNOW — AUTH MODULE (Placeholder for Round 2)
   ============================================================ */

const Auth = {
  // Will be replaced with real Supabase auth in Round 2
  currentUser: null,

  isLoggedIn() {
    return !!this.currentUser;
  },

  getRole() {
    return this.currentUser?.role || null;
  },

  login(email, password) {
    console.log('[Auth] Login attempt — will connect in Round 2');
    return Promise.resolve();
  },

  signup(data) {
    console.log('[Auth] Signup attempt — will connect in Round 2');
    return Promise.resolve();
  },

  logout() {
    this.currentUser = null;
    window.location.href = CONFIG.ROUTES.HOME;
  },
};
