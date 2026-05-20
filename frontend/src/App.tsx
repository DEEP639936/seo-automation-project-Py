import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { Websites } from './pages/Websites'
import { Audits } from './pages/Audits'
import { Keywords } from './pages/Keywords'
import { Rankings } from './pages/Rankings'
import { Backlinks } from './pages/Backlinks'
import { Content } from './pages/Content'
import { Reports } from './pages/Reports'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      </Route>

      {/* App Routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/websites" element={<PrivateRoute><Websites /></PrivateRoute>} />
        <Route path="/audits" element={<PrivateRoute><Audits /></PrivateRoute>} />
        <Route path="/keywords" element={<PrivateRoute><Keywords /></PrivateRoute>} />
        <Route path="/rankings" element={<PrivateRoute><Rankings /></PrivateRoute>} />
        <Route path="/backlinks" element={<PrivateRoute><Backlinks /></PrivateRoute>} />
        <Route path="/content" element={<PrivateRoute><Content /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
