// Package handler provides HTTP handlers for role management.
package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/internal/auth/handler/middleware"
	"github.com/clinova/simrs/backend/internal/usermanagement/dto"
	"github.com/clinova/simrs/backend/internal/usermanagement/service"
	"github.com/clinova/simrs/backend/pkg/audit"
	"github.com/clinova/simrs/backend/pkg/response"
)

// RoleHandler handles role management HTTP requests.
type RoleHandler struct {
	roleService *service.RoleService
}

// NewRoleHandler creates a new role handler.
func NewRoleHandler(roleService *service.RoleService) *RoleHandler {
	return &RoleHandler{roleService: roleService}
}

func (h *RoleHandler) getActor(c *gin.Context) audit.Actor {
	userID := middleware.GetUserID(c)
	return audit.Actor{UserID: userID, Username: userID}
}

// CreateRole handles POST /admin/roles
func (h *RoleHandler) CreateRole(c *gin.Context) {
	var req dto.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	actor := h.getActor(c)
	role, err := h.roleService.CreateRole(c.Request.Context(), actor, c.ClientIP(), req.Name, req.Description)
	if err != nil {
		if err == service.ErrRoleExists {
			response.BadRequest(c, "ROLE_EXISTS", "Role sudah ada")
		} else {
			response.InternalServerError(c, "Gagal membuat role")
		}
		return
	}

	resp := dto.RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		Description: role.Description,
	}
	response.Success(c, resp)
}

// GetRoles handles GET /admin/roles
func (h *RoleHandler) GetRoles(c *gin.Context) {
	roles, err := h.roleService.GetAllRoles(c.Request.Context())
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar role")
		return
	}

	roleResponses := make([]dto.RoleResponse, len(roles))
	for i, r := range roles {
		isSystem, _ := h.roleService.IsSystemRole(c.Request.Context(), r.ID)
		roleResponses[i] = dto.RoleResponse{
			ID:          r.ID,
			Name:        r.Name,
			Description: r.Description,
			IsSystem:    isSystem,
		}
	}

	resp := dto.RoleListResponse{Roles: roleResponses}
	response.Success(c, resp)
}

// GetRole handles GET /admin/roles/:id
func (h *RoleHandler) GetRole(c *gin.Context) {
	roleID := c.Param("id")

	role, perms, err := h.roleService.GetRoleByID(c.Request.Context(), roleID)
	if err != nil {
		if err == service.ErrRoleNotFound {
			response.NotFound(c, "Role tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal mengambil data role")
		}
		return
	}

	isSystem, _ := h.roleService.IsSystemRole(c.Request.Context(), roleID)

	permBriefs := make([]dto.PermissionBrief, len(perms))
	for i, p := range perms {
		permBriefs[i] = dto.PermissionBrief{ID: p.ID, Code: p.Code}
	}

	resp := dto.RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		Description: role.Description,
		IsSystem:    isSystem,
		Permissions: permBriefs,
	}
	response.Success(c, resp)
}

// UpdateRole handles PUT /admin/roles/:id
func (h *RoleHandler) UpdateRole(c *gin.Context) {
	roleID := c.Param("id")

	var req dto.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	updates["description"] = req.Description

	actor := h.getActor(c)
	if err := h.roleService.UpdateRole(c.Request.Context(), actor, c.ClientIP(), roleID, updates); err != nil {
		if err == service.ErrRoleNotFound {
			response.NotFound(c, "Role tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal memperbarui role")
		}
		return
	}

	response.SuccessWithMessage(c, "Role berhasil diperbarui", nil)
}

// DeleteRole handles DELETE /admin/roles/:id
func (h *RoleHandler) DeleteRole(c *gin.Context) {
	roleID := c.Param("id")
	actor := h.getActor(c)

	if err := h.roleService.DeleteRole(c.Request.Context(), actor, c.ClientIP(), roleID); err != nil {
		if err == service.ErrRoleNotFound {
			response.NotFound(c, "Role tidak ditemukan")
		} else if err == service.ErrSystemRole {
			response.BadRequest(c, "SYSTEM_ROLE", "Tidak dapat menghapus role sistem")
		} else {
			response.InternalServerError(c, "Gagal menghapus role")
		}
		return
	}

	response.SuccessWithMessage(c, "Role berhasil dihapus", nil)
}

// AssignPermissions handles PUT /admin/roles/:id/permissions
func (h *RoleHandler) AssignPermissions(c *gin.Context) {
	roleID := c.Param("id")

	var req dto.AssignRolePermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	actor := h.getActor(c)
	if err := h.roleService.AssignPermissions(c.Request.Context(), actor, c.ClientIP(), roleID, req.PermissionIDs); err != nil {
		if err == service.ErrRoleNotFound {
			response.NotFound(c, "Role tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal menetapkan permission")
		}
		return
	}

	response.SuccessWithMessage(c, "Permission berhasil ditetapkan", nil)
}
