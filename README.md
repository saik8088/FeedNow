# 🍱 FEEDNOW — Food-Rescue Platform

> **Right Food. Right Place. Right Time.**  
> A full-stack food-rescue platform connecting surplus food donors with verified NGOs in real time to eliminate food waste and fight hunger.

---

## 🌟 Overview

FEEDNOW bridges the gap between food donors (restaurants, caterers, households, event organizers) and nearby NGOs/food banks. Instead of edible food ending up in landfills, donors can easily discover nearby organizations, dispatch donation requests with food shelf-life and urgency details, and coordinate seamless pickup and delivery.

### Complete Donation Lifecycle
```text
[Donor] Create Donation Request (PENDING)
                   │
                   ▼
       [NGO] Receives Notification & Request
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
     [ACCEPTED]          [DECLINED]
         │
         ▼
 [NGO / Donor] Coordinate Logistics (COORDINATED)
         │
         ▼
 [NGO] Food Received & Verified (COMPLETED)
```

---

## 🛠️ Technology Stack

FeedNow is built with a lightweight, decoupled full-stack architecture adhering strictly to modern standards without heavy ORMs or third-party cloud backends:

- **Frontend**:
  - **HTML5 & Vanilla CSS3**: Custom design system using CSS variables, responsive grid/flexbox layouts, cards, and micro-animations.
  - **Vanilla JavaScript (ES6+)**: Modular scripts, browser `fetch` API, JWT storage in `localStorage`.
  - **Zero Frontend Frameworks**: High performance, pure browser-native implementation.
- **Backend**:
  - **Node.js & Express.js**: RESTful API architecture with structured routes, controllers, and middleware.
  - **MongoDB & Mongoose**: Schemas for Users, NGO Profiles, Donations, and Notifications.
  - **Authentication**: Stateless JSON Web Tokens (`jsonwebtoken`) + password hashing via `bcryptjs`.
  - **Environment Configuration**: `dotenv` for secret isolation and configurable connection strings.
  - **Cross-Origin Resource Sharing**: `cors` middleware enabled for seamless local development.

---

## 📁 Project Structure

```text
FeedNow/
├── index.html                     # Landing page with dynamic authenticated navigation
├── assets/
│   ├── css/
│   │   ├── base.css               # Design tokens, typography, CSS resets
│   │   ├── components.css         # Buttons, badges, cards, modal dialogs, forms
│   │   └── pages/                 # Page-specific styling
│   └── js/
│       ├── api.js                 # Centralized API client & HTTP interceptor
│       ├── auth.js                # Auth helper bridge
│       └── shared/
│           ├── guards.js          # Route guards: requireAuth, requireRole, redirectIfLoggedIn
│           └── navbar.js          # Shared navbar logic
├── pages/
│   ├── login.html                 # Login page with role-based redirection
│   ├── signup.html                # Donor and NGO registration with dual forms
│   ├── donor/
│   │   ├── dashboard.html         # Donor metrics, quick actions & recent donations
│   │   ├── nearby-ngos.html       # Location-aware NGO discovery (Haversine search)
│   │   ├── ngo-details.html       # Detailed NGO view with food preferences & contact
│   │   ├── create-donation.html   # Donation creation form (shelf-life, quantity, urgency)
│   │   ├── donations.html         # Complete donor history with filter tabs
│   │   ├── donation-details.html  # Live donation tracking timeline & coordination details
│   │   ├── notifications.html     # Real-time event notifications for donor
│   │   └── profile.html           # Donor account details & statistics
│   └── ngo/
│       ├── dashboard.html         # NGO metrics, acceptance status toggle & recent requests
│       ├── requests.html          # Incoming requests categorized by status tabs
│       ├── request-details.html   # Request inspection, privacy-masked donor info & actions
│       ├── notifications.html     # Real-time event notifications for NGO
│       └── profile.html           # NGO operational profile & preferences editor
└── backend/
    ├── server.js                  # Express application entry point & route mounting
    ├── package.json               # Backend dependencies & npm scripts
    ├── .env.example               # Template environment configuration
    ├── .env                       # Local secrets (ignored in version control)
    ├── config/
    │   └── db.js                  # Mongoose MongoDB connection handler
    ├── models/
    │   ├── User.js                # User model (name, email, password, role, phone, address)
    │   ├── NgoProfile.js          # Extended NGO profile (mission, capacity, location, verified)
    │   ├── Donation.js            # Food donation records & lifecycle status
    │   └── Notification.js        # In-app notification records with read/unread tracking
    ├── middleware/
    │   └── auth.js                # JWT verification (`protect`) & role guard (`requireRole`)
    ├── controllers/
    │   ├── authController.js      # Register, login, getMe profile handler
    │   ├── ngoController.js       # NGO listing, profile update, Haversine nearby lookup
    │   ├── donationController.js  # Donation creation, status progression & privacy control
    │   ├── notificationController.js # Notifications list & read state management
    │   └── dashboardController.js # Aggregate statistics for Donor and NGO dashboards
    ├── routes/
    │   ├── authRoutes.js          # /api/auth
    │   ├── ngoRoutes.js           # /api/ngos
    │   ├── donationRoutes.js      # /api/donations
    │   ├── notificationRoutes.js  # /api/notifications
    │   └── dashboardRoutes.js     # /api/dashboard
    ├── test_suite.js              # 30-step unit & integration testing suite
    └── e2e_test.js                # 27-step end-to-end user journey & security suite
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v16.x or higher): [Download Node.js](https://nodejs.org/)
- **npm** (comes bundled with Node.js)
- **MongoDB**: A running local instance (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster connection string.

---

### 2. Backend Setup & Configuration

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `backend/.env` and configure your settings:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/feednow
   JWT_SECRET=feednow_super_secure_jwt_secret_dev_key_2024
   JWT_EXPIRES_IN=7d
   ```

4. **Start the Backend Server**:
   - Production mode:
     ```bash
     npm start
     ```
   - Development mode with auto-reload (using `nodemon`):
     ```bash
     npm run dev
     ```
   The backend will start and log:
   ```text
   MongoDB Connected: localhost:27017/feednow
   FeedNow Backend running on port 5000
   ```

---

### 3. Frontend Setup

The frontend consists of static HTML, CSS, and JavaScript files and connects to the backend at `http://localhost:5000/api`.

You can run the frontend using any static file server:
- **Option A — VS Code Live Server**: Right-click `index.html` and click **"Open with Live Server"**.
- **Option B — Node `npx serve`**:
  ```bash
  # In the root project directory:
  npx serve .
  ```
- **Option C — Python HTTP Server**:
  ```bash
  # In the root project directory:
  python -m http.server 3000
  ```
Open your browser and navigate to `http://localhost:3000` or the Live Server URL.

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public | Register new Donor or NGO account |
| `POST` | `/api/auth/login` | Public | Login with email & password, returns JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile (password excluded) |

### 2. NGOs (`/api/ngos`)
| Method | Endpoint | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ngos` | Public | List all active NGOs with filter options |
| `GET` | `/api/ngos/nearby` | Public | Location-based NGO discovery (query: `lat`, `lng`, `radiusKm`) |
| `GET` | `/api/ngos/me` | NGO only | Retrieve own NGO organization profile |
| `PUT` | `/api/ngos/me` | NGO only | Update own NGO details (capacity, address, accepting status) |
| `GET` | `/api/ngos/:id` | Public | View individual NGO details by user ID or profile ID |

### 3. Donations (`/api/donations`)
| Method | Endpoint | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/donations` | Donor only | Create a new food donation request targeted to an NGO |
| `GET` | `/api/donations/my` | Donor only | Retrieve all donations created by authenticated donor |
| `GET` | `/api/donations/received` | NGO only | Retrieve all donation requests sent to authenticated NGO |
| `GET` | `/api/donations/:id` | Authenticated | Retrieve donation details with role-based privacy masking |
| `PATCH` | `/api/donations/:id/status` | NGO only | Transition donation status (`ACCEPTED`, `DECLINED`, `COORDINATED`, `COMPLETED`) |

### 4. Notifications (`/api/notifications`)
| Method | Endpoint | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | Get user's notifications sorted by newest first |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark a single notification as read |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications for the user as read |

### 5. Dashboard (`/api/dashboard`)
| Method | Endpoint | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/donor` | Donor only | Aggregate metrics (total, pending, completed) & recent items |
| `GET` | `/api/dashboard/ngo` | NGO only | Aggregate metrics (requests, accepted, completed) & status |

### 6. Health
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Backend system health & uptime verification |

---

## 🔒 Security & Privacy Features

1. **Password Security**:
   - All passwords are encrypted with `bcryptjs` using a salt work factor of 10.
   - Passwords are never returned in API payloads (`select: false` on User schema).
2. **Stateless JWT Authentication**:
   - Secure token expiration (7-day default).
   - Bearer token verified on every protected request via `protect` middleware.
3. **Strict Role-Based Access Control (RBAC)**:
   - Donors cannot access NGO-only endpoints (e.g., cannot accept donations, cannot edit NGO profiles).
   - NGOs cannot access donor-only endpoints (e.g., cannot create donation requests).
4. **Donor Privacy Shielding**:
   - Precise donor contact details (phone, full street address) remain hidden from NGOs while a request is `PENDING`.
   - Donor details become accessible to the NGO only once the donation is formally `ACCEPTED`.
5. **Enforced Status Progression**:
   - Donations can only move through approved lifecycle transitions:
     `PENDING` ➔ `ACCEPTED` or `DECLINED` ➔ `COORDINATED` ➔ `COMPLETED`.
   - Illegitimate status jumps (e.g. attempting to accept a completed donation) are rejected with HTTP 400.

---

## 🧪 Testing & Verification

FeedNow features an automated testing pipeline with 57 comprehensive tests:

### Running Tests
To run all tests from the backend directory:
```bash
cd backend
npm test
```

### Test Breakdown
- **Unit & Integration Suite (`test_suite.js`)**: **30 / 30 Passed**
  - Health check & database connection
  - User registration & duplicate email prevention
  - Password hashing & login authentication
  - Token validation & missing token rejection
  - Role-based route guard enforcement
  - NGO profile updating & listing
  - Haversine distance-based nearby search
  - Donation creation & lifecycle transitions
  - Automated notification dispatching & read state toggling
  - Dashboard stats aggregation
  - Error handling (404 for non-existent IDs, 400 for malformed ObjectIds)

- **End-to-End User Journey & Security Suite (`e2e_test.js`)**: **27 / 27 Passed**
  - Complete lifecycle flow: NGO registration ➔ Donor registration ➔ Discovery ➔ Donation creation ➔ Real-time notifications ➔ NGO acceptance ➔ Coordination ➔ Completion.
  - Verification of dashboard statistics synchronization.
  - Security & negative checks:
    - Rejection of invalid credentials (401)
    - Rejection of duplicate accounts (400)
    - Rejection of malformed requests (400)
    - Rejection of unauthorized role access (403)
    - Rejection of illegitimate status regressions (400)
    - Protection of private donation records from unrelated users (403)

---

## 👥 User Roles & Walkthrough

### 🙋 Donor Workflow
1. **Sign Up / Log In**: Register as a donor at `/pages/signup.html`.
2. **Discover NGOs**: Visit `/pages/donor/nearby-ngos.html` to find nearby charities sorted by proximity and food requirements.
3. **Submit Donation**: Click **"Donate"** on an NGO card or use `/pages/donor/create-donation.html` to enter food type, quantity, prepared time, expiry deadline, and pickup address.
4. **Track Donation**: Monitor progress in `/pages/donor/donations.html` and view the dynamic timeline at `/pages/donor/donation-details.html`.
5. **Notifications**: Receive instant notifications when an NGO accepts, coordinates, or completes the donation.

### 🏢 NGO Workflow
1. **Sign Up / Log In**: Register as an NGO at `/pages/signup.html`.
2. **Configure Profile**: Set operational hours, food categories accepted, and current accepting status at `/pages/ngo/profile.html`.
3. **Review Requests**: View incoming requests categorized under New, Accepted, Completed, or Declined tabs at `/pages/ngo/requests.html`.
4. **Accept & Coordinate**: Review food details and shelf-life urgency at `/pages/ngo/request-details.html`. Accept the request to reveal donor contact details, then mark as Coordinated and Completed.
5. **Monitor Impact**: Track donation metrics and meals saved via the NGO dashboard at `/pages/ngo/dashboard.html`.

---

## 📄 License
This project is developed for educational and social-impact purposes.
All rights reserved © 2024 FeedNow Team.
