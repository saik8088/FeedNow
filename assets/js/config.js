/* ============================================================
   FEEDNOW — CONFIGURATION
   Supabase + environment settings
   ============================================================ */

const CONFIG = {
  // Supabase — Replace with your actual credentials
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  // App settings
  APP_NAME: 'FeedNow',
  APP_TAGLINE: 'Right Food. Right Place. Right Time.',

  // Location defaults
  DEFAULT_RADIUS_KM: 20,
  MAX_RADIUS_KM: 50,

  // Matching weights (must sum to 1.0)
  MATCH_WEIGHTS: {
    distance: 0.40,
    availability: 0.30,
    capacity: 0.20,
    foodType: 0.10,
  },

  // Routes
  ROUTES: {
    HOME: '/index.html',
    LOGIN: '/pages/login.html',
    SIGNUP: '/pages/signup.html',

    DONOR_DASHBOARD: '/pages/donor/dashboard.html',
    DONOR_NEARBY_NGOS: '/pages/donor/nearby-ngos.html',
    DONOR_NGO_DETAILS: '/pages/donor/ngo-details.html',
    DONOR_CREATE_DONATION: '/pages/donor/create-donation.html',
    DONOR_DONATIONS: '/pages/donor/donations.html',
    DONOR_DONATION_DETAILS: '/pages/donor/donation-details.html',
    DONOR_NOTIFICATIONS: '/pages/donor/notifications.html',
    DONOR_PROFILE: '/pages/donor/profile.html',

    NGO_DASHBOARD: '/pages/ngo/dashboard.html',
    NGO_REQUESTS: '/pages/ngo/requests.html',
    NGO_REQUEST_DETAILS: '/pages/ngo/request-details.html',
    NGO_NOTIFICATIONS: '/pages/ngo/notifications.html',
    NGO_PROFILE: '/pages/ngo/profile.html',
  },

  // Donation statuses
  DONATION_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    PICKUP_SCHEDULED: 'pickup_scheduled',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Food types
  FOOD_TYPES: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Other'],

  // Quantity units
  QUANTITY_UNITS: ['Meals', 'Plates', 'Packs', 'Kilograms', 'Other'],

  // Collection methods
  COLLECTION_METHODS: ['NGO Will Pick Up', 'Donor Will Deliver'],

  // Decline reasons
  DECLINE_REASONS: [
    'Capacity Full',
    'Food Type Not Accepted',
    'Too Far',
    'Pickup Not Possible',
    'Other',
  ],
};

// Freeze to prevent accidental modification
Object.freeze(CONFIG);
Object.freeze(CONFIG.ROUTES);
Object.freeze(CONFIG.MATCH_WEIGHTS);
Object.freeze(CONFIG.DONATION_STATUS);
