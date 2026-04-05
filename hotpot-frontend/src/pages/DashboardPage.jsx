import { useState, useEffect } from 'react'

function DashboardPage() {
  const [today, setToday] = useState(null)
  const [tables, setTables] = useState([])
  const [plates, setPlates] = useState([])
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [t, tb, pl, pe] = await Promise.all([
        fetch('/api/dashboard/today').then(r => r.json()),
        fetch('/api/dashboard/tables').then(r => r.json()),
        fetch('/api/dashboard/plates').then(r => r.json()),
        fetch('/api/dashboard/periods').then(r => r.json()),
      ])
      setToday(t)
      setTables(tb)
      setPlates(pl)
      setPeriods(pe)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  if (loading) return <div style={styles.loading}>載入中...</div>

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <h2 style={styles.title}>📊 今日報表</h2>
        <button style={styles.refreshBtn} onClick={fetchAll}>🔄 更新</button>
      </div>

      {/* 當日總收入 */}
      <div style={styles.summaryGrid}>
        <div style={{ ...styles.summaryCard, borderLeft: '4px solid #e53935' }}>
          <div style={styles.summaryLabel}>今日總收入</div>
          <div style={styles.summaryValue}>${today?.total_revenue?.toFixed(2) || '0.00'}</div>
        </div>
        <div style={{ ...styles.summaryCard, borderLeft: '4px solid #1976d2' }}>
          <div style={styles.summaryLabel}>訂單數量</div>
          <div style={styles.summaryValue}>{today?.order_count || 0} 單</div>
        </div>
        <div style={{ ...styles.summaryCard, borderLeft: '4px solid #388e3c' }}>
          <div style={styles.summaryLabel}>稅金收入</div>
          <div style={styles.summaryValue}>${today?.total_tax?.toFixed(2) || '0.00'}</div>
        </div>
      </div>

      <div style={styles.row}>
        {/* 每桌記錄 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🪑 每桌消費記錄</h3>
          {tables.length === 0 ? (
            <p style={styles.empty}>今日尚無資料</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>桌號</th>
                  <th style={styles.th}>訂單數</th>
                  <th style={styles.th}>消費總計</th>
                  <th style={styles.th}>時段</th>
                </tr>
              </thead>
              <tbody>
                {tables.map(t => (
                  <tr key={t.table_id}>
                    <td style={styles.td}>桌 {t.table_id}</td>
                    <td style={styles.td}>{t.order_count}</td>
                    <td style={{ ...styles.td, color: '#e53935', fontWeight: 'bold' }}>${t.total_spent?.toFixed(2)}</td>
                    <td style={styles.td}>{t.periods}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 用餐時段 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>⏰ 用餐時段統計</h3>
          {periods.length === 0 ? (
            <p style={styles.empty}>今日尚無資料</p>
          ) : (
            periods.map(p => (
              <div key={p.meal_period} style={styles.periodRow}>
                <span style={styles.periodName}>{p.meal_period}</span>
                <span style={styles.periodOrders}>{p.order_count} 單</span>
                <span style={styles.periodRevenue}>${p.revenue?.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 盤子銷售 */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🍽️ 各盤子銷售數量</h3>
        {plates.length === 0 ? (
          <p style={styles.empty}>今日尚無資料</p>
        ) : (
          <div style={styles.platesGrid}>
            {plates.sort((a, b) => b.qty - a.qty).map(p => (
              <div key={p.name} style={styles.plateStatCard}>
                <div style={styles.plateStatName}>{p.name}</div>
                <div style={styles.plateStatQty}>{p.qty}</div>
                <div style={styles.plateStatLabel}>個</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '60px', fontSize: '18px', color: '#888' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: 0, fontSize: '22px', color: '#222' },
  refreshBtn: { padding: '8px 16px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  summaryCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  summaryLabel: { fontSize: '13px', color: '#888', marginBottom: '8px' },
  summaryValue: { fontSize: '28px', fontWeight: 'bold', color: '#222' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  section: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: '16px' },
  sectionTitle: { margin: '0 0 16px', fontSize: '16px', color: '#333' },
  empty: { color: '#aaa', textAlign: 'center', padding: '20px 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: '13px', color: '#888', borderBottom: '1px solid #f0f0f0' },
  td: { padding: '10px 12px', fontSize: '14px', borderBottom: '1px solid #f9f9f9' },
  periodRow: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' },
  periodName: { flex: 1, fontWeight: 'bold', fontSize: '15px' },
  periodOrders: { color: '#888', fontSize: '14px', marginRight: '16px' },
  periodRevenue: { color: '#e53935', fontWeight: 'bold', fontSize: '16px' },
  platesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' },
  plateStatCard: { backgroundColor: '#f9f9f9', borderRadius: '10px', padding: '16px', textAlign: 'center' },
  plateStatName: { fontSize: '13px', color: '#666', marginBottom: '8px' },
  plateStatQty: { fontSize: '32px', fontWeight: 'bold', color: '#e53935' },
  plateStatLabel: { fontSize: '12px', color: '#999' },
}

export default DashboardPage
