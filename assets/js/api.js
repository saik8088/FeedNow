/* ============================================================
   FEEDNOW — API CLIENT
   Centralized API module for connecting Frontend to Node/Express Backend
   ============================================================ */

const API = {
  BASE_URL: (typeof window !== 'undefined' && localStorage.getItem('feednow_api_url')) || (
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'))
      ? 'http://localhost:5000/api'
      : '/api'
  ),

  /* ── Token & Session Management ── */
  getToken() {
    return localStorage.getItem('feednow_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('feednow_token', token);
    } else {
      localStorage.removeItem('feednow_token');
    }
  },

  getUser() {
    try {
      const u = localStorage.getItem('feednow_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('feednow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('feednow_user');
    }
  },

  clearSession() {
    localStorage.removeItem('feednow_token');
    localStorage.removeItem('feednow_user');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  getUserRole() {
    const u = this.getUser();
    return u ? u.role : null;
  },

  /* ── Core Fetch Wrapper ── */
  async request(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // If unauthorized and not already on auth page, can handle session expiry
        if (res.status === 401 && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
          this.clearSession();
        }
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
      throw err;
    }
  },

  /* ── Auth API ── */
  auth: {
    async signup(payload) {
      const data = await API.request('/auth/signup', {
        method: 'POST',
        body: payload,
      });
      if (data.token && data.user) {
        API.setToken(data.token);
        API.setUser(data.user);
      }
      return data;
    },

    async login(payload) {
      const data = await API.request('/auth/login', {
        method: 'POST',
        body: payload,
      });
      if (data.token && data.user) {
        API.setToken(data.token);
        API.setUser(data.user);
      }
      return data;
    },

    async getMe() {
      const data = await API.request('/auth/me');
      if (data.user) {
        API.setUser(data.user);
      }
      return data;
    },

    logout() {
      API.clearSession();
      // Redirect to home
      const inPages = window.location.pathname.includes('/pages/');
      const inSub = window.location.pathname.includes('/pages/donor/') || window.location.pathname.includes('/pages/ngo/');
      const target = inSub ? '../../index.html' : (inPages ? '../index.html' : 'index.html');
      window.location.href = target;
    },
  },

  /* ── NGO API ── */
  ngos: {
    getAll() {
      return API.request('/ngos');
    },

    getNearby(lat, lon, radius = 20) {
      return API.request(`/ngos/nearby?latitude=${lat}&longitude=${lon}&radius=${radius}`);
    },

    getById(id) {
      return API.request(`/ngos/${id}`);
    },

    getMyProfile() {
      return API.request('/ngos/profile');
    },

    updateMyProfile(payload) {
      return API.request('/ngos/profile', {
        method: 'PUT',
        body: payload,
      });
    },
  },

  /* ── Donations API ── */
  donations: {
    create(payload) {
      return API.request('/donations', {
        method: 'POST',
        body: payload,
      });
    },

    getMy() {
      return API.request('/donations/my');
    },

    getReceived() {
      return API.request('/donations/received');
    },

    getById(id) {
      return API.request(`/donations/${id}`);
    },

    match(id) {
      return API.request(`/donations/${id}/match`, {
        method: 'POST',
      });
    },

    update(id, payload) {
      return API.request(`/donations/${id}`, {
        method: 'PATCH',
        body: payload,
      });
    },

    updateStatus(id, status) {
      return API.request(`/donations/${id}/status`, {
        method: 'PATCH',
        body: { status },
      });
    },
  },

  /* ── Rescue Requests API ── */
  rescueRequests: {
    getMy() {
      return API.request('/rescue-requests/my');
    },

    getById(id) {
      return API.request(`/rescue-requests/${id}`);
    },

    getByDonation(donationId) {
      return API.request(`/rescue-requests/donation/${donationId}`);
    },

    accept(id, payload = {}) {
      return API.request(`/rescue-requests/${id}/accept`, {
        method: 'PATCH',
        body: payload,
      });
    },

    reject(id, payload = {}) {
      return API.request(`/rescue-requests/${id}/reject`, {
        method: 'PATCH',
        body: payload,
      });
    },

    complete(id) {
      return API.request(`/rescue-requests/${id}/complete`, {
        method: 'PATCH',
      });
    },
  },

  /* ── Admin API ── */
  admin: {
    getStats() {
      return API.request('/admin/stats');
    },

    getUsers(role) {
      const q = role ? `?role=${role}` : '';
      return API.request(`/admin/users${q}`);
    },

    verifyUser(id, isVerified) {
      return API.request(`/admin/users/${id}/verify`, {
        method: 'PATCH',
        body: { isVerified },
      });
    },

    getDonations(status) {
      const q = status ? `?status=${status}` : '';
      return API.request(`/admin/donations${q}`);
    },

    getRescueRequests(status) {
      const q = status ? `?status=${status}` : '';
      return API.request(`/admin/rescue-requests${q}`);
    },
  },

  /* ── Notifications API ── */
  notifications: {
    getMy() {
      return API.request('/notifications');
    },

    markOneRead(id) {
      return API.request(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
    },

    markAllRead() {
      return API.request('/notifications/read-all', {
        method: 'PATCH',
      });
    },
  },

  /* ── Dashboard API ── */
  dashboard: {
    getDonor() {
      return API.request('/dashboard/donor');
    },

    getNgo() {
      return API.request('/dashboard/ngo');
    },
  },
};

// Global helper alias
window.API = API;
