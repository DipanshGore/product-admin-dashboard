# Product Admin Dashboard

A Next.js admin dashboard utilizing the DummyJSON API to authenticate and manage product listings. Built with React, Tailwind CSS, and Axios without third-party data fetching or UI table libraries.

## Live Demo & Repository
- **Live URL:** https://product-admin-dashboard-15v81amoa-dgore7078-5434.vercel.app
- **GitHub:** https://github.com/DipanshGore/product-admin-dashboard

---

## Features Implemented
- **Authentication:** Login using `emilys` / `emilyspass` against DummyJSON `/auth/login`. Centralized JWT token handling via Axios request interceptors.
- **Route Protection:** Route wrapper redirecting unauthenticated users to `/login`. Global session logout button.
- **Product Management:** Responsive UI featuring a structured table on desktop and compact card layouts on mobile.
- **URL-Driven State:** Two-way sync for pagination (`page`, `limit`), search queries (`search`), category filters (`category`), and sort order (`sortBy`). Refreshing or sharing deep links retains exact query states.
- **Search & Debouncing:** Input debounced with 400ms delay to prevent unnecessary API overhead.
- **Race Condition Prevention:** Integrated `AbortController` to cancel in-flight Axios requests when fast successive inputs occur.
- **Mock CRUD Operations:** Form validation for adding and editing products; deletion confirmation dialog with responsive local-state updates.
- **Product Details & Error Handling:** Dynamic routing at `/products/[id]` showing detailed specs, a custom terminal-themed 404 fallback for invalid IDs, and resilient URL parameter parsing.

---

## Architecture & Edge-Case Decisions

### 1. The Search vs. Category Filter Constraint
The DummyJSON API does not support combining search queries (`/products/search?q=`) and category filtering (`/products/category/{cat}`) in a single request. 
- **Design Choice:** Search and Category are treated as mutually exclusive views. Selecting a category clears the active search field, and typing into the search bar automatically resets the category filter back to "All Categories". This keeps the URL as the single source of truth.

### 2. Add, Edit, and Delete Persistence
Because DummyJSON does not persist mutations to its backend database, API endpoints for newly added mock IDs return a `404 Not Found`.
- **Solution:** The Axios response logic is designed to intercept and ignore 404 errors specifically during PUT and DELETE requests. Successful mock API submissions instantly trigger local React state updates, prepending new items with unique client-side IDs so the UI degrades gracefully.

### 3. A Challenge Faced & How It Was Resolved
- **Problem:** During fast typing in the search box, delayed network responses returned out of order, occasionally overwriting the latest search results with older data. Additionally, immediate redirects for invalid URLs (like `?page=999`) caused global Axios interceptors to throw false-positive error screens.
- **Solution:** Implemented `AbortController` coupled with Axios `signal`. The Axios global interceptor was updated to detect `axios.isCancel(error)` and pass it through silently, ensuring that canceled requests do not trigger the global error UI.

### 4. AI Tool Usage
- AI tools were utilized to quickly scaffold repetitive Tailwind UI boilerplate, generate the terminal-style 404 page aesthetic, and identify the specific Axios interceptor syntax needed to globally bypass `CanceledError` exceptions. All core routing logic and state synchronization were managed directly.

---

## Getting Started

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install