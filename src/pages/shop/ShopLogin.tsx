import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useSession } from '../../contexts/SessionContext'
import type { UserRole } from '../../contexts/SessionContext'
import '../../assets/styles/App.css'

declare global {
  interface Window {
    google: any
  }
}

export default function ShopLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const googleInitializedRef = useRef(false)
  const navigate = useNavigate()
  const { setUser } = useSession()

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const buttonElement = document.getElementById('google-login-btn')

    if (!clientId || !window.google || !buttonElement) return
    if (googleInitializedRef.current) return

    const handleGoogleResponse = async (response: any) => {
      setIsSubmitting(true)
      setError('')

      try {
        await api.post(
          '/auth/sign-in/social',
          {
            provider: 'google',
            credential: response.credential,
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
        console.error('Erro no login Google:', err)
        setError(
          err?.message || 'Falha na autenticação com Google. Tente novamente.'
        )
      } finally {
        setIsSubmitting(false)
      }
    }

    try {
      googleInitializedRef.current = true
      buttonElement.innerHTML = ''

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      })

      window.google.accounts.id.renderButton(buttonElement, {
        theme: 'outline',
        size: 'large',
        width: 320,
      })
    } catch (err) {
      console.error('Erro ao inicializar botão Google:', err)
      googleInitializedRef.current = false
    }
  }, [navigate])

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

          <div
            id="google-login-btn"
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'center',
            }}
          ></div>

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

      <div className="login-copy">© {new Date().getFullYear()} MM Pescados</div>
    </div>
  )
}