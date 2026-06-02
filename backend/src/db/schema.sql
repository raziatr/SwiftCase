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
  role          TEXT    NOT NULL DEFAULT 'kasir',  -- 'admin' | 'kasir'
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  category       TEXT    NOT NULL,
  price          INTEGER NOT NULL,
  purchase_price INTEGER NOT NULL DEFAULT 0,
  stock          INTEGER NOT NULL DEFAULT 0,
  sku            TEXT,
  barcode        TEXT,
  description    TEXT,
  emoji          TEXT,
  image_url      TEXT,
  active         INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  points      INTEGER NOT NULL DEFAULT 0,
  note        TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ingredients (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  unit        TEXT    NOT NULL DEFAULT 'pcs',
  qty         REAL    NOT NULL DEFAULT 0,
  min_stock   REAL    NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id   INTEGER,
  product_name TEXT    NOT NULL,
  delta        INTEGER NOT NULL,
  reason       TEXT    NOT NULL DEFAULT 'Manual',
  stock_before INTEGER NOT NULL DEFAULT 0,
  stock_after  INTEGER NOT NULL DEFAULT 0,
  actor        TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS discounts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  type       TEXT    NOT NULL DEFAULT 'percent',   -- 'percent' | 'fixed'
  scope      TEXT    NOT NULL DEFAULT 'order',     -- 'order' | 'item'
  value      REAL    NOT NULL,
  min_order  INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_no        TEXT    NOT NULL,
  user_id         INTEGER,
  customer_id     INTEGER,
  customer_name   TEXT    NOT NULL,
  order_type      TEXT    NOT NULL DEFAULT 'Dine-in',
  pay_method      TEXT    NOT NULL DEFAULT 'Tunai',
  payment_status  TEXT    NOT NULL DEFAULT 'Belum Bayar',
  payment_ref     TEXT,
  status          TEXT    NOT NULL DEFAULT 'Baru',
  notes           TEXT,
  discount_id     INTEGER,
  discount_name   TEXT,
  item_discount   INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  subtotal        INTEGER NOT NULL DEFAULT 0,
  tax_rate        REAL    NOT NULL DEFAULT 0,
  tax_amount      INTEGER NOT NULL DEFAULT 0,
  raw_total       INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id        INTEGER NOT NULL,
  product_id      INTEGER,
  name            TEXT    NOT NULL,
  price           INTEGER NOT NULL,
  qty             INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  note            TEXT,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id          TEXT    PRIMARY KEY,
  external_id TEXT,
  order_ref   TEXT,
  amount      INTEGER NOT NULL,
  method      TEXT    NOT NULL DEFAULT 'QRIS',
  status      TEXT    NOT NULL DEFAULT 'PENDING',
  qr_string   TEXT,
  raw         TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  actor        TEXT,
  action       TEXT    NOT NULL,
  detail       TEXT,
  before_value TEXT,
  after_value  TEXT,
  ip           TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Indexes ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created   ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user      ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_items_order      ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_product    ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_created    ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_created     ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_customers_phone  ON customers(phone);
