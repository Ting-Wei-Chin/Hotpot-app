const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./db');

// CORS
app.use(cors());

app.use(express.json());
app.use(express.static('public'));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 菜單
const menu = [
  { id: 1, name: '綠色盤', color: '#4CAF50', borderColor: '#2e7d32', bgColor: '#c8e6c9', price: 30  },
  { id: 2, name: '藍色盤', color: '#2196F3', borderColor: '#1565c0', bgColor: '#bbdefb', price: 50  },
  { id: 3, name: '橘色盤', color: '#FF9800', borderColor: '#e65100', bgColor: '#ffe0b2', price: 40  },
  { id: 4, name: '白色盤', color: '#eeeeee', borderColor: '#9e9e9e', bgColor: '#f5f5f5', price: 70  },
  { id: 5, name: '黃色盤', color: '#FFEB3B', borderColor: '#f9a825', bgColor: '#fff9c4', price: 80  },
  { id: 6, name: '花色盤', color: '#E91E63', borderColor: '#880e4f', bgColor: '#fce4ec', price: 100 },
  { id: 7, name: '雞蛋',   color: '#FFF176', borderColor: '#f57f17', bgColor: '#fffde7', price: 15, isItem: true },
  { id: 8, name: '白飯',   color: '#FAFAFA', borderColor: '#bdbdbd', bgColor: '#fafafa', price: 20, isItem: true },
];

app.get('/menu', (req, res) => res.json(menu));

// 取得用餐時段
const getMealPeriod = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return '早餐';
  if (hour >= 12 && hour < 17) return '午餐';
  if (hour >= 17 && hour < 22) return '晚餐';
  return '宵夜';
};

// 建立訂單
app.post('/order', (req, res) => {
  const { table, items } = req.body;
  if (!table || !items || items.length === 0)
    return res.status(400).json({ error: 'Missing table or items' });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = parseFloat((subtotal * 0.1).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));
  const meal_period = getMealPeriod();

  db.run(
    `INSERT INTO orders (table_id, items, subtotal, tax, total, meal_period, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`,
    [table, JSON.stringify(items), subtotal, tax, total, meal_period],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Order created', orderId: this.lastID, total });
    }
  );
});

// 取得全部訂單
app.get('/orders', (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 更新訂單狀態
app.put('/order/:id', (req, res) => {
  const { status } = req.body;
  db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Order updated' });
  });
});

// Checkout 整桌
app.put('/checkout/:tableId', (req, res) => {
  db.run(`UPDATE orders SET status = 'paid' WHERE table_id = ? AND status = 'active'`,
    [req.params.tableId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: `Table ${req.params.tableId} checked out` });
    }
  );
});

// ── Dashboard APIs ──────────────────────────────────────────

// 當日總收入
app.get('/dashboard/today', (req, res) => {
  db.get(
    `SELECT
      COUNT(*) as order_count,
      COALESCE(SUM(subtotal), 0) as total_subtotal,
      COALESCE(SUM(tax), 0) as total_tax,
      COALESCE(SUM(total), 0) as total_revenue
     FROM orders
     WHERE date(created_at) = date('now', 'localtime') AND status = 'paid'`,
    [],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    }
  );
});

// 每桌消費記錄（今日）
app.get('/dashboard/tables', (req, res) => {
  db.all(
    `SELECT
      table_id,
      COUNT(*) as order_count,
      SUM(total) as total_spent,
      MAX(created_at) as last_order,
      GROUP_CONCAT(meal_period) as periods
     FROM orders
     WHERE date(created_at) = date('now', 'localtime')
     GROUP BY table_id
     ORDER BY table_id`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// 各盤子銷售數量（今日）
app.get('/dashboard/plates', (req, res) => {
  db.all(
    `SELECT items FROM orders WHERE date(created_at) = date('now', 'localtime')`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const counts = {};
      rows.forEach(row => {
        const items = JSON.parse(row.items);
        items.forEach(item => {
          counts[item.name] = (counts[item.name] || 0) + item.qty;
        });
      });
      const result = Object.entries(counts).map(([name, qty]) => ({ name, qty }));
      res.json(result);
    }
  );
});

// 用餐時段統計（今日）
app.get('/dashboard/periods', (req, res) => {
  db.all(
    `SELECT
      meal_period,
      COUNT(*) as order_count,
      COALESCE(SUM(total), 0) as revenue
     FROM orders
     WHERE date(created_at) = date('now', 'localtime')
     GROUP BY meal_period`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.listen(3000, () => console.log('Server running on port 3000'));
