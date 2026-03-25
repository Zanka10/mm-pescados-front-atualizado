import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './assets/styles/App.css'
import Dashboard from './components/layout/Dashboard'
import Login from './components/admin/Login'
import Shop from './pages/shop/Shop'
import { storageService } from './services/storage.service'
import { api } from './services/api'
import type { User } from './types'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loggedIn, setLoggedIn] = useState(() => storageService.isAuthenticated())
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Informe email e senha')
      return
    }

    try {
      // Chamada para a nova API de autenticação
      const response = await api.post('/auth/sign-in/email', {
        email: username.trim().toLowerCase(),
        password: password
      })

      // Supondo que a API retorne um objeto com user e token
      // Exemplo: { user: { name, email, role }, token: '...' }
      if (response && response.token) {
        setLoggedIn(true)
        storageService.setAuth(
          true, 
          { 
            name: response.user?.name || response.user?.email || 'Usuário', 
            email: response.user?.email, 
            role: response.user?.role || 'User' 
          }, 
          response.token
        )
      } else {
        setError('Resposta da API inválida')
      }
    } catch (err: any) {
      console.error('Erro no login:', err)
      setError(err.message || 'Falha ao validar login. Verifique suas credenciais.')
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/loja" element={<Shop />} />
        
        {/* Rotas de Autenticação */}
        {!loggedIn ? (
          <>
            <Route path="/login" element={
              <Login
                username={username}
                password={password}
                error={error}
                showPassword={showPassword}
                onUsernameChange={setUsername}
                onPasswordChange={setPassword}
                onTogglePassword={() => setShowPassword((v) => !v)}
                onSubmit={handleSubmit}
              />
            } />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/*"
              element={
                <Dashboard
                  onLogout={() => {
                    storageService.logout()
                    setLoggedIn(false)
                  }}
                />
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App
