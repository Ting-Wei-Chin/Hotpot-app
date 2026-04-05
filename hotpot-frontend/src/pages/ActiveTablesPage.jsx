import { useState, useEffect } from 'react'

function ActiveTablesPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    const res = await fetch('/api/orders')
    const data = await res.json()
    const active = data.filter(o => o.status === 'active')
    setOrders(active)
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  // 把訂單依桌號分組
  const tableMap = {}
  orders.forEach(o => {
    if (!tableMap[o.table_id]) tableMap[o.table_id] = []
    tableMap[o.table_id].push(o)
  })

  const checkout = async (tableId) => {
    setCheckingOut(tableId)
    await fetch(`/api/checkout/${tableId}`, { method: 'PUT' })
    await fetchOrders()
    setCheckingOut(null)
  }

  if (loading) return <div style={s.loading}>載入中...</div>

  const tables = Object.entries(tableMap)

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <h2 style={s.title}>🪑 未結帳桌台</h2>
        <button style={s.refreshBtn} onClick={fetchOrders}>🔄 更新</button>
      </div>

      {tables.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>✅</div>
          <div>目前沒有未結帳的桌台</div>
        </div>
      ) : (
        <div style={s.grid}>
          {tables.map(([tableId, tableOrders]) => {
            const subtotal = tableOrders.reduce((sum, o) => sum + o.subtotal, 0)
            const tax = tableOrders.reduce((sum, o) => sum + o.tax, 0)
            const total = tableOrders.reduce((sum, o) => sum + o.total, 0)
            const allItems = tableOrders.flatMap(o => JSON.parse(o.items))

            // 合併相同品項
            const itemMap = {}
            allItems.forEach(i => {
              itemMap[i.name] = (itemMap[i.name] || 0) + i.qty
            })

            return (
              <div key={tableId} style={s.card}>
                <div style={s.cardHeader}>
                  <span style={s.tableName}>{tableId} 桌</span>
                  <span style={s.orderCount}>{tableOrders.length} 筆訂單</span>
                </div>

                <div style={s.period}>
                  ⏰ {tableOrders[0]?.meal_period || '—'} &nbsp;·&nbsp;
                  🕐 {new Date(tableOrders[0]?.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div style={s.itemList}>
                  {Object.entries(itemMap).map(([name, qty]) => (
                    <span key={name} style={s.itemTag}>{name} × {qty}</span>
                  ))}
                </div>

                <div style={s.priceBlock}>
                  <div style={s.priceRow}>
                    <span style={s.priceLabel}>小計</span>
                    <span>NT${subtotal.toFixed(0)}</span>
                  </div>
                  <div style={s.priceRow}>
                    <span style={s.priceLabel}>稅金</span>
                    <span>NT${tax.toFixed(0)}</span>
                  </div>
                  <div style={{ ...s.priceRow, ...s.totalRow }}>
                    <span>總計</span>
                    <span>NT${total.toFixed(0)}</span>
                  </div>
                </div>

                <button
                  style={s.checkoutBtn}
                  onClick={() => checkout(tableId)}
                  disabled={checkingOut === tableId}
                >
                  {checkingOut === tableId ? '處理中...' : '💳 結帳'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s = {
  page: { padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: '60px', color: '#888', fontSize: '16px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: 0, fontSize: '20px', color: '#222' },
  refreshBtn: { padding: '8px 16px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  empty: { textAlign: 'center', padding: '80px 20px', color: '#888', fontSize: '16px' },
  emptyIcon: { fontSize: '48px', marginBottom: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  card: { backgroundColor: 'white', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  tableName: { fontSize: '22px', fontWeight: 'bold', color: '#c62828' },
  orderCount: { fontSize: '13px', color: '#888', backgroundColor: '#f5f5f5', padding: '3px 10px', borderRadius: '12px' },
  period: { fontSize: '13px', color: '#888', marginBottom: '12px' },
  itemList: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' },
  itemTag: { backgroundColor: '#fce4ec', color: '#c62828', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '500' },
  priceBlock: { borderTop: '1px solid #f5f5f5', paddingTop: '12px', marginBottom: '16px' },
  priceRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666', marginBottom: '6px' },
  priceLabel: { color: '#aaa' },
  totalRow: { fontWeight: 'bold', fontSize: '18px', color: '#c62828', borderTop: '1px solid #f0f0f0', paddingTop: '8px', marginTop: '4px' },
  checkoutBtn: { width: '100%', padding: '12px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' },
}

export default ActiveTablesPage
