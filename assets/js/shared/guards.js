/* ============================================================
   FEEDNOW — ROUTE GUARDS (Fixed with Admin Support)
   Enforces authentication & role-based route protection
   ============================================================ */

const Guards = {
  getAuthStatus() {
    const token = localStorage.getItem('feednow_token');
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('feednow_user'));
    } catch {}
    return { token, user };
  },

  /* Enforce authentication — redirect to login if unauthenticated */
  requireAuth() {
    const { token } = this.getAuthStatus();
    if (!token) {
      console.warn('[Guards] Unauthenticated access — redirecting to login');
      const inSub = window.location.pathname.includes('/pages/donor/') ||
                    window.location.pathname.includes('/pages/ngo/') ||
                    window.location.pathname.includes('/pages/admin/');
      const loginUrl = inSub ? '../login.html' : 'login.html';
      window.location.href = loginUrl;
      return false;
    }
    return true;
  },

  /* Enforce specific role: 'donor', 'ngo', or 'admin' */
  requireRole(role) {
    if (!this.requireAuth()) return false;

    const { user } = this.getAuthStatus();
    if (user && user.role !== role) {
      console.warn(`[Guards] Role mismatch: user is ${user.role}, required ${role}`);
      const inSub = window.location.pathname.includes('/pages/donor/') ||
                    window.location.pathname.includes('/pages/ngo/') ||
                    window.location.pathname.includes('/pages/admin/');
      
      if (user.role === 'admin') {
        window.location.href = inSub ? '../admin/dashboard.html' : 'admin/dashboard.html';
      } else if (user.role === 'donor') {
        window.location.href = inSub ? '../donor/dashboard.html' : 'donor/dashboard.html';
      } else if (user.role === 'ngo') {
        window.location.href = inSub ? '../ngo/dashboard.html' : 'ngo/dashboard.html';
      }
      return false;
    }
    return true;
  },

  /* Redirect to appropriate dashboard if already logged in (used on login & signup pages) */
  redirectIfLoggedIn() {
    const { token, user } = this.getAuthStatus();
    if (token && user) {
      if (user.role === 'admin') {
        window.location.href = 'admin/dashboard.html';
      } else if (user.role === 'donor') {
        window.location.href = 'donor/dashboard.html';
      } else if (user.role === 'ngo') {
        window.location.href = 'ngo/dashboard.html';
      }
    }
  },
};

window.Guards = Guards;
