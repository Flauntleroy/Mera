// Package middleware provides HTTP middleware.
package middleware

import (
	"context"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/internal/auth/service"
	"github.com/clinova/simrs/backend/pkg/jwt"
	"github.com/clinova/simrs/backend/pkg/response"
)

const (
	ContextKeyUserID    = "user_id"
	ContextKeySessionID = "session_id"
	ContextKeyPermCache = "permission_cache"
)

// lastSeenThrottle prevents excessive DB updates for last_seen_at
// only update once per minute per session
type lastSeenThrottle struct {
	mu       sync.RWMutex
	lastSeen map[string]time.Time
}

var throttle = &lastSeenThrottle{
	lastSeen: make(map[string]time.Time),
}

func (t *lastSeenThrottle) shouldUpdate(sessionID string) bool {
	t.mu.RLock()
	last, exists := t.lastSeen[sessionID]
	t.mu.RUnlock()

	if !exists || time.Since(last) > time.Minute {
		t.mu.Lock()
		t.lastSeen[sessionID] = time.Now()
		t.mu.Unlock()
		return true
	}
	return false
}

type JWTMiddleware struct {
	jwtManager     *jwt.Manager
	sessionService *service.SessionService
}

func NewJWTMiddleware(jwtManager *jwt.Manager, sessionService *service.SessionService) *JWTMiddleware {
	return &JWTMiddleware{jwtManager: jwtManager, sessionService: sessionService}
}

func (m *JWTMiddleware) Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, response.ErrCodeInvalidToken, "Header otorisasi tidak ditemukan")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Unauthorized(c, response.ErrCodeInvalidToken, "Format header otorisasi tidak valid")
			c.Abort()
			return
		}

		claims, err := m.jwtManager.ValidateAccessToken(parts[1])
		if err != nil {
			if err == jwt.ErrExpiredToken {
				response.Unauthorized(c, response.ErrCodeExpiredToken, "Token telah kedaluwarsa")
			} else {
				response.Unauthorized(c, response.ErrCodeInvalidToken, "Token tidak valid")
			}
			c.Abort()
			return
		}

		session, err := m.sessionService.GetSessionByID(c.Request.Context(), claims.SessionID)
		if err != nil || session == nil || !session.IsActive() {
			response.Unauthorized(c, response.ErrCodeSessionRevoked, "Sesi telah dibatalkan")
			c.Abort()
			return
		}

		// Update last_seen_at with throttling (max once per minute per session)
		// Use background context since request context will be cancelled after response
		if throttle.shouldUpdate(claims.SessionID) {
			go func(sessionID string) {
				ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				defer cancel()
				m.sessionService.UpdateSessionActivity(ctx, sessionID)
			}(claims.SessionID)
		}

		c.Set(ContextKeyUserID, claims.UserID)
		c.Set(ContextKeySessionID, claims.SessionID)
		c.Set(ContextKeyPermCache, service.NewPermissionCache())

		c.Next()
	}
}

func GetUserID(c *gin.Context) string {
	if userID, exists := c.Get(ContextKeyUserID); exists {
		return userID.(string)
	}
	return ""
}

func GetSessionID(c *gin.Context) string {
	if sessionID, exists := c.Get(ContextKeySessionID); exists {
		return sessionID.(string)
	}
	return ""
}

func GetPermissionCache(c *gin.Context) *service.PermissionCache {
	if cache, exists := c.Get(ContextKeyPermCache); exists {
		return cache.(*service.PermissionCache)
	}
	return nil
}

type PermissionMiddleware struct {
	permissionService *service.PermissionService
}

func NewPermissionMiddleware(permissionService *service.PermissionService) *PermissionMiddleware {
	return &PermissionMiddleware{permissionService: permissionService}
}

func (m *PermissionMiddleware) RequirePermission(permissionCode string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := GetUserID(c)
		if userID == "" {
			response.Unauthorized(c, response.ErrCodeInvalidToken, "Autentikasi diperlukan")
			c.Abort()
			return
		}

		cache := GetPermissionCache(c)
		if cache == nil {
			cache = service.NewPermissionCache()
			c.Set(ContextKeyPermCache, cache)
		}

		has, err := m.permissionService.HasPermission(c.Request.Context(), cache, userID, permissionCode)
		if err != nil {
			response.InternalServerError(c, "Gagal memeriksa izin")
			c.Abort()
			return
		}
		if !has {
			response.Forbidden(c, "Akses ditolak")
			c.Abort()
			return
		}

		c.Next()
	}
}

func (m *PermissionMiddleware) RequireAnyPermission(codes ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := GetUserID(c)
		if userID == "" {
			response.Unauthorized(c, response.ErrCodeInvalidToken, "Autentikasi diperlukan")
			c.Abort()
			return
		}

		cache := GetPermissionCache(c)
		if cache == nil {
			cache = service.NewPermissionCache()
			c.Set(ContextKeyPermCache, cache)
		}

		has, err := m.permissionService.HasAnyPermission(c.Request.Context(), cache, userID, codes)
		if err != nil {
			response.InternalServerError(c, "Gagal memeriksa izin")
			c.Abort()
			return
		}
		if !has {
			response.Forbidden(c, "Akses ditolak")
			c.Abort()
			return
		}

		c.Next()
	}
}
