import { useMemo, useEffect, useState, useCallback } from 'react'
import { storageService } from '../../services/storage.service'
import { formatCurrency } from '../../utils/formatters'

export default function DashboardHome() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    try {
      setLoading(true)
      const ordersData = storageService.getOrders()

      setOrders(ordersData)
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Ouvir novos pedidos para atualizar o dashboard instantaneamente
  useEffect(() => {
    const handleRefreshSignal = () => {
      fetchData()
    }

    window.addEventListener('refresh-orders-list', handleRefreshSignal)
    
    return () => {
      window.removeEventListener('refresh-orders-list', handleRefreshSignal)
    }
  }, [fetchData])

  const stats = useMemo(() => {
    const totalSales = orders.reduce((acc, o) => acc + (o.total || 0), 0)
    const pendingOrders = orders.filter(o => o.status === 'Pendente').length

    return {
      totalSales,
      totalOrders: orders.length,
      pendingOrders
    }
  }, [orders])

  const recentOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5)
  }, [orders])

  if (loading) return <div className="loading">Carregando dados...</div>

  return (
    <div className="dashboard-home">
      <header className="main-header">
        <div>
          <h1 className="main-title">Dashboard</h1>
          <p className="main-subtitle">Bem-vindo ao painel da MM Pescados</p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon sales">
            <span role="img" aria-label="vendas">💰</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Vendas Totais</span>
            <span className="stat-value">{formatCurrency(stats.totalSales)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">
            <span role="img" aria-label="pedidos">📦</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Pedidos Totais</span>
            <span className="stat-value">{stats.totalOrders}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <span role="img" aria-label="pendentes">⏳</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Pedidos Pendentes</span>
            <span className="stat-value">{stats.pendingOrders}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card recent-orders-card">
          <div className="card-header">
            <h3>Pedidos Recentes</h3>
            <a href="/dashboard/pedidos" className="view-all">Ver todos</a>
          </div>
          <div className="table">
            <div className="table-head" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
              <div className="th">Cliente</div>
              <div className="th">Total</div>
              <div className="th">Status</div>
            </div>
            {recentOrders.length === 0 ? (
              <div className="empty-state">Nenhum pedido recente.</div>
            ) : (
              recentOrders.map(o => (
                <div className="table-row" key={o.id} style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                  <div className="td">
                    <div className="td-title">{o.clientName}</div>
                    <div className="td-sub">{o.date ? new Date(o.date).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="td" style={{ fontWeight: 700 }}>{formatCurrency(o.total || 0)}</div>
                  <div className="td">
                    <span className={`status-chip ${o.status === 'Pendente' ? 'chip-pending' : o.status === 'Em andamento' ? 'chip-progress' : o.status === 'Concluido' ? 'chip-done' : o.status === 'Cancelado' ? 'chip-cancel' : ''}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card performance-card">
          <div className="card-header">
            <h3>Metas e Desempenho</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Conversão de Vendas</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>85%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: 'var(--primary)' }}></div>
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Pedidos Concluídos</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{stats.totalOrders > 0 ? Math.round(((stats.totalOrders - stats.pendingOrders) / stats.totalOrders) * 100) : 0}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${stats.totalOrders > 0 ? ((stats.totalOrders - stats.pendingOrders) / stats.totalOrders) * 100 : 0}%`, 
                  height: '100%', 
                  background: '#2196f3' 
                }}></div>
              </div>
            </div>
            <div style={{ padding: '20px', background: 'rgba(18, 158, 98, 0.05)', borderRadius: '16px', border: '1px dashed var(--primary)' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--primary)', lineHeight: '1.5', fontWeight: 500 }}>
                💡 <b>Dica:</b> Você atingiu 90% da sua meta semanal! Continue assim para bater o recorde do mês.
              </p>
            </div>
          </div>
        </div>
      </div>

      <button className="notification-fab">
        <span className="fab-icon">🔔</span>
        Ativar Som de Notificações
      </button>
    </div>
  )
}
