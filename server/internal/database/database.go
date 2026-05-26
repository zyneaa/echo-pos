package database

import (
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	_ "modernc.org/sqlite"
	"path/filepath"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

type DB struct {
	*sql.DB
}

func InitDB(dbPath string) (*DB, error) {
	sqlDB, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite db: %w", err)
	}

	if _, err := sqlDB.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		sqlDB.Close()
		return nil, fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	db := &DB{sqlDB}

	if err := db.runMigrations(); err != nil {
		db.Close()
		return nil, err
	}

	return db, nil
}

func (db *DB) runMigrations() error {
	files, err := fs.ReadDir(migrationFS, "migrations")
	if err != nil {
		return fmt.Errorf("failed to read migrations dir: %w", err)
	}

	for _, file := range files {
		if file.IsDir() || filepath.Ext(file.Name()) != ".sql" {
			continue
		}

		content, err := migrationFS.ReadFile("migrations/" + file.Name())
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", file.Name(), err)
		}

		_, err = db.Exec(string(content))
		if err != nil {
			return fmt.Errorf("migration failed in %s: %w", file.Name(), err)
		}
	}

	return nil
}
