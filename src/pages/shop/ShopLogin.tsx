import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useSession } from '../../contexts/SessionContext'
import type { UserRole } from '../../contexts/SessionContext'
import '../../assets/styles/App.css'

export default function ShopLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useSession()

  async function handleGoogleLogin() {
    setIsSubmitting(true)
    setError('')
    try {
      const data = await api.post('/auth/sign-in/social', {
        provider: 'google',
        callbackURL: `${window.location.origin}/loja`,
      }, true)

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err?.message || 'Falha na autenticação com Google. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Informe e-mail e senha')
      return
    }

    setIsSubmitting(true)

    try {
      await api.post(
        '/auth/sign-in/email',
        {
          email: email.trim().toLowerCase(),
          password,
        },
        true
      )

      const session = await api.get('/auth/get-session', true)

      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.name || session.user.email || 'Cliente',
          email: session.user.email || '',
          role: session.user.role as UserRole,
          phone: session.user.phone || '',
        })
        navigate('/loja')
      } else {
        setError('Não foi possível validar a sessão do usuário.')
      }
    } catch (err: any) {
      console.error('Erro no login do cliente:', err)
      setError(
        err?.message || 'Falha ao validar login. Verifique suas credenciais.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login shop-login">
      <div className="login-brand">
        <img
          src="/logo-mm-pescados.png"
          alt="Mm Pescados"
          className="brand-logo"
        />
        <p
          className="brand-caption"
          style={{
            letterSpacing: '0.2em',
            color: 'var(--primary)',
            fontWeight: 700,
          }}
        >
          ÁREA DO CLIENTE
        </p>
      </div>

      <div className="login-panel">
        <h2
          style={{
            textAlign: 'center',
            marginBottom: '24px',
            color: 'var(--text-main)',
            fontSize: '20px',
          }}
        >
          Bem-vindo de volta!
        </h2>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <div className="input-wrapper">
              <svg
                className="input-icon-left"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
              </svg>
              <input
                type="email"
                className="login-input with-icon"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="E-mail"
              />
            </div>
          </label>

          <label className="field">
            <div className="input-wrapper">
              <svg
                className="input-icon-left"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 17a2 2 0 1 0-2-2 2 2 0 0 0 2 2zm6-7h-1V8a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v8h16v-8a2 2 0 0 0-2-2zm-3 0H9V8a3 3 0 0 1 6 0z" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input with-icon with-toggle"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Senha"
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d={
                      showPassword
                        ? 'M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 5-5 5 5 0 0 1-5 5z'
                        : 'M3 3l18 18-1.41 1.41L17.73 19C15.93 20 14.06 20.5 12 20.5 5 20.5 2 13.5 2 13.5a20.62 20.62 0 0 1 5.23-6.49L1.59 4.41 3 3zm9 2.5c7 0 10 8 10 8a20.94 20.94 0 0 1-5.27 6.54l-2.14-2.14A5 5 0 0 0 9.1 9.1l-2.3-2.3A21.07 21.07 0 0 1 12 5.5z'
                    }
                  />
                </svg>
              </button>
            </div>
          </label>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
            style={{ background: 'var(--primary)' }}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar na Loja'}
          </button>

          <div className="login-divider">
            <span>OU</span>
          </div>

          <button
            type="button"
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          <div
            style={{
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            Ainda não tem conta?{' '}
            <Link
              to="/cadastro"
              style={{
                color: 'var(--primary)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Cadastre-se
            </Link>
          </div>
        </form>
      </div>

      <div className="login-copy">© 2026 MM Pescados - Todos os direitos reservados</div>
    </div>
  )
}