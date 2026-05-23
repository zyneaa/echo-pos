package server

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/zyneaa/server/internal/middlewares"
	"golang.org/x/time/rate"
	"net/http"
)

func (s *Server) RegisterRoutes() http.Handler {
	r := chi.NewRouter()

	limiter := middlewares.NewRateLimiter(rate.Limit(5), 10)
	r.Use(limiter.Limit)

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/ping", s.posH.PingServer)
	r.Post("/register", s.userH.Register)
	r.Post("/login", s.userH.Login)

	r.Group(func(r chi.Router) {
		r.Use(middlewares.JWTMiddleware)

		r.Post("/products", s.posH.UpsertProduct)
		r.Get("/products", s.posH.GetAllProducts)
		r.Get("/products/search", s.posH.SearchByName)
		r.Get("/products/low-stock", s.posH.GetLowStock)
		r.Get("/products/price-range", s.posH.GetByPriceRange)
		r.Get("/products/{barcodeID}", s.posH.GetProductByBarcode)

		r.Post("/product-types", s.posH.CreateProductType)
		r.Get("/product-types", s.posH.GetAllProductTypes)

		r.Post("/transactions", s.posH.CreateTransaction)
		r.Get("/transactions", s.posH.GetTransactions)

		r.Post("/spending", s.posH.CreateSpending)
	})

	return r
}
