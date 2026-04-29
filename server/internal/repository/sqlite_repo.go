package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"github.com/username/pos-server/internal/model"
)

type SQLiteRepository struct {
	db *sql.DB
}

func NewSQLiteRepository(db *sql.DB) *SQLiteRepository {
	return &SQLiteRepository{db: db}
}

// User Repository
func (r *SQLiteRepository) GetUserByUsername(ctx context.Context, username string) (*model.User, error) {
	query := `SELECT id, username, password_hash, role, created_at FROM users WHERE username = ?`
	row := r.db.QueryRowContext(ctx, query, username)

	var user model.User
	err := row.Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *SQLiteRepository) CreateUser(ctx context.Context, user *model.User) error {
	query := `INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, user.ID, user.Username, user.PasswordHash, user.Role)
	return err
}

// Product Type Repository
func (r *SQLiteRepository) GetAllProductTypes(ctx context.Context) ([]model.ProductType, error) {
	query := `SELECT id, type_name, created_at FROM product_types`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var types []model.ProductType
	for rows.Next() {
		var t model.ProductType
		err := rows.Scan(&t.ID, &t.TypeName, &t.CreatedAt)
		if err != nil {
			return nil, err
		}
		types = append(types, t)
	}
	return types, nil
}

func (r *SQLiteRepository) CreateProductType(ctx context.Context, t *model.ProductType) error {
	query := `INSERT INTO product_types (id, type_name) VALUES (?, ?)`
	_, err := r.db.ExecContext(ctx, query, t.ID, t.TypeName)
	return err
}

// Product Repository
func (r *SQLiteRepository) GetProductByBarcode(ctx context.Context, barcodeID string) (*model.Product, error) {
	query := `SELECT id, barcode_id, name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products WHERE barcode_id = ?`
	row := r.db.QueryRowContext(ctx, query, barcodeID)

	var p model.Product
	err := row.Scan(&p.ID, &p.BarcodeID, &p.Name, &p.ImageURL, &p.Description, &p.TypeID, &p.PriceMMK, &p.StockQuantity, &p.CostPriceMMK, &p.AlertStock, &p.ExpireAt, &p.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *SQLiteRepository) UpsertProduct(ctx context.Context, p *model.Product) error {
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

func (r *SQLiteRepository) SearchByName(ctx context.Context, name string) ([]model.Product, error) {
	query := `SELECT * FROM products WHERE name LIKE ?`
	return r.fetchProducts(ctx, query, "%"+name+"%")
}

func (r *SQLiteRepository) GetLowStock(ctx context.Context) ([]model.Product, error) {
	query := `SELECT * FROM products WHERE stock_quantity <= alert_stock`
	return r.fetchProducts(ctx, query)
}

func (r *SQLiteRepository) GetByPriceRange(ctx context.Context, min, max float64) ([]model.Product, error) {
	query := `SELECT * FROM products WHERE price_mmk BETWEEN ? AND ?`
	return r.fetchProducts(ctx, query, min, max)
}

func (r *SQLiteRepository) fetchProducts(ctx context.Context, query string, args ...any) ([]model.Product, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var p model.Product
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

func (r *SQLiteRepository) GetAllProducts(ctx context.Context) ([]model.Product, error) {
	query := `SELECT id, barcode_id, name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var p model.Product
		err := rows.Scan(&p.ID, &p.BarcodeID, &p.Name, &p.ImageURL, &p.Description, &p.TypeID, &p.PriceMMK, &p.StockQuantity, &p.CostPriceMMK, &p.AlertStock, &p.ExpireAt, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func (r *SQLiteRepository) CreateTransaction(ctx context.Context, t *model.Transaction) error {
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

func (r *SQLiteRepository) GetTransactionsByPeriod(ctx context.Context, start, end string) ([]model.Transaction, error) {
	query := `SELECT transaction_id, total_amount_mmk, payment_method, items, cashier_id, timestamp FROM transactions WHERE timestamp BETWEEN ? AND ?`
	
	rows, err := r.db.QueryContext(ctx, query, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []model.Transaction
	for rows.Next() {
		var t model.Transaction
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
