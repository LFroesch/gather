## DevLog

### 2026-03-23: Hide seed data from real users + "Sample" badges
- Tagged all seed content (posts, events, comments, songs, polls, messages) with `isDemo: true` in `seedData.js`
- Real users no longer see seed data (existing `demoFilter()` handles it)
- Added "Sample" badge to PostCard, EventCard, PollCard for demo content
- Added demo nudge text on LoginPage under "Try Demo" button
- Files: `backend/src/lib/seedData.js`, `frontend/src/components/PostCard.jsx`, `frontend/src/components/EventCard.jsx`, `frontend/src/pages/PollsPage.jsx`, `frontend/src/pages/LoginPage.jsx`

### 2026-03-23: Mobile UI polish round 2
- Tab overflow fix: hide icons on small screens, shrink text for tabs in HomePage (Near Me/My Events), PollsPage, SettingsPage, AdminPage
- Navbar Create button: changed to circle `btn-circle` to match search/theme buttons
- PollsPage: stacked tabs/filters vertically on mobile (`flex-col sm:flex-row`), hide "New Poll" text on small screens
- Footer: hidden below `xl` breakpoint (mobile has bottom nav, footer was redundant)
- Sidebar: fixed duplicate unread-message badge — avatar badge for mobile, text badge for desktop
- Files: HomePage.jsx, PollsPage.jsx, SettingsPage.jsx, AdminPage.jsx, Navbar.jsx, Footer.jsx, Sidebar.jsx

### 2026-03-23: Swap Gmail SMTP → Resend for password reset
- DO blocks SMTP ports on droplets; Resend sends over HTTPS (port 443)
- Replaced `nodemailer` with `resend` package
- Updated `.env.example`: `SMTP_USER`/`SMTP_PASS` → `RESEND_API_KEY`/`FROM_EMAIL`
- Files: `backend/src/lib/email.js`, `backend/.env.example`, `backend/package.json`

### 2026-03-23: Mobile navigation fix
- Added Polls to mobile bottom nav (was inaccessible on < xl screens)
- Added mobile search icon in top navbar (replaced Search in bottom nav with Polls)
- Defined `safe-area-pb` CSS utility for iPhone home bar padding
- Fixed MessagingPage height calc to account for bottom nav on mobile
- Added/fixed `pb-20` on 6 pages missing bottom nav clearance: SettingsPage, CreatePostPage, CreateEventPage, AdminPage, ChartsPage, VotingPage
- Files: Navbar.jsx, index.css, MessagingPage.jsx, SettingsPage.jsx, CreatePostPage.jsx, CreateEventPage.jsx, AdminPage.jsx, ChartsPage.jsx, VotingPage.jsx

### 2026-03-20: Demo reseed on every login + post images
- Extracted seed logic into `backend/src/lib/seedData.js` with `reseedDemoData()` export
- `demoLogin` now calls `reseedDemoData()` — full nuke+recreate instead of partial cleanup. Guarantees fresh state for every recruiter.
- Added context-matching Unsplash images to all 6 seed posts
- Removed unused model imports from auth.controller.js
- Files: `backend/src/lib/seedData.js` (new), `backend/src/seed.js`, `backend/src/controllers/auth.controller.js`

### 2026-03-19: Deployed to droplet
Live at gather.froesch.dev. Docker Compose, Nginx, Let's Encrypt. Demo login working.

### 2026-03-19: Footer — portfolio & GitHub links
- Name link now points to `froesch.dev`, added separate GitHub link
- Files: `frontend/src/components/Footer.jsx`

### 2026-03-19: Demo isolation — full content sandboxing
- `isDemo` field added to Post, Event, Comment, Message, Poll, Song models
- Demo session content auto-tagged with `isDemo: true` at creation
- Non-demo users never see `isDemo` content (filtered on all feed/search/comment queries)
- `demoLogin` cleanup: wipes all `isDemo` content, demo likes, demo RSVPs, demo votes on each login
- `demoGuard` middleware blocks demo users from: admin writes, follow/friend, profile edits, password changes
- `demoFilter()` utility in utils.js for consistent query filtering
- Admin `getUsers` still filtered to demo users only for demo sessions
- Files: 6 models, `protectRoute.js`, `utils.js`, `auth.controller.js`, `admin.controller.js`, `post.route.js`, `event.route.js`, `comment.route.js`, `message.controller.js`, `poll.controller.js`, `voting.controller.js`, `admin.route.js`, `auth.route.js`, `follow.route.js`, `friend.route.js`, `LoginPage.jsx`, `useAuthStore.js`

### 2026-03-18: Production audit fixes
- **Helmet CSP**: configured to allow `res.cloudinary.com` for `img-src` — default helmet blocks all external images in prod
- **DB exit on failure**: `db.js` now calls `process.exit(1)` on connection error so Docker restarts the container instead of running with no DB
- **Nginx WebSocket timeout**: added `proxy_read_timeout 86400s` to `gather.conf` — default 60s drops Socket.IO connections every minute
- Files: `backend/src/index.js`, `backend/src/lib/db.js`, `droplet/nginx/sites/gather.conf`

### 2026-03-18: Demo login — one-click recruiter access with read-only protection
- `POST /auth/demo-login` endpoint — no creds exposed in frontend bundle
- `isDemo` flag on User model, tagged on all seed users
- `protectRoute` blocks all non-GET requests for demo accounts (except logout)
- Admin `getUsers` filters to demo users only when requester is demo
- Frontend: "Try Demo" button on login page, uses dedicated `demoLogin` store method
- Files: `user.model.js`, `seed.js`, `auth.controller.js`, `auth.route.js`, `protectRoute.js`, `admin.controller.js`, `useAuthStore.js`, `LoginPage.jsx`

### 2026-03-17: Seed script + README overhaul for portfolio screenshots
- Seed: added profile pics (pravatar), filled all event images (Unsplash), added friendships (2 accepted + 1 pending), added messages (8 between alex/jordan/maya)
- README: broke out notifications, admin, themes, moderation into own sections (were buried in "Other stuff"). Added collapsible screenshot placeholders for 10 features. Added seed instructions to Getting Started.
- Files: `backend/src/seed.js`, `README.md`
- Task #2 (seed data) → done

### 2026-03-17: Swap Resend → Gmail SMTP for password reset emails
- Replaced `resend` package with `nodemailer` using Gmail SMTP
- Files: `backend/src/lib/email.js`, `.env.example`, `README.md`
- Add `SMTP_USER` and `SMTP_PASS` (Gmail App Password) to `.env` to test

### 2026-03-17: Git history cleanup
- Squashed 21 messy commits into 9 clean ones with preserved dates
- Removed dead files: `frontend/README.md` (Vite boilerplate), `frontend/public/event-chat.svg`, `frontend/public/vite.svg`

### 2026-03-17: PollCard badge layout fix
- Badges forced to row below username, `badge-md` size
- Files: PollsPage.jsx

### 2026-03-17: README accuracy pass, extended BackgroundBlobs, de-AI content pass, PostCard variety
- See earlier entries for details

### 2026-03-16: Polls geo-scoping, LocationPicker, creation flow overhaul
### 2026-03-13: Admin panel overhaul, poll approval, EADDRINUSE fix
### 2026-03-13: Bug fixes & small tasks batch
### 2026-03-12: Notifications + event categories, Friends system
### 2026-03-11: Pre-launch cleanup
### 2026-03-09: Production hardening
### 2026-03-05: Community polls + search
### 2026-02-25: UI polish pass
### 2026-02-24: UI polish + seed data
### 2026-02-12: Resume polish pass
### 2026-02-03: Project restart
