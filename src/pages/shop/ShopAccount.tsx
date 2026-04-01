import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../../assets/styles/Shop.css'
import { api } from '../../services/api'
import { formatCep, formatPhone } from '../../utils/formatters'

type CustomerPayload = {
  id?: string
  name?: string
  email?: string
  phone?: string
  cellphone?: string
  document?: string
  cpf?: string
  taxId?: string
  zipCode?: string
  cep?: string
  street?: string
  address?: string
  number?: string
  district?: string
  city?: string
  state?: string
  complement?: string
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, '$1.$2')
  if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export default function ShopAccount() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    zipCode: '',
    street: '',
    number: '',
    district: '',
    city: '',
    state: '',
    complement: '',
  })

  useEffect(() => {
    let active = true

    async function loadCustomer() {
      try {
        const response = await api.get<CustomerPayload>('/customers/me')
        if (!active) return

        setForm({
          name: response?.name || '',
          email: response?.email || '',
          phone: response?.phone || response?.cellphone || '',
          taxId: response?.document || response?.cpf || response?.taxId || '',
          zipCode: response?.zipCode || response?.cep || '',
          street: response?.street || response?.address || '',
          number: response?.number || '',
          district: response?.district || '',
          city: response?.city || '',
          state: response?.state || '',
          complement: response?.complement || '',
        })
      } catch (err: any) {
        if (active) setError(err?.message || 'Não foi possível carregar seus dados.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCustomer()
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await api.patch('/customers/me', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        cellphone: form.phone,
        document: onlyDigits(form.taxId),
        cpf: onlyDigits(form.taxId),
        taxId: onlyDigits(form.taxId),
        zipCode: onlyDigits(form.zipCode),
        cep: onlyDigits(form.zipCode),
        street: form.street,
        address: form.street,
        number: form.number,
        district: form.district,
        city: form.city,
        state: form.state,
        complement: form.complement,
      })
      setMessage('Dados atualizados com sucesso.')
    } catch (err: any) {
      setError(err?.message || 'Não foi possível salvar seus dados.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="shop-panel-page">
      <div className="shop-panel-header">
        <div>
          <span className="shop-panel-badge">Área do Cliente</span>
          <h1>Dados da Conta</h1>
          <p>Mantenha seus dados atualizados para agilizar o checkout.</p>
        </div>
        <Link to="/loja" className="shop-panel-back">Voltar para a loja</Link>
      </div>

      <div className="shop-panel-card">
        {loading ? (
          <p>Carregando dados...</p>
        ) : (
          <form className="shop-account-form" onSubmit={handleSubmit}>
            <div className="shop-account-grid">
              <label>
                <span>Nome completo</span>
                <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              </label>
              <label>
                <span>E-mail</span>
                <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </label>
              <label>
                <span>Telefone</span>
                <input value={form.phone} maxLength={15} onChange={(e) => setForm((prev) => ({ ...prev, phone: formatPhone(e.target.value) }))} />
              </label>
              <label>
                <span>CPF</span>
                <input value={form.taxId} maxLength={14} onChange={(e) => setForm((prev) => ({ ...prev, taxId: formatCpf(e.target.value) }))} />
              </label>
              <label>
                <span>CEP</span>
                <input value={form.zipCode} maxLength={9} onChange={(e) => setForm((prev) => ({ ...prev, zipCode: formatCep(e.target.value) }))} />
              </label>
              <label>
                <span>Número</span>
                <input value={form.number} onChange={(e) => setForm((prev) => ({ ...prev, number: e.target.value }))} />
              </label>
              <label className="shop-account-grid-full">
                <span>Endereço</span>
                <input value={form.street} onChange={(e) => setForm((prev) => ({ ...prev, street: e.target.value }))} />
              </label>
              <label>
                <span>Bairro</span>
                <input value={form.district} onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))} />
              </label>
              <label>
                <span>Cidade</span>
                <input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
              </label>
              <label>
                <span>Estado</span>
                <input value={form.state} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} />
              </label>
              <label className="shop-account-grid-full">
                <span>Complemento</span>
                <input value={form.complement} onChange={(e) => setForm((prev) => ({ ...prev, complement: e.target.value }))} />
              </label>
            </div>

            {error && <div className="shop-panel-error">{error}</div>}
            {message && <div className="shop-panel-success">{message}</div>}

            <div className="shop-account-actions">
              <button type="submit" className="order-pay-btn" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar dados'}
              </button>
            </div>
          </form>
        )}
      </div>

      <footer className="shop-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-section">
              <h4>MM Pescados</h4>
              <p>Os melhores pescados de Florianópolis diretamente para sua mesa. Qualidade e frescor garantidos.</p>
              <div className="social-links" style={{ marginTop: '20px' }}>
                <a href="https://www.instagram.com/mm_pescadosfpolis/" target="_blank" rel="noreferrer" className="social-link" title="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
              </div>
            </div>

            <div className="footer-section">
              <h4>Endereço</h4>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Rua+Deputado+Walter+Gomes,+340+-+Santo+Antônio+de+Lisboa,+Florianópolis+-+SC,+88050-501" 
                target="_blank" 
                rel="noreferrer" 
                className="footer-address-link"
                style={{ textDecoration: 'none' }}
              >
                <address className="footer-address">
                  <p>Rua Deputado Walter Gomes, 340</p>
                  <p>Santo Antônio de Lisboa</p>
                  <p>Florianópolis - SC</p>
                  <p>CEP: 88050-501</p>
                  <span style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: 700, marginTop: '10px', display: 'block' }}>
                    📍 Ver no Google Maps
                  </span>
                </address>
              </a>
            </div>

            <div className="footer-section">
              <h4>Newsletter</h4>
              <p>Receba ofertas exclusivas e novidades em seu e-mail.</p>
              <form className="newsletter-form" style={{ marginTop: '15px' }} onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Seu melhor e-mail" />
                <button type="submit" className="newsletter-btn">Assinar</button>
              </form>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="copyright">© 2026 MM Pescados - Todos os direitos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
