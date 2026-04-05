import { useState, useEffect } from 'react'

function MenuPage() {
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({})
  const [tableId, setTableId] = useState(null)
  const [showCart, setShowCart] = useState(false)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/menu').then(r => r.json()).then(setMenu)
  }, [])

  const totalQty = Object.values(cart).reduce((s, i) => s + i.qty, 0)
  const cartItems = Object.values(cart).filter(i => i.qty > 0)
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = parseFloat((subtotal * 0.1).toFixed(2))
  const total = parseFloat((subtotal + tax).toFixed(2))

  const setQty = (item, qty) => {
    const n = Math.max(0, parseInt(qty) || 0)
    setCart(prev => {
      if (n === 0) { const c = { ...prev }; delete c[item.id]; return c }
      return { ...prev, [item.id]: { ...item, qty: n } }
    })
  }

  const addItem = (item) => setQty(item, (cart[item.id]?.qty || 0) + 1)
  const removeItem = (item) => setQty(item, (cart[item.id]?.qty || 0) - 1)

  const placeOrder = async () => {
    if (!tableId) return setMessage({ type: 'error', text: '⚠️ 請先選擇桌號！' })
    if (cartItems.length === 0) return setMessage({ type: 'error', text: '⚠️ 請選擇至少一項餐點！' })
    setLoading(true)
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: parseInt(tableId), items: cartItems })
      })
      const data = await res.json()
      setMessage({ type: 'success', text: `✅ 桌號 ${tableId} 點餐成功！總計 NT$${data.total}` })
      setCart({})
      setShowCart(false)
    } catch {
      setMessage({ type: 'error', text: '❌ 點餐失敗，請重試' })
    }
    setLoading(false)
  }

  const plates = menu.filter(m => !m.isItem)
  const extras = menu.filter(m => m.isItem)

  return (
    <div style={s.page}>
      {/* 標題列 */}
      <div style={s.header}>
        <div>
          <div style={s.headerTitle}>光明石頭火鍋</div>
          <div style={s.headerSub}>員工點餐系統</div>
        </div>
        <button style={s.cartBtn} onClick={() => {
          if (!tableId) return setMessage({ type: 'error', text: '⚠️ 請先選擇桌號！' })
          setShowCart(true)
        }}>
          🛒
          {totalQty > 0 && <span style={s.badge}>{totalQty}</span>}
        </button>
      </div>

      {/* 桌號選擇 */}
      <div style={s.tableBar}>
        <span style={s.tableLabel}>選擇桌號：</span>
        <div style={s.tableButtons}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n}
              style={{ ...s.tableBtn, ...(tableId === n ? s.tableBtnActive : {}) }}
              onClick={() => { setTableId(n); setMessage(null) }}
            >{n} 桌</button>
          ))}
        </div>
      </div>

      {/* 訊息提示 */}
      {message && (
        <div style={{ ...s.msg, backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee', color: message.type === 'success' ? '#2e7d32' : '#c62828' }}>
          {message.text}
          <button style={s.msgClose} onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      {/* 未選桌號提示 */}
      {!tableId && (
        <div style={s.noTableHint}>👆 請先選擇桌號才能點餐</div>
      )}

      {/* 盤子區 */}
      <div style={s.sectionTitle}>盤子</div>
      <div style={s.grid}>
        {plates.map(item => (
          <PlateCard key={item.id} item={item}
            qty={cart[item.id]?.qty || 0}
            onAdd={() => addItem(item)}
            onRemove={() => removeItem(item)}
            onType={(v) => setQty(item, v)}
            disabled={!tableId}
          />
        ))}
      </div>

      {/* 加點區 */}
      <div style={s.sectionTitle}>加點</div>
      <div style={s.grid}>
        {extras.map(item => (
          <PlateCard key={item.id} item={item}
            qty={cart[item.id]?.qty || 0}
            onAdd={() => addItem(item)}
            onRemove={() => removeItem(item)}
            onType={(v) => setQty(item, v)}
            disabled={!tableId}
            isExtra
          />
        ))}
      </div>

      {/* 購物車 Modal */}
      {showCart && (
        <div style={s.overlay} onClick={() => setShowCart(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <span>🛒 {tableId} 桌的訂單</span>
              <button style={s.closeBtn} onClick={() => setShowCart(false)}>✕</button>
            </div>

            <div style={s.modalBody}>
              {cartItems.length === 0
                ? <p style={s.emptyCart}>尚未選擇任何餐點</p>
                : cartItems.map(item => (
                  <div key={item.id} style={s.cartRow}>
                    <div style={{ ...s.dotSmall, backgroundColor: item.bgColor, border: `3px solid ${item.borderColor}` }} />
                    <div style={s.cartInfo}>
                      <div style={s.cartName}>{item.name}</div>
                      <div style={s.cartUnitPrice}>NT${item.price} / 個</div>
                    </div>
                    <div style={s.cartQtyCtrl}>
                      <button style={s.qtyBtn} onClick={() => removeItem(item)}>－</button>
                      <input
                        type="number"
                        value={item.qty}
                        min="0"
                        onChange={e => setQty(item, e.target.value)}
                        style={s.qtyInput}
                      />
                      <button style={{ ...s.qtyBtn, ...s.qtyBtnPlus }} onClick={() => addItem(item)}>＋</button>
                    </div>
                    <div style={s.cartItemTotal}>NT${(item.price * item.qty).toFixed(0)}</div>
                  </div>
                ))
              }
            </div>

            <div style={s.modalFooter}>
              <div style={s.sumRow}><span>小計</span><span>NT${subtotal.toFixed(0)}</span></div>
              <div style={s.sumRow}><span>稅金 (10%)</span><span>NT${tax.toFixed(0)}</span></div>
              <div style={{ ...s.sumRow, ...s.sumTotal }}><span>總計</span><span>NT${total.toFixed(0)}</span></div>
              <button style={s.orderBtn} onClick={placeOrder} disabled={loading}>
                {loading ? '處理中...' : '確認送出'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlateCard({ item, qty, onAdd, onRemove, onType, disabled, isExtra }) {
  return (
    <div style={{ ...s.card, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ ...s.dot, backgroundColor: item.bgColor, border: `6px solid ${item.borderColor}` }}>
        {isExtra && <span style={{ fontSize: '30px' }}>{item.name === '雞蛋' || item.name === 'Egg' ? '🥚' : '🍚'}</span>}
      </div>
      <div style={s.cardName}>{item.name}</div>
      <div style={s.cardPrice}>NT${item.price}</div>
      {qty === 0 ? (
        <button style={{ ...s.addBtn, ...(disabled ? s.addBtnDisabled : {}) }}
          onClick={disabled ? undefined : onAdd}>
          ＋ 加入
        </button>
      ) : (
        <div style={s.qtyCtrl}>
          <button style={s.qtyBtn} onClick={onRemove}>－</button>
          <input
            type="number"
            value={qty}
            min="0"
            onChange={e => onType(e.target.value)}
            style={s.qtyInput}
          />
          <button style={{ ...s.qtyBtn, ...s.qtyBtnPlus }} onClick={onAdd}>＋</button>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: '40px' },
  header: { backgroundColor: '#c62828', color: 'white', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: '20px', fontWeight: 'bold' },
  headerSub: { fontSize: '12px', opacity: 0.8, marginTop: '2px' },
  cartBtn: { position: 'relative', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: 'white' },
  badge: { position: 'absolute', top: '-4px', right: '-6px', backgroundColor: '#333', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  tableBar: { backgroundColor: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  tableLabel: { fontWeight: 'bold', color: '#333', fontSize: '15px', whiteSpace: 'nowrap' },
  tableButtons: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  tableBtn: { padding: '6px 14px', borderRadius: '20px', border: '2px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: '#444' },
  tableBtnActive: { backgroundColor: '#c62828', color: 'white', border: '2px solid #c62828' },
  msg: { margin: '12px 20px', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' },
  msgClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'inherit', opacity: 0.6 },
  noTableHint: { margin: '12px 20px', padding: '12px 16px', backgroundColor: '#fff8e1', color: '#f57f17', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' },
  sectionTitle: { padding: '16px 20px 8px', fontWeight: 'bold', fontSize: '16px', color: '#444' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', padding: '0 20px 8px' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '18px 14px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  dot: { width: '90px', height: '90px', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardName: { fontWeight: 'bold', fontSize: '15px', marginBottom: '4px', color: '#222' },
  cardPrice: { color: '#c62828', fontWeight: 'bold', fontSize: '17px', marginBottom: '12px' },
  addBtn: { width: '100%', padding: '9px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  addBtnDisabled: { backgroundColor: '#ccc', cursor: 'not-allowed' },
  qtyCtrl: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  qtyBtn: { width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
  qtyBtnPlus: { backgroundColor: '#c62828', color: 'white', border: 'none' },
  qtyInput: { width: '44px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 0' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 },
  modal: { backgroundColor: 'white', width: '360px', height: '100%', display: 'flex', flexDirection: 'column' },
  modalHeader: { padding: '18px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '17px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' },
  modalBody: { flex: 1, overflowY: 'auto', padding: '16px' },
  emptyCart: { textAlign: 'center', color: '#aaa', padding: '30px 0' },
  cartRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f5f5f5' },
  dotSmall: { width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0 },
  cartInfo: { flex: 1 },
  cartName: { fontWeight: 'bold', fontSize: '15px' },
  cartUnitPrice: { color: '#c62828', fontSize: '13px', marginTop: '2px' },
  cartQtyCtrl: { display: 'flex', alignItems: 'center', gap: '6px' },
  cartItemTotal: { fontWeight: 'bold', fontSize: '15px', minWidth: '60px', textAlign: 'right' },
  modalFooter: { padding: '16px 20px', borderTop: '1px solid #eee' },
  sumRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '15px', color: '#555' },
  sumTotal: { fontWeight: 'bold', fontSize: '18px', color: '#c62828', borderTop: '1px solid #eee', paddingTop: '10px' },
  orderBtn: { width: '100%', padding: '14px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '8px' },
}

export default MenuPage
