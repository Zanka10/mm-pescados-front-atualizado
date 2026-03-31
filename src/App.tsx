import React, { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import './assets/styles/App.css'
import Dashboard from './components/layout/Dashboard'
import Login from './components/admin/Login'
import Shop from './pages/shop/Shop'
import ShopLogin from './pages/shop/ShopLogin'
import ShopRegister from './pages/shop/ShopRegister'
import ShopOrders from './pages/shop/ShopOrders'
import ShopAccount from './pages/shop/ShopAccount'
import { SessionProvider, useSession } from './contexts/SessionContext'
import { storageService } from './services/storage.service'
import { api } from './services/api'

function AppRoutes() {
  const { user, loading, setUser, clearSession } = useSession()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF'
  const isShopUser = user?.role === 'USER'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Informe email e senha')
      return
    }

    try {
      await api.post('/auth/sign-in/email/admin', {
        email: username.trim().toLowerCase(),
        password,
      }, true)

      const session = await api.get('/auth/get-session', true)

      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.name || session.user.email || 'Usuário',
          email: session.user.email || '',
          role: session.user.role,
          phone: session.user.phone || '',
        })
      } else {
        setError('Não foi possível validar a sessão do usuário.')
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao validar login. Verifique suas credenciais.')
    }
  }

  async function handleAdminLogout() {
    await clearSession()
    setUsername('')
    setPassword('')
    setError('')
  }

  function publicRoute(element: React.ReactElement) {
    if (loading) return null
    if (isAdmin) return <Navigate to="/dashboard" replace />
    if (isShopUser) return <Navigate to="/loja" replace />
    return element
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#080b16' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#129e62', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <Routes>
      {/* Rotas públicas — redirecionam se já houver sessão */}
      <Route path="/login" element={publicRoute(
        <Login
          username={username}
          password={password}
          error={error}
          showPassword={showPassword}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          onSubmit={handleSubmit}
        />
      )} />
      <Route path="/loja/login" element={publicRoute(<ShopLogin />)} />
      <Route path="/cadastro" element={publicRoute(<ShopRegister />)} />

      {/* Rotas privadas da loja — acessíveis por clientes e admins */}
      <Route
        path="/loja"
        element={(isShopUser || isAdmin)
          ? <Shop onLogout={isShopUser ? clearSession : undefined} />
          : <Navigate to="/loja/login" replace />
        }
      />
      <Route
        path="/loja/pedidos"
        element={(isShopUser || isAdmin)
          ? <ShopOrders />
          : <Navigate to="/loja/login" replace />
        }
      />
      <Route
        path="/loja/conta"
        element={(isShopUser || isAdmin)
          ? <ShopAccount />
          : <Navigate to="/loja/login" replace />
        }
      />

      {/* Rotas privadas do admin */}
      <Route
        path="/*"
        element={isAdmin
          ? <Dashboard onLogout={handleAdminLogout} />
          : <Navigate to="/login" replace />
        }
      />
    </Routes>
  )
}

export default function App() {
  storageService.clearOrders()

  return (
    <SessionProvider>
      <BrowserRouter>
        <NuqsAdapter>
          <AppRoutes />
        </NuqsAdapter>
      </BrowserRouter>
    </SessionProvider>
  )
}
