const express = require('express');
const app = express();
const db = require('./db');

app.use(express.json());
app.use(express.static('public'));

// 菜單
const menu = [
  { id: 1, name: "牛肉鍋", price: 300 },
  { id: 2, name: "豬肉鍋", price: 280 },
  { id: 3, name: "羊肉鍋", price: 320 }
];

// 首頁
app.get('/', (req, res) => {
  res.send('Hotpot API is running');
});

// 取得菜單
app.get('/menu', (req, res) => {
  res.json(menu);
});

// 建立訂單（寫入 DB）
app.post('/order', (req, res) => {
  const { table, items } = req.body;

  if (!table || !items) {
    return res.status(400).json({ error: "Missing table or items" });
  }

  db.run(
    `INSERT INTO orders (table_id, items, status) VALUES (?, ?, ?)`,
    [table, JSON.stringify(items), "pending"],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: "Order created",
        orderId: this.lastID
      });
    }
  );
});

// 取得全部訂單
app.get('/orders', (req, res) => {
  db.all(`SELECT * FROM orders`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// 查某桌訂單（用 DB）
app.get('/table/:id/orders', (req, res) => {
  const tableId = req.params.id;

  db.all(
    `SELECT * FROM orders WHERE table_id = ?`,
    [tableId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(rows);
    }
  );
});

// 更新訂單狀態
app.put('/order/:id', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  db.run(
    `UPDATE orders SET status = ? WHERE id = ?`,
    [status, orderId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: "Order updated"
      });
    }
  );
});
// 🔥 Checkout（整桌設為 paid）
app.put('/checkout/:tableId', (req, res) => {
  const tableId = parseInt(req.params.tableId);

  db.run(
    `UPDATE orders SET status = 'paid' WHERE table_id = ?`,
    [tableId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        message: `Table ${tableId} checked out`
      });
    }
  );
});
// server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});