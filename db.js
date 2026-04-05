const sqlite3 = require('sqlite3').verbose();

function createDb(path) {
  const db = new sqlite3.Database(path);
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id INTEGER,
        items TEXT,
        subtotal REAL,
        tax REAL,
        total REAL,
        meal_period TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
  return db;
}

module.exports = { createDb };
