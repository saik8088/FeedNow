/* ============================================================
   FEEDNOW — SHARED UTILITIES
   General purpose helper functions
   ============================================================ */

const Utils = {
  /* Get URL parameter */
  getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  /* Format date */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  },

  /* Format time */
  formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /* Format date and time */
  formatDateTime(dateStr) {
    return `${this.formatDate(dateStr)}, ${this.formatTime(dateStr)}`;
  },

  /* Debounce */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /* Simple email validation */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /* Simple phone validation */
  isValidPhone(phone) {
    return /^[+]?[\d\s-]{10,15}$/.test(phone);
  },

  /* Capitalize first letter */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /* Truncate text */
  truncate(str, len = 100) {
    if (str.length <= len) return str;
    return str.substring(0, len).trim() + '…';
  },

  /* Format status for display */
  formatStatus(status) {
    const map = {
      pending: 'Pending',
      accepted: 'Accepted',
      declined: 'Declined',
      pickup_scheduled: 'Pickup Scheduled',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return map[status] || Utils.capitalize(status);
  },

  /* Get status badge class */
  getStatusBadgeClass(status) {
    const map = {
      pending: 'badge--pending',
      accepted: 'badge--accepted',
      declined: 'badge--declined',
      pickup_scheduled: 'badge--pickup',
      completed: 'badge--completed',
      cancelled: 'badge--cancelled',
    };
    return map[status] || 'badge--info';
  },
};
