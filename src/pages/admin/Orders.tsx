import { useMemo, useState, useEffect } from 'react'
import { api } from '../../services/api'
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters'

interface ApiOrderItem {
  id: string
  quantity: number
  unitPriceCents: number
  totalCents: number
  product: {
    id: string
    name: string
    imageUrl: string
  }
}

interface ApiOrder {
  id: string
  code: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'CANCELED'
  totalCents: number
  createdAt: string
  customer: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  items: ApiOrderItem[]
  payments: {
    id: string
    method: string
    status: string
    amountCents: number
  }[]
}

type StatusTab = 'Todos' | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'CANCELED'

const PAYMENT_LABEL: Record<string, string> = {
  PIX: 'Pix',
  CARD: 'Cartão',
  CASH: 'Dinheiro',
}

const STATUS_TABS: { label: string; value: StatusTab }[] = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Pendentes', value: 'PENDING' },
  { label: 'Confirmados', value: 'CONFIRMED' },
  { label: 'Preparando', value: 'PREPARING' },
  { label: 'Enviados', value: 'SHIPPED' },
  { label: 'Entregues', value: 'DELIVERED' },
  { label: 'Cancelados', value: 'CANCELED' },
]

export default function Orders() {
  const [items, setItems] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<StatusTab>('Todos')
  const [period, setPeriod] = useState<'Hoje' | 'Últimos 7 dias' | 'Últimos 30 dias' | 'Todos'>('Últimos 7 dias')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [selectedInvoice, setSelectedInvoice] = useState<ApiOrder | null>(null)

  function toggleOrderExpansion(id: string) {
    const newSet = new Set(expandedOrders)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedOrders(newSet)
  }

  function handlePrint() {
    window.print()
  }

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders')
        setItems(response.data ?? [])
      } catch (err) {
        console.error('Erro ao carregar pedidos:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

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
        o.customer.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        (o.customer.phone ?? '').includes(q)
      const matchesStatus = statusTab === 'Todos' || o.status === statusTab
      const matchesPeriod = new Date(o.createdAt).getTime() >= startDate
      return matchesSearch && matchesStatus && matchesPeriod
    })
  }, [items, search, statusTab, period])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const totalAmount = useMemo(() => filtered.reduce((acc, o) => acc + o.totalCents / 100, 0), [filtered])

  function updateStatus(id: string, newStatus: ApiOrder['status']) {
    setItems(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
  }

  function sendWhatsApp(order: ApiOrder) {
    const phone = (order.customer.phone ?? '').replace(/\D/g, '')
    if (!phone) {
      alert('Telefone do cliente não encontrado!')
      return
    }

    const itemsList = order.items.map(item =>
      `• ${item.quantity}x ${item.product.name} - ${formatCurrency(item.totalCents / 100)}`
    ).join('\n')

    const message = encodeURIComponent(
      `*MM Pescados - Pedido ${order.code}*\n\n` +
      `Olá, *${order.customer.name}*!\n\n` +
      `*Itens:*\n${itemsList}\n\n` +
      `*Total:* ${formatCurrency(order.totalCents / 100)}\n\n` +
      `Obrigado por comprar conosco! 🐟`
    )

    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank')
  }

  function remove(id: string) {
    if (!confirm('Deseja realmente excluir este pedido?')) return
    setItems(prev => prev.filter(o => o.id !== id))
  }

  return (
    <div className="dashboard-home">
      <header className="main-header">
        <div>
          <h1 className="main-title">Pedidos</h1>
          <p className="main-subtitle">Gerencie os pedidos da loja</p>
        </div>
      </header>

      <div className="toolbar">
        <div className="search">
          <svg className="search-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
          </svg>
          <input
            className="search-input"
            placeholder="Buscar por código, cliente ou telefone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="select">
          <select value={period} onChange={(e) => { setPeriod(e.target.value as typeof period); setPage(1) }}>
            <option>Hoje</option>
            <option>Últimos 7 dias</option>
            <option>Últimos 30 dias</option>
            <option>Todos</option>
          </select>
        </div>
      </div>

      <div className="orders-tabs">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            className={`tab-btn ${statusTab === tab.value ? 'active' : ''}`}
            onClick={() => { setStatusTab(tab.value); setPage(1) }}
          >
            {tab.label}
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
          <div className="table-head" style={{ gridTemplateColumns: '1.5fr 2fr 1.5fr 1fr 1fr 1.2fr 1fr' }}>
            <div className="th">Código</div>
            <div className="th">Cliente</div>
            <div className="th">Data/Hora</div>
            <div className="th">Total</div>
            <div className="th">Pagamento</div>
            <div className="th">Status</div>
            <div className="th" style={{ textAlign: 'right' }}>Ações</div>
          </div>

          {loading ? (
            <div className="empty-state">Carregando pedidos...</div>
          ) : current.length === 0 ? (
            <div className="empty-state">Nenhum pedido encontrado.</div>
          ) : (
            current.map((o) => {
              const paymentMethod = o.payments[0]?.method ?? ''
              const dateMs = new Date(o.createdAt).getTime()
              const isExpanded = expandedOrders.has(o.id)

              return (
                <div key={o.id} style={{ display: 'contents' }}>
                  <div className={`table-row ${isExpanded ? 'expanded' : ''}`} style={{ gridTemplateColumns: '1.5fr 2fr 1.5fr 1fr 1fr 1.2fr 1fr', cursor: 'pointer' }} onClick={() => toggleOrderExpansion(o.id)}>
                    <div className="td" style={{ fontWeight: 700, color: '#8a93a3', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s' }}
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                      {o.code}
                    </div>
                    <div className="td">
                      <div className="td-title">{o.customer.name}</div>
                      <div className="td-sub">{o.customer.phone ?? o.customer.email}</div>
                    </div>
                    <div className="td">
                      <div className="td-title">{formatDate(dateMs)}</div>
                      <div className="td-sub">{formatTime(dateMs)}</div>
                    </div>
                    <div className="td" style={{ fontWeight: 700 }}>{formatCurrency(o.totalCents / 100)}</div>
                    <div className="td">
                      <span className={`pay-chip ${paymentMethod === 'CARD' ? 'pay-card' : paymentMethod === 'CASH' ? 'pay-money' : paymentMethod === 'PIX' ? 'pay-pix' : 'pay-pending'}`}>
                        {PAYMENT_LABEL[paymentMethod] ?? paymentMethod}
                      </span>
                    </div>
                    <div className="td" onClick={e => e.stopPropagation()}>
                      <select
                        className="status-select"
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value as ApiOrder['status'])}
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="CONFIRMED">Confirmado</option>
                        <option value="PREPARING">Preparando</option>
                        <option value="SHIPPED">Enviado</option>
                        <option value="DELIVERED">Entregue</option>
                        <option value="CANCELED">Cancelado</option>
                      </select>
                    </div>
                    <div className="td col-actions" onClick={e => e.stopPropagation()}>
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
                      <button className="button button-pdf" title="Gerar Nota Fiscal" onClick={() => setSelectedInvoice(o)}>
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

                  {isExpanded && (
                    <div className="order-items-detail">
                      <div className="order-items-list">
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                          Itens do Pedido
                        </div>
                        {o.items.map(item => (
                          <div className="order-item-row" key={item.id}>
                            <div className="order-item-info">
                              <span className="order-item-qty">{item.quantity}x</span>
                              <span className="order-item-name">{item.product.name}</span>
                            </div>
                            <div className="order-item-price">
                              {formatCurrency(item.unitPriceCents / 100)} / un • <b>{formatCurrency(item.totalCents / 100)}</b>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="table-footer">
          <div className="table-footer-left">
            <div>
              Mostrando <b>{Math.min((page - 1) * pageSize + 1, filtered.length)}</b>–<b>{Math.min(page * pageSize, filtered.length)}</b> de <b>{filtered.length}</b>
            </div>
            <div className="page-size-selector">
              <span>Mostrar:</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pager">
            <div className="pager-buttons">
              <button className="pager-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span style={{ padding: '0 12px' }}>Página {page} de {totalPages}</span>
              <button className="pager-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedInvoice && (
        <div className="modal" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-card invoice-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nota Fiscal - {selectedInvoice.code}</h2>
              <button className="modal-close" onClick={() => setSelectedInvoice(null)}>&times;</button>
            </div>

            <div className="modal-body" style={{ background: '#f8f9fa' }}>
              <div className="invoice-content">
                <div className="invoice-header">
                  <div className="invoice-logo">MM PESCADOS</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Comércio de Pescados e Frutos do Mar<br />
                    São Paulo - SP<br />
                    WhatsApp: (11) 9XXXX-XXXX
                  </div>
                </div>

                <div className="invoice-body">
                  <div className="invoice-section">
                    <div className="invoice-section-title">Dados do Pedido</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span><b>Código:</b> {selectedInvoice.code}</span>
                      <span><b>Data:</b> {formatDate(new Date(selectedInvoice.createdAt).getTime())} {formatTime(new Date(selectedInvoice.createdAt).getTime())}</span>
                    </div>
                  </div>

                  <div className="invoice-section">
                    <div className="invoice-section-title">Dados do Cliente</div>
                    <div style={{ fontSize: '12px' }}>
                      <div><b>Nome:</b> {selectedInvoice.customer.name}</div>
                      <div><b>Email:</b> {selectedInvoice.customer.email}</div>
                      <div><b>Telefone:</b> {selectedInvoice.customer.phone || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="invoice-section">
                    <div className="invoice-section-title">Itens do Pedido</div>
                    <table className="invoice-table">
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th style={{ textAlign: 'center' }}>Qtd</th>
                          <th style={{ textAlign: 'right' }}>Unitário</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map(item => (
                          <tr key={item.id}>
                            <td>{item.product.name}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPriceCents / 100)}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.totalCents / 100)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="invoice-section">
                    <div className="invoice-section-title">Pagamento</div>
                    <div style={{ fontSize: '12px' }}>
                      <b>Método:</b> {PAYMENT_LABEL[selectedInvoice.payments[0]?.method] || selectedInvoice.payments[0]?.method || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="invoice-footer">
                  <div className="invoice-total-row">
                    <span>TOTAL DO PEDIDO:</span>
                    <span>{formatCurrency(selectedInvoice.totalCents / 100)}</span>
                  </div>
                  <div style={{ marginTop: '30px', fontSize: '10px', color: '#999', textAlign: 'center' }}>
                    Obrigado pela preferência!
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="button btn-cancel" onClick={() => setSelectedInvoice(null)}>
                Fechar
              </button>
              <button type="button" className="button button-success" onClick={handlePrint}>
                <span className="button-icon">
                  <svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" /></svg>
                </span>
                Imprimir / Salvar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
