type Props = {
  username: string
  password: string
  error: string
  showPassword: boolean
  onUsernameChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onTogglePassword: () => void
  onSubmit: (e: React.FormEvent) => void
}

export default function Login({
  username,
  password,
  error,
  showPassword,
  onUsernameChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: Props) {
  return (
    <div className="login">
      <div className="login-brand">
        <img
          src="/mm-logo.png"
          onError={(ev) => {
            const img = ev.currentTarget
            img.src = '/logo-mm-pescados.png'
          }}
          alt="Mm Pescados"
          className="brand-logo"
        />
      </div>
      <div className="login-panel">
        <form className="login-form" onSubmit={onSubmit} noValidate>
          <label className="field">
            <div className="input-wrapper">
              <svg className="input-icon-left" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
              </svg>
              <input
                type="text"
                className="login-input with-icon"
                placeholder="Digite seu e-mail"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                aria-label="Usuário"
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
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                aria-label="Senha"
              />
              <button
                type="button"
                className="input-icon-right"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={onTogglePassword}
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
            <div className="field-actions">
              <a href="#" className="forgot-link">Esqueceu sua senha?</a>
            </div>
          </label>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-button">Acessar</button>
        </form>
      </div>
      <div className="login-copy">© {new Date().getFullYear()} MM Pescados</div>
    </div>
  )
}
