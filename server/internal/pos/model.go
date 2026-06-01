package pos

import (
	"time"
)

type ProductType struct {
	ID        string    `json:"id" db:"id"`
	TypeName  string    `json:"type_name" db:"type_name"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type ProductTag struct {
	ID        string    `json:"id" db:"id"`
	TagName   string    `json:"tag_name" db:"tag_name"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type ProductTagMapping struct {
	ProductID string `json:"productid" db:"product_id"`
	TagID     string `json:"tag_id" db:"tag_id"`
}

type Product struct {
	ID            string    `json:"id" db:"id"`
	BarcodeID     string    `json:"barcode_id" db:"barcode_id"`
	ProductName   string    `json:"product_name" db:"product_name"`
	ImageURL      *string   `json:"image_url" db:"image_url"`
	Description   *string   `json:"description" db:"description"`
	TypeID        *string   `json:"type_id" db:"type_id"`
	PriceMMK      uint64    `json:"price_mmk" db:"price_mmk"`
	StockQuantity uint64    `json:"stock_quantity" db:"stock_quantity"`
	CostPriceMMK  uint64    `json:"cost_price_mmk" db:"cost_price_mmk"`
	AlertStock    uint64    `json:"alert_stock" db:"alert_stock"`
	ExpireAt      time.Time `json:"expire_at" db:"expire_at"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

type Transaction struct {
	ID             string            `json:"id" db:"id"`
	TotalAmountMMK uint64            `json:"total_amount_mmk" db:"total_amount_mmk"`
	PaymentMethod  string            `json:"payment_method" db:"payment_method"`
	CashierID      string            `json:"cashier_id" db:"cashier_id"`
	CreatedAt      time.Time         `json:"created_at" db:"created_at"`
	Items          []TransactionItem `json:"items" db:"-"`
}

type TransactionItem struct {
	ID            string  `json:"id" db:"id"`
	TransactionID *string `json:"transaction_id" db:"transaction_id"`
	ProductID     string  `json:"product_id" db:"product_id"`
	ProductName   string  `json:"product_name" db:"product_name"`
	Quantity      uint64  `json:"quantity"`
	UnitPriceMMK  uint64  `json:"unit_price_mmk" db:"unit_price_mmk"`
}

type Spending struct {
	ID        string    `json:"id" db:"id"`
	Info      string    `json:"info" db:"info"`
	Amount    int64     `json:"amount" db:"amount"`
	Timestamp time.Time `json:"timestamp" db:"timestamp"`
}

type Supplier struct {
	SupplierId string    `json:"supplier_id" db:"supplier_id"`
	Name       string    `json:"name" db:"name"`
	Timestamp  time.Time `json:"timestamp" db:"timestamp"`
}

type DailyFinancialSnapshot struct {
	ID             string    `json:"id" db:"id"`
	SnapshotDate   time.Time `json:"snapshot_date" db:"snapshot_date"`
	GrossRevenue   uint64    `json:"gross_revenue" db:"gross_revenue"`
	COGS           uint64    `json:"cogs" db:"cogs"`
	GrossProfit    int64     `json:"gross_profit" db:"gross_profit"`
	TotalSpending  int64     `json:"total_spending" db:"total_spending"`
	NetProfit      int64     `json:"net_profit" db:"net_profit"`
	InventoryValue uint64    `json:"inventory_value" db:"inventory_value"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}
