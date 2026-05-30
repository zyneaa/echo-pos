package main

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/oklog/ulid/v2"
	"github.com/zyneaa/server/internal/config"
	"github.com/zyneaa/server/internal/database"
)

func main() {
	cfg := config.Load()
	db, err := database.InitDB(cfg.DBPath)
	if err != nil {
		log.Fatalf("failed to init db: %v", err)
	}
	defer db.Close()

	rand.Seed(time.Now().UnixNano())

	fmt.Println("Wiping old seed data (Keeping users)...")
	clearDatabase(db.DB)

	fmt.Println("Seeding database with ULIDs...")

	// 1. Get existing users
	userIDs := getExistingUserIDs(db.DB)
	fmt.Printf("Found %d existing users\n", len(userIDs))

	// 2. Seed Product Types
	typeIDs := seedProductTypes(db.DB)
	fmt.Printf("Seeded %d product types\n", len(typeIDs))

	// 3. Seed Product Tags
	tagIDs := seedProductTags(db.DB)
	fmt.Printf("Seeded %d product tags\n", len(tagIDs))

	// 4. Seed Suppliers
	supplierIDs := seedSuppliers(db.DB)
	fmt.Printf("Seeded %d suppliers\n", len(supplierIDs))

	// 5. Seed Delivery Services
	deliveryServiceIDs := seedDeliveryServices(db.DB)
	fmt.Printf("Seeded %d delivery services\n", len(deliveryServiceIDs))

	// 6. Seed Products
	productIDs := seedProducts(db.DB, typeIDs, tagIDs)
	fmt.Printf("Seeded %d products\n", len(productIDs))

	// 7. Seed Inventory Logs
	seedInventoryLogs(db.DB, productIDs, supplierIDs)
	fmt.Println("Seeded inventory logs")

	// 8. Seed Transactions
	seedTransactions(db.DB, productIDs, userIDs)
	fmt.Println("Seeded transactions")

	// 9. Seed Spendings
	seedSpendings(db.DB)
	fmt.Println("Seeded spendings")

	// 10. Seed Deliveries
	seedDeliveries(db.DB, productIDs, deliveryServiceIDs)
	fmt.Println("Seeded deliveries")

	fmt.Println("Seeding completed successfully!")
}

func clearDatabase(db *sql.DB) {
	// Order is strictly set to prevent foreign key constraint violations
	tables := []string{
		"product_tag_mappings",
		"inventory_logs",
		"transaction_items",
		"transactions",
		"spendings",
		"delivery_items",
		"deliveries",
		"products",
		"product_types",
		"product_tags",
		"suppliers",
		"delivery_services",
	}

	for _, table := range tables {
		_, err := db.Exec(fmt.Sprintf("DELETE FROM %s", table))
		if err != nil {
			log.Printf("Warning: failed to clear table %s: %v", table, err)
		}
	}
}

func getExistingUserIDs(db *sql.DB) []string {
	rows, err := db.Query("SELECT id FROM users")
	if err != nil {
		return nil
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err == nil {
			ids = append(ids, id)
		}
	}
	return ids
}

func seedProductTypes(db *sql.DB) []string {
	types := []string{"Snacks", "Drinks", "Electronics", "Groceries", "Household", "Personal Care"}
	var ids []string
	for _, t := range types {
		id := ulid.Make().String()
		_, err := db.Exec("INSERT INTO product_types (id, type_name) VALUES (?, ?)", id, t)
		if err == nil {
			ids = append(ids, id)
		}
	}
	return ids
}

func seedProductTags(db *sql.DB) []string {
	tags := []string{"Sale", "New Arrival", "Bestseller", "Organic", "Limited Edition"}
	var ids []string
	for _, t := range tags {
		id := ulid.Make().String()
		_, err := db.Exec("INSERT INTO product_tags (id, tag_name) VALUES (?, ?)", id, t)
		if err == nil {
			ids = append(ids, id)
		}
	}
	return ids
}

func seedSuppliers(db *sql.DB) []string {
	suppliers := []struct {
		name    string
		contact string
	}{
		{"City Mart Wholesale", "09123456789"},
		{"Pro Mart Distributions", "09987654321"},
		{"Global Trading Co.", "01-555-0000"},
		{"Local Farmer's Coop", "contact@localfarmers.com"},
	}
	var ids []string
	for _, s := range suppliers {
		id := ulid.Make().String()
		_, err := db.Exec("INSERT INTO suppliers (id, name, contact_info, spent_amount, time_bought) VALUES (?, ?, ?, ?, ?)",
			id, s.name, s.contact, rand.Intn(1000000), rand.Intn(50))
		if err == nil {
			ids = append(ids, id)
		}
	}
	return ids
}

func seedDeliveryServices(db *sql.DB) []string {
	services := []struct {
		name    string
		contact string
		desc    string
	}{
		{"Royal Express", "0123456", "Nationwide delivery"},
		{"Bee Delivery", "0987654", "Local fast delivery"},
		{"GrabExpress", "app only", "On-demand delivery"},
	}
	var ids []string
	for _, s := range services {
		id := ulid.Make().String()
		_, err := db.Exec("INSERT INTO delivery_services (id, delivery_service_name, contact_number, description) VALUES (?, ?, ?, ?)",
			id, s.name, s.contact, s.desc)
		if err == nil {
			ids = append(ids, id)
		}
	}
	return ids
}

func seedProducts(db *sql.DB, typeIDs, tagIDs []string) []string {
	var ids []string
	adjectives := []string{"Premium", "Organic", "Crispy", "Refreshing", "Durable", "Eco-friendly"}
	nouns := []string{"Chips", "Coffee", "Headphones", "Detergent", "Soap", "Bread", "Milk", "Soda"}

	for range 50 {
		id := ulid.Make().String()
		barcode := fmt.Sprintf("%012d", rand.Int63n(1000000000000))
		name := adjectives[rand.Intn(len(adjectives))] + " " + nouns[rand.Intn(len(nouns))]
		typeID := typeIDs[rand.Intn(len(typeIDs))]
		costPrice := (rand.Intn(50) + 10) * 100
		price := costPrice + (rand.Intn(20)+5)*100
		stock := rand.Intn(100) + 10
		alert := rand.Intn(10) + 5
		expireAt := time.Now().AddDate(0, rand.Intn(12), rand.Intn(30)).Format(time.RFC3339)

		_, err := db.Exec(`INSERT INTO products (id, barcode_id, product_name, type_id, price_mmk, stock_quantity, cost_price_mmk, alert_stock, expire_at) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			id, barcode, name, typeID, price, stock, costPrice, alert, expireAt)

		if err != nil {
			continue
		}
		ids = append(ids, id)

		numTags := rand.Intn(3)
		for range numTags {
			tagID := tagIDs[rand.Intn(len(tagIDs))]
			_, _ = db.Exec("INSERT OR IGNORE INTO product_tag_mappings (product_id, tag_id) VALUES (?, ?)", id, tagID)
		}
	}
	return ids
}

func seedInventoryLogs(db *sql.DB, productIDs, supplierIDs []string) {
	for range 20 {
		id := ulid.Make().String()
		productID := productIDs[rand.Intn(len(productIDs))]
		supplierID := supplierIDs[rand.Intn(len(supplierIDs))]
		qty := (rand.Intn(5) + 1) * 10
		cost := (rand.Intn(50) + 10) * 100

		_, _ = db.Exec("INSERT INTO inventory_logs (id, product_id, supplier_id, quantity_added, cost_price_mmk) VALUES (?, ?, ?, ?, ?)",
			id, productID, supplierID, qty, cost)
	}
}

func seedTransactions(db *sql.DB, productIDs []string, userIDs []string) {
	for range 100 {
		txID := ulid.Make().String()
		numItems := rand.Intn(5) + 1

		var cashierID any
		if len(userIDs) > 0 && rand.Intn(10) > 2 {
			cashierID = userIDs[rand.Intn(len(userIDs))]
		} else {
			cashierID = nil
		}

		paymentMethods := []string{"Cash", "KPay", "WaveMoney"}
		paymentMethod := paymentMethods[rand.Intn(len(paymentMethods))]
		createdAt := time.Now().Add(-time.Duration(rand.Intn(30*24)) * time.Hour).Format(time.RFC3339)

		// 1. Calculate items and total amount entirely in-memory first
		type tempItem struct {
			id    string
			pID   string
			qty   int
			price int
		}

		var items []tempItem
		totalAmount := 0

		for range numItems {
			productID := productIDs[rand.Intn(len(productIDs))]
			qty := rand.Intn(3) + 1

			var price int
			err := db.QueryRow("SELECT price_mmk FROM products WHERE id = ?", productID).Scan(&price)
			if err != nil {
				log.Fatalf("failed to fetch product price during seeding: %v", err)
			}

			totalAmount += price * qty

			items = append(items, tempItem{
				id:    ulid.Make().String(),
				pID:   productID,
				qty:   qty,
				price: price,
			})
		}

		// 2. Insert parent record FIRST so Foreign Keys don't cry
		_, err := db.Exec("INSERT INTO transactions (id, total_amount_mmk, payment_method, cashier_id, created_at) VALUES (?, ?, ?, ?, ?)",
			txID, totalAmount, paymentMethod, cashierID, createdAt)
		if err != nil {
			log.Fatalf("failed to insert transaction parent header: %v", err)
		}

		// 3. Insert child records SECOND
		for _, item := range items {
			_, err = db.Exec("INSERT INTO transaction_items (id, transaction_id, product_id, quantity, unit_price_mmk) VALUES (?, ?, ?, ?, ?)",
				item.id, txID, item.pID, item.qty, item.price)
			if err != nil {
				log.Fatalf("failed to insert transaction line item: %v", err)
			}
		}
	}
}

func seedSpendings(db *sql.DB) {
	reasons := []string{"Electricity Bill", "Internet", "Water", "Rent", "Staff Snacks", "Cleaning Supplies"}
	for range 100 {
		id := ulid.Make().String()
		info := reasons[rand.Intn(len(reasons))]
		amount := (rand.Intn(100) + 10) * 100
		createdAt := time.Now().Add(-time.Duration(rand.Intn(30*24)) * time.Hour).Format(time.RFC3339)

		_, _ = db.Exec("INSERT INTO spendings (id, info, amount, created_at) VALUES (?, ?, ?, ?)",
			id, info, amount, createdAt)
	}
}

func seedDeliveries(db *sql.DB, productIDs, deliveryServiceIDs []string) {
	customers := []string{"Maung Maung", "Daw Hla", "Ko Kyaw", "Su Su", "Phyu Phyu"}
	destinations := []string{"Kamayut", "Hledan", "Sanchaung", "Tamwe", "Yankin"}
	messengers := []string{"TELEGRAM", "VIBER", "PHONE"}
	payStatus := []string{"UNPAID", "PREPAID", "COD_COLLECTED"}
	delStatus := []string{"PENDING", "SHIPPED", "DELIVERED", "REJECTED"}

	for range 30 {
		id := ulid.Make().String()
		customer := customers[rand.Intn(len(customers))]
		destination := destinations[rand.Intn(len(destinations))]
		messenger := messengers[rand.Intn(len(messengers))]
		serviceID := deliveryServiceIDs[rand.Intn(len(deliveryServiceIDs))]
		fee := (rand.Intn(5) + 1) * 500
		pStatus := payStatus[rand.Intn(len(payStatus))]
		dStatus := delStatus[rand.Intn(len(delStatus))]

		numItems := rand.Intn(3) + 1
		totalAmount := 0

		for range numItems {
			itemID := ulid.Make().String()
			productID := productIDs[rand.Intn(len(productIDs))]
			qty := rand.Intn(2) + 1

			var price int
			_ = db.QueryRow("SELECT price_mmk FROM products WHERE id = ?", productID).Scan(&price)
			totalAmount += price * qty

			_, _ = db.Exec("INSERT INTO delivery_items (id, delivery_id, product_id, quantity, unit_price_mmk) VALUES (?, ?, ?, ?, ?)",
				itemID, id, productID, qty, price)
		}

		createdAt := time.Now().Add(-time.Duration(rand.Intn(10*24)) * time.Hour).Format(time.RFC3339)

		_, _ = db.Exec(`INSERT INTO deliveries (id, customer_name, destination, messenger, delivery_service_id, 
			total_amount_mmk, delivery_fee_mmk, payment_status, delivery_status, created_at) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			id, customer, destination, messenger, serviceID, totalAmount, fee, pStatus, dStatus, createdAt)
	}
}
