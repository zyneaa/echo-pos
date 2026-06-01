package pos

import (
	"context"
	"database/sql"

	"github.com/oklog/ulid/v2"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateProductType(ctx context.Context, t *ProductType) error {
	if t.ID == "" {
		t.ID = ulid.Make().String()
	}
	return s.repo.CreateProductType(ctx, t)
}

func (s *Service) GetAllProductTypes(ctx context.Context) ([]ProductType, error) {
	return s.repo.GetAllProductTypes(ctx)
}

func (s *Service) UpsertProduct(ctx context.Context, p *Product) error {
	if p.ID == "" {
		p.ID = ulid.Make().String()
	}
	return s.repo.UpsertProduct(ctx, p)
}

func (s *Service) GetProducts(ctx context.Context, filters map[string]any, limit, offset int) ([]Product, error) {
	return s.repo.GetProducts(ctx, filters, limit, offset)
}

func (s *Service) GetProductByBarcode(ctx context.Context, barcodeID string) (*Product, error) {
	return s.repo.GetProductByBarcode(ctx, barcodeID)
}

func (s *Service) CreateTransaction(ctx context.Context, tx *sql.Tx, t *Transaction, tID string) error {
	return s.repo.CreateTransaction(ctx, tx, t, tID)
}

func (s *Service) InsertTransactionItems(ctx context.Context, tx *sql.Tx, txID string, items []TransactionItem) error {
	return s.repo.InsertTransactionItems(ctx, tx, txID, items)
}

func (s *Service) ProcessCheckout(ctx context.Context, t *Transaction) error {
	tx, err := s.repo.BeginTransaction(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	tID := ulid.Make().String()

	var calculatedTotal uint64
	for i, item := range t.Items {
		prod, err := s.repo.GetProductByID(ctx, item.ProductID)
		if err != nil {
			return err
		}

		t.Items[i].ID = ulid.Make().String()
		t.Items[i].UnitPriceMMK = prod.PriceMMK
		t.Items[i].TransactionID = &tID

		calculatedTotal += prod.PriceMMK * item.Quantity
	}

	t.TotalAmountMMK = calculatedTotal

	if err := s.CreateTransaction(ctx, tx, t, tID); err != nil {
		return err
	}

	if err := s.InsertTransactionItems(ctx, tx, tID, t.Items); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

func (s *Service) GetTransactions(ctx context.Context, start, end string, minAmount, limit, offset int) ([]Transaction, error) {
	return s.repo.GetTransactions(ctx, start, end, minAmount, limit, offset)
}

func (s *Service) GetLowStock(ctx context.Context) ([]Product, error) {
	return s.repo.GetLowStock(ctx)
}

func (s *Service) AddSpending(ctx context.Context, sp *Spending) error {
	return s.repo.AddSpending(ctx, sp)
}

func (s *Service) GetSpending(ctx context.Context, start, end string) ([]Spending, error) {
	return s.repo.GetSpending(ctx, start, end)
}
