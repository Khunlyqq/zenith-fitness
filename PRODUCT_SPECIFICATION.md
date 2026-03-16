# Product Specification: Zenith

## 1. Product Overview
**Zenith** is a comprehensive fitness and productivity application designed to help users track their health data, manage workout schedules, and monitor physical progress. The application focuses on a "premium" user experience with a modern, responsive interface and support for multiple languages.

## 2. Target Audience
- Fitness enthusiasts looking for a dedicated tracking tool.
- Individuals wanting to monitor their daily nutrition and hydration.
- Users who prefer a multilingual interface (Indonesian/English).

## 3. Key Features

### 3.1 User Authentication & Profile
- **Global Auth Context:** Secure session management using JWT.
- **Onboarding:** Seamless registration and login flows.
- **Profile Management:** User-specific settings, including language preferences and account details.

### 3.2 Fitness Dashboard
- **Streak Tracking:** Visual representation of consecutive active days.
- **Calorie Monitoring:** Daily calorie burn overview.
- **Hydration Tracker:** Interactive tool to log water intake (standard 250ml increments) with progress visualization.
- **Next Session Notification:** Reminders for upcoming scheduled workouts.

### 3.3 Nutrition & Body Stats
- **Macronutrient Breakdown:** Tracking of Protein, Carbohydrates, and Fat with goal-based progress bars.
- **Body Metrics:** Logging and visualization of weight and body fat percentage trends.

### 3.4 Workout & Schedule Management
- **Exercise Library:** A catalog of exercises for reference.
- **Interactive Schedule:** Calendar-like interface (Jadwal) to plan and view training sessions.
- **Workout Execution:** Dedicated interface (Workout) for active session tracking.

### 3.5 Localization
- **Dynamic Language Toggle:** Full support for **Bahasa Indonesia** and **English**, handled via a dedicated `translations.js` and React Context.

## 4. Technical Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS 4.0
- **Routing:** React Router 7
- **Icons:** Material Symbols

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQL.js (SQLite compiled to WebAssembly for portablility/testing)
- **Security:** JWT (JSON Web Tokens) for API authentication, bcryptjs for password hashing.

## 5. User Interface (UI) Design
- **Theme:** Modern dark/light mode support (Glassmorphism influences).
- **Responsiveness:** Mobile-first approach, optimized for various screen sizes.
- **Animations:** Smooth transitions and interactive micro-animations (e.g., water drop bounce).

## 6. API Architecture
- **Auth Endpoints:** `/api/auth/login`, `/api/auth/register`
- **Dashboard Endpoints:**
    - `GET /dashboard/summary`
    - `GET /dashboard/nutrition/today`
    - `POST /dashboard/hydration`
- **Schedule/Stats Endpoints:** Detailed CRUD for workout schedules and body metric logs.
