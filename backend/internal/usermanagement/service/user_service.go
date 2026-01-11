// Package service contains business logic for user management.
package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/clinova/simrs/backend/internal/auth/entity"
	"github.com/clinova/simrs/backend/internal/usermanagement/repository"
	"github.com/clinova/simrs/backend/pkg/audit"
	"github.com/clinova/simrs/backend/pkg/password"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrUserExists         = errors.New("username or email already exists")
	ErrSourceUserNotFound = errors.New("source user not found")
)

// UserService handles user management business logic.
type UserService struct {
	userRepo       repository.UserRepository
	roleRepo       repository.RoleRepository
	passwordHasher *password.Hasher
	auditLogger    *audit.Logger
}

// NewUserService creates a new user service.
func NewUserService(
	userRepo repository.UserRepository,
	roleRepo repository.RoleRepository,
	passwordHasher *password.Hasher,
	auditLogger *audit.Logger,
) *UserService {
	return &UserService{
		userRepo:       userRepo,
		roleRepo:       roleRepo,
		passwordHasher: passwordHasher,
		auditLogger:    auditLogger,
	}
}

// CreateUser creates a new user.
func (s *UserService) CreateUser(ctx context.Context, actor audit.Actor, ip string,
	username, email, plainPassword string, isActive bool) (*entity.User, error) {

	// Check if user exists
	existing, _ := s.userRepo.GetByUsername(ctx, username)
	if existing != nil {
		return nil, ErrUserExists
	}

	// Hash password
	hashedPassword, err := s.passwordHasher.Hash(plainPassword)
	if err != nil {
		return nil, err
	}

	user := &entity.User{
		ID:           uuid.New().String(),
		Username:     username,
		Email:        email,
		PasswordHash: hashedPassword,
		IsActive:     isActive,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	// Audit log
	if err := s.auditLogger.LogInsert(audit.InsertParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "users",
			PrimaryKey: map[string]string{"id": user.ID},
		},
		InsertedData: map[string]interface{}{
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"is_active": user.IsActive,
		},
		BusinessKey: user.Username,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Pengguna baru %s (%s) berhasil dibuat", user.Username, user.Email),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return user, nil
}

// GetUserByID retrieves a user by ID.
func (s *UserService) GetUserByID(ctx context.Context, id string) (*entity.User, []entity.Role, []repository.PermissionOverride, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, nil, nil, err
	}
	if user == nil {
		return nil, nil, nil, ErrUserNotFound
	}

	roles, _ := s.userRepo.GetRolesByUserID(ctx, id)
	overrides, _ := s.userRepo.GetPermissionOverrides(ctx, id)

	return user, roles, overrides, nil
}

// GetAllUsers retrieves all users with pagination.
func (s *UserService) GetAllUsers(ctx context.Context, page, limit int) ([]entity.User, int, error) {
	offset := (page - 1) * limit
	return s.userRepo.GetAll(ctx, limit, offset)
}

// UpdateUser updates a user's basic info.
func (s *UserService) UpdateUser(ctx context.Context, actor audit.Actor, ip string, userID string, updates map[string]interface{}) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return ErrUserNotFound
	}

	// Track changes for audit
	changedColumns := make(map[string]audit.ColumnChange)

	if username, ok := updates["username"].(string); ok && username != "" && username != user.Username {
		changedColumns["username"] = audit.ColumnChange{Old: user.Username, New: username}
		user.Username = username
	}
	if email, ok := updates["email"].(string); ok && email != "" && email != user.Email {
		changedColumns["email"] = audit.ColumnChange{Old: user.Email, New: email}
		user.Email = email
	}
	if isActive, ok := updates["is_active"].(bool); ok && isActive != user.IsActive {
		changedColumns["is_active"] = audit.ColumnChange{Old: user.IsActive, New: isActive}
		user.IsActive = isActive
	}

	if len(changedColumns) == 0 {
		return nil // No changes
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return err
	}

	// Build summary
	var cols []string
	for col := range changedColumns {
		cols = append(cols, col)
	}

	if err := s.auditLogger.LogUpdate(audit.UpdateParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "users",
			PrimaryKey: map[string]string{"id": userID},
		},
		ChangedColumns: changedColumns,
		Where:          map[string]interface{}{"id": userID},
		BusinessKey:    user.Username,
		Actor:          actor,
		IP:             ip,
		Summary:        fmt.Sprintf("Data pengguna %s diperbarui: %s", user.Username, strings.Join(cols, ", ")),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return nil
}

// ToggleUserActive activates or deactivates a user.
func (s *UserService) ToggleUserActive(ctx context.Context, actor audit.Actor, ip string, userID string, isActive bool) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return ErrUserNotFound
	}

	oldActive := user.IsActive
	user.IsActive = isActive

	if err := s.userRepo.Update(ctx, user); err != nil {
		return err
	}

	action := "diaktifkan"
	if !isActive {
		action = "dinonaktifkan"
	}

	if err := s.auditLogger.LogUpdate(audit.UpdateParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "users",
			PrimaryKey: map[string]string{"id": userID},
		},
		ChangedColumns: map[string]audit.ColumnChange{
			"is_active": {Old: oldActive, New: isActive},
		},
		Where:       map[string]interface{}{"id": userID},
		BusinessKey: user.Username,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Pengguna %s %s", user.Username, action),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return nil
}

// ResetPassword resets a user's password.
func (s *UserService) ResetPassword(ctx context.Context, actor audit.Actor, ip string, userID, newPassword string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return ErrUserNotFound
	}

	hashedPassword, err := s.passwordHasher.Hash(newPassword)
	if err != nil {
		return err
	}

	user.PasswordHash = hashedPassword
	if err := s.userRepo.Update(ctx, user); err != nil {
		return err
	}

	if err := s.auditLogger.LogUpdate(audit.UpdateParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "users",
			PrimaryKey: map[string]string{"id": userID},
		},
		ChangedColumns: map[string]audit.ColumnChange{
			"password_hash": {Old: "[REDACTED]", New: "[REDACTED]"},
		},
		Where:       map[string]interface{}{"id": userID},
		BusinessKey: user.Username,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Password pengguna %s direset oleh %s", user.Username, actor.Username),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return nil
}

// AssignRoles assigns roles to a user.
func (s *UserService) AssignRoles(ctx context.Context, actor audit.Actor, ip string, userID string, roleIDs []string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return ErrUserNotFound
	}

	// Get old roles for audit
	oldRoles, _ := s.userRepo.GetRolesByUserID(ctx, userID)
	var oldRoleNames []string
	for _, r := range oldRoles {
		oldRoleNames = append(oldRoleNames, r.Name)
	}

	if err := s.userRepo.AssignRoles(ctx, userID, roleIDs); err != nil {
		return err
	}

	// Get new roles for audit
	newRoles, _ := s.userRepo.GetRolesByUserID(ctx, userID)
	var newRoleNames []string
	for _, r := range newRoles {
		newRoleNames = append(newRoleNames, r.Name)
	}

	if err := s.auditLogger.LogUpdate(audit.UpdateParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "user_roles",
			PrimaryKey: map[string]string{"user_id": userID},
		},
		ChangedColumns: map[string]audit.ColumnChange{
			"roles": {Old: oldRoleNames, New: newRoleNames},
		},
		Where:       map[string]interface{}{"user_id": userID},
		BusinessKey: user.Username,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Role pengguna %s diubah: %v → %v", user.Username, oldRoleNames, newRoleNames),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return nil
}

// AssignPermissionOverrides sets permission overrides for a user.
func (s *UserService) AssignPermissionOverrides(ctx context.Context, actor audit.Actor, ip string, userID string, overrides []repository.PermissionOverride) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return ErrUserNotFound
	}

	// Get old overrides for audit
	oldOverrides, _ := s.userRepo.GetPermissionOverrides(ctx, userID)

	if err := s.userRepo.SetPermissionOverrides(ctx, userID, overrides); err != nil {
		return err
	}

	if err := s.auditLogger.LogUpdate(audit.UpdateParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "user_permissions",
			PrimaryKey: map[string]string{"user_id": userID},
		},
		ChangedColumns: map[string]audit.ColumnChange{
			"overrides": {Old: len(oldOverrides), New: len(overrides)},
		},
		Where:       map[string]interface{}{"user_id": userID},
		BusinessKey: user.Username,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Permission override pengguna %s diubah: %d → %d", user.Username, len(oldOverrides), len(overrides)),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return nil
}

// CopyAccess copies roles and permission overrides from source user to target user.
func (s *UserService) CopyAccess(ctx context.Context, actor audit.Actor, ip string, sourceUserID, targetUserID string) error {
	sourceUser, err := s.userRepo.GetByID(ctx, sourceUserID)
	if err != nil {
		return err
	}
	if sourceUser == nil {
		return ErrSourceUserNotFound
	}

	targetUser, err := s.userRepo.GetByID(ctx, targetUserID)
	if err != nil {
		return err
	}
	if targetUser == nil {
		return ErrUserNotFound
	}

	// Get old data for audit
	oldRoles, _ := s.userRepo.GetRolesByUserID(ctx, targetUserID)
	oldOverrides, _ := s.userRepo.GetPermissionOverrides(ctx, targetUserID)

	// Perform copy
	if err := s.userRepo.CopyAccess(ctx, sourceUserID, targetUserID); err != nil {
		return err
	}

	// Get new data for audit
	newRoles, _ := s.userRepo.GetRolesByUserID(ctx, targetUserID)
	newOverrides, _ := s.userRepo.GetPermissionOverrides(ctx, targetUserID)

	var oldRoleNames, newRoleNames []string
	for _, r := range oldRoles {
		oldRoleNames = append(oldRoleNames, r.Name)
	}
	for _, r := range newRoles {
		newRoleNames = append(newRoleNames, r.Name)
	}

	if err := s.auditLogger.LogUpdate(audit.UpdateParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "users",
			PrimaryKey: map[string]string{"id": targetUserID},
		},
		ChangedColumns: map[string]audit.ColumnChange{
			"roles":                {Old: oldRoleNames, New: newRoleNames},
			"permission_overrides": {Old: len(oldOverrides), New: len(newOverrides)},
		},
		Where:       map[string]interface{}{"id": targetUserID},
		BusinessKey: targetUser.Username,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Akses pengguna %s disalin dari %s (roles: %v, overrides: %d)", targetUser.Username, sourceUser.Username, newRoleNames, len(newOverrides)),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return nil
}

// SoftDeleteUser soft deletes a user.
func (s *UserService) SoftDeleteUser(ctx context.Context, actor audit.Actor, ip string, userID string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return ErrUserNotFound
	}

	if err := s.userRepo.SoftDelete(ctx, userID); err != nil {
		return err
	}

	if err := s.auditLogger.LogDelete(audit.DeleteParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "users",
			PrimaryKey: map[string]string{"id": userID},
		},
		DeletedData: map[string]interface{}{
			"id":       userID,
			"username": user.Username,
			"email":    user.Email,
		},
		Where:       map[string]interface{}{"id": userID},
		BusinessKey: user.Username,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Pengguna %s dihapus (soft delete) oleh %s", user.Username, actor.Username),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return nil
}
