CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    total_amount_mmk INTEGER NOT NULL,
    payment_method TEXT NOT NULL, -- KPay, Cash
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    cashier_id TEXT,
    FOREIGN KEY(cashier_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transaction_items (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON transaction_items(transaction_id);
