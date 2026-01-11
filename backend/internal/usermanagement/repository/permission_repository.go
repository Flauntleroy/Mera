// Package repository provides data access for permission management.
package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/clinova/simrs/backend/internal/auth/entity"
)

// PermissionRepository handles permission data access.
type PermissionRepository interface {
	Create(ctx context.Context, perm *entity.Permission) error
	GetByID(ctx context.Context, id string) (*entity.Permission, error)
	GetByCode(ctx context.Context, code string) (*entity.Permission, error)
	GetAll(ctx context.Context) ([]entity.Permission, error)
	GetByDomain(ctx context.Context, domain string) ([]entity.Permission, error)
}

// MySQLPermissionRepository implements PermissionRepository for MySQL.
type MySQLPermissionRepository struct {
	db *sql.DB
}

// NewMySQLPermissionRepository creates a new MySQL permission repository.
func NewMySQLPermissionRepository(db *sql.DB) *MySQLPermissionRepository {
	return &MySQLPermissionRepository{db: db}
}

func (r *MySQLPermissionRepository) Create(ctx context.Context, perm *entity.Permission) error {
	query := `INSERT INTO permissions (id, code, domain, action, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, perm.ID, perm.Code, perm.Domain, perm.Action, perm.Description, time.Now())
	return err
}

func (r *MySQLPermissionRepository) GetByID(ctx context.Context, id string) (*entity.Permission, error) {
	query := `SELECT id, code, domain, action, description FROM permissions WHERE id = ?`
	row := r.db.QueryRowContext(ctx, query, id)

	var p entity.Permission
	var desc sql.NullString
	err := row.Scan(&p.ID, &p.Code, &p.Domain, &p.Action, &desc)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		p.Description = desc.String
	}
	return &p, nil
}

func (r *MySQLPermissionRepository) GetByCode(ctx context.Context, code string) (*entity.Permission, error) {
	query := `SELECT id, code, domain, action, description FROM permissions WHERE code = ?`
	row := r.db.QueryRowContext(ctx, query, code)

	var p entity.Permission
	var desc sql.NullString
	err := row.Scan(&p.ID, &p.Code, &p.Domain, &p.Action, &desc)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		p.Description = desc.String
	}
	return &p, nil
}

func (r *MySQLPermissionRepository) GetAll(ctx context.Context) ([]entity.Permission, error) {
	query := `SELECT id, code, domain, action, description FROM permissions ORDER BY domain, action`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var perms []entity.Permission
	for rows.Next() {
		var p entity.Permission
		var desc sql.NullString
		if err := rows.Scan(&p.ID, &p.Code, &p.Domain, &p.Action, &desc); err != nil {
			return nil, err
		}
		if desc.Valid {
			p.Description = desc.String
		}
		perms = append(perms, p)
	}
	return perms, nil
}

func (r *MySQLPermissionRepository) GetByDomain(ctx context.Context, domain string) ([]entity.Permission, error) {
	query := `SELECT id, code, domain, action, description FROM permissions WHERE domain = ? ORDER BY action`
	rows, err := r.db.QueryContext(ctx, query, domain)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var perms []entity.Permission
	for rows.Next() {
		var p entity.Permission
		var desc sql.NullString
		if err := rows.Scan(&p.ID, &p.Code, &p.Domain, &p.Action, &desc); err != nil {
			return nil, err
		}
		if desc.Valid {
			p.Description = desc.String
		}
		perms = append(perms, p)
	}
	return perms, nil
}
