# Gather

Gather is a location-based social app I built to help people find events, share posts, and connect with others in their area. Think of it like a neighborhood bulletin board with real-time chat, polls, and a song voting feature thrown in.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Zustand, Tailwind + DaisyUI, React Router |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB (with geospatial indexes for location queries) |
| Real-time | Socket.IO for chat and live notifications |
| Auth | JWT stored in httpOnly cookies, role-based access |
| File uploads | Cloudinary |
| Geocoding | Nominatim (free, no API key needed) |
| Email | Resend (password resets) |

## What it does

**Events** — Create events with images, categories, and capacity limits. RSVP as yes/maybe/no. Invite friends. Comment and reply on events. Everything is scoped to your area using MongoDB `$geoNear`, so you only see stuff nearby.

**Posts** — Share text or image posts tied to your location. Like, comment, tag a venue. Short text-only posts get a different "thought bubble" layout, longer ones look more like tweets.

**Real-time messaging** — DM friends through Socket.IO. Online/offline indicators, image sharing. Messaging is gated behind friendship by default (configurable in settings).

**Friends & follows** — Following is one-way (see their content). Friendship is mutual (unlocks DMs). Friend requests show up in notifications with accept/reject buttons.

**Community polls** — Create polls with 2-4 options, tied to a location and category. Polls need admin approval before they go live. Filter by active, expired, or your own.

**Song voting** — Submit songs, vote once per day, see a live leaderboard. Historical daily charts with date navigation.

**Search** — Search events, posts, and users with geo filtering. Scope results to "nearby" or "following." All three queries fire in parallel.

**Admin dashboard** — Platform stats, user management (roles, bans), report review queue, poll approval, song moderation.

**Notifications** — Real-time notifications for RSVPs, comments, replies, friend requests, follows, event invites, and poll approvals. Inline accept/reject for friend requests. Clear all button.

**Other stuff** — 32 theme options, profanity filter, HTML sanitization, content reporting, password reset via email, configurable search radius, mobile-responsive with bottom nav.

## Project structure

```
gather/
├── backend/src/
│   ├── controllers/    # request handlers
│   ├── models/         # mongoose schemas
│   ├── routes/         # express routers
│   ├── middleware/      # auth + admin guards
│   └── lib/            # db, socket.io, cloudinary, email, utils
├── frontend/src/
│   ├── pages/          # route-level components
│   ├── components/     # shared UI
│   ├── store/          # zustand stores
│   └── lib/            # axios instance, helpers
└── package.json        # root scripts
```

## Why I made these choices

- **Zustand instead of Redux** — way less boilerplate for a project this size, and the API is nicer to work with
- **httpOnly cookies for JWT** — tokens can't be stolen via XSS like they can from localStorage
- **MongoDB geospatial indexes** — `$geoNear` handles proximity queries natively, no need for a separate geo service
- **Socket.IO rooms** — each user gets their own room, makes it easy to target messages and track presence

## API overview

The full API has ~50 endpoints across these route groups. Here are the main ones:

| Route group | What it covers |
|-------------|----------------|
| `/api/auth` | Signup, login, logout, profile updates, password reset |
| `/api/events` | CRUD, RSVP, invites, nearby/following/search queries |
| `/api/posts` | CRUD, likes, nearby/following/search queries |
| `/api/messages` | Conversations list, message history, send messages |
| `/api/follow` | Follow/unfollow, notifications |
| `/api/friends` | Friend requests, accept/reject/remove |
| `/api/geo` | Location updates, city search, radius settings |
| `/api/polls` | CRUD, voting, admin approval |
| `/api/voting` | Song submission, daily votes, charts, stats |
| `/api/comments` | Comments on posts/events, replies, likes |
| `/api/reports` | Submit + review reports |
| `/api/admin` | Dashboard stats, user/song management, role changes |

## Getting started

You'll need Node 18+, a MongoDB instance ([Atlas free tier](https://www.mongodb.com/atlas) works), and a [Cloudinary](https://cloudinary.com/) account.

1. Clone and install:

   ```bash
   git clone https://github.com/LFroesch/gather.git
   cd gather
   npm install && cd backend && npm install && cd ../frontend && npm install
   ```

2. Create `backend/.env`:

   ```env
   MONGODB_URI=your_mongodb_uri
   PORT=5001
   JWT_SECRET=pick_something_random
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   RESEND_API_KEY=your_resend_key          # optional, for password reset emails
   RESEND_FROM_EMAIL=Gather <noreply@yourdomain.com>
   ```

3. Run it:

   ```bash
   npm run dev   # starts backend (5001) + frontend (5173)
   ```

### Production build

```bash
npm run build   # installs deps + builds frontend
npm start       # serves backend + static frontend
```

## License

[AGPL-3.0](LICENSE) — Lucas Froeschner, 2026
