import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage.jsx'
import InicioPage from './pages/InicioPage.jsx'

function isAuthenticated() {
  return Boolean(sessionStorage.getItem('vitalbot_token'))
}

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route
        path="/inicio"
        element={
          <PrivateRoute>
            <InicioPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
