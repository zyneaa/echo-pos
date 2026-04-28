package model

import (
	"time"
)

type UserRole string

const (
	RoleAdmin   UserRole = "Admin"
	RoleCashier UserRole = "Cashier"
)

type User struct {
	ID           string    `json:"id" db:"id"`
	Username     string    `json:"username" db:"username"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Role         UserRole  `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type ProductType struct {
	ID        string    `json:"id" db:"id"`
	TypeName  string    `json:"type_name" db:"type_name"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Product struct {
	ID            string    `json:"id" db:"id"`
	BarcodeID     string    `json:"barcode_id" db:"barcode_id"`
	Name          string    `json:"name" db:"name"`
	ImageURL      string    `json:"image_url" db:"image_url"`
	Description   string    `json:"description" db:"description"`
	TypeID        string    `json:"type_id" db:"type_id"`
	PriceMMK      int       `json:"price_mmk" db:"price_mmk"`
	StockQuantity int       `json:"stock_quantity" db:"stock_quantity"`
	CostPriceMMK  int       `json:"cost_price_mmk" db:"cost_price_mmk"`
	AlertStock    int       `json:"alert_stock" db:"alert_stock"`
	ExpireAt      time.Time `json:"expire_at" db:"expire_at"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

type TransactionItem struct {
	ProductID         string `json:"product_id"`
	Quantity          int    `json:"quantity"`
	PriceAtTimeOfSale int    `json:"price_at_time_of_sale"`
}

type Transaction struct {
	TransactionID  string            `json:"transaction_id" db:"transaction_id"`
	TotalAmountMMK int               `json:"total_amount_mmk" db:"total_amount_mmk"`
	PaymentMethod  string            `json:"payment_method" db:"payment_method"`
	Items          []TransactionItem `json:"items" db:"items"`
	Timestamp      time.Time         `json:"timestamp" db:"timestamp"`
	CashierID      string            `json:"cashier_id" db:"cashier_id"`
}
