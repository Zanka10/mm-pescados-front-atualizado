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

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  CANCELED: 'Cancelado',
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
                  <span className="order-status">{STATUS_LABEL[order.status || ''] || order.status || 'Pendente'}</span>
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
