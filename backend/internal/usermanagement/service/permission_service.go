// Package service contains business logic for permission management.
package service

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/google/uuid"

	"github.com/clinova/simrs/backend/internal/auth/entity"
	"github.com/clinova/simrs/backend/internal/usermanagement/repository"
	"github.com/clinova/simrs/backend/pkg/audit"
)

var (
	ErrPermissionNotFound = errors.New("permission not found")
	ErrPermissionExists   = errors.New("permission code already exists")
)

// PermissionService handles permission management business logic.
type PermissionService struct {
	permRepo    repository.PermissionRepository
	auditLogger *audit.Logger
}

// NewPermissionService creates a new permission service.
func NewPermissionService(permRepo repository.PermissionRepository, auditLogger *audit.Logger) *PermissionService {
	return &PermissionService{
		permRepo:    permRepo,
		auditLogger: auditLogger,
	}
}

// CreatePermission creates a new permission.
func (s *PermissionService) CreatePermission(ctx context.Context, actor audit.Actor, ip string, code, domain, action, description string) (*entity.Permission, error) {
	// Check if permission exists
	existing, _ := s.permRepo.GetByCode(ctx, code)
	if existing != nil {
		return nil, ErrPermissionExists
	}

	perm := &entity.Permission{
		ID:          uuid.New().String(),
		Code:        code,
		Domain:      domain,
		Action:      action,
		Description: description,
	}

	if err := s.permRepo.Create(ctx, perm); err != nil {
		return nil, err
	}

	if err := s.auditLogger.LogInsert(audit.InsertParams{
		Module: "usermanagement",
		Entity: audit.Entity{
			Table:      "permissions",
			PrimaryKey: map[string]string{"id": perm.ID},
		},
		InsertedData: map[string]interface{}{
			"id":          perm.ID,
			"code":        perm.Code,
			"domain":      perm.Domain,
			"action":      perm.Action,
			"description": perm.Description,
		},
		BusinessKey: perm.Code,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Permission baru %s berhasil dibuat", perm.Code),
	}); err != nil {
		log.Printf("Gagal menulis audit log: %v", err)
	}

	return perm, nil
}

// GetPermissionByID retrieves a permission by ID.
func (s *PermissionService) GetPermissionByID(ctx context.Context, id string) (*entity.Permission, error) {
	perm, err := s.permRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if perm == nil {
		return nil, ErrPermissionNotFound
	}
	return perm, nil
}

// GetAllPermissions retrieves all permissions.
func (s *PermissionService) GetAllPermissions(ctx context.Context) ([]entity.Permission, error) {
	return s.permRepo.GetAll(ctx)
}

// GetPermissionsByDomain retrieves permissions by domain.
func (s *PermissionService) GetPermissionsByDomain(ctx context.Context, domain string) ([]entity.Permission, error) {
	return s.permRepo.GetByDomain(ctx, domain)
}
