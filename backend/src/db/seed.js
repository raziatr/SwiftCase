'use strict';
const { db, migrate, transaction } = require('./database');
const password = require('../utils/password');
const config = require('../config');

const SEED_PRODUCTS = [
  { name: 'Nasi Goreng Spesial',  category: 'Makanan', price: 25000, purchasePrice: 12000, stock: 30, sku: 'MKN-001', desc: 'Nasi goreng dengan telur, ayam, dan kerupuk', emoji: '🍛' },
  { name: 'Mie Goreng Jawa',      category: 'Makanan', price: 22000, purchasePrice: 10000, stock: 25, sku: 'MKN-002', desc: 'Mie goreng khas Jawa dengan bumbu kacang',    emoji: '🍜' },
  { name: 'Ayam Geprek',          category: 'Makanan', price: 28000, purchasePrice: 14000, stock:  4, sku: 'MKN-003', desc: 'Ayam goreng tepung dengan sambal geprek',     emoji: '🍗' },
  { name: 'Nasi Uduk Komplit',    category: 'Makanan', price: 20000, purchasePrice:  9000, stock: 18, sku: 'MKN-004', desc: 'Nasi uduk dengan lauk lengkap',               emoji: '🍚' },
  { name: 'Es Teh Manis',         category: 'Minuman', price:  8000, purchasePrice:  2000, stock: 50, sku: 'MNM-001', desc: 'Teh manis dingin segar',                      emoji: '🧊' },
  { name: 'Kopi Susu Gula Aren',  category: 'Minuman', price: 18000, purchasePrice:  8000, stock: 35, sku: 'MNM-002', desc: 'Kopi susu dengan gula aren asli',             emoji: '☕' },
  { name: 'Jus Alpukat',          category: 'Minuman', price: 15000, purchasePrice:  6000, stock:  3, sku: 'MNM-003', desc: 'Jus alpukat segar dengan susu coklat',        emoji: '🥑' },
  { name: 'Es Jeruk Peras',       category: 'Minuman', price: 10000, purchasePrice:  3000, stock:  0, sku: 'MNM-004', desc: 'Jeruk peras segar dengan es batu',            emoji: '🍊' },
  { name: 'Kentang Goreng',       category: 'Snack',   price: 15000, purchasePrice:  5000, stock: 20, sku: 'SNK-001', desc: 'Kentang goreng renyah dengan saus',           emoji: '🍟' },
  { name: 'Risol Mayo',           category: 'Snack',   price: 12000, purchasePrice:  4000, stock:  8, sku: 'SNK-002', desc: 'Risol isi mayo, telur, dan sayuran',          emoji: '🥟' },
  { name: 'Tahu Crispy',          category: 'Snack',   price: 10000, purchasePrice:  3500, stock:  2, sku: 'SNK-003', desc: 'Tahu goreng crispy dengan sambal kecap',      emoji: '🧈' },
  { name: 'Dimsum Ayam',          category: 'Snack',   price: 18000, purchasePrice:  8000, stock: 15, sku: 'SNK-004', desc: 'Dimsum kukus isi ayam dan udang',             emoji: '🥟' },
  { name: 'Cheesecake Slice',     category: 'Dessert', price: 30000, purchasePrice: 15000, stock:  7, sku: 'DST-001', desc: 'Cheesecake lembut original',                  emoji: '🍰' },
  { name: 'Pisang Goreng Coklat', category: 'Dessert', price: 16000, purchasePrice:  5000, stock: 12, sku: 'DST-002', desc: 'Pisang goreng dengan topping coklat',         emoji: '🍌' },
  { name: 'Es Krim Kelapa',       category: 'Dessert', price: 14000, purchasePrice:  6000, stock:  0, sku: 'DST-003', desc: 'Es krim kelapa muda homemade',                emoji: '🍨' },
  { name: 'Puding Mangga',        category: 'Dessert', price: 12000, purchasePrice:  4000, stock: 22, sku: 'DST-004', desc: 'Puding mangga segar dengan vla',              emoji: '🍮' },
];

const SEED_DISCOUNTS = [
  { name: 'Diskon Weekend 10%',     type: 'percent', scope: 'order', value: 10,   minOrder: 50000, expiresAt: null },
  { name: 'Hemat Rp 5.000',         type: 'fixed',   scope: 'order', value: 5000, minOrder: 30000, expiresAt: null },
  { name: 'Promo Item 15%',         type: 'percent', scope: 'item',  value: 15,   minOrder: 0,     expiresAt: null },
  { name: 'Potongan Item Rp 3.000', type: 'fixed',   scope: 'item',  value: 3000, minOrder: 0,     expiresAt: null },
];

const SEED_CUSTOMERS = [
  { name: 'Andi Wijaya',  phone: '081200000001', email: 'andi@mail.com', address: 'Jl. Merdeka No. 1' },
  { name: 'Siti Rahma',   phone: '081200000002', email: 'siti@mail.com', address: 'Jl. Sudirman No. 5' },
  { name: 'Budi Santoso', phone: '081200000003', email: 'budi@mail.com', address: 'Jl. Diponegoro No. 9' },
];

const SEED_INGREDIENTS = [
  { name: 'Beras',         unit: 'kg',    qty: 50,   minStock: 10 },
  { name: 'Telur',         unit: 'butir', qty: 120,  minStock: 30 },
  { name: 'Ayam Potong',   unit: 'kg',    qty: 8,    minStock: 10 },
  { name: 'Minyak Goreng', unit: 'liter', qty: 25,   minStock: 5 },
  { name: 'Gula Aren',     unit: 'kg',    qty: 4,    minStock: 5 },
  { name: 'Kopi Bubuk',    unit: 'gram',  qty: 3000, minStock: 1000 },
  { name: 'Susu UHT',      unit: 'liter', qty: 12,   minStock: 8 },
  { name: 'Tepung Terigu', unit: 'kg',    qty: 15,   minStock: 5 },
];

function seed() {
  migrate();

  if (db.prepare('SELECT COUNT(*) c FROM admins').get().c === 0) {
    db.prepare('INSERT INTO admins(name,username,password_hash,role,active) VALUES(?,?,?,?,1)')
      .run(config.seed.adminName, config.seed.adminUser, password.hash(config.seed.adminPass), 'admin');
    // eslint-disable-next-line no-console
    console.log(`   ✓ Seed admin: ${config.seed.adminUser} / ${config.seed.adminPass}`);
  }

  if (db.prepare('SELECT COUNT(*) c FROM users').get().c === 0) {
    db.prepare('INSERT INTO users(name,email,phone,password_hash) VALUES(?,?,?,?)')
      .run('John Doe', 'john@mail.com', '081234567890', password.hash('123456'));
    // eslint-disable-next-line no-console
    console.log('   ✓ Seed pelanggan: john@mail.com / 123456');
  }

  if (db.prepare('SELECT COUNT(*) c FROM categories').get().c === 0) {
    const insC = db.prepare('INSERT OR IGNORE INTO categories(name,sort_order) VALUES(?,?)');
    config.defaultCategories.forEach((name, i) => insC.run(name, i));
    // eslint-disable-next-line no-console
    console.log(`   ✓ Seed ${config.defaultCategories.length} kategori`);
  }

  if (db.prepare('SELECT COUNT(*) c FROM products').get().c === 0) {
    const ins = db.prepare(
      'INSERT INTO products(name,category,price,purchase_price,stock,sku,barcode,description,emoji) VALUES(?,?,?,?,?,?,?,?,?)'
    );
    transaction(() => SEED_PRODUCTS.forEach((p, i) => {
      const barcode = '8990000' + String(1000 + i + 1); // mis. 89900001001
      ins.run(p.name, p.category, p.price, p.purchasePrice, p.stock, p.sku, barcode, p.desc, p.emoji);
    }))();
    // eslint-disable-next-line no-console
    console.log(`   ✓ Seed ${SEED_PRODUCTS.length} produk (dengan barcode)`);
  }

  if (db.prepare('SELECT COUNT(*) c FROM discounts').get().c === 0) {
    const ins = db.prepare(
      'INSERT INTO discounts(name,type,scope,value,min_order,expires_at,active) VALUES(?,?,?,?,?,?,1)'
    );
    SEED_DISCOUNTS.forEach((d) => ins.run(d.name, d.type, d.scope, d.value, d.minOrder, d.expiresAt));
    // eslint-disable-next-line no-console
    console.log(`   ✓ Seed ${SEED_DISCOUNTS.length} diskon`);
  }

  if (db.prepare('SELECT COUNT(*) c FROM customers').get().c === 0) {
    const ins = db.prepare('INSERT INTO customers(name,phone,email,address) VALUES(?,?,?,?)');
    SEED_CUSTOMERS.forEach((c) => ins.run(c.name, c.phone, c.email, c.address));
    // eslint-disable-next-line no-console
    console.log(`   ✓ Seed ${SEED_CUSTOMERS.length} pelanggan`);
  }

  if (db.prepare('SELECT COUNT(*) c FROM ingredients').get().c === 0) {
    const ins = db.prepare('INSERT INTO ingredients(name,unit,qty,min_stock) VALUES(?,?,?,?)');
    SEED_INGREDIENTS.forEach((i) => ins.run(i.name, i.unit, i.qty, i.minStock));
    // eslint-disable-next-line no-console
    console.log(`   ✓ Seed ${SEED_INGREDIENTS.length} bahan baku`);
  }
}

module.exports = seed;

// Jalankan langsung: `npm run seed`
if (require.main === module) {
  seed();
  // eslint-disable-next-line no-console
  console.log('Seed selesai.');
  process.exit(0);
}
