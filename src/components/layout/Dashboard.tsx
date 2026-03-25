import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import '../../assets/styles/Dashboard.css'
import Sidebar from './Sidebar'
import Clients from '../../pages/admin/Clients'
import DashboardHome from '../../pages/admin/DashboardHome'
import Orders from '../../pages/admin/Orders'
import Users from '../../pages/admin/Users'
import Reports from '../../pages/admin/Reports'
import Products from '../../pages/admin/Products'

type Props = {
  onLogout?: () => void
}

export default function Dashboard({ onLogout }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="dash">
      <Sidebar onLogout={onLogout} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="dash-main">
        <button 
          className="mobile-toggle" 
          onClick={() => setMobileMenuOpen(true)}
          style={{
            display: 'none',
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 90,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '10px',
            borderRadius: '10px',
            color: 'var(--text-main)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <Routes>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/usuarios" element={<Users />} />
          <Route path="/relatorios" element={<Reports />} />
        </Routes>
      </main>
    </div>
  )
}
