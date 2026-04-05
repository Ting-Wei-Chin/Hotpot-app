import { useState, useEffect } from 'react'

function HistoryPage() {
  const [orders, setOrders] = useState([])
  const [todayStats, setTodayStats] = useState(null)
  const [plates, setPlates] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [allOrders, stats, plateStats] = await Promise.all([
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/dashboard/today').then(r => r.json()),
        fetch('/api/dashboard/plates').then(r => r.json()),
      ])
      setOrders(allOrders.filter(o => o.status === 'paid'))
      setTodayStats(stats)
      setPlates(plateStats)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  if (loading) return <div style={s.loading}>載入中...</div>

  const periodLabel = { '早餐': '🌅', '午餐': '☀️', '晚餐': '🌙', '宵夜': '⭐' }

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <h2 style={s.title}>📊 歷史記錄</h2>
        <button style={s.refreshBtn} onClick={fetchAll}>🔄 更新</button>
      </div>

      {/* 今日收入統計 */}
      <div style={s.statsGrid}>
        <div style={{ ...s.statCard, borderLeft: '4px solid #c62828' }}>
          <div style={s.statLabel}>今日總收入</div>
          <div style={s.statValue}>NT${(todayStats?.total_revenue || 0).toFixed(0)}</div>
        </div>
        <div style={{ ...s.statCard, borderLeft: '4px solid #1976d2' }}>
          <div style={s.statLabel}>已結帳桌次</div>
          <div style={s.statValue}>{todayStats?.order_count || 0} 單</div>
        </div>
        <div style={{ ...s.statCard, borderLeft: '4px solid #388e3c' }}>
          <div style={s.statLabel}>含稅總計</div>
          <div style={s.statValue}>NT${((todayStats?.total_revenue || 0) + (todayStats?.total_tax || 0)).toFixed(0)}</div>
        </div>
      </div>

      {/* 各盤子銷售 */}
      {plates.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>今日各品項銷售量</div>
          <div style={s.platesRow}>
            {plates.sort((a, b) => b.qty - a.qty).map(p => (
              <div key={p.name} style={s.plateChip}>
                <span style={s.plateChipName}>{p.name}</span>
                <span style={s.plateChipQty}>{p.qty} 個</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 結帳記錄列表 */}
      <div style={s.section}>
        <div style={s.sectionTitle}>結帳記錄</div>
        {orders.length === 0 ? (
          <div style={s.empty}>今日尚無結帳記錄</div>
        ) : (
          orders.map(order => {
            const items = JSON.parse(order.items)
            const time = new Date(order.created_at).toLocaleString('zh-TW', {
              month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit'
            })
            return (
              <div key={order.id} style={s.orderCard}>
                <div style={s.orderHeader}>
                  <div style={s.orderLeft}>
                    <span style={s.orderTable}>{order.table_id} 桌</span>
                    <span style={s.orderPeriod}>{periodLabel[order.meal_period] || '🍽️'} {order.meal_period}</span>
                  </div>
                  <div style={s.orderRight}>
                    <span style={s.orderTime}>{time}</span>
                    <span style={s.orderTotal}>NT${order.total?.toFixed(0)}</span>
                  </div>
                </div>
                <div style={s.orderItems}>
                  {items.map((item, i) => (
                    <span key={i} style={s.itemTag}>{item.name} × {item.qty}</span>
                  ))}
                </div>
                <div style={s.orderFooter}>
                  <span style={s.footerText}>小計 NT${order.subtotal?.toFixed(0)} ＋ 稅金 NT${order.tax?.toFixed(0)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const s = {
  page: { padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: '60px', color: '#888', fontSize: '16px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: 0, fontSize: '20px', color: '#222' },
  refreshBtn: { padding: '8px 16px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' },
  statCard: { backgroundColor: 'white', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  statLabel: { fontSize: '13px', color: '#888', marginBottom: '8px' },
  statValue: { fontSize: '26px', fontWeight: 'bold', color: '#222' },
  section: { backgroundColor: 'white', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: '16px' },
  sectionTitle: { fontWeight: 'bold', fontSize: '15px', color: '#333', marginBottom: '14px' },
  platesRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  plateChip: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fce4ec', borderRadius: '20px', padding: '6px 14px' },
  plateChipName: { fontSize: '13px', fontWeight: 'bold', color: '#c62828' },
  plateChipQty: { fontSize: '13px', color: '#888' },
  empty: { textAlign: 'center', color: '#aaa', padding: '30px 0', fontSize: '15px' },
  orderCard: { borderBottom: '1px solid #f5f5f5', paddingBottom: '14px', marginBottom: '14px' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  orderLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  orderTable: { fontSize: '18px', fontWeight: 'bold', color: '#c62828' },
  orderPeriod: { fontSize: '13px', color: '#888', backgroundColor: '#f5f5f5', padding: '3px 10px', borderRadius: '12px' },
  orderRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  orderTime: { fontSize: '12px', color: '#aaa' },
  orderTotal: { fontSize: '18px', fontWeight: 'bold', color: '#c62828' },
  orderItems: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' },
  itemTag: { backgroundColor: '#f5f5f5', color: '#555', padding: '3px 10px', borderRadius: '12px', fontSize: '13px' },
  orderFooter: { fontSize: '12px', color: '#aaa' },
  footerText: {},
}

export default HistoryPage
