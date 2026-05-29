'use strict';
const { db, migrate, transaction } = require('./database');
const password = require('../utils/password');
const config = require('../config');

const SEED_PRODUCTS = [
  { name: 'Nasi Goreng Spesial', category: 'Makanan', price: 25000, stock: 30, desc: 'Nasi goreng dengan telur, ayam, dan kerupuk', emoji: '🍛' },
  { name: 'Mie Goreng Jawa', category: 'Makanan', price: 22000, stock: 25, desc: 'Mie goreng khas Jawa dengan bumbu kacang', emoji: '🍜' },
  { name: 'Ayam Geprek', category: 'Makanan', price: 28000, stock: 4, desc: 'Ayam goreng tepung dengan sambal geprek', emoji: '🍗' },
  { name: 'Nasi Uduk Komplit', category: 'Makanan', price: 20000, stock: 18, desc: 'Nasi uduk dengan lauk lengkap', emoji: '🍚' },
  { name: 'Es Teh Manis', category: 'Minuman', price: 8000, stock: 50, desc: 'Teh manis dingin segar', emoji: '🧊' },
  { name: 'Kopi Susu Gula Aren', category: 'Minuman', price: 18000, stock: 35, desc: 'Kopi susu dengan gula aren asli', emoji: '☕' },
  { name: 'Jus Alpukat', category: 'Minuman', price: 15000, stock: 3, desc: 'Jus alpukat segar dengan susu coklat', emoji: '🥑' },
  { name: 'Es Jeruk Peras', category: 'Minuman', price: 10000, stock: 0, desc: 'Jeruk peras segar dengan es batu', emoji: '🍊' },
  { name: 'Kentang Goreng', category: 'Snack', price: 15000, stock: 20, desc: 'Kentang goreng renyah dengan saus', emoji: '🍟' },
  { name: 'Risol Mayo', category: 'Snack', price: 12000, stock: 8, desc: 'Risol isi mayo, telur, dan sayuran', emoji: '🥟' },
  { name: 'Tahu Crispy', category: 'Snack', price: 10000, stock: 2, desc: 'Tahu goreng crispy dengan sambal kecap', emoji: '🧈' },
  { name: 'Dimsum Ayam', category: 'Snack', price: 18000, stock: 15, desc: 'Dimsum kukus isi ayam dan udang', emoji: '🥟' },
  { name: 'Cheesecake Slice', category: 'Dessert', price: 30000, stock: 7, desc: 'Cheesecake lembut original', emoji: '🍰' },
  { name: 'Pisang Goreng Coklat', category: 'Dessert', price: 16000, stock: 12, desc: 'Pisang goreng dengan topping coklat', emoji: '🍌' },
  { name: 'Es Krim Kelapa', category: 'Dessert', price: 14000, stock: 0, desc: 'Es krim kelapa muda homemade', emoji: '🍨' },
  { name: 'Puding Mangga', category: 'Dessert', price: 12000, stock: 22, desc: 'Puding mangga segar dengan vla', emoji: '🍮' },
];

function seed() {
  migrate();

  if (db.prepare('SELECT COUNT(*) c FROM admins').get().c === 0) {
    db.prepare('INSERT INTO admins(name,username,password_hash,role) VALUES(?,?,?,?)')
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

  if (db.prepare('SELECT COUNT(*) c FROM products').get().c === 0) {
    const ins = db.prepare('INSERT INTO products(name,category,price,stock,description,emoji) VALUES(?,?,?,?,?,?)');
    transaction(() => SEED_PRODUCTS.forEach((p) => ins.run(p.name, p.category, p.price, p.stock, p.desc, p.emoji)))();
    // eslint-disable-next-line no-console
    console.log(`   ✓ Seed ${SEED_PRODUCTS.length} produk`);
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
