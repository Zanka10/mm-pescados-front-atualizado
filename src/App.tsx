import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import './assets/styles/App.css'
import Dashboard from './components/layout/Dashboard'
import Login from './components/admin/Login'
import Shop from './pages/shop/Shop'
import ShopLogin from './pages/shop/ShopLogin'
import ShopRegister from './pages/shop/ShopRegister'
import { storageService } from './services/storage.service'
import { api } from './services/api'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loggedIn, setLoggedIn] = useState(() => storageService.isAuthenticated())
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    storageService.clearOrders()
    console.log('Todos os pedidos em localStorage foram limpos.')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Informe email e senha')
      return
    }

    try {
      await api.post(
        '/auth/sign-in/email',
        {
          email: username.trim().toLowerCase(),
          password,
        },
        true
      )

      const session = await api.get('/auth/get-session', true)

      if (session?.user) {
        setLoggedIn(true)

        storageService.setAuth(
          true,
          {
            name: session.user?.name || session.user?.email || 'Usuário',
            email: session.user?.email || '',
            role: session.user?.role || 'User',
          },
          ''
        )
      } else {
        setError('Não foi possível validar a sessão do usuário.')
      }
    } catch (err: any) {
      console.error('Erro no login:', err)
      setError(
        err?.message || 'Falha ao validar login. Verifique suas credenciais.'
      )
    }
  }

  function handleLogout() {
    storageService.logout()
    setLoggedIn(false)
    setUsername('')
    setPassword('')
    setError('')
  }

  const isShopAuthenticated = storageService.isShopAuthenticated()

  return (
    <BrowserRouter>
      <NuqsAdapter>
      <Routes>
        <Route path="/loja/login" element={<ShopLogin />} />
        <Route path="/cadastro" element={<ShopRegister />} />
        <Route
          path="/loja"
          element={
            isShopAuthenticated ? <Shop /> : <Navigate to="/loja/login" replace />
          }
        />

        {!loggedIn ? (
          <>
            <Route
              path="/login"
              element={
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
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/*"
              element={<Dashboard onLogout={handleLogout} />}
            />
          </>
        )}
      </Routes>
      </NuqsAdapter>
    </BrowserRouter>
  )
}

export default App