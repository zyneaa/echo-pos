package pos

import (
	"context"
	"database/sql"
	"encoding/json"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// Product Type Repository
func (r *Repository) GetAllProductTypes(ctx context.Context) ([]ProductType, error) {
	query := `SELECT id, type_name, created_at FROM product_types`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var types []ProductType
	for rows.Next() {
		var t ProductType
		err := rows.Scan(&t.ID, &t.TypeName, &t.CreatedAt)
		if err != nil {
			return nil, err
		}
		types = append(types, t)
	}
	return types, nil
}

func (r *Repository) CreateProductType(ctx context.Context, t *ProductType) error {
	query := `INSERT INTO product_types (id, type_name) VALUES (?, ?)`
	_, err := r.db.ExecContext(ctx, query, t.ID, t.TypeName)
	return err
}

// Product Repository
func (r *Repository) GetProductByBarcode(ctx context.Context, barcodeID string) (*Product, error) {
	query := `SELECT id, barcode_id, name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products WHERE barcode_id = ?`
	row := r.db.QueryRowContext(ctx, query, barcodeID)

	var p Product
	err := row.Scan(&p.ID, &p.BarcodeID, &p.Name, &p.ImageURL, &p.Description, &p.TypeID, &p.PriceMMK, &p.StockQuantity, &p.CostPriceMMK, &p.AlertStock, &p.ExpireAt, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) UpsertProduct(ctx context.Context, p *Product) error {
	query := `INSERT INTO products (id, barcode_id, name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at)
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
		expire_at=excluded.expire_at`
	_, err := r.db.ExecContext(ctx, query, p.ID, p.BarcodeID, p.Name, p.ImageURL, p.Description, p.TypeID, p.PriceMMK, p.StockQuantity, p.CostPriceMMK, p.AlertStock, p.ExpireAt)
	return err
}

func (r *Repository) SearchByName(ctx context.Context, name string) ([]Product, error) {
	query := `SELECT id, barcode_id, name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products WHERE name LIKE ?`
	return r.fetchProducts(ctx, query, "%"+name+"%")
}

func (r *Repository) GetLowStock(ctx context.Context) ([]Product, error) {
	query := `SELECT id, barcode_id, name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products WHERE stock_quantity <= alert_stock`
	return r.fetchProducts(ctx, query)
}

func (r *Repository) GetByPriceRange(ctx context.Context, min, max float64) ([]Product, error) {
	query := `SELECT id, barcode_id, name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products WHERE price_mmk BETWEEN ? AND ?`
	return r.fetchProducts(ctx, query, min, max)
}

func (r *Repository) fetchProducts(ctx context.Context, query string, args ...any) ([]Product, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		err := rows.Scan(
			&p.ID, &p.BarcodeID, &p.Name, &p.ImageURL, &p.Description,
			&p.TypeID, &p.PriceMMK, &p.StockQuantity, &p.CostPriceMMK,
			&p.AlertStock, &p.ExpireAt, &p.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, rows.Err()
}

func (r *Repository) GetAllProducts(ctx context.Context) ([]Product, error) {
	query := `SELECT id, barcode_id, name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		err := rows.Scan(&p.ID, &p.BarcodeID, &p.Name, &p.ImageURL, &p.Description, &p.TypeID, &p.PriceMMK, &p.StockQuantity, &p.CostPriceMMK, &p.AlertStock, &p.ExpireAt, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func (r *Repository) CreateTransaction(ctx context.Context, t *Transaction) error {
	itemsJSON, err := json.Marshal(t.Items)
	if err != nil {
		return err
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `INSERT INTO transactions (transaction_id, total_amount_mmk, payment_method, items, cashier_id) VALUES (?, ?, ?, ?, ?)`
	_, err = tx.ExecContext(ctx, query, t.TransactionID, t.TotalAmountMMK, t.PaymentMethod, string(itemsJSON), t.CashierID)
	if err != nil {
		return err
	}

	// Decrement stock for each item
	for _, item := range t.Items {
		updateStockQuery := `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`
		_, err = tx.ExecContext(ctx, updateStockQuery, item.Quantity, item.ProductID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *Repository) GetProducts(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]Product, error) {
	query := `SELECT id, barcode_id, name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products WHERE 1=1`
	var args []interface{}

	if val, ok := filters["name"]; ok && val != "" {
		query += ` AND (name LIKE ? OR barcode_id LIKE ?)`
		args = append(args, "%"+val.(string)+"%", "%"+val.(string)+"%")
	}

	if val, ok := filters["type_id"]; ok && val != "" {
		query += ` AND type_id = ?`
		args = append(args, val)
	}

	if val, ok := filters["min_stock"]; ok {
		query += ` AND stock_quantity >= ?`
		args = append(args, val)
	}

	if val, ok := filters["max_stock"]; ok {
		query += ` AND stock_quantity <= ?`
		args = append(args, val)
	}

	if val, ok := filters["min_price"]; ok {
		query += ` AND price_mmk >= ?`
		args = append(args, val)
	}

	if val, ok := filters["max_price"]; ok {
		query += ` AND price_mmk <= ?`
		args = append(args, val)
	}

	if val, ok := filters["min_cost"]; ok {
		query += ` AND cost_price_mmk >= ?`
		args = append(args, val)
	}

	if val, ok := filters["max_cost"]; ok {
		query += ` AND cost_price_mmk <= ?`
		args = append(args, val)
	}

	query += ` ORDER BY created_at DESC`

	if limit > 0 {
		query += ` LIMIT ? OFFSET ?`
		args = append(args, limit, offset)
	}

	return r.fetchProducts(ctx, query, args...)
}

func (r *Repository) GetTransactions(ctx context.Context, start, end string, minAmount, limit, offset int) ([]Transaction, error) {
	query := `SELECT transaction_id, total_amount_mmk, payment_method, items, cashier_id, timestamp FROM transactions WHERE 1=1`
	var args []interface{}

	if start != "" && end != "" {
		query += ` AND timestamp BETWEEN ? AND ?`
		args = append(args, start, end)
	} else if start != "" {
		query += ` AND timestamp >= ?`
		args = append(args, start)
	} else if end != "" {
		query += ` AND timestamp <= ?`
		args = append(args, end)
	}

	if minAmount > 0 {
		query += ` AND total_amount_mmk >= ?`
		args = append(args, minAmount)
	}

	query += ` ORDER BY timestamp DESC`

	if limit > 0 {
		query += ` LIMIT ? OFFSET ?`
		args = append(args, limit, offset)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []Transaction
	for rows.Next() {
		var t Transaction
		var itemsJSON string
		err := rows.Scan(&t.TransactionID, &t.TotalAmountMMK, &t.PaymentMethod, &itemsJSON, &t.CashierID, &t.Timestamp)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal([]byte(itemsJSON), &t.Items); err != nil {
			return nil, err
		}

		transactions = append(transactions, t)
	}

	return transactions, rows.Err()
}

func (r *Repository) GetTransactionsByPeriod(ctx context.Context, start, end string) ([]Transaction, error) {
	query := `SELECT transaction_id, total_amount_mmk, payment_method, items, cashier_id, timestamp FROM transactions WHERE timestamp BETWEEN ? AND ?`

	rows, err := r.db.QueryContext(ctx, query, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []Transaction
	for rows.Next() {
		var t Transaction
		var itemsJSON string
		err := rows.Scan(&t.TransactionID, &t.TotalAmountMMK, &t.PaymentMethod, &itemsJSON, &t.CashierID, &t.Timestamp)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal([]byte(itemsJSON), &t.Items); err != nil {
			return nil, err
		}

		transactions = append(transactions, t)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

func (r *Repository) AddSpending(ctx context.Context, s *Spending) error {
	query := `INSERT INTO spendings (id, info, amount) VALUES (?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, s.ID, s.Info, s.Amount)
	return err
}

func (r *Repository) GetSpending(ctx context.Context, start, end string) ([]Spending, error) {
	query := "SELECT id, amount, info, timestamp FROM spendings WHERE timestamp BETWEEN ? AND ?"
	rows, err := r.db.QueryContext(ctx, query, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var spendings []Spending
	for rows.Next() {
		var s Spending
		err := rows.Scan(&s.ID, &s.Amount, &s.Info, &s.Timestamp)
		if err != nil {
			return nil, err
		}

		spendings = append(spendings, s)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return spendings, nil
}
