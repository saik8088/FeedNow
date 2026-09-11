/* ============================================================
   FEEDNOW — AUTH MODULE
   Connects to Node.js + Express + JWT Backend via API client
   ============================================================ */

const Auth = {
  get currentUser() {
    return (window.API && window.API.getUser()) || null;
  },

  isLoggedIn() {
    return window.API ? window.API.isAuthenticated() : !!localStorage.getItem('feednow_token');
  },

  getRole() {
    return window.API ? window.API.getUserRole() : null;
  },

  async login(email, password) {
    if (!window.API) throw new Error('API client not loaded');
    return window.API.auth.login({ email, password });
  },

  async signup(data) {
    if (!window.API) throw new Error('API client not loaded');
    return window.API.auth.signup(data);
  },

  logout() {
    if (window.API) {
      window.API.auth.logout();
    } else {
      localStorage.removeItem('feednow_token');
      localStorage.removeItem('feednow_user');
      window.location.href = '/index.html';
    }
  },
};

window.Auth = Auth;
