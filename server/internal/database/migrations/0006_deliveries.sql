CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    destination TEXT NOT NULL,
    total_amount_mmk INTEGER NOT NULL,
    delivered INTEGER NOT NULL DEFAULT 0, -- 0 = Pending, 1 = Shipped, 2 = Delivered, 3 = Rejected or Failed
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_items (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY(delivery_id) REFERENCES deliveries(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);
