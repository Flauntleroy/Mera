// Package repository provides data access for user management.
package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/clinova/simrs/backend/internal/auth/entity"
)

// UserRepository handles user data access.
type UserRepository interface {
	// User CRUD
	Create(ctx context.Context, user *entity.User) error
	GetByID(ctx context.Context, id string) (*entity.User, error)
	GetByUsername(ctx context.Context, username string) (*entity.User, error)
	GetAll(ctx context.Context, limit, offset int) ([]entity.User, int, error)
	Update(ctx context.Context, user *entity.User) error
	SoftDelete(ctx context.Context, id string) error

	// Role assignment
	GetRolesByUserID(ctx context.Context, userID string) ([]entity.Role, error)
	AssignRoles(ctx context.Context, userID string, roleIDs []string) error
	RemoveAllRoles(ctx context.Context, userID string) error

	// Permission overrides
	GetPermissionOverrides(ctx context.Context, userID string) ([]PermissionOverride, error)
	SetPermissionOverrides(ctx context.Context, userID string, overrides []PermissionOverride) error
	RemoveAllPermissionOverrides(ctx context.Context, userID string) error

	// Copy access
	CopyAccess(ctx context.Context, sourceUserID, targetUserID string) error
}

// PermissionOverride represents a user-specific permission override.
type PermissionOverride struct {
	PermissionID   string `json:"permission_id"`
	PermissionCode string `json:"permission_code"`
	Effect         string `json:"effect"` // GRANT or REVOKE
}

// MySQLUserRepository implements UserRepository for MySQL.
type MySQLUserRepository struct {
	db *sql.DB
}

// NewMySQLUserRepository creates a new MySQL user repository.
func NewMySQLUserRepository(db *sql.DB) *MySQLUserRepository {
	return &MySQLUserRepository{db: db}
}

func (r *MySQLUserRepository) Create(ctx context.Context, user *entity.User) error {
	query := `INSERT INTO mera_users (id, username, email, password_hash, is_active, created_at, updated_at)
			  VALUES (?, ?, ?, ?, ?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query,
		user.ID, user.Username, user.Email, user.PasswordHash,
		user.IsActive, user.CreatedAt, user.UpdatedAt)
	return err
}

func (r *MySQLUserRepository) GetByID(ctx context.Context, id string) (*entity.User, error) {
	query := `SELECT id, username, email, password_hash, is_active, last_login_at, created_at, updated_at
			  FROM mera_users WHERE id = ? AND deleted_at IS NULL`
	row := r.db.QueryRowContext(ctx, query, id)
	return scanUser(row)
}

func (r *MySQLUserRepository) GetByUsername(ctx context.Context, username string) (*entity.User, error) {
	query := `SELECT id, username, email, password_hash, is_active, last_login_at, created_at, updated_at
			  FROM mera_users WHERE username = ? AND deleted_at IS NULL`
	row := r.db.QueryRowContext(ctx, query, username)
	return scanUser(row)
}

func (r *MySQLUserRepository) GetAll(ctx context.Context, limit, offset int) ([]entity.User, int, error) {
	// Count total
	var total int
	countQuery := `SELECT COUNT(*) FROM mera_users WHERE deleted_at IS NULL`
	if err := r.db.QueryRowContext(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Get paginated users
	query := `SELECT id, username, email, password_hash, is_active, last_login_at, created_at, updated_at
			  FROM mera_users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?`
	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []entity.User
	for rows.Next() {
		var u entity.User
		var lastLogin sql.NullTime
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash,
			&u.IsActive, &lastLogin, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		if lastLogin.Valid {
			u.LastLoginAt = &lastLogin.Time
		}
		users = append(users, u)
	}
	return users, total, nil
}

func (r *MySQLUserRepository) Update(ctx context.Context, user *entity.User) error {
	query := `UPDATE mera_users SET username = ?, email = ?, password_hash = ?, is_active = ?, updated_at = ?
			  WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query,
		user.Username, user.Email, user.PasswordHash, user.IsActive, time.Now(), user.ID)
	return err
}

func (r *MySQLUserRepository) SoftDelete(ctx context.Context, id string) error {
	query := `UPDATE mera_users SET deleted_at = ?, is_active = FALSE WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, time.Now(), id)
	return err
}

func (r *MySQLUserRepository) GetRolesByUserID(ctx context.Context, userID string) ([]entity.Role, error) {
	query := `SELECT r.id, r.name, r.description FROM mera_roles r
			  INNER JOIN mera_user_roles ur ON r.id = ur.role_id
			  WHERE ur.user_id = ?`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []entity.Role
	for rows.Next() {
		var role entity.Role
		var desc sql.NullString
		if err := rows.Scan(&role.ID, &role.Name, &desc); err != nil {
			return nil, err
		}
		if desc.Valid {
			role.Description = desc.String
		}
		roles = append(roles, role)
	}
	return roles, nil
}

func (r *MySQLUserRepository) AssignRoles(ctx context.Context, userID string, roleIDs []string) error {
	// Remove existing roles
	if err := r.RemoveAllRoles(ctx, userID); err != nil {
		return err
	}

	// Insert new roles
	if len(roleIDs) == 0 {
		return nil
	}

	query := `INSERT INTO mera_user_roles (user_id, role_id, created_at) VALUES (?, ?, ?)`
	for _, roleID := range roleIDs {
		if _, err := r.db.ExecContext(ctx, query, userID, roleID, time.Now()); err != nil {
			return err
		}
	}
	return nil
}

func (r *MySQLUserRepository) RemoveAllRoles(ctx context.Context, userID string) error {
	query := `DELETE FROM mera_user_roles WHERE user_id = ?`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}

func (r *MySQLUserRepository) GetPermissionOverrides(ctx context.Context, userID string) ([]PermissionOverride, error) {
	query := `SELECT up.permission_id, p.code, up.type FROM mera_user_permissions up
			  INNER JOIN mera_permissions p ON up.permission_id = p.id
			  WHERE up.user_id = ?`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var overrides []PermissionOverride
	for rows.Next() {
		var o PermissionOverride
		if err := rows.Scan(&o.PermissionID, &o.PermissionCode, &o.Effect); err != nil {
			return nil, err
		}
		overrides = append(overrides, o)
	}
	return overrides, nil
}

func (r *MySQLUserRepository) SetPermissionOverrides(ctx context.Context, userID string, overrides []PermissionOverride) error {
	// Remove existing overrides
	if err := r.RemoveAllPermissionOverrides(ctx, userID); err != nil {
		return err
	}

	if len(overrides) == 0 {
		return nil
	}

	query := `INSERT INTO mera_user_permissions (user_id, permission_id, type, created_at) VALUES (?, ?, ?, ?)`
	for _, o := range overrides {
		if _, err := r.db.ExecContext(ctx, query, userID, o.PermissionID, o.Effect, time.Now()); err != nil {
			return err
		}
	}
	return nil
}

func (r *MySQLUserRepository) RemoveAllPermissionOverrides(ctx context.Context, userID string) error {
	query := `DELETE FROM mera_user_permissions WHERE user_id = ?`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}

func (r *MySQLUserRepository) CopyAccess(ctx context.Context, sourceUserID, targetUserID string) error {
	// 1. Remove target's existing roles
	if err := r.RemoveAllRoles(ctx, targetUserID); err != nil {
		return err
	}

	// 2. Remove target's existing permission overrides
	if err := r.RemoveAllPermissionOverrides(ctx, targetUserID); err != nil {
		return err
	}

	// 3. Copy roles from source to target
	copyRolesQuery := `INSERT INTO mera_user_roles (user_id, role_id, created_at)
					   SELECT ?, role_id, ? FROM mera_user_roles WHERE user_id = ?`
	if _, err := r.db.ExecContext(ctx, copyRolesQuery, targetUserID, time.Now(), sourceUserID); err != nil {
		return err
	}

	// 4. Copy permission overrides from source to target
	copyPermsQuery := `INSERT INTO mera_user_permissions (user_id, permission_id, type, created_at)
					   SELECT ?, permission_id, type, ? FROM mera_user_permissions WHERE user_id = ?`
	if _, err := r.db.ExecContext(ctx, copyPermsQuery, targetUserID, time.Now(), sourceUserID); err != nil {
		return err
	}

	return nil
}

func scanUser(row *sql.Row) (*entity.User, error) {
	var u entity.User
	var lastLogin sql.NullTime
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash,
		&u.IsActive, &lastLogin, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if lastLogin.Valid {
		u.LastLoginAt = &lastLogin.Time
	}
	return &u, nil
}
