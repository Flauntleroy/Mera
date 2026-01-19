package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"

	"github.com/clinova/simrs/backend/internal/auth/entity"
)

type mysqlUserRepository struct {
	db *sql.DB
}

func NewMySQLUserRepository(db *sql.DB) UserRepository {
	return &mysqlUserRepository{db: db}
}

func (r *mysqlUserRepository) Create(ctx context.Context, user *entity.User) error {
	if user.ID == "" {
		user.ID = uuid.New().String()
	}
	query := `INSERT INTO mera_users (id, username, email, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`
	_, err := r.db.ExecContext(ctx, query, user.ID, user.Username, user.Email, user.PasswordHash, user.IsActive)
	return err
}

func (r *mysqlUserRepository) GetByID(ctx context.Context, id string) (*entity.User, error) {
	query := `SELECT id, username, email, password_hash, is_active, last_login_at, created_at, updated_at FROM mera_users WHERE id = ?`
	user := &entity.User{}
	var lastLoginAt sql.NullTime
	err := r.db.QueryRowContext(ctx, query, id).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.IsActive, &lastLoginAt, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	return user, nil
}

func (r *mysqlUserRepository) GetByUsername(ctx context.Context, username string) (*entity.User, error) {
	query := `SELECT id, username, email, password_hash, is_active, last_login_at, created_at, updated_at FROM mera_users WHERE username = ?`
	user := &entity.User{}
	var lastLoginAt sql.NullTime
	err := r.db.QueryRowContext(ctx, query, username).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.IsActive, &lastLoginAt, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	return user, nil
}

func (r *mysqlUserRepository) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	query := `SELECT id, username, email, password_hash, is_active, last_login_at, created_at, updated_at FROM mera_users WHERE email = ?`
	user := &entity.User{}
	var lastLoginAt sql.NullTime
	err := r.db.QueryRowContext(ctx, query, email).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.IsActive, &lastLoginAt, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	return user, nil
}

func (r *mysqlUserRepository) Update(ctx context.Context, user *entity.User) error {
	query := `UPDATE mera_users SET username = ?, email = ?, password_hash = ?, is_active = ?, updated_at = NOW() WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, user.Username, user.Email, user.PasswordHash, user.IsActive, user.ID)
	return err
}

func (r *mysqlUserRepository) UpdateLastLogin(ctx context.Context, userID string) error {
	query := `UPDATE mera_users SET last_login_at = ? WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, time.Now(), userID)
	return err
}

func (r *mysqlUserRepository) GetRolesByUserID(ctx context.Context, userID string) ([]entity.Role, error) {
	query := `SELECT r.id, r.name, r.description, r.created_at, r.updated_at FROM mera_roles r INNER JOIN mera_user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?`
	rows, err := r.db.QueryContext(ctx, query, userID)
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

func (r *mysqlUserRepository) AssignRole(ctx context.Context, userID, roleID string) error {
	query := `INSERT IGNORE INTO mera_user_roles (user_id, role_id, created_at) VALUES (?, ?, NOW())`
	_, err := r.db.ExecContext(ctx, query, userID, roleID)
	return err
}

func (r *mysqlUserRepository) RemoveRole(ctx context.Context, userID, roleID string) error {
	query := `DELETE FROM mera_user_roles WHERE user_id = ? AND role_id = ?`
	_, err := r.db.ExecContext(ctx, query, userID, roleID)
	return err
}
