package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/username/pos-server/internal/handler"
	"github.com/username/pos-server/internal/repository"
	"github.com/username/pos-server/internal/service"
	"github.com/username/pos-server/pkg/auth"
	"github.com/username/pos-server/pkg/backup"
	"github.com/username/pos-server/pkg/database"
)

func main() {
	dbPath := "pos.db"
	db, err := database.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	repo := repository.NewSQLiteRepository(db)
	svc := service.NewPOSService(repo)
	h := handler.NewPOSHandler(svc)

	// Create initial admin for testing
	go func() {
		err := svc.Register(context.Background(), "admin", "admin123", "Admin")
		if err != nil {
			log.Printf("Admin user already exists or failed to create: %v", err)
		} else {
			log.Println("Initial admin user created: admin/admin123")
		}
	}()

	// Start daily backup
	backup.StartBackupCron(dbPath)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/ping", h.PingServer)
	r.Post("/register", h.Register)
	r.Post("/login", h.Login)

	r.Group(func(r chi.Router) {
		r.Use(JWTMiddleware)
		r.Post("/products", h.UpsertProduct)
		r.Get("/products", h.GetAllProducts)
		r.Get("/products/search", h.SearchByName)
		r.Get("/products/low-stock", h.GetLowStock)
		r.Get("/products/price-range", h.GetByPriceRange)
		r.Get("/products/{barcodeID}", h.GetProductByBarcode)
		r.Post("/product-types", h.CreateProductType)
		r.Get("/product-types", h.GetAllProductTypes)
		r.Post("/transactions", h.CreateTransaction)
		r.Get("/transactions", h.GetTransactionByPeriod)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe("0.0.0.0:"+port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
			return
		}

		claims, err := auth.ValidateToken(parts[1])
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "user_id", claims.UserID)
		ctx = context.WithValue(ctx, "role", claims.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
