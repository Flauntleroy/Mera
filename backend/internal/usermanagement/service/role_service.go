// Package service contains business logic for role management.
package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"

	"github.com/clinova/simrs/backend/internal/auth/entity"
	"github.com/clinova/simrs/backend/internal/usermanagement/repository"
	"github.com/clinova/simrs/backend/pkg/audit"
)

var (
	ErrRoleNotFound = errors.New("role not found")
	ErrRoleExists   = errors.New("role already exists")
	ErrSystemRole   = errors.New("cannot delete system role")
)

// RoleService handles role management business logic.
type RoleService struct {
	roleRepo    repository.RoleRepository
	auditLogger *audit.Logger
}

// NewRoleService creates a new role service.
func NewRoleService(roleRepo repository.RoleRepository, auditLogger *audit.Logger) *RoleService {
	return &RoleService{
		roleRepo:    roleRepo,
		auditLogger: auditLogger,
	}
}

// CreateRole creates a new role.
func (s *RoleService) CreateRole(ctx context.Context, actor audit.Actor, ip string, name, description string) (*entity.Role, error) {
	// Check if role exists
	existing, _ := s.roleRepo.GetByName(ctx, name)
	if existing != nil {
		return nil, ErrRoleExists
	}

	role := &entity.Role{
		ID:          uuid.New().String(),
		Name:        name,
		Description: description,
	}

	if err := s.roleRepo.Create(ctx, role); err != nil {
		return nil, err
	}

	if err := s.auditLogger.LogInsert(audit.InsertParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "roles",
			PrimaryKey: map[string]string{"id": role.ID},
		},
		InsertedData: map[string]interface{}{
			"id":          role.ID,
			"name":        role.Name,
			"description": role.Description,
		},
		BusinessKey: role.Name,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Role baru %s berhasil dibuat", role.Name),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return role, nil
}

// GetRoleByID retrieves a role by ID.
func (s *RoleService) GetRoleByID(ctx context.Context, id string) (*entity.Role, []entity.Permission, error) {
	role, err := s.roleRepo.GetByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	if role == nil {
		return nil, nil, ErrRoleNotFound
	}

	perms, _ := s.roleRepo.GetPermissionsByRoleID(ctx, id)
	return role, perms, nil
}

// GetAllRoles retrieves all roles.
func (s *RoleService) GetAllRoles(ctx context.Context) ([]entity.Role, error) {
	return s.roleRepo.GetAll(ctx)
}

// UpdateRole updates a role.
func (s *RoleService) UpdateRole(ctx context.Context, actor audit.Actor, ip string, roleID string, updates map[string]interface{}) error {
	role, err := s.roleRepo.GetByID(ctx, roleID)
	if err != nil {
		return err
	}
	if role == nil {
		return ErrRoleNotFound
	}

	changedColumns := make(map[string]audit.ColumnChange)

	if name, ok := updates["name"].(string); ok && name != "" && name != role.Name {
		changedColumns["name"] = audit.ColumnChange{Old: role.Name, New: name}
		role.Name = name
	}
	if desc, ok := updates["description"].(string); ok && desc != role.Description {
		changedColumns["description"] = audit.ColumnChange{Old: role.Description, New: desc}
		role.Description = desc
	}

	if len(changedColumns) == 0 {
		return nil
	}

	if err := s.roleRepo.Update(ctx, role); err != nil {
		return err
	}

	var cols []string
	for col := range changedColumns {
		cols = append(cols, col)
	}

	if err := s.auditLogger.LogUpdate(audit.UpdateParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "roles",
			PrimaryKey: map[string]string{"id": roleID},
		},
		ChangedColumns: changedColumns,
		Where:          map[string]interface{}{"id": roleID},
		BusinessKey:    role.Name,
		Actor:          actor,
		IP:             ip,
		Summary:        fmt.Sprintf("Role %s diperbarui: %s", role.Name, strings.Join(cols, ", ")),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return nil
}

// DeleteRole deletes a role (not allowed for system roles).
func (s *RoleService) DeleteRole(ctx context.Context, actor audit.Actor, ip string, roleID string) error {
	role, err := s.roleRepo.GetByID(ctx, roleID)
	if err != nil {
		return err
	}
	if role == nil {
		return ErrRoleNotFound
	}

	isSystem, _ := s.roleRepo.IsSystemRole(ctx, roleID)
	if isSystem {
		return ErrSystemRole
	}

	if err := s.roleRepo.Delete(ctx, roleID); err != nil {
		return err
	}

	if err := s.auditLogger.LogDelete(audit.DeleteParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "roles",
			PrimaryKey: map[string]string{"id": roleID},
		},
		DeletedData: map[string]interface{}{
			"id":          roleID,
			"name":        role.Name,
			"description": role.Description,
		},
		Where:       map[string]interface{}{"id": roleID},
		BusinessKey: role.Name,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Role %s dihapus oleh %s", role.Name, actor.Username),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return nil
}

// AssignPermissions assigns permissions to a role.
func (s *RoleService) AssignPermissions(ctx context.Context, actor audit.Actor, ip string, roleID string, permissionIDs []string) error {
	role, err := s.roleRepo.GetByID(ctx, roleID)
	if err != nil {
		return err
	}
	if role == nil {
		return ErrRoleNotFound
	}

	// Get old permissions for audit
	oldPerms, _ := s.roleRepo.GetPermissionsByRoleID(ctx, roleID)
	var oldPermCodes []string
	for _, p := range oldPerms {
		oldPermCodes = append(oldPermCodes, p.Code)
	}

	if err := s.roleRepo.AssignPermissions(ctx, roleID, permissionIDs); err != nil {
		return err
	}

	// Get new permissions for audit
	newPerms, _ := s.roleRepo.GetPermissionsByRoleID(ctx, roleID)
	var newPermCodes []string
	for _, p := range newPerms {
		newPermCodes = append(newPermCodes, p.Code)
	}

	if err := s.auditLogger.LogUpdate(audit.UpdateParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "role_permissions",
			PrimaryKey: map[string]string{"role_id": roleID},
		},
		ChangedColumns: map[string]audit.ColumnChange{
			"permissions": {Old: oldPermCodes, New: newPermCodes},
		},
		Where:       map[string]interface{}{"role_id": roleID},
		BusinessKey: role.Name,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Permission role %s diubah: %d → %d permission", role.Name, len(oldPermCodes), len(newPermCodes)),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return nil
}

// IsSystemRole checks if a role is a system role.
func (s *RoleService) IsSystemRole(ctx context.Context, roleID string) (bool, error) {
	return s.roleRepo.IsSystemRole(ctx, roleID)
}
