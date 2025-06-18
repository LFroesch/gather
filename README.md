# Event Chat 💬
A real-time chat application built with React and Node.js featuring Socket.IO for instant messaging.

## Tech Stack
- **Frontend:** React, Tailwind CSS + DaisyUI, React Router, Socket.IO Client, Zustand
- **Backend:** Node.js, Express, MongoDB, Socket.IO, JWT Authentication
- **File Upload:** Cloudinary integration for image sharing

## Quick Start
1. **Install dependencies**
   ```bash
   # Main Folder
   npm run build
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
- Real-time messaging with Socket.IO
- User authentication & profiles
- Image sharing capabilities
- Online/offline status indicators
- Multiple theme options
- Responsive design

---
*Educational project by Lucas*