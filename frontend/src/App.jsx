import Navbar from "./components/Navbar"
import BackgroundBlobs from "./components/BackgroundBlobs"

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
import PostPage from "./pages/PostPage"
import HelpPage from "./pages/HelpPage"
import PollsPage from "./pages/PollsPage"
import AdminPage from "./pages/AdminPage"
import ChartsPage from "./pages/ChartsPage"
import NotFoundPage from "./pages/NotFoundPage"
import SearchResultsPage from "./pages/SearchResultsPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import Footer from "./components/Footer"
import { useAuthStore } from "./store/useAuthStore"
import { useEffect } from "react"
import { Loader } from "lucide-react"
import { Toaster } from "react-hot-toast"
import { useThemeStore } from "./store/useThemeStore"
import { useLocationStore } from "./store/useLocationStore"

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore()
  const { initializeLocation } = useLocationStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (authUser) {
      initializeLocation()
    }
  }, [authUser, initializeLocation])

  if (isCheckingAuth && !authUser)
    return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader className="size-10 animate-spin"/>
    </div>
    )
  return (
    <div data-theme={theme} className="min-h-screen">
      <BackgroundBlobs/>
      <div className="relative z-[1]">
      <Navbar/>

      <Routes>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/events" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/posts" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/events" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/events" />}/>
        <Route path="/forgot-password" element={!authUser ? <ForgotPasswordPage /> : <Navigate to="/events" />} />
        <Route path="/reset-password/:token" element={!authUser ? <ResetPasswordPage /> : <Navigate to="/events" />} />
        <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/profile/:username" element={authUser ? <OtherUserProfilePage /> : <Navigate to="/login" />} />
        <Route path="/events/:eventId" element={authUser ? <EventPage /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={authUser ? <NotificationsPage /> : <Navigate to="/login" />} />
        <Route path="/messages" element={authUser ? <MessagingPage /> : <Navigate to="/login" />} />
        <Route path="/create-event" element={authUser ? <CreateEventPage /> : <Navigate to="/login" />} />
        <Route path="/create-post" element={authUser ? <CreatePostPage /> : <Navigate to="/login" />} />
        <Route path="/posts/:postId" element={authUser ? <PostPage /> : <Navigate to="/login" />} />
        <Route path="/search" element={authUser ? <SearchResultsPage /> : <Navigate to="/login" />} />
        <Route path="/polls" element={authUser ? <PollsPage /> : <Navigate to="/login" />} />
        <Route path="/charts" element={authUser ? <ChartsPage /> : <Navigate to="/login" />} />
        <Route path="/admin" element={authUser?.role === 'admin' || authUser?.role === 'moderator' ? <AdminPage /> : <Navigate to="/events" />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer/>
      </div>
      <Toaster/>
    </div>
  )
}

export default App