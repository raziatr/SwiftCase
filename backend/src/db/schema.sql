-- ════════════════════════════════════════════════
--  SwiftCase POS — skema database (SQLite)
-- ════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    UNIQUE NOT NULL,
  phone         TEXT,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  username      TEXT    UNIQUE NOT NULL,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'kasir',   -- 'admin' | 'kasir'
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  category    TEXT    NOT NULL,
  price       INTEGER NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  emoji       TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_no       TEXT    NOT NULL,
  user_id        INTEGER,
  customer_name  TEXT    NOT NULL,
  order_type     TEXT    NOT NULL DEFAULT 'Dine-in',     -- 'Dine-in' | 'Bawa Pulang'
  pay_method     TEXT    NOT NULL DEFAULT 'Tunai',        -- 'Tunai' | 'QRIS' | 'Kartu'
  payment_status TEXT    NOT NULL DEFAULT 'Belum Bayar',  -- 'Belum Bayar' | 'Lunas'
  payment_ref    TEXT,
  status         TEXT    NOT NULL DEFAULT 'Baru',         -- 'Baru' | 'Diproses' | 'Selesai' | 'Batal'
  notes          TEXT,
  total          INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL,
  product_id INTEGER,
  name       TEXT    NOT NULL,
  price      INTEGER NOT NULL,
  qty        INTEGER NOT NULL,
  note       TEXT,                                    -- catatan per item (mis. "tanpa bawang")
  FOREIGN KEY (order_id)  REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id          TEXT    PRIMARY KEY,                    -- reference_id internal (mis. SC169...)
  external_id TEXT,                                   -- id dari Xendit
  order_ref   TEXT,
  amount      INTEGER NOT NULL,
  method      TEXT    NOT NULL DEFAULT 'QRIS',
  status      TEXT    NOT NULL DEFAULT 'PENDING',     -- PENDING | PAID | EXPIRED | FAILED
  qr_string   TEXT,
  raw         TEXT,                                   -- payload mentah dari gateway (JSON)
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor      TEXT,
  action     TEXT    NOT NULL,
  detail     TEXT,
  ip         TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_items_order    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_logs_created   ON activity_logs(created_at);
