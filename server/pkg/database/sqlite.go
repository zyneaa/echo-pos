package database

import (
	"database/sql"
	_ "modernc.org/sqlite"
	"log"
)

func InitDB(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	err = createTables(db)
	if err != nil {
		return nil, err
	}

	return db, nil
}

func createTables(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS product_types (
			id TEXT PRIMARY KEY,
			type_name TEXT UNIQUE NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS products (
			id TEXT PRIMARY KEY,
			barcode_id TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			image_url TEXT,
			description TEXT,
			type_id TEXT,
			price_mmk INTEGER NOT NULL,
			stock_quantity INTEGER NOT NULL,
			cost_price_mmk INTEGER NOT NULL,
			alert_stock INTEGER NOT NULL,
			expire_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(type_id) REFERENCES product_types(id)
		);`,
		`CREATE TABLE IF NOT EXISTS transactions (
			transaction_id TEXT PRIMARY KEY,
			total_amount_mmk INTEGER NOT NULL,
			payment_method TEXT NOT NULL,
			items TEXT NOT NULL, -- JSON
			timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
			cashier_id TEXT,
			FOREIGN KEY(cashier_id) REFERENCES users(id)
		);`,
	}

	for _, query := range queries {
		_, err := db.Exec(query)
		if err != nil {
			log.Printf("Error creating table: %v\nQuery: %s", err, query)
			return err
		}
	}

	return nil
}
