// Package handler provides HTTP handlers.
package handler

import (
	"errors"

	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/internal/auth/handler/dto"
	"github.com/clinova/simrs/backend/internal/auth/handler/middleware"
	"github.com/clinova/simrs/backend/internal/auth/service"
	"github.com/clinova/simrs/backend/pkg/response"
)

type AuthHandler struct {
	authService       *service.AuthService
	sessionService    *service.SessionService
	permissionService *service.PermissionService
}

func NewAuthHandler(authSvc *service.AuthService, sessionSvc *service.SessionService, permSvc *service.PermissionService) *AuthHandler {
	return &AuthHandler{authService: authSvc, sessionService: sessionSvc, permissionService: permSvc}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	loginReq := &service.LoginRequest{
		Username:   req.Username,
		Password:   req.Password,
		DeviceInfo: c.GetHeader("User-Agent"),
		IPAddress:  c.ClientIP(),
	}

	result, err := h.authService.Login(c.Request.Context(), loginReq)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCredentials):
			response.Unauthorized(c, response.ErrCodeInvalidCredentials, "Username atau password salah")
		case errors.Is(err, service.ErrUserInactive):
			response.Unauthorized(c, response.ErrCodeUserInactive, "Akun pengguna tidak aktif")
		default:
			response.InternalServerError(c, "Gagal login")
		}
		return
	}

	roleBriefs := make([]dto.RoleBrief, len(result.User.Roles))
	for i, role := range result.User.Roles {
		roleBriefs[i] = dto.RoleBrief{ID: role, Name: role}
	}

	resp := dto.LoginResponse{
		User: dto.UserResponse{
			ID:          result.User.ID,
			Username:    result.User.Username,
			Email:       result.User.Email,
			IsActive:    result.User.IsActive,
			LastLoginAt: result.User.LastLoginAt,
			Roles:       roleBriefs,
			Permissions: result.User.Permissions,
		},
		Tokens: dto.TokenResponse{
			AccessToken:  result.Tokens.AccessToken,
			RefreshToken: result.Tokens.RefreshToken,
			TokenType:    result.Tokens.TokenType,
			ExpiresAt:    result.Tokens.ExpiresAt,
		},
		Session: dto.SessionBrief{ID: result.SessionID, CreatedAt: result.Tokens.ExpiresAt},
	}
	response.Success(c, resp)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	sessionID := middleware.GetSessionID(c)
	if sessionID == "" {
		response.Unauthorized(c, response.ErrCodeInvalidToken, "Tidak ada sesi aktif")
		return
	}
	if err := h.authService.Logout(c.Request.Context(), sessionID); err != nil {
		response.InternalServerError(c, "Gagal logout")
		return
	}
	response.SuccessWithMessage(c, "Berhasil logout", nil)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "Format data tidak valid")
		return
	}

	tokens, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidRefreshToken):
			response.Unauthorized(c, response.ErrCodeInvalidToken, "Refresh token tidak valid")
		case errors.Is(err, service.ErrSessionRevoked):
			response.Unauthorized(c, response.ErrCodeSessionRevoked, "Sesi telah dibatalkan")
		case errors.Is(err, service.ErrUserInactive):
			response.Unauthorized(c, response.ErrCodeUserInactive, "Akun pengguna tidak aktif")
		default:
			response.InternalServerError(c, "Gagal refresh token")
		}
		return
	}

	resp := dto.RefreshTokenResponse{
		Tokens: dto.TokenResponse{
			AccessToken:  tokens.AccessToken,
			RefreshToken: tokens.RefreshToken,
			TokenType:    tokens.TokenType,
			ExpiresAt:    tokens.ExpiresAt,
		},
	}
	response.Success(c, resp)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		response.Unauthorized(c, response.ErrCodeInvalidToken, "Belum terautentikasi")
		return
	}

	cache := middleware.GetPermissionCache(c)
	user, err := h.permissionService.GetUserWithPermissions(c.Request.Context(), cache, userID)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			response.NotFound(c, "Pengguna tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal mengambil informasi pengguna")
		}
		return
	}

	roleBriefs := make([]dto.RoleBrief, len(user.Roles))
	for i, role := range user.Roles {
		roleBriefs[i] = dto.RoleBrief{ID: role.ID, Name: role.Name}
	}

	resp := dto.MeResponse{
		User: dto.UserResponse{
			ID:          user.ID,
			Username:    user.Username,
			Email:       user.Email,
			IsActive:    user.IsActive,
			LastLoginAt: user.LastLoginAt,
			Roles:       roleBriefs,
			Permissions: user.GetPermissionCodes(),
		},
	}
	response.Success(c, resp)
}

func (h *AuthHandler) GetSessions(c *gin.Context) {
	userID := middleware.GetUserID(c)
	currentSessionID := middleware.GetSessionID(c)

	sessions, err := h.sessionService.GetUserSessions(c.Request.Context(), userID)
	if err != nil {
		response.InternalServerError(c, "Gagal mengambil daftar sesi")
		return
	}

	sessionResponses := make([]dto.SessionResponse, len(sessions))
	for i, s := range sessions {
		sessionResponses[i] = dto.SessionResponse{
			ID:         s.ID,
			DeviceInfo: s.DeviceInfo,
			IPAddress:  s.IPAddress,
			CreatedAt:  s.CreatedAt,
			LastSeenAt: s.LastSeenAt,
			IsCurrent:  s.ID == currentSessionID,
			IsActive:   s.IsActive(),
			RevokedAt:  s.RevokedAt,
		}
	}

	resp := dto.SessionListResponse{Sessions: sessionResponses, Total: len(sessions)}
	response.Success(c, resp)
}

func (h *AuthHandler) RevokeSession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		response.BadRequest(c, response.ErrCodeValidationError, "ID sesi wajib diisi")
		return
	}

	userID := middleware.GetUserID(c)
	cache := middleware.GetPermissionCache(c)

	isAdmin, _ := h.permissionService.HasPermission(c.Request.Context(), cache, userID, "session.revoke")

	err := h.sessionService.RevokeSession(c.Request.Context(), userID, sessionID, isAdmin)
	if err != nil {
		if errors.Is(err, service.ErrSessionNotFound) {
			response.NotFound(c, "Sesi tidak ditemukan")
		} else {
			response.InternalServerError(c, "Gagal membatalkan sesi")
		}
		return
	}
	response.SuccessWithMessage(c, "Sesi berhasil dibatalkan", nil)
}
