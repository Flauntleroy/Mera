// Package repository provides data access for role management.
package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/clinova/simrs/backend/internal/auth/entity"
)

// RoleRepository handles role data access.
type RoleRepository interface {
	Create(ctx context.Context, role *entity.Role) error
	GetByID(ctx context.Context, id string) (*entity.Role, error)
	GetByName(ctx context.Context, name string) (*entity.Role, error)
	GetAll(ctx context.Context) ([]entity.Role, error)
	Update(ctx context.Context, role *entity.Role) error
	Delete(ctx context.Context, id string) error
	IsSystemRole(ctx context.Context, id string) (bool, error)

	// Permission assignment
	GetPermissionsByRoleID(ctx context.Context, roleID string) ([]entity.Permission, error)
	AssignPermissions(ctx context.Context, roleID string, permissionIDs []string) error
	RemoveAllPermissions(ctx context.Context, roleID string) error
}

// MySQLRoleRepository implements RoleRepository for MySQL.
type MySQLRoleRepository struct {
	db *sql.DB
}

// NewMySQLRoleRepository creates a new MySQL role repository.
func NewMySQLRoleRepository(db *sql.DB) *MySQLRoleRepository {
	return &MySQLRoleRepository{db: db}
}

func (r *MySQLRoleRepository) Create(ctx context.Context, role *entity.Role) error {
	query := `INSERT INTO mera_roles (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, role.ID, role.Name, role.Description, time.Now(), time.Now())
	return err
}

func (r *MySQLRoleRepository) GetByID(ctx context.Context, id string) (*entity.Role, error) {
	query := `SELECT id, name, description, created_at, updated_at FROM mera_roles WHERE id = ?`
	row := r.db.QueryRowContext(ctx, query, id)

	var role entity.Role
	var desc sql.NullString
	var createdAt, updatedAt time.Time
	err := row.Scan(&role.ID, &role.Name, &desc, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		role.Description = desc.String
	}
	return &role, nil
}

func (r *MySQLRoleRepository) GetByName(ctx context.Context, name string) (*entity.Role, error) {
	query := `SELECT id, name, description, created_at, updated_at FROM mera_roles WHERE name = ?`
	row := r.db.QueryRowContext(ctx, query, name)

	var role entity.Role
	var desc sql.NullString
	var createdAt, updatedAt time.Time
	err := row.Scan(&role.ID, &role.Name, &desc, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		role.Description = desc.String
	}
	return &role, nil
}

func (r *MySQLRoleRepository) GetAll(ctx context.Context) ([]entity.Role, error) {
	query := `SELECT id, name, description, created_at, updated_at FROM mera_roles ORDER BY name`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []entity.Role
	for rows.Next() {
		var role entity.Role
		var desc sql.NullString
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&role.ID, &role.Name, &desc, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		if desc.Valid {
			role.Description = desc.String
		}
		roles = append(roles, role)
	}
	return roles, nil
}

func (r *MySQLRoleRepository) Update(ctx context.Context, role *entity.Role) error {
	query := `UPDATE mera_roles SET name = ?, description = ?, updated_at = ? WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, role.Name, role.Description, time.Now(), role.ID)
	return err
}

func (r *MySQLRoleRepository) Delete(ctx context.Context, id string) error {
	// Delete role_permissions first
	if _, err := r.db.ExecContext(ctx, `DELETE FROM mera_role_permissions WHERE role_id = ?`, id); err != nil {
		return err
	}
	// Delete user_roles
	if _, err := r.db.ExecContext(ctx, `DELETE FROM mera_user_roles WHERE role_id = ?`, id); err != nil {
		return err
	}
	// Delete role
	_, err := r.db.ExecContext(ctx, `DELETE FROM mera_roles WHERE id = ?`, id)
	return err
}

func (r *MySQLRoleRepository) IsSystemRole(ctx context.Context, id string) (bool, error) {
	// Only admin is a system role (protected from deletion)
	query := `SELECT name FROM mera_roles WHERE id = ?`
	var name string
	err := r.db.QueryRowContext(ctx, query, id).Scan(&name)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	// Only admin role is protected
	return name == "admin", nil
}

func (r *MySQLRoleRepository) GetPermissionsByRoleID(ctx context.Context, roleID string) ([]entity.Permission, error) {
	query := `SELECT p.id, p.code, p.domain, p.action, p.description 
			  FROM mera_permissions p
			  INNER JOIN mera_role_permissions rp ON p.id = rp.permission_id
			  WHERE rp.role_id = ?`
	rows, err := r.db.QueryContext(ctx, query, roleID)
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

func (r *MySQLRoleRepository) AssignPermissions(ctx context.Context, roleID string, permissionIDs []string) error {
	// Remove existing permissions
	if err := r.RemoveAllPermissions(ctx, roleID); err != nil {
		return err
	}

	if len(permissionIDs) == 0 {
		return nil
	}

	query := `INSERT INTO mera_role_permissions (role_id, permission_id, created_at) VALUES (?, ?, ?)`
	for _, permID := range permissionIDs {
		if _, err := r.db.ExecContext(ctx, query, roleID, permID, time.Now()); err != nil {
			return err
		}
	}
	return nil
}

func (r *MySQLRoleRepository) RemoveAllPermissions(ctx context.Context, roleID string) error {
	query := `DELETE FROM mera_role_permissions WHERE role_id = ?`
	_, err := r.db.ExecContext(ctx, query, roleID)
	return err
}
