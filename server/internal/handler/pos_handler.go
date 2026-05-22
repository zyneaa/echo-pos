package handler

import (
	"encoding/json"
	"github.com/go-chi/chi/v5"
	"github.com/zyneaa/pos-server/internal/model"
	"github.com/zyneaa/pos-server/internal/service"
	"net/http"
	"strconv"
	"time"
)

type POSHandler struct {
	svc *service.POSService
}

func NewPOSHandler(svc *service.POSService) *POSHandler {
	return &POSHandler{svc: svc}
}

func (h *POSHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string         `json:"username"`
		Password string         `json:"password"`
		Role     model.UserRole `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.Register(r.Context(), req.Username, req.Password, req.Role); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *POSHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	token, err := h.svc.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

func (h *POSHandler) CreateProductType(w http.ResponseWriter, r *http.Request) {
	var t model.ProductType
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.CreateProductType(r.Context(), &t); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *POSHandler) GetAllProductTypes(w http.ResponseWriter, r *http.Request) {
	types, err := h.svc.GetAllProductTypes(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(types)
}

func (h *POSHandler) UpsertProduct(w http.ResponseWriter, r *http.Request) {
	var p model.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.UpsertProduct(r.Context(), &p); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *POSHandler) GetProductByBarcode(w http.ResponseWriter, r *http.Request) {
	barcodeID := chi.URLParam(r, "barcodeID")
	p, err := h.svc.GetProductByBarcode(r.Context(), barcodeID)
	if err != nil {
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(p)
}

func (h *POSHandler) GetAllProducts(w http.ResponseWriter, r *http.Request) {
	filters := make(map[string]interface{})
	query := r.URL.Query()

	if name := query.Get("name"); name != "" {
		filters["name"] = name
	}
	if typeID := query.Get("type_id"); typeID != "" {
		filters["type_id"] = typeID
	}
	if minStock := query.Get("min_stock"); minStock != "" {
		filters["min_stock"], _ = strconv.Atoi(minStock)
	}
	if maxStock := query.Get("max_stock"); maxStock != "" {
		filters["max_stock"], _ = strconv.Atoi(maxStock)
	}
	if minPrice := query.Get("min_price"); minPrice != "" {
		filters["min_price"], _ = strconv.Atoi(minPrice)
	}
	if maxPrice := query.Get("max_price"); maxPrice != "" {
		filters["max_price"], _ = strconv.Atoi(maxPrice)
	}
	if minCost := query.Get("min_cost"); minCost != "" {
		filters["min_cost"], _ = strconv.Atoi(minCost)
	}
	if maxCost := query.Get("max_cost"); maxCost != "" {
		filters["max_cost"], _ = strconv.Atoi(maxCost)
	}

	limit, _ := strconv.Atoi(query.Get("limit"))
	offset, _ := strconv.Atoi(query.Get("offset"))

	products, err := h.svc.GetProducts(r.Context(), filters, limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(products)
}

func (h *POSHandler) SearchByName(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	products, err := h.svc.SearchByName(r.Context(), name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(products)
}

func (h *POSHandler) GetLowStock(w http.ResponseWriter, r *http.Request) {
	products, err := h.svc.GetLowStock(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(products)
}

func (h *POSHandler) GetByPriceRange(w http.ResponseWriter, r *http.Request) {
	minStr := r.URL.Query().Get("min")
	maxStr := r.URL.Query().Get("max")

	min, _ := strconv.ParseFloat(minStr, 64)
	max, _ := strconv.ParseFloat(maxStr, 64)

	products, err := h.svc.GetByPriceRange(r.Context(), min, max)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(products)
}

func (h *POSHandler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	var t model.Transaction
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.CreateTransaction(r.Context(), &t); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *POSHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")
	minAmountStr := r.URL.Query().Get("min_amount")

	minAmount := 0
	if minAmountStr != "" {
		minAmount, _ = strconv.Atoi(minAmountStr)
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	transactions, err := h.svc.GetTransactions(r.Context(), start, end, minAmount, limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch transactions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(transactions); err != nil {
		http.Error(w, "Failed to encode JSON", http.StatusInternalServerError)
	}
}

func (h *POSHandler) CreateSpending(w http.ResponseWriter, r *http.Request) {
	var s model.Spending
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.AddSpending(r.Context(), &s); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *POSHandler) GetSpendings(w http.ResponseWriter, r *http.Request) {
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")

	spendings, err := h.svc.GetSpending(r.Context(), start, end)
	if err != nil {
		http.Error(w, "Failed to fetch transactions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(spendings); err != nil {
		http.Error(w, "Failed to encode JSON", http.StatusInternalServerError)
	}
}

func (h *POSHandler) PingServer(w http.ResponseWriter, r *http.Request) {
	currentTime := time.Now().Format(time.RFC3339)
	json.NewEncoder(w).Encode(currentTime)
}
