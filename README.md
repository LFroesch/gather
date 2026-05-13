# Gather

Location-based social app for nearby events, posts, messaging, polls, and lightweight community discovery.

Gather is a full-stack social product built around local context. Users can post nearby updates, create events, chat with friends in real time, vote in community polls, and manage a profile with social graph features like follows and friendships.

**Live app:** [gather.froesch.dev](https://gather.froesch.dev)
**Portfolio:** [froesch.dev](https://froesch.dev)

## What works well

- Nearby events and posts using MongoDB geospatial queries
- Real-time messaging and notifications with Socket.IO
- Follow and friendship systems with DM gating
- Community polls and a separate song-voting feature
- Admin moderation tools and role-based access
- Mobile-friendly layouts and theme support through DaisyUI

## Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React, Vite, Zustand, Tailwind, DaisyUI |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Realtime | Socket.IO |
| Auth | JWT in httpOnly cookies |
| Uploads | Cloudinary |
| Email | Resend |

## Feature overview

### Events

Create local events with categories, images, comments, RSVPs, and friend invites.

### Posts

Share local text or image posts, like and comment on them, and browse nearby or following-scoped content.

### Messaging

Send direct messages with live updates, presence, and image support.

### Social graph

Use follows for one-way discovery and friendships for mutual connections and messaging permissions.

### Polls and song voting

Run community polls with admin approval and a separate daily song-voting flow with leaderboard/history views.

### Moderation

Admin routes cover user management, report review, poll approval, and song moderation.

## Local development

Requirements:

- Node.js 18+
- MongoDB
- Cloudinary account for uploads

Install:

```bash
git clone https://github.com/LFroesch/gather.git
cd gather
npm install
npm install --prefix backend
npm install --prefix frontend
```

Create your backend env file:

```bash
cp backend/.env.example backend/.env
```

The main values are defined in [`backend/.env.example`](backend/.env.example).

Run in development:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Seed data

Seed the local demo data with:

```bash
npm run seed --prefix backend
```

The seed includes demo users, events, posts, polls, songs, and messages.

If you want to verify seeded image URLs:

```bash
./backend/src/check-seed-images.sh
```

## Production notes

Build the frontend:

```bash
npm run build
```

Then start the backend with `NODE_ENV=production` so it serves `frontend/dist`:

```bash
NODE_ENV=production npm start
```

That detail matters here because static frontend serving is only enabled in production mode.

## API surface

Main route groups:

- `/api/auth`
- `/api/events`
- `/api/posts`
- `/api/messages`
- `/api/follow`
- `/api/friends`
- `/api/geo`
- `/api/polls`
- `/api/voting`
- `/api/comments`
- `/api/reports`
- `/api/admin`

## License

[AGPL-3.0](LICENSE)
