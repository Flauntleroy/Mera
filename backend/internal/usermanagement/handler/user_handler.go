// Package handler provides HTTP handlers for user management.
package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/internal/auth/handler/middleware"
	"github.com/clinova/simrs/backend/internal/usermanagement/dto"
	"github.com/clinova/simrs/backend/internal/usermanagement/repository"
	"github.com/clinova/simrs/backend/internal/usermanagement/service"
	"github.com/clinova/simrs/backend/pkg/audit"
	"github.com/clinova/simrs/backend/pkg/response"
)

// UserHandler handles user management HTTP requests.
type UserHandler struct {
	userService *service.UserService
}

// NewUserHandler creates a new user handler.
func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) getActor(c *gin.Context) audit.Actor {
	userID := middleware.GetUserID(c)
	// We'll get username from context or use a fallback
	return audit.Actor{UserID: userID, Username: userID}
}

// CreateUser handles POST /admin/users
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req dto.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	actor := h.getActor(c)
	user, err := h.userService.CreateUser(c.Request.Context(), actor, c.ClientIP(),
		req.Username, req.Email, req.Password, req.IsActive)
	if err != nil {
		if err == service.ErrUserExists {
			response.BadRequest(c, "USER_EXISTS", "Username atau email sudah digunakan")
		} else {
			response.InternalServerError(c, "Gagal membuat pengguna")
		}
		return
	}

	resp := dto.UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
	response.Success(c, resp)
}

// GetUsers handles GET /admin/users
func (h *UserHandler) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	users, total, err := h.userService.GetAllUsers(c.Request.Context(), page, limit)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar pengguna")
		return
	}

	userResponses := make([]dto.UserResponse, len(users))
	for i, u := range users {
		userResponses[i] = dto.UserResponse{
			ID:          u.ID,
			Username:    u.Username,
			Email:       u.Email,
			IsActive:    u.IsActive,
			LastLoginAt: u.LastLoginAt,
			CreatedAt:   u.CreatedAt,
			UpdatedAt:   u.UpdatedAt,
		}
	}

	resp := dto.UserListResponse{
		Users: userResponses,
		Total: total,
		Page:  page,
		Limit: limit,
	}
	response.Success(c, resp)
}

// GetUser handles GET /admin/users/:id
func (h *UserHandler) GetUser(c *gin.Context) {
	userID := c.Param("id")

	user, roles, overrides, err := h.userService.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		if err == service.ErrUserNotFound {
			response.NotFound(c, "Pengguna tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal mengambil data pengguna")
		}
		return
	}

	roleBriefs := make([]dto.RoleBrief, len(roles))
	for i, r := range roles {
		roleBriefs[i] = dto.RoleBrief{ID: r.ID, Name: r.Name}
	}

	overrideResponses := make([]dto.PermissionOverrideResponse, len(overrides))
	for i, o := range overrides {
		overrideResponses[i] = dto.PermissionOverrideResponse{
			PermissionID:   o.PermissionID,
			PermissionCode: o.PermissionCode,
			Effect:         o.Effect,
		}
	}

	resp := dto.UserDetailResponse{
		UserResponse: dto.UserResponse{
			ID:          user.ID,
			Username:    user.Username,
			Email:       user.Email,
			IsActive:    user.IsActive,
			LastLoginAt: user.LastLoginAt,
			CreatedAt:   user.CreatedAt,
			UpdatedAt:   user.UpdatedAt,
			Roles:       roleBriefs,
		},
		PermissionOverrides: overrideResponses,
	}
	response.Success(c, resp)
}

// UpdateUser handles PUT /admin/users/:id
func (h *UserHandler) UpdateUser(c *gin.Context) {
	userID := c.Param("id")

	var req dto.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	updates := make(map[string]interface{})
	if req.Username != "" {
		updates["username"] = req.Username
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	actor := h.getActor(c)
	if err := h.userService.UpdateUser(c.Request.Context(), actor, c.ClientIP(), userID, updates); err != nil {
		if err == service.ErrUserNotFound {
			response.NotFound(c, "Pengguna tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal memperbarui pengguna")
		}
		return
	}

	response.SuccessWithMessage(c, "Pengguna berhasil diperbarui", nil)
}

// ActivateUser handles POST /admin/users/:id/activate
func (h *UserHandler) ActivateUser(c *gin.Context) {
	userID := c.Param("id")
	actor := h.getActor(c)

	if err := h.userService.ToggleUserActive(c.Request.Context(), actor, c.ClientIP(), userID, true); err != nil {
		if err == service.ErrUserNotFound {
			response.NotFound(c, "Pengguna tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal mengaktifkan pengguna")
		}
		return
	}

	response.SuccessWithMessage(c, "Pengguna berhasil diaktifkan", nil)
}

// DeactivateUser handles POST /admin/users/:id/deactivate
func (h *UserHandler) DeactivateUser(c *gin.Context) {
	userID := c.Param("id")
	actor := h.getActor(c)

	if err := h.userService.ToggleUserActive(c.Request.Context(), actor, c.ClientIP(), userID, false); err != nil {
		if err == service.ErrUserNotFound {
			response.NotFound(c, "Pengguna tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal menonaktifkan pengguna")
		}
		return
	}

	response.SuccessWithMessage(c, "Pengguna berhasil dinonaktifkan", nil)
}

// ResetPassword handles POST /admin/users/:id/reset-password
func (h *UserHandler) ResetPassword(c *gin.Context) {
	userID := c.Param("id")

	var req dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	actor := h.getActor(c)
	if err := h.userService.ResetPassword(c.Request.Context(), actor, c.ClientIP(), userID, req.NewPassword); err != nil {
		if err == service.ErrUserNotFound {
			response.NotFound(c, "Pengguna tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal mereset password")
		}
		return
	}

	response.SuccessWithMessage(c, "Password berhasil direset", nil)
}

// AssignRoles handles PUT /admin/users/:id/roles
func (h *UserHandler) AssignRoles(c *gin.Context) {
	userID := c.Param("id")

	var req dto.AssignRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	actor := h.getActor(c)
	if err := h.userService.AssignRoles(c.Request.Context(), actor, c.ClientIP(), userID, req.RoleIDs); err != nil {
		if err == service.ErrUserNotFound {
			response.NotFound(c, "Pengguna tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal menetapkan role")
		}
		return
	}

	response.SuccessWithMessage(c, "Role berhasil ditetapkan", nil)
}

// AssignPermissions handles PUT /admin/users/:id/permissions
func (h *UserHandler) AssignPermissions(c *gin.Context) {
	userID := c.Param("id")

	var req dto.AssignPermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	overrides := make([]repository.PermissionOverride, len(req.Overrides))
	for i, o := range req.Overrides {
		overrides[i] = repository.PermissionOverride{
			PermissionID: o.PermissionID,
			Effect:       o.Effect,
		}
	}

	actor := h.getActor(c)
	if err := h.userService.AssignPermissionOverrides(c.Request.Context(), actor, c.ClientIP(), userID, overrides); err != nil {
		if err == service.ErrUserNotFound {
			response.NotFound(c, "Pengguna tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal menetapkan permission override")
		}
		return
	}

	response.SuccessWithMessage(c, "Permission override berhasil ditetapkan", nil)
}

// CopyAccess handles POST /admin/users/:id/copy-access
func (h *UserHandler) CopyAccess(c *gin.Context) {
	targetUserID := c.Param("id")

	var req dto.CopyAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	actor := h.getActor(c)
	if err := h.userService.CopyAccess(c.Request.Context(), actor, c.ClientIP(), req.SourceUserID, targetUserID); err != nil {
		if err == service.ErrSourceUserNotFound {
			response.NotFound(c, "Pengguna sumber tidak ditemukan")
		} else if err == service.ErrUserNotFound {
			response.NotFound(c, "Pengguna target tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal menyalin akses")
		}
		return
	}

	response.SuccessWithMessage(c, "Akses berhasil disalin", nil)
}

// DeleteUser handles DELETE /admin/users/:id
func (h *UserHandler) DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	actor := h.getActor(c)

	if err := h.userService.SoftDeleteUser(c.Request.Context(), actor, c.ClientIP(), userID); err != nil {
		if err == service.ErrUserNotFound {
			response.NotFound(c, "Pengguna tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal menghapus pengguna")
		}
		return
	}

	response.SuccessWithMessage(c, "Pengguna berhasil dihapus", nil)
}
