package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"

	"github.com/clinova/simrs/backend/internal/auth/entity"
)

type mysqlPermissionRepository struct {
	db *sql.DB
}

func NewMySQLPermissionRepository(db *sql.DB) PermissionRepository {
	return &mysqlPermissionRepository{db: db}
}

func (r *mysqlPermissionRepository) Create(ctx context.Context, perm *entity.Permission) error {
	if perm.ID == "" {
		perm.ID = uuid.New().String()
	}
	query := `INSERT INTO mera_permissions (id, code, domain, action, description, created_at) VALUES (?, ?, ?, ?, ?, NOW())`
	_, err := r.db.ExecContext(ctx, query, perm.ID, perm.Code, perm.Domain, perm.Action, perm.Description)
	return err
}

func (r *mysqlPermissionRepository) GetByID(ctx context.Context, id string) (*entity.Permission, error) {
	query := `SELECT id, code, domain, action, description, created_at FROM mera_permissions WHERE id = ?`
	p := &entity.Permission{}
	var desc sql.NullString
	err := r.db.QueryRowContext(ctx, query, id).Scan(&p.ID, &p.Code, &p.Domain, &p.Action, &desc, &p.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		p.Description = desc.String
	}
	return p, nil
}

func (r *mysqlPermissionRepository) GetByCode(ctx context.Context, code string) (*entity.Permission, error) {
	query := `SELECT id, code, domain, action, description, created_at FROM mera_permissions WHERE code = ?`
	p := &entity.Permission{}
	var desc sql.NullString
	err := r.db.QueryRowContext(ctx, query, code).Scan(&p.ID, &p.Code, &p.Domain, &p.Action, &desc, &p.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		p.Description = desc.String
	}
	return p, nil
}

func (r *mysqlPermissionRepository) GetByDomain(ctx context.Context, domain string) ([]entity.Permission, error) {
	query := `SELECT id, code, domain, action, description, created_at FROM mera_permissions WHERE domain = ?`
	rows, err := r.db.QueryContext(ctx, query, domain)
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

func (r *mysqlPermissionRepository) GetAll(ctx context.Context) ([]entity.Permission, error) {
	query := `SELECT id, code, domain, action, description, created_at FROM mera_permissions ORDER BY domain, action`
	rows, err := r.db.QueryContext(ctx, query)
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

func (r *mysqlPermissionRepository) GetEffectivePermissions(ctx context.Context, userID string) (map[string]bool, error) {
	// Get role-based permissions
	query := `SELECT DISTINCT p.code FROM mera_permissions p INNER JOIN mera_role_permissions rp ON p.id = rp.permission_id INNER JOIN mera_user_roles ur ON rp.role_id = ur.role_id WHERE ur.user_id = ?`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	perms := make(map[string]bool)
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return nil, err
		}
		perms[code] = true
	}

	// Apply user overrides
	overrideQuery := `SELECT p.code, up.type FROM mera_user_permissions up INNER JOIN mera_permissions p ON up.permission_id = p.id WHERE up.user_id = ?`
	overrideRows, err := r.db.QueryContext(ctx, overrideQuery, userID)
	if err != nil {
		return nil, err
	}
	defer overrideRows.Close()

	for overrideRows.Next() {
		var code, overrideType string
		if err := overrideRows.Scan(&code, &overrideType); err != nil {
			return nil, err
		}
		if overrideType == entity.OverrideTypeGrant {
			perms[code] = true
		} else if overrideType == entity.OverrideTypeRevoke {
			perms[code] = false
		}
	}
	return perms, nil
}

func (r *mysqlPermissionRepository) GetUserOverrides(ctx context.Context, userID string) ([]entity.UserPermissionOverride, error) {
	query := `SELECT up.user_id, up.permission_id, up.type, up.created_at, p.id, p.code, p.domain, p.action, p.description, p.created_at FROM mera_user_permissions up INNER JOIN mera_permissions p ON up.permission_id = p.id WHERE up.user_id = ?`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var overrides []entity.UserPermissionOverride
	for rows.Next() {
		var o entity.UserPermissionOverride
		var p entity.Permission
		var desc sql.NullString
		if err := rows.Scan(&o.UserID, &o.PermissionID, &o.Type, &o.CreatedAt, &p.ID, &p.Code, &p.Domain, &p.Action, &desc, &p.CreatedAt); err != nil {
			return nil, err
		}
		if desc.Valid {
			p.Description = desc.String
		}
		o.Permission = &p
		overrides = append(overrides, o)
	}
	return overrides, nil
}

func (r *mysqlPermissionRepository) SetUserOverride(ctx context.Context, userID, permissionID, overrideType string) error {
	query := `INSERT INTO mera_user_permissions (user_id, permission_id, type, created_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE type = VALUES(type)`
	_, err := r.db.ExecContext(ctx, query, userID, permissionID, overrideType)
	return err
}

func (r *mysqlPermissionRepository) RemoveUserOverride(ctx context.Context, userID, permissionID string) error {
	query := `DELETE FROM mera_user_permissions WHERE user_id = ? AND permission_id = ?`
	_, err := r.db.ExecContext(ctx, query, userID, permissionID)
	return err
}
