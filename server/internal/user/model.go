package user

import (
	"time"
)

type UserRole string

const (
	RoleAdmin   UserRole = "Admin"
	RoleCashier UserRole = "Cashier"
)

type User struct {
	ID           string    `json:"id" db:"id"`
	Username     string    `json:"username" db:"username"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Role         UserRole  `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}
