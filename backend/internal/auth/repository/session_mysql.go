package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/clinova/simrs/backend/internal/auth/entity"
)

type mysqlSessionRepository struct {
	db *sql.DB
}

func NewMySQLSessionRepository(db *sql.DB) SessionRepository {
	return &mysqlSessionRepository{db: db}
}

func (r *mysqlSessionRepository) Create(ctx context.Context, session *entity.LoginSession) error {
	if session.ID == "" {
		session.ID = uuid.New().String()
	}
	query := `INSERT INTO mera_login_sessions (id, user_id, refresh_token_hash, device_info, ip_address, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`
	_, err := r.db.ExecContext(ctx, query, session.ID, session.UserID, session.RefreshTokenHash, session.DeviceInfo, session.IPAddress)
	return err
}

func (r *mysqlSessionRepository) GetByID(ctx context.Context, id string) (*entity.LoginSession, error) {
	query := `SELECT id, user_id, refresh_token_hash, device_info, ip_address, created_at, last_seen_at, revoked_at FROM mera_login_sessions WHERE id = ?`
	s := &entity.LoginSession{}
	var deviceInfo, ipAddress sql.NullString
	var revokedAt sql.NullTime
	err := r.db.QueryRowContext(ctx, query, id).Scan(&s.ID, &s.UserID, &s.RefreshTokenHash, &deviceInfo, &ipAddress, &s.CreatedAt, &s.LastSeenAt, &revokedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if deviceInfo.Valid {
		s.DeviceInfo = deviceInfo.String
	}
	if ipAddress.Valid {
		s.IPAddress = ipAddress.String
	}
	if revokedAt.Valid {
		s.RevokedAt = &revokedAt.Time
	}
	return s, nil
}

func (r *mysqlSessionRepository) GetByRefreshTokenHash(ctx context.Context, hash string) (*entity.LoginSession, error) {
	query := `SELECT id, user_id, refresh_token_hash, device_info, ip_address, created_at, last_seen_at, revoked_at FROM mera_login_sessions WHERE refresh_token_hash = ?`
	s := &entity.LoginSession{}
	var deviceInfo, ipAddress sql.NullString
	var revokedAt sql.NullTime
	err := r.db.QueryRowContext(ctx, query, hash).Scan(&s.ID, &s.UserID, &s.RefreshTokenHash, &deviceInfo, &ipAddress, &s.CreatedAt, &s.LastSeenAt, &revokedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if deviceInfo.Valid {
		s.DeviceInfo = deviceInfo.String
	}
	if ipAddress.Valid {
		s.IPAddress = ipAddress.String
	}
	if revokedAt.Valid {
		s.RevokedAt = &revokedAt.Time
	}
	return s, nil
}

func (r *mysqlSessionRepository) GetActiveByUserID(ctx context.Context, userID string) ([]entity.LoginSession, error) {
	query := `SELECT id, user_id, refresh_token_hash, device_info, ip_address, created_at, last_seen_at, revoked_at FROM mera_login_sessions WHERE user_id = ? AND revoked_at IS NULL ORDER BY last_seen_at DESC`
	return r.querySessions(ctx, query, userID)
}

func (r *mysqlSessionRepository) GetAllByUserID(ctx context.Context, userID string) ([]entity.LoginSession, error) {
	query := `SELECT id, user_id, refresh_token_hash, device_info, ip_address, created_at, last_seen_at, revoked_at FROM mera_login_sessions WHERE user_id = ? ORDER BY created_at DESC`
	return r.querySessions(ctx, query, userID)
}

func (r *mysqlSessionRepository) querySessions(ctx context.Context, query string, args ...interface{}) ([]entity.LoginSession, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var sessions []entity.LoginSession
	for rows.Next() {
		var s entity.LoginSession
		var deviceInfo, ipAddress sql.NullString
		var revokedAt sql.NullTime
		if err := rows.Scan(&s.ID, &s.UserID, &s.RefreshTokenHash, &deviceInfo, &ipAddress, &s.CreatedAt, &s.LastSeenAt, &revokedAt); err != nil {
			return nil, err
		}
		if deviceInfo.Valid {
			s.DeviceInfo = deviceInfo.String
		}
		if ipAddress.Valid {
			s.IPAddress = ipAddress.String
		}
		if revokedAt.Valid {
			s.RevokedAt = &revokedAt.Time
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (r *mysqlSessionRepository) UpdateLastSeen(ctx context.Context, sessionID string) error {
	query := `UPDATE mera_login_sessions SET last_seen_at = ? WHERE id = ? AND revoked_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, time.Now(), sessionID)
	return err
}

func (r *mysqlSessionRepository) Revoke(ctx context.Context, sessionID string) error {
	query := `UPDATE mera_login_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL`
	result, err := r.db.ExecContext(ctx, query, time.Now(), sessionID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("session not found or already revoked")
	}
	return nil
}

func (r *mysqlSessionRepository) RevokeAllByUserID(ctx context.Context, userID string) error {
	query := `UPDATE mera_login_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, time.Now(), userID)
	return err
}
