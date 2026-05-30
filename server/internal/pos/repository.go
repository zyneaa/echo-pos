package pos

import (
	"context"
	"database/sql"
	"time"

	"github.com/oklog/ulid/v2"
	"github.com/zyneaa/server/internal/database"
)

type Repository struct {
	db *database.DB
}

func NewRepository(db *database.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) BeginTransaction(ctx context.Context) (*sql.Tx, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	return tx, nil
}

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
	query := `SELECT id, barcode_id, product_name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products WHERE barcode_id = ?`
	row := r.db.QueryRowContext(ctx, query, barcodeID)

	var p Product
	err := row.Scan(&p.ID, &p.BarcodeID, &p.ProductName, &p.ImageURL, &p.Description, &p.TypeID, &p.PriceMMK, &p.StockQuantity, &p.CostPriceMMK, &p.AlertStock, &p.ExpireAt, &p.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &p, nil
}

func (r *Repository) GetProductByID(ctx context.Context, ID string) (*Product, error) {
	query := `SELECT id, barcode_id, product_name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products WHERE id = ?`
	row := r.db.QueryRowContext(ctx, query, ID)

	var p Product
	err := row.Scan(&p.ID, &p.BarcodeID, &p.ProductName, &p.ImageURL, &p.Description, &p.TypeID, &p.PriceMMK, &p.StockQuantity, &p.CostPriceMMK, &p.AlertStock, &p.ExpireAt, &p.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &p, nil
}

func (r *Repository) UpsertProduct(ctx context.Context, p *Product) error {
	query := `INSERT INTO products (id, barcode_id, product_name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(barcode_id) DO UPDATE SET
		product_name=excluded.product_name,
		image_url=excluded.image_url,
		description=excluded.description,
		type_id=excluded.type_id,
		price_mmk=excluded.price_mmk,
		stock_quantity=excluded.stock_quantity,
		cost_price_mmk=excluded.cost_price_mmk,
		alert_stock=excluded.alert_stock,
		expire_at=excluded.expire_at`
	_, err := r.db.ExecContext(ctx, query, p.ID, p.BarcodeID, p.ProductName, p.ImageURL, p.Description, p.TypeID, p.PriceMMK, p.StockQuantity, p.CostPriceMMK, p.AlertStock, p.ExpireAt)

	return err
}

func (r *Repository) GetLowStock(ctx context.Context) ([]Product, error) {
	query := `SELECT id, barcode_id, product_name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products WHERE stock_quantity <= alert_stock`
	return r.FetchProducts(ctx, query)
}

func (r *Repository) FetchProducts(ctx context.Context, query string, args ...any) ([]Product, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		err := rows.Scan(
			&p.ID, &p.BarcodeID, &p.ProductName, &p.ImageURL, &p.Description,
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

func (r *Repository) CreateTransaction(ctx context.Context, tx *sql.Tx, t *Transaction, tID string) error {
	query := `
		INSERT INTO transactions (id, total_amount_mmk, payment_method, cashier_id)
		VALUES (?, ?, ?, ?);`

	_, err := tx.ExecContext(ctx, query, tID, t.TotalAmountMMK, t.PaymentMethod, t.CashierID)
	if err != nil {
		return err
	}
	return nil
}

func (r *Repository) InsertTransactionItems(ctx context.Context, tx *sql.Tx, txID string, items []TransactionItem) error {
	itemQuery := `
		INSERT INTO transaction_items (id, transaction_id, product_id, quantity, unit_price_mmk)
		VALUES (?, ?, ?, ?, ?);`

	stockQuery := `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?;`

	stmtItem, err := tx.PrepareContext(ctx, itemQuery)
	if err != nil {
		return err
	}
	defer stmtItem.Close()

	stmtStock, err := tx.PrepareContext(ctx, stockQuery)
	if err != nil {
		return err
	}
	defer stmtStock.Close()

	for _, item := range items {
		_, err = stmtItem.ExecContext(ctx, item.ID, txID, item.ProductID, item.Quantity, item.UnitPriceMMK)
		if err != nil {
			return err
		}

		_, err = stmtStock.ExecContext(ctx, item.Quantity, item.ProductID)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *Repository) GetProducts(ctx context.Context, filters map[string]any, limit, offset int) ([]Product, error) {
	query := `SELECT id, barcode_id, product_name, image_url, description, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at, created_at FROM products WHERE 1=1`
	var args []any

	if val, ok := filters["product_name"]; ok && val != "" {
		query += ` AND (product_name LIKE ? OR barcode_id LIKE ?)`
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

	return r.FetchProducts(ctx, query, args...)
}

func (r *Repository) GetTransactions(ctx context.Context, start, end string, minAmount, limit, offset int) ([]Transaction, error) {
	baseQuery := `
		SELECT 
			t.id, t.total_amount_mmk, t.payment_method, t.cashier_id, t.created_at,
			ti.id, ti.product_id, ti.quantity, ti.unit_price_mmk, p.product_name
		FROM (
			SELECT id, total_amount_mmk, payment_method, cashier_id, created_at
			FROM transactions
			WHERE 1=1`

	var args []any

	if start != "" && end != "" {
		baseQuery += ` AND created_at BETWEEN ? AND ?`
		args = append(args, start, end)
	} else if start != "" {
		baseQuery += ` AND created_at >= ?`
		args = append(args, start)
	} else if end != "" {
		baseQuery += ` AND created_at <= ?`
		args = append(args, end)
	}

	if minAmount > 0 {
		baseQuery += ` AND total_amount_mmk >= ?`
		args = append(args, minAmount)
	}

	baseQuery += ` ORDER BY created_at DESC`

	if limit > 0 {
		baseQuery += ` LIMIT ? OFFSET ?`
		args = append(args, limit, offset)
	}

	baseQuery += `) t
	LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
	LEFT JOIN products p ON ti.product_id = p.id
	ORDER BY t.created_at DESC`

	rows, err := r.db.QueryContext(ctx, baseQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []Transaction
	txMap := make(map[string]*Transaction)
	var txIDs []string

	for rows.Next() {
		var tID, tPayment string
		var tCreatedAt time.Time
		var tAmount uint64
		var tCashier sql.NullString

		var itemID, itemProdID, itemProdName sql.NullString
		var itemQty, itemPrice sql.NullInt64

		err := rows.Scan(
			&tID, &tAmount, &tPayment, &tCashier, &tCreatedAt,
			&itemID, &itemProdID, &itemQty, &itemPrice, &itemProdName,
		)
		if err != nil {
			return nil, err
		}

		if _, exists := txMap[tID]; !exists {
			txMap[tID] = &Transaction{
				ID:             tID,
				TotalAmountMMK: tAmount,
				PaymentMethod:  tPayment,
				CashierID:      tCashier.String,
				CreatedAt:      tCreatedAt,
				Items:          []TransactionItem{},
			}
			txIDs = append(txIDs, tID)
		}

		if itemID.Valid {
			txMap[tID].Items = append(txMap[tID].Items, TransactionItem{
				ID:            itemID.String,
				TransactionID: &tID,
				ProductID:     itemProdID.String,
				ProductName:   itemProdName.String,
				Quantity:      int(itemQty.Int64),
				UnitPriceMMK:  int(itemPrice.Int64),
			})
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	for _, id := range txIDs {
		transactions = append(transactions, *txMap[id])
	}

	return transactions, nil
}

func (r *Repository) AddSpending(ctx context.Context, s *Spending) error {
	query := `INSERT INTO spendings (id, info, amount) VALUES (?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, ulid.Make().String(), s.Info, s.Amount)
	return err
}

func (r *Repository) GetSpending(ctx context.Context, start, end string) ([]Spending, error) {
	query := "SELECT id, amount, info, created_at FROM spendings WHERE created_at BETWEEN ? AND ?"
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
