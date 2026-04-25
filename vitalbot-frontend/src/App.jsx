import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import InicioPage from './pages/InicioPage.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'
import AdminSintomasPage from './pages/admin/AdminSintomasPage.jsx'
import AdminContenidoPage from './pages/admin/AdminContenidoPage.jsx'
import AdminReglasPage from './pages/admin/AdminReglasPage.jsx'
import { isAuthenticated, isAdmin } from './lib/session.js'

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />
}

function AdminRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/" replace />
  if (!isAdmin()) return <Navigate to="/inicio" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/recuperar" element={<ForgotPasswordPage />} />
      <Route path="/restablecer" element={<ResetPasswordPage />} />
      <Route path="/restablecer/" element={<ResetPasswordPage />} />
      <Route
        path="/inicio"
        element={
          <PrivateRoute>
            <InicioPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="usuarios" element={<AdminUsersPage />} />
        <Route path="sintomas" element={<AdminSintomasPage />} />
        <Route path="contenido" element={<AdminContenidoPage />} />
        <Route path="reglas" element={<AdminReglasPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
