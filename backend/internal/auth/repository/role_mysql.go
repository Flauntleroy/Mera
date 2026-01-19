package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"

	"github.com/clinova/simrs/backend/internal/auth/entity"
)

type mysqlRoleRepository struct {
	db *sql.DB
}

func NewMySQLRoleRepository(db *sql.DB) RoleRepository {
	return &mysqlRoleRepository{db: db}
}

func (r *mysqlRoleRepository) Create(ctx context.Context, role *entity.Role) error {
	if role.ID == "" {
		role.ID = uuid.New().String()
	}
	query := `INSERT INTO mera_roles (id, name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`
	_, err := r.db.ExecContext(ctx, query, role.ID, role.Name, role.Description)
	return err
}

func (r *mysqlRoleRepository) GetByID(ctx context.Context, id string) (*entity.Role, error) {
	query := `SELECT id, name, description, created_at, updated_at FROM mera_roles WHERE id = ?`
	role := &entity.Role{}
	var desc sql.NullString
	err := r.db.QueryRowContext(ctx, query, id).Scan(&role.ID, &role.Name, &desc, &role.CreatedAt, &role.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		role.Description = desc.String
	}
	return role, nil
}

func (r *mysqlRoleRepository) GetByName(ctx context.Context, name string) (*entity.Role, error) {
	query := `SELECT id, name, description, created_at, updated_at FROM mera_roles WHERE name = ?`
	role := &entity.Role{}
	var desc sql.NullString
	err := r.db.QueryRowContext(ctx, query, name).Scan(&role.ID, &role.Name, &desc, &role.CreatedAt, &role.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		role.Description = desc.String
	}
	return role, nil
}

func (r *mysqlRoleRepository) GetAll(ctx context.Context) ([]entity.Role, error) {
	query := `SELECT id, name, description, created_at, updated_at FROM roles ORDER BY name`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var roles []entity.Role
	for rows.Next() {
		var role entity.Role
		var desc sql.NullString
		if err := rows.Scan(&role.ID, &role.Name, &desc, &role.CreatedAt, &role.UpdatedAt); err != nil {
			return nil, err
		}
		if desc.Valid {
			role.Description = desc.String
		}
		roles = append(roles, role)
	}
	return roles, nil
}

func (r *mysqlRoleRepository) Update(ctx context.Context, role *entity.Role) error {
	query := `UPDATE mera_roles SET name = ?, description = ?, updated_at = NOW() WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, role.Name, role.Description, role.ID)
	return err
}

func (r *mysqlRoleRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM mera_roles WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *mysqlRoleRepository) GetPermissionsByRoleID(ctx context.Context, roleID string) ([]entity.Permission, error) {
	query := `SELECT p.id, p.code, p.domain, p.action, p.description, p.created_at FROM mera_permissions p INNER JOIN mera_role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?`
	rows, err := r.db.QueryContext(ctx, query, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var perms []entity.Permission
	for rows.Next() {
		var p entity.Permission
		var desc sql.NullString
		if err := rows.Scan(&p.ID, &p.Code, &p.Domain, &p.Action, &desc, &p.CreatedAt); err != nil {
			return nil, err
		}
		if desc.Valid {
			p.Description = desc.String
		}
		perms = append(perms, p)
	}
	return perms, nil
}

func (r *mysqlRoleRepository) AssignPermission(ctx context.Context, roleID, permissionID string) error {
	query := `INSERT IGNORE INTO mera_role_permissions (role_id, permission_id, created_at) VALUES (?, ?, NOW())`
	_, err := r.db.ExecContext(ctx, query, roleID, permissionID)
	return err
}

func (r *mysqlRoleRepository) RemovePermission(ctx context.Context, roleID, permissionID string) error {
	query := `DELETE FROM mera_role_permissions WHERE role_id = ? AND permission_id = ?`
	_, err := r.db.ExecContext(ctx, query, roleID, permissionID)
	return err
}
