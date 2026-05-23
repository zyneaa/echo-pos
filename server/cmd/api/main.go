package main

import (
	"context"
	"github.com/zyneaa/server/internal/config"
	"github.com/zyneaa/server/internal/database"
	"github.com/zyneaa/server/internal/pos"
	"github.com/zyneaa/server/internal/server"
	"github.com/zyneaa/server/internal/user"
	"github.com/zyneaa/server/pkg/backup"
	"log"
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

	go func() {
		err := userSvc.Register(context.Background(), "admin", "admin123", user.RoleAdmin)
		if err != nil {
			log.Printf("Admin user already exists or failed to create: %v", err)
		} else {
			log.Println("Initial admin user created: admin/admin123")
		}
	}()

	backup.StartBackupCron(cfg.DBPath)

	srv := server.NewServer(cfg.Port, userH, posH)

	log.Printf("Server starting on port %s", cfg.Port)
	if err := srv.Start(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
