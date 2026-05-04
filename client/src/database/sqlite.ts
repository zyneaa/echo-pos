import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('pos.db');

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS product_types (
      id TEXT PRIMARY KEY NOT NULL,
      type_name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      barcode_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      image_url TEXT,
      description TEXT,
      type_id TEXT,
      price_mmk INTEGER NOT NULL,
      stock_quantity INTEGER NOT NULL,
      cost_price_mmk INTEGER NOT NULL,
      alert_stock INTEGER NOT NULL,
      expire_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(type_id) REFERENCES product_types(id)
    );
    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id TEXT PRIMARY KEY NOT NULL,
      total_amount_mmk INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      items TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      cashier_id TEXT,
      is_synced INTEGER DEFAULT 0
    );
  `);

  // Migration: Ensure all columns exist in 'products' table
  const tableInfo = db.getAllSync("PRAGMA table_info(products)") as any[];
  const columnNames = tableInfo.map(c => c.name);

  const migrations = [
    { name: 'image_url', type: 'TEXT' },
    { name: 'description', type: 'TEXT' },
    { name: 'type_id', type: 'TEXT' },
    { name: 'cost_price_mmk', type: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'alert_stock', type: 'INTEGER NOT NULL DEFAULT 5' },
    { name: 'expire_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
  ];

  for (const m of migrations) {
    if (!columnNames.includes(m.name)) {
      try {
        db.execSync(`ALTER TABLE products ADD COLUMN ${m.name} ${m.type};`);
        console.log(`Added missing column ${m.name} to products table`);
      } catch (e) {
        console.error(`Failed to add column ${m.name}:`, e);
      }
    }
  }
};

export const getProducts = () => {
  return db.getAllSync('SELECT * FROM products');
};

export const getProductByBarcode = (barcodeId: string) => {
  return db.getFirstSync('SELECT * FROM products WHERE barcode_id = ?', [barcodeId]);
};

export const upsertProduct = (p: any) => {
  db.runSync(
    `INSERT INTO products (id, barcode_id, name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(barcode_id) DO UPDATE SET
     name=excluded.name,
     image_url=excluded.image_url,
     description=excluded.description,
     type_id=excluded.type_id,
     price_mmk=excluded.price_mmk,
     stock_quantity=excluded.stock_quantity,
     cost_price_mmk=excluded.cost_price_mmk,
     alert_stock=excluded.alert_stock,
     expire_at=excluded.expire_at`,
    [p.id, p.barcode_id, p.name, p.image_url, p.description, p.type_id, p.price_mmk, p.stock_quantity, p.cost_price_mmk, p.alert_stock, p.expire_at]
  );
};

export const insertTransaction = (t: any) => {
  db.runSync(
    `INSERT INTO transactions (transaction_id, total_amount_mmk, payment_method, items, cashier_id, is_synced)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [t.transaction_id, t.total_amount_mmk, t.payment_method, JSON.stringify(t.items), t.cashier_id]
  );
};

export const getUnsyncedTransactions = () => {
  return db.getAllSync('SELECT * FROM transactions WHERE is_synced = 0');
};

export const markTransactionSynced = (transactionId: string) => {
  db.runSync('UPDATE transactions SET is_synced = 1 WHERE transaction_id = ?', [transactionId]);
};
