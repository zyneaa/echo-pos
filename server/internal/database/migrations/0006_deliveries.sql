CREATE TABLE IF NOT EXISTS delivery_services (
    id TEXT PRIMARY KEY,
    delivery_service_name TEXT NOT NULL,
    contact_number TEXT,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    destination TEXT NOT NULL,
    contact_number TEXT,
    messenger TEXT, -- 'TELEGRAM', 'VIBER', etc.
    delivery_service_id TEXT,
    total_amount_mmk INTEGER NOT NULL,
    delivery_fee_mmk INTEGER NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'UNPAID', -- 'UNPAID', 'PREPAID', 'COD_COLLECTED'
    delivered INTEGER NOT NULL DEFAULT 0, -- 0 = Pending, 1 = Shipped, 2 = Delivered, 3 = Rejected/Failed
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(delivery_service_id) REFERENCES delivery_services(id)
);

CREATE TABLE IF NOT EXISTS delivery_items (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_mmk INTEGER NOT NULL,
    FOREIGN KEY(delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(delivered);
CREATE INDEX IF NOT EXISTS idx_delivery_items_master ON delivery_items(delivery_id);
