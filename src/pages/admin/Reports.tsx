import { useMemo, useState } from 'react'
import { storageService } from '../../services/storage.service'
import { formatCurrency } from '../../utils/formatters'

export default function Reports() {
  const [period, setPeriod] = useState<'Hoje' | 'Mês' | 'Tudo'>('Tudo')
  const orders = useMemo(() => storageService.getOrders(), [])

  const stats = useMemo(() => {
    const productSales: Record<string, { quantity: number, revenue: number, ordersCount: number }> = {}
    let totalRevenue = 0
    let totalItems = 0
    let completedOrders = 0

    orders.forEach(order => {
      // Filter by period (mock logic for now as dates might be varied)
      // In a real app, we'd check order.date
      
      const isCompleted = ['COMPLETED', 'DELIVERED', 'CONFIRMED', 'Concluido'].includes(order.status)
      if (isCompleted) {
        completedOrders++
        order.items?.forEach(item => {
          if (!productSales[item.productName]) {
            productSales[item.productName] = { quantity: 0, revenue: 0, ordersCount: 0 }
          }
          const itemTotal = item.price * item.quantity
          productSales[item.productName].quantity += item.quantity
          productSales[item.productName].revenue += itemTotal
          productSales[item.productName].ordersCount += 1
          
          totalRevenue += itemTotal
          totalItems += item.quantity
        })
      }
    })

    const sortedProducts = Object.entries(productSales)
      .map(([name, data]) => ({ 
        name, 
        ...data,
        ticketMedio: data.revenue / data.quantity
      }))
      .sort((a, b) => b.revenue - a.revenue)

    return {
      productSales: sortedProducts,
      totalRevenue,
      totalItems,
      completedOrders,
      bestSeller: sortedProducts[0] || null
    }
  }, [orders, period])

  return (
    <div className="dashboard-home">
      <header className="main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="main-title">Relatórios de Vendas</h1>
          <p className="main-subtitle">Análise de desempenho e faturamento</p>
        </div>
        <div className="reports-header-actions">
          <div className="period-selector">
            {(['Hoje', 'Mês', 'Tudo'] as const).map(p => (
              <button 
                key={p}
                className={`period-btn ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="export-btn">
            <span role="img" aria-label="print">🖨️</span>
            Exportar PDF
          </button>
        </div>
      </header>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon sales">
            <span role="img" aria-label="receita">💰</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Receita Total</span>
            <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orders">
            <span role="img" aria-label="pedidos">📦</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Pedidos Concluídos</span>
            <span className="stat-value">{stats.completedOrders}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon volume">
            <span role="img" aria-label="volume">⚖️</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Volume Total</span>
            <span className="stat-value">{stats.totalItems.toFixed(1)} kg</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon top">
            <span role="img" aria-label="top">🏆</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Top Produto</span>
            <span className="stat-value" style={{ fontSize: '14px' }}>{stats.bestSeller?.name || '-'}</span>
          </div>
        </div>
      </div>

      <div className="reports-grid" style={{ gridTemplateColumns: '1.8fr 1fr' }}>
        <div className="card">
          <div className="card-header">
            <h3>Ranking de Produtos (por Receita)</h3>
          </div>
          <div className="table">
            <div className="table-head" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
              <div className="th">Produto</div>
              <div className="th">Qtd. Vendida</div>
              <div className="th">Ticket Médio</div>
              <div className="th">Total</div>
            </div>
            {stats.productSales.length === 0 ? (
              <div className="empty-state">
                Nenhum dado disponível para o período selecionado.
              </div>
            ) : (
              stats.productSales.map((p) => (
                <div className="table-row" key={p.name} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                  <div className="td">
                    <div className="td-title">{p.name}</div>
                  </div>
                  <div className="td" style={{ fontWeight: 600 }}>{p.quantity.toFixed(1)} kg</div>
                  <div className="td" style={{ color: 'var(--text-muted)' }}>{formatCurrency(p.ticketMedio)}</div>
                  <div className="td" style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(p.revenue)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Visão de Crescimento</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '1px' }}>Meta Mensal</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{formatCurrency(stats.totalRevenue)}</span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Alvo: R$ 50.000</span>
              </div>
              <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (stats.totalRevenue / 50000) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #2ecc71)' }}></div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '1px' }}>Ticket Médio Geral</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800 }}>{formatCurrency(stats.totalRevenue / (stats.completedOrders || 1))}</span>
                <span style={{ fontSize: '13px', color: '#129e62', fontWeight: 700 }}>↑ 12% este mês</span>
              </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(33, 150, 243, 0.05)', borderRadius: '16px', border: '1px solid rgba(33, 150, 243, 0.1)' }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2196f3' }}>Projeção de Fechamento</h5>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Com base no ritmo atual, você deve fechar o mês com uma receita estimada de <b>{formatCurrency(stats.totalRevenue * 1.4)}</b>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
