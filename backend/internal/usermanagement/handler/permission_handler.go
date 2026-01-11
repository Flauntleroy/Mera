// Package handler provides HTTP handlers for permission management.
package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/internal/auth/handler/middleware"
	"github.com/clinova/simrs/backend/internal/usermanagement/dto"
	"github.com/clinova/simrs/backend/internal/usermanagement/service"
	"github.com/clinova/simrs/backend/pkg/audit"
	"github.com/clinova/simrs/backend/pkg/response"
)

// PermissionHandler handles permission management HTTP requests.
type PermissionHandler struct {
	permService *service.PermissionService
}

// NewPermissionHandler creates a new permission handler.
func NewPermissionHandler(permService *service.PermissionService) *PermissionHandler {
	return &PermissionHandler{permService: permService}
}

func (h *PermissionHandler) getActor(c *gin.Context) audit.Actor {
	userID := middleware.GetUserID(c)
	return audit.Actor{UserID: userID, Username: userID}
}

// GetPermissions handles GET /admin/permissions
func (h *PermissionHandler) GetPermissions(c *gin.Context) {
	domain := c.Query("domain")

	var perms []any
	var err error

	if domain != "" {
		perms_, err_ := h.permService.GetPermissionsByDomain(c.Request.Context(), domain)
		if err_ != nil {
			response.InternalServerError(c, "Gagal mengambil daftar permission")
			return
		}
		permResponses := make([]dto.PermissionResponse, len(perms_))
		for i, p := range perms_ {
			permResponses[i] = dto.PermissionResponse{
				ID:          p.ID,
				Code:        p.Code,
				Domain:      p.Domain,
				Action:      p.Action,
				Description: p.Description,
			}
		}
		response.Success(c, dto.PermissionListResponse{Permissions: permResponses})
		return
	}

	perms_, err := h.permService.GetAllPermissions(c.Request.Context())
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar permission")
		return
	}

	_ = perms // unused

	permResponses := make([]dto.PermissionResponse, len(perms_))
	for i, p := range perms_ {
		permResponses[i] = dto.PermissionResponse{
			ID:          p.ID,
			Code:        p.Code,
			Domain:      p.Domain,
			Action:      p.Action,
			Description: p.Description,
		}
	}

	response.Success(c, dto.PermissionListResponse{Permissions: permResponses})
}

// CreatePermission handles POST /admin/permissions
func (h *PermissionHandler) CreatePermission(c *gin.Context) {
	var req dto.CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	actor := h.getActor(c)
	perm, err := h.permService.CreatePermission(c.Request.Context(), actor, c.ClientIP(),
		req.Code, req.Domain, req.Action, req.Description)
	if err != nil {
		if err == service.ErrPermissionExists {
			response.BadRequest(c, "PERMISSION_EXISTS", "Permission code sudah ada")
		} else {
			response.InternalServerError(c, "Gagal membuat permission")
		}
		return
	}

	resp := dto.PermissionResponse{
		ID:          perm.ID,
		Code:        perm.Code,
		Domain:      perm.Domain,
		Action:      perm.Action,
		Description: perm.Description,
	}
	response.Success(c, resp)
}
