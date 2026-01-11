// Package handler provides router for audit log API.
package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/internal/auth/handler/middleware"
)

// Router handles routing for audit log domain.
type Router struct {
	handler        *AuditLogHandler
	jwtMiddleware  *middleware.JWTMiddleware
	permMiddleware *middleware.PermissionMiddleware
}

// NewRouter creates a new audit log router.
func NewRouter(
	logPath string,
	jwtMiddleware *middleware.JWTMiddleware,
	permMiddleware *middleware.PermissionMiddleware,
) *Router {
	return &Router{
		handler:        NewAuditLogHandler(logPath),
		jwtMiddleware:  jwtMiddleware,
		permMiddleware: permMiddleware,
	}
}

// RegisterRoutes registers all audit log routes.
func (r *Router) RegisterRoutes(engine *gin.Engine) {
	admin := engine.Group("/admin")
	admin.Use(r.jwtMiddleware.Authenticate())

	auditLogs := admin.Group("/audit-logs")
	auditLogs.Use(r.permMiddleware.RequirePermission("auditlog.read"))
	{
		auditLogs.GET("", r.handler.GetAuditLogs)
		auditLogs.GET("/modules", r.handler.GetModules)
		auditLogs.GET("/:id", r.handler.GetAuditLogDetail)
	}
}
