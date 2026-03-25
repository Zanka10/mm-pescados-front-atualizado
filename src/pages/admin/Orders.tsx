import { useMemo, useState } from 'react'
import type { Order, OrderStatus, Payment } from '../../types'
import { storageService } from '../../services/storage.service'
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters'

export default function Orders() {
  const [items, setItems] = useState<Order[]>(() => storageService.getOrders())
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<'Todos' | OrderStatus>('Todos')
  const [period, setPeriod] = useState<'Hoje' | 'Últimos 7 dias' | 'Últimos 30 dias' | 'Todos'>('Últimos 7 dias')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<Partial<Order>>({
    clientName: '',
    clientPhone: '',
    total: 0,
    payment: 'Pix',
    status: 'Pendente'
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const startDate =
      period === 'Hoje' ? new Date().setHours(0, 0, 0, 0) :
      period === 'Últimos 7 dias' ? now - 7 * day :
      period === 'Últimos 30 dias' ? now - 30 * day : 0
    return items.filter((o) => {
      const matchesSearch =
        o.clientName.toLowerCase().includes(q) ||
        o.clientPhone.toLowerCase().includes(q) ||
        o.id.toString().includes(q)
      const matchesStatus = statusTab === 'Todos' || o.status === statusTab
      const matchesPeriod = o.date >= startDate
      return matchesSearch && matchesStatus && matchesPeriod
    })
  }, [items, search, statusTab, period])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const totalAmount = useMemo(() => filtered.reduce((acc, o) => acc + o.total, 0), [filtered])

  function updateStatus(id: number, newStatus: OrderStatus) {
    const next = items.map(o => o.id === id ? { ...o, status: newStatus } : o)
    setItems(next)
    storageService.setOrders(next)
  }

  function sendWhatsApp(order: Order) {
    const phone = order.clientPhone.split('|')[0].replace(/\D/g, '')
    if (!phone) {
      alert('Telefone do cliente não encontrado!')
      return
    }

    const itemsList = order.items?.map(item => 
      `• ${item.quantity}x ${item.productName} - ${formatCurrency(item.price * item.quantity)}`
    ).join('\n') || 'Nenhum item detalhado'

    const message = encodeURIComponent(
      `*MM Pescados - Atualização do Pedido #${order.id}*\n\n` +
      `Olá, *${order.clientName}*! Seu pedido agora está com o status: *${order.status}*\n\n` +
      `*Detalhes do Pedido:*\n${itemsList}\n\n` +
      `*Total:* ${formatCurrency(order.total)}\n` +
      `*Pagamento:* ${order.payment}\n\n` +
      `*Endereço:* ${order.clientPhone.split('|')[1] || 'Retirada'}\n\n` +
      `Obrigado por comprar conosco! 🐟`
    )

    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank')
  }

  function remove(id: number) {
    if (!confirm('Deseja realmente excluir este pedido?')) return
    const next = items.filter(o => o.id !== id)
    setItems(next)
    storageService.setOrders(next)
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientName?.trim() || !form.total) return

    const newOrder: Order = {
      id: items.length > 0 ? Math.max(...items.map(o => o.id)) + 1 : 1,
      clientName: form.clientName || '',
      clientPhone: form.clientPhone || '',
      total: form.total || 0,
      payment: (form.payment as Payment) || 'Pix',
      status: (form.status as OrderStatus) || 'Pendente',
      items: [],
      date: Date.now(),
      createdAt: Date.now()
    }

    const next = [newOrder, ...items]
    setItems(next)
    storageService.setOrders(next)
    setModalOpen(false)
    setForm({ clientName: '', clientPhone: '', total: 0, payment: 'Pix', status: 'Pendente' })
  }

  return (
    <div className="dashboard-home">
      <header className="main-header">
        <div>
          <h1 className="main-title">Pedidos</h1>
          <p className="main-subtitle">Gerencie os pedidos da loja</p>
        </div>
        <button className="button button-success" onClick={() => {
          setForm({ clientName: '', clientPhone: '', total: 0, payment: 'Pix', status: 'Pendente' });
          setModalOpen(true);
        }}>
          <span className="button-icon">
            <svg viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </span>
          Novo Pedido
        </button>
      </header>

      <div className="toolbar">
        <div className="search">
          <svg className="search-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
          </svg>
          <input
            className="search-input"
            placeholder="Buscar por ID, cliente ou status..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="select">
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value as typeof period)
              setPage(1)
            }}
          >
            <option>Hoje</option>
            <option>Últimos 7 dias</option>
            <option>Últimos 30 dias</option>
            <option>Todos os períodos</option>
          </select>
        </div>
      </div>

      <div className="orders-tabs">
        {['Todos', 'Pendentes', 'Em andamento', 'Concluidos', 'Cancelados'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${statusTab === (tab === 'Pendentes' ? 'Pendente' : tab === 'Concluidos' ? 'Concluido' : tab === 'Cancelados' ? 'Cancelado' : tab) ? 'active' : ''}`}
            onClick={() => {
              const map = tab === 'Pendentes' ? 'Pendente' : tab === 'Concluidos' ? 'Concluido' : tab === 'Cancelados' ? 'Cancelado' : tab
              setStatusTab(map as any); setPage(1)
            }}
          >
            {tab}
          </button>
        ))}
        <div className="orders-total">
          <span>{filtered.length} pedidos</span>
          <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
          <span style={{ color: '#129e62' }}>{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <div className="card">
        <div className="table">
          <div className="table-head" style={{ gridTemplateColumns: '0.6fr 2fr 1.5fr 1fr 1fr 1.2fr 1fr' }}>
            <div className="th">ID</div>
            <div className="th">Cliente</div>
            <div className="th">Data/Hora</div>
            <div className="th">Total</div>
            <div className="th">Pagamento</div>
            <div className="th">Status</div>
            <div className="th" style={{ textAlign: 'right' }}>Ações</div>
          </div>
          {current.length === 0 ? (
            <div className="empty-state">Nenhum pedido encontrado.</div>
          ) : (
            current.map((o) => (
              <div className="table-row" key={o.id} style={{ gridTemplateColumns: '0.6fr 2fr 1.5fr 1fr 1fr 1.2fr 1fr' }}>
                <div className="td" style={{ fontWeight: 700, color: '#8a93a3' }}>#{o.id}</div>
                <div className="td">
                  <div className="td-title">{o.clientName}</div>
                  <div className="td-sub">{o.clientPhone}</div>
                </div>
                <div className="td">
                  <div className="td-title">{formatDate(o.date)}</div>
                  <div className="td-sub">{formatTime(o.date)}</div>
                </div>
                <div className="td" style={{ fontWeight: 700 }}>{formatCurrency(o.total)}</div>
                <div className="td">
                  <span className={`pay-chip ${o.payment === 'Cartão' ? 'pay-card' : o.payment === 'Dinheiro' ? 'pay-money' : o.payment === 'Pix' ? 'pay-pix' : 'pay-pending'}`}>
                    {o.payment}
                  </span>
                </div>
                <div className="td">
<select 
  className="status-select"
  value={o.status}
  onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
>
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluido">Concluido</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="td col-actions">
                  <button 
                    className="button button-edit" 
                    title="Enviar WhatsApp"
                    onClick={() => sendWhatsApp(o)}
                    style={{ color: '#25D366', background: 'rgba(37, 211, 102, 0.1)' }}
                  >
                    <span className="button-icon">
                      <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zM12.04 20.14c-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.211 8.211 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.177 8.177 0 0 1 2.41 5.83c.01 4.54-3.69 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.45.06-.68.31-.22.25-.87.85-.87 2.08 0 1.23.89 2.42 1.01 2.58.12.17 1.75 2.67 4.23 3.74.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.07-.1-.23-.16-.48-.28z" /></svg>
                    </span>
                  </button>
                  <button className="button button-pdf" title="Gerar PDF">
                    <span className="button-icon">
                      <svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6zM8 9h8v2H8zm0 4h8v2H8z" /></svg>
                    </span>
                  </button>
                  <button className="button button-delete" onClick={() => remove(o.id)} title="Excluir">
                    <span className="button-icon">
                      <svg viewBox="0 0 24 24"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zm3.46-9h1.5v8h-1.5zm5.58 0h1.5v8h-1.5zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="table-footer">
          <div className="table-footer-left">
            <div>
              Mostrando <b>{Math.min((page - 1) * pageSize + 1, filtered.length)}</b>-<b>{Math.min(page * pageSize, filtered.length)}</b> de <b>{filtered.length}</b>
            </div>
            <div className="page-size-selector">
              <span>Mostrar:</span>
              <select 
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pager">
            <div className="pager-buttons">
              <button className="pager-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span style={{ padding: '0 12px' }}>Página {page} de {totalPages}</span>
              <button className="pager-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal">
          <div className="modal-card">
            <div className="modal-title">Cadastrar Pedido</div>
            <form className="modal-form" onSubmit={submitForm}>
              <label className="modal-field">
                <span>Nome do Cliente</span>
                <input 
                  value={form.clientName} 
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })} 
                  required 
                />
              </label>
              <label className="modal-field">
                <span>Telefone</span>
                <input 
                  value={form.clientPhone} 
                  onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} 
                />
              </label>
              <label className="modal-field">
                <span>Total (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.total || ''}
                  onChange={(e) => setForm({ ...form, total: Number(e.target.value) })}
                  required
                />
              </label>
              <label className="modal-field">
                <span>Forma de Pagamento</span>
                <select
                  value={form.payment}
                  onChange={(e) => setForm({ ...form, payment: e.target.value as Payment })}
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Pend.">Pendente</option>
                </select>
              </label>
              <label className="modal-field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as OrderStatus })}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluido">Concluido</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="button" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="button button-success">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
