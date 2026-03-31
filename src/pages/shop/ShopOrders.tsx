import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../../assets/styles/Shop.css'
import { api } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'

type ApiOrderItem = {
  id?: string
  quantity?: number
  unitPriceCents?: number
  totalCents?: number
  product?: {
    id?: string
    name?: string
    imageUrl?: string | null
  }
}

type ApiPayment = {
  id?: string
  status?: string
  method?: string
  checkoutUrl?: string | null
  paymentUrl?: string | null
  redirectUrl?: string | null
  url?: string | null
  paidAt?: string | null
}

type ApiOrder = {
  id?: string
  code?: string
  status?: string
  totalCents?: number
  subtotalCents?: number
  shippingCents?: number
  createdAt?: string
  items?: ApiOrderItem[]
  payments?: ApiPayment[]
}

function normalizeOrders(payload: any): ApiOrder[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.orders)) return payload.orders
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.orders)) return payload.data.orders
  return []
}

function resolvePaymentUrl(order: ApiOrder) {
  const payment = order.payments?.[0]
  return payment?.redirectUrl || payment?.paymentUrl || payment?.url || payment?.checkoutUrl || null
}

export default function ShopOrders() {
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadOrders() {
      try {
        setLoading(true)
        setError('')

        let response: any
        try {
          response = await api.get('/orders/my')
        } catch {
          response = await api.get('/orders/me')
        }

        if (active) {
          setOrders(normalizeOrders(response))
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || 'Não foi possível carregar seus pedidos.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOrders()
    return () => {
      active = false
    }
  }, [])

  const ordered = useMemo(() => {
    return [...orders].sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return db - da
    })
  }, [orders])

  return (
    <div className="shop-panel-page">
      <div className="shop-panel-header">
        <div>
          <span className="shop-panel-badge">Área do Cliente</span>
          <h1>Meus Pedidos</h1>
          <p>Acompanhe seus pedidos e continue o pagamento quando necessário.</p>
        </div>
        <Link to="/loja" className="shop-panel-back">Voltar para a loja</Link>
      </div>

      {loading && <div className="shop-panel-card">Carregando pedidos...</div>}
      {!loading && error && <div className="shop-panel-card shop-panel-error">{error}</div>}

      {!loading && !error && ordered.length === 0 && (
        <div className="shop-panel-card">
          <p>Você ainda não possui pedidos.</p>
        </div>
      )}

      {!loading && !error && ordered.length > 0 && (
        <div className="shop-orders-list">
          {ordered.map((order) => {
            const paymentUrl = resolvePaymentUrl(order)
            return (
              <div key={order.id || order.code} className="shop-panel-card order-card">
                <div className="order-card-top">
                  <div>
                    <strong>{order.code || `Pedido ${order.id}`}</strong>
                    <span className="order-date">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : 'Sem data'}
                    </span>
                  </div>
                  <span className="order-status">{order.status || 'PENDING'}</span>
                </div>

                <div className="order-summary-grid">
                  <div>
                    <small>Total</small>
                    <strong>{formatCurrency((order.totalCents || 0) / 100)}</strong>
                  </div>
                  <div>
                    <small>Itens</small>
                    <strong>{order.items?.length || 0}</strong>
                  </div>
                  <div>
                    <small>Pagamento</small>
                    <strong>{order.payments?.[0]?.method || 'Não informado'}</strong>
                  </div>
                  <div>
                    <small>Status pagamento</small>
                    <strong>{order.payments?.[0]?.status || 'Pendente'}</strong>
                  </div>
                </div>

                {!!order.items?.length && (
                  <div className="order-items-list">
                    {order.items.map((item, index) => (
                      <div key={item.id || `${order.id}-${index}`} className="order-item-row">
                        <span>
                          {item.quantity || 0}x {item.product?.name || 'Produto'}
                        </span>
                        <strong>{formatCurrency(((item.totalCents ?? (item.unitPriceCents || 0) * (item.quantity || 0)) || 0) / 100)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {paymentUrl && (
                  <div className="order-actions-row">
                    <a href={paymentUrl} target="_blank" rel="noreferrer" className="order-pay-btn">
                      Ir para pagamento
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
