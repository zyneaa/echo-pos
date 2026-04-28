package service

import (
	"context"
	"errors"
	"github.com/google/uuid"
	"github.com/username/pos-server/internal/model"
	"github.com/username/pos-server/internal/repository"
	"github.com/username/pos-server/pkg/auth"
	"golang.org/x/crypto/bcrypt"
)

type POSService struct {
	repo *repository.SQLiteRepository
}

func NewPOSService(repo *repository.SQLiteRepository) *POSService {
	return &POSService{repo: repo}
}

func (s *POSService) Register(ctx context.Context, username, password string, role model.UserRole) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := &model.User{
		ID:           uuid.New().String(),
		Username:     username,
		PasswordHash: string(hashedPassword),
		Role:         role,
	}

	return s.repo.CreateUser(ctx, user)
}

func (s *POSService) Login(ctx context.Context, username, password string) (string, error) {
	user, err := s.repo.GetUserByUsername(ctx, username)
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	token, err := auth.GenerateToken(user.ID, string(user.Role))
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *POSService) CreateProductType(ctx context.Context, t *model.ProductType) error {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	return s.repo.CreateProductType(ctx, t)
}

func (s *POSService) GetAllProductTypes(ctx context.Context) ([]model.ProductType, error) {
	return s.repo.GetAllProductTypes(ctx)
}

func (s *POSService) UpsertProduct(ctx context.Context, p *model.Product) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return s.repo.UpsertProduct(ctx, p)
}

func (s *POSService) GetProductByBarcode(ctx context.Context, barcodeID string) (*model.Product, error) {
	return s.repo.GetProductByBarcode(ctx, barcodeID)
}

func (s *POSService) GetAllProducts(ctx context.Context) ([]model.Product, error) {
	return s.repo.GetAllProducts(ctx)
}

func (s *POSService) CreateTransaction(ctx context.Context, t *model.Transaction) error {
	return s.repo.CreateTransaction(ctx, t)
}
