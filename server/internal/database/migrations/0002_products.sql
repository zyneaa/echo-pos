CREATE TABLE IF NOT EXISTS product_types (
    id TEXT PRIMARY KEY,
    type_name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_tags (
    id TEXT PRIMARY KEY,
    tag_name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    barcode_id TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    image_url TEXT,
    description TEXT,
    type_id TEXT,
    price_mmk INTEGER NOT NULL,
    stock_quantity INTEGER NOT NULL,
    cost_price_mmk INTEGER NOT NULL,
    alert_stock INTEGER NOT NULL,
    expire_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(type_id) REFERENCES product_types(id)
);

CREATE TABLE IF NOT EXISTS product_tag_mappings (
    product_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (product_id, tag_id),
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES product_tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode_id);
CREATE INDEX IF NOT EXISTS idx_products_alert ON products(stock_quantity, alert_stock);
CREATE INDEX IF NOT EXISTS idx_product_tag_mappings_tag ON product_tag_mappings(tag_id);
