import Navbar from "./components/Navbar"

import { Routes, Route, Navigate } from "react-router-dom"
import HomePage from "./pages/HomePage"
import SignUpPage from "./pages/SignUpPage"
import LoginPage from "./pages/LoginPage"
import SettingsPage from "./pages/SettingsPage"
import ProfilePage from "./pages/ProfilePage"
import OtherUserProfilePage from "./pages/OtherUserProfilePage"
import EventPage from "./pages/EventPage"
import NotificationsPage from "./pages/NotificationsPage"
import MessagingPage from "./pages/MessagingPage"
import CreateEventPage from "./pages/CreateEventPage"
import CreatePostPage from "./pages/CreatePostPage"
import Footer from "./components/Footer"
import { useAuthStore } from "./store/useAuthStore"
import { useEffect } from "react"
import { Loader } from "lucide-react"
import { Toaster } from "react-hot-toast"
import { useThemeStore } from "./store/useThemeStore"

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  console.log({ authUser })

  if (isCheckingAuth && !authUser)
    return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader className="size-10 animate-spin"/>
    </div>
    )
  return (
    <div data-theme={theme}>
      <Navbar/>

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />}/>
        <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/profile/:username" element={authUser ? <OtherUserProfilePage /> : <Navigate to="/login" />} />
        <Route path="/events/:eventId" element={authUser ? <EventPage /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={authUser ? <NotificationsPage /> : <Navigate to="/login" />} />
        <Route path="/messages" element={authUser ? <MessagingPage /> : <Navigate to="/login" />} />
        <Route path="/create-event" element={authUser ? <CreateEventPage /> : <Navigate to="/login" />} />
        <Route path="/create-post" element={authUser ? <CreatePostPage /> : <Navigate to="/login" />} />
      </Routes>
      <Footer/>
      <Toaster/>
    </div>
  )
}

export default App