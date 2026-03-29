import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { storageService } from '../../services/storage.service'
import '../../assets/styles/App.css'

declare global {
  interface Window {
    google: any;
  }
}

export default function ShopLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const handleGoogleResponse = async (response: any) => {
      setIsSubmitting(true);
      setError('');
      try {
        const res = await api.post('/auth/google', {
          token: response.credential
        }, true);

        if (res && res.token) {
          storageService.setShopAuth(
            true,
            {
              name: res.user?.name || 'Cliente',
              email: res.user?.email,
              phone: res.user?.phone || '',
            },
            res.token
          );
          navigate('/loja');
        }
      } catch (err: any) {
        console.error('Erro no login Google:', err);
        setError('Falha na autenticação com Google. Tente novamente.');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-login-btn'),
        { theme: 'outline', size: 'large', width: '100%' }
      );
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    if (!email.trim() || !password.trim()) {
      setError('Informe e-mail e senha')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await api.post('/auth/sign-in/email', {
        email: email.trim().toLowerCase(),
        password: password
      }, true)

      if (response && response.token) {
        storageService.setShopAuth(
          true,
          {
            name: response.user?.name || response.user?.email || 'Cliente',
            email: response.user?.email,
            phone: response.user?.phone || '',
          },
          response.token
        )
        navigate('/loja')
      } else {
        setError('Resposta da API inválida')
      }
    } catch (err: any) {
      console.error('Erro no login do cliente:', err)
      setError(err.message || 'Falha ao validar login. Verifique suas credenciais.')
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
        <p className="brand-caption" style={{ letterSpacing: '0.2em', color: 'var(--primary)', fontWeight: 700 }}>ÁREA DO CLIENTE</p>
      </div>
      
      <div className="login-panel">
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-main)', fontSize: '20px' }}>Bem-vindo de volta!</h2>
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <div className="input-wrapper">
              <svg className="input-icon-left" viewBox="0 0 24 24" aria-hidden="true">
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
              <svg className="input-icon-left" viewBox="0 0 24 24" aria-hidden="true">
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
          
          <button type="submit" className="login-button" disabled={isSubmitting} style={{ background: 'var(--primary)' }}>
            {isSubmitting ? 'Entrando...' : 'Entrar na Loja'}
          </button>
          
          <div className="login-divider">
            <span>OU</span>
          </div>

          <div id="google-login-btn" style={{ marginBottom: '16px' }}></div>
          
          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            Ainda não tem conta? <Link to="/cadastro" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Cadastre-se</Link>
          </div>
        </form>
      </div>
      
      <div className="login-copy">© {new Date().getFullYear()} MM Pescados</div>
    </div>
  )
}
