package main

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/zyneaa/pos-server/internal/config"
	"github.com/zyneaa/pos-server/internal/database"
	"github.com/zyneaa/pos-server/internal/pos"
	"github.com/zyneaa/pos-server/internal/user"
	"github.com/zyneaa/pos-server/pkg/auth"
	"github.com/zyneaa/pos-server/pkg/backup"
)

func main() {
	cfg := config.Load()

	db, err := database.InitDB(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	userRepo := user.NewRepository(db)
	userSvc := user.NewService(userRepo)
	userH := user.NewHandler(userSvc)

	posRepo := pos.NewRepository(db)
	posSvc := pos.NewService(posRepo)
	posH := pos.NewHandler(posSvc)

	// Create initial admin for testing
	go func() {
		err := userSvc.Register(context.Background(), "admin", "admin123", user.RoleAdmin)
		if err != nil {
			log.Printf("Admin user already exists or failed to create: %v", err)
		} else {
			log.Println("Initial admin user created: admin/admin123")
		}
	}()

	// Start daily backup
	backup.StartBackupCron(cfg.DBPath)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/ping", posH.PingServer)
	r.Post("/register", userH.Register)
	r.Post("/login", userH.Login)

	r.Group(func(r chi.Router) {
		r.Use(JWTMiddleware)
		r.Post("/products", posH.UpsertProduct)
		r.Get("/products", posH.GetAllProducts)
		r.Get("/products/search", posH.SearchByName)
		r.Get("/products/low-stock", posH.GetLowStock)
		r.Get("/products/price-range", posH.GetByPriceRange)
		r.Get("/products/{barcodeID}", posH.GetProductByBarcode)
		r.Post("/product-types", posH.CreateProductType)
		r.Get("/product-types", posH.GetAllProductTypes)
		r.Post("/transactions", posH.CreateTransaction)
		r.Get("/transactions", posH.GetTransactions)
		r.Post("/spending", posH.CreateSpending)
	})

	log.Printf("Server starting on port %s", cfg.Port)
	if err := http.ListenAndServe("0.0.0.0:"+cfg.Port, r); err != nil {
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
