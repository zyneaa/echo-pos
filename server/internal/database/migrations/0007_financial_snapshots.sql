CREATE TABLE daily_financial_snapshots (
    id TEXT PRIMARY KEY,
    snapshot_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    gross_revenue INTEGER NOT NULL DEFAULT 0,
    cogs INTEGER NOT NULL DEFAULT 0,
    gross_profit INTEGER NOT NULL DEFAULT 0,
    total_spending INTEGER NOT NULL DEFAULT 0,
    net_profit INTEGER NOT NULL DEFAULT 0,
    inventory_value INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_daily_snapshots_date ON daily_financial_snapshots(snapshot_date);
