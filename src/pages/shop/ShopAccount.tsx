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
    </div>
  )
}
