# Event Chat 🎉
A location-based social platform built with React and Node.js featuring real-time messaging, event creation, and social networking capabilities.

## Tech Stack
- **Frontend:** React, Tailwind CSS + DaisyUI, React Router, Socket.IO Client, Zustand
- **Backend:** Node.js, Express, MongoDB, Socket.IO, JWT Authentication, Mongoose
- **File Upload:** Cloudinary integration for images
- **Geolocation:** MongoDB geospatial queries for location-based features
- **Real-time:** Socket.IO for messaging and notifications

## Quick Start
1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd frontend
   npm install
   ```

2. **Setup environment**
   
   Create `.env` in backend directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   NODE_ENV=development
   ```

3. **Run the app**
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend (new terminal)
   cd frontend
   npm run dev
   ```

App runs on `http://localhost:5173` 🚀

## Features

### 🌍 Location-Based Discovery
- Set your location for personalized content
- Discover events and posts within customizable radius (5-100 miles)
- Real-time distance calculations and display

### 📅 Event Management
- Create and manage events with rich details
- RSVP system (Yes/Maybe/No responses)
- Event categories and tagging
- Invite friends to events
- Location-based event discovery

### 💬 Social Features
- Real-time messaging with Socket.IO
- Follow/unfollow users
- Like and comment on posts
- User profiles with bios and avatars
- Post creation with image support

### 🔔 Notifications
- Real-time notifications for follows, likes, and event invites
- Mark as read/unread functionality
- Event RSVP notifications

### 🎨 User Experience
- Multiple theme options (30+ DaisyUI themes)
- Responsive design for all devices
- Online/offline status indicators
- Image upload and sharing
- Search functionality for users and locations

## Project Structure
```
event-chat/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth & validation
│   │   └── lib/             # Utils & config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand state management
│   │   └── lib/            # Utils & API client
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/check` - Check auth status
- `PUT /api/auth/update-profile` - Update profile

### Events
- `GET /api/events/nearby` - Get nearby events
- `GET /api/events/my-events` - Get user's events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/rsvp` - RSVP to event

### Posts
- `GET /api/posts/nearby` - Get nearby posts
- `GET /api/posts/following` - Get following feed
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/like` - Like/unlike post

### Social
- `POST /api/follow/follow/:userId` - Follow user
- `POST /api/follow/unfollow/:userId` - Unfollow user
- `GET /api/follow/notifications` - Get notifications

### Location
- `PUT /api/geo/current-location` - Update current location
- `GET /api/geo/search-cities` - Search for cities
- `PUT /api/geo/settings` - Update location settings

## Database Schema

### User Model
- Authentication (email, password, username)
- Profile (name, bio, profile picture)
- Location settings and current city
- Following/followers system

### Event Model
- Event details (title, description, date, category)
- Location with geospatial coordinates
- Attendee management with RSVP status
- Creator and privacy settings

### Post Model
- Content and optional image
- Author and location information
- Like system and event association

### Message Model
- Real-time messaging between users
- Text and image support
- Socket.IO integration

---
*Educational project demonstrating modern full-stack development with location-based features*