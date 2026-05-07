import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/Dashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  </StrictMode>,
)
