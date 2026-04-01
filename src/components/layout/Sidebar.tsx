import { NavLink } from 'react-router-dom'

type Props = {
  onLogout?: () => void
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ onLogout, isOpen, onClose }: Props) {
  const authUser = (() => {
    try {
      const raw = localStorage.getItem('mm-auth-user')
      return raw ? JSON.parse(raw) as { name?: string; email?: string; role?: string } : null
    } catch {
      return null
    }
  })()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 95
          }}
        />
      )}

      <aside className={`dash-sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo-mm-pescados.png" alt="Mm Pescados" className="sidebar-logo" />
          <button className="sidebar-close" onClick={onClose} style={{ display: 'none' }}>×</button>
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar" style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'var(--primary)', 
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '800',
            color: 'white'
          }}>
            {authUser?.name?.charAt(0) ?? 'U'}
          </div>
          <div>{authUser?.name ?? 'Usuário'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{authUser?.role ?? 'Admin'}</div>
        </div>

        <nav className="sidebar-nav">
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/dashboard" onClick={onClose}>
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </span>
            Dashboard
          </NavLink>
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/produtos" onClick={onClose}>
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </span>
            Produtos
          </NavLink>
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/pedidos" onClick={onClose}>
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            </span>
            Pedidos
          </NavLink>
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/clientes" onClick={onClose}>
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </span>
            Clientes
          </NavLink>
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/usuarios" onClick={onClose}>
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </span>
            Usuários
          </NavLink>

          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/relatorios" onClick={onClose}>
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            </span>
            Relatórios
          </NavLink>
          
          <div style={{ margin: '20px 0', height: '1px', background: 'var(--border-color)' }}></div>

          <NavLink className="nav-item" to="/loja" target="_blank">
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </span>
            Ver Loja
          </NavLink>
          <button className="nav-item" onClick={() => onLogout?.()}>
            <span className="nav-icon" style={{ color: '#ff6b6b' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </span>
            Sair
          </button>
        </nav>
        <div className="sidebar-footer" style={{ 
          padding: '24px 20px', 
          borderTop: '1px solid var(--border-color)', 
          marginTop: 'auto',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-muted)', 
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}>
            © 2026 MM Pescados
          </p>
          <p style={{ 
            fontSize: '10px', 
            color: 'rgba(255,255,255,0.2)', 
            marginTop: '4px',
            textTransform: 'uppercase'
          }}>
            Todos os direitos reservados
          </p>
        </div>
      </aside>
    </>
  )
}
