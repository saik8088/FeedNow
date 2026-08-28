🍱 FEEDNOW

Right Food, Right Place, Right Time

Absolutely. Based on your **FEEDNOW frontend workflow**, here is a clean, professional `README.md` you can directly use in your GitHub repository.

````markdown
# 🍱 FEEDNOW

### Right Food. Right Place. Right Time.

FEEDNOW is a smart food-rescue platform designed to connect people and organizations with surplus food to nearby NGOs that need food in real time.

The platform simplifies the donation process by helping donors discover nearby NGOs, understand their current requirements, submit food donation requests, and coordinate pickup or delivery.

---

## 🌱 Overview

A large amount of edible food is wasted every day while many people and communities still face food shortages.

FEEDNOW aims to bridge this gap through a simple digital platform where:

**Donors → Find Nearby NGOs → Send Food Requests → NGO Accepts → Coordinate → Donation Completed**

The frontend provides separate experiences for **Donors** and **NGOs**, making the entire food-rescue workflow simple and transparent.

---

## 🎯 Objectives

- Reduce avoidable food wastage.
- Connect surplus food with organizations that need it.
- Help donors find nearby NGOs quickly.
- Provide NGOs with an organized way to receive donation requests.
- Simplify food pickup and delivery coordination.
- Provide real-time status updates through notifications.
- Create a simple and user-friendly food donation experience.

---

## 🔄 Complete Workflow

```text
                    FEEDNOW
                       │
                       ▼
                 Landing Page
                       │
                       ▼
                Login / Signup
                       │
                       ▼
                  Select Role
                  /         \
                 /           \
                ▼             ▼
             DONOR           NGO
                │             │
                ▼             ▼
        Donor Dashboard   NGO Dashboard
                │             │
                ▼             │
          Find Nearby NGOs    │
                │             │
                ▼             │
          View NGO Details    │
                │             │
                ▼             │
        Create Donation       │
             Request          │
                │             │
                └──────┬──────┘
                       ▼
                NGO Receives
                   Request
                       │
                 ┌─────┴─────┐
                 ▼           ▼
              Accept       Decline
                 │
                 ▼
             Coordinate
          Pickup / Delivery
                 │
                 ▼
          Donation Completed
                 │
                 ▼
              Impact
````

---

## 👥 User Roles

### 🙋 Donor

Donors can:

* Create an account.
* Select the donor role.
* Allow location access.
* View nearby NGOs.
* Check NGO requirements.
* View NGO details.
* Create food donation requests.
* Enter food information and quantity.
* Specify preparation and pickup deadlines.
* Add additional notes.
* Submit donation requests.
* Track donation status.
* Receive notifications.

### 🏢 NGO

NGOs can:

* Create an NGO account.
* Access the NGO dashboard.
* View incoming donation requests.
* Check food details.
* Review quantity and availability.
* Accept or decline donations.
* Coordinate pickup or delivery.
* Track accepted donations.
* View completed donations.
* Receive notifications.

---

## 🖥️ Frontend Pages

### 1. Landing Page

The landing page introduces FEEDNOW and explains its purpose.

Main navigation includes:

* Home
* How It Works
* About / Impact
* Login
* Donate Food
* Join as NGO

Primary message:

> Good food deserves a second destination.

---

### 2. Authentication

Users can:

* Login using email and password.
* Create a new account.
* Select their role during registration.

Available roles:

```text
I want to donate food
        OR
I represent an NGO
```

The selected role determines the dashboard and workflow shown to the user.

---

### 3. Donor Dashboard

After authentication, donors enter their dashboard.

The dashboard provides access to:

* Dashboard
* Nearby NGOs
* My Donations
* Notifications
* Profile

The donor can also see donation statistics such as:

* Donations Made
* Pending Donations
* Completed Donations
* Recent Donations

---

### 4. Nearby NGO Discovery

FEEDNOW uses the donor's location to help discover nearby NGOs.

Donors can view information such as:

* NGO name
* Distance
* Food requirement
* Food type accepted
* Pickup availability
* Current donation status

This allows donors to identify NGOs that currently need the available food.

---

### 5. NGO Details

Before sending a donation, donors can view additional information about an NGO.

This helps donors make an informed decision about where to send their surplus food.

---

### 6. Create Donation Request

Donors can create a donation request by entering information such as:

* Food name
* Food type
* Quantity
* Prepared time
* Best-before / pickup deadline
* Additional notes
* Food image, where applicable

The donor can review the donation information before sending the request.

---

### 7. NGO Dashboard

The NGO dashboard provides an overview of donation activity.

It includes areas such as:

* Dashboard
* Donation Requests
* Notifications
* Profile

The NGO can monitor:

* New requests
* Pending requests
* Accepted donations
* Completed donations

---

### 8. Donation Request Management

When an NGO receives a donation request, it can review:

* Food name
* Quantity
* Food type
* Preparation time
* Availability deadline
* Donor information
* Relevant location information

The NGO can then:

```text
ACCEPT DONATION
       OR
DECLINE DONATION
```

---

### 9. Pickup / Delivery Coordination

After accepting a donation, the donor and NGO coordinate how the food will reach the NGO.

Possible coordination options include:

* NGO pickup
* Donor delivery

The donation status progresses through the workflow:

```text
PENDING
   ↓
ACCEPTED
   ↓
COORDINATED
   ↓
COMPLETED
```

---

### 10. Notifications

Notifications keep users informed about important donation events.

Examples include:

* Donation request sent.
* Donation request accepted.
* Donation request declined.
* Pickup / delivery coordination.
* Donation completed.

---

## 🧩 Key Features

* 🔐 User authentication
* 👥 Donor and NGO role selection
* 📍 Location-based NGO discovery
* 🏢 NGO profiles
* 🍱 Food donation creation
* 📋 Donation request management
* ✅ Accept / decline workflow
* 🚚 Pickup and delivery coordination
* 🔔 Notifications
* 📊 Donation statistics
* 📱 Responsive user interface

---

## 🎨 Design

FEEDNOW follows a clean and modern social-impact technology design.

### Brand Colors

| Color         | Hex       | Purpose                                    |
| ------------- | --------- | ------------------------------------------ |
| Fresh Green   | `#22C55E` | Food, freshness, sustainability and impact |
| Dark Charcoal | `#17211B` | Text and primary UI elements               |
| White         | `#FFFFFF` | Background and negative space              |

The interface focuses on:

* Clean layouts
* Clear navigation
* Simple cards
* Strong typography
* Intuitive actions
* Minimal visual clutter
* Responsive design

---

## 🚀 User Journey

### Donor Journey

```text
Landing Page
     ↓
Login / Signup
     ↓
Select Donor
     ↓
Allow Location
     ↓
Donor Dashboard
     ↓
Nearby NGOs
     ↓
View NGO Details
     ↓
Create Donation
     ↓
Send Request
     ↓
Wait for NGO Response
     ↓
Coordinate Pickup / Delivery
     ↓
Donation Completed
```

### NGO Journey

```text
Landing Page
     ↓
Login / Signup
     ↓
Select NGO
     ↓
NGO Dashboard
     ↓
View Donation Requests
     ↓
Review Food Details
     ↓
Accept / Decline
     ↓
Coordinate Pickup / Delivery
     ↓
Complete Donation
```

---

## 💡 Impact

FEEDNOW aims to create a direct connection between **surplus food and genuine need**.

Instead of letting usable food go to waste, the platform provides a structured workflow for moving it toward organizations that can distribute it to people who need it.

### FEEDNOW focuses on:

**Food Rescue**
Recover usable surplus food.

**Real-Time Connection**
Connect donors with nearby NGOs.

**Efficient Coordination**
Make pickup and delivery easier.

**Social Impact**
Turn surplus food into meaningful community support.

---

## 🏗️ Project Structure

```text
FEEDNOW/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── assets/
│   └── ...
│
├── public/
│
├── package.json
├── README.md
└── ...
```

> Update the folder structure above according to the final implementation of your project.

---

## 🛠️ Getting Started

### Prerequisites

Make sure you have installed:

* Node.js
* npm
* Git

### Installation

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Navigate to the project:

```bash
cd FEEDNOW
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local development URL shown in your terminal.

---

## 🔮 Future Scope

Potential future improvements can include:

* Smarter donor-NGO matching.
* Improved real-time availability.
* Advanced impact analytics.
* Better route and pickup optimization.
* Mobile application support.
* Multi-location NGO management.
* Food safety and expiry monitoring.
* Larger-scale community partnerships.

These are future possibilities and are **not represented as current implemented features**.

---

## 🤝 Social Impact

FEEDNOW is built around a simple idea:

> **Food should reach people, not landfills.**

By making food donation faster, more organized, and location-aware, FEEDNOW can help create a more sustainable and connected food-rescue ecosystem.

---

## 📌 Project Status

**Project:** FEEDNOW
**Category:** Food Rescue / Social Impact Technology
**Platform:** Web Application
**Focus:** Donor–NGO Food Donation Workflow

---

## 👨‍💻 Team

Developed as a hackathon project focused on solving food wastage through technology and real-time community connection.

---

# FEEDNOW

### Right Food. Right Place. Right Time.

```

This README follows the workflow you provided, particularly the **donor → nearby NGO → donation request → NGO response → coordination → completion** flow, rather than adding unrelated features. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1}

**For GitHub, I'd recommend using this as `README.md` and replacing `<YOUR_GITHUB_REPOSITORY_URL>` with your actual repository URL.**
```
