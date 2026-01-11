// Package handler provides router setup for user management.
package handler

import (
	"database/sql"

	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/internal/auth/handler/middleware"
	authService "github.com/clinova/simrs/backend/internal/auth/service"
	"github.com/clinova/simrs/backend/internal/usermanagement/repository"
	"github.com/clinova/simrs/backend/internal/usermanagement/service"
	"github.com/clinova/simrs/backend/pkg/audit"
	"github.com/clinova/simrs/backend/pkg/password"
)

// Router handles routing for user management domain.
type Router struct {
	userHandler       *UserHandler
	roleHandler       *RoleHandler
	permissionHandler *PermissionHandler
	jwtMiddleware     *middleware.JWTMiddleware
	permMiddleware    *middleware.PermissionMiddleware
}

// NewRouter creates a new user management router.
func NewRouter(
	db *sql.DB,
	auditLogger *audit.Logger,
	passwordHasher *password.Hasher,
	jwtMiddleware *middleware.JWTMiddleware,
	permMiddleware *middleware.PermissionMiddleware,
) *Router {
	// Initialize repositories
	userRepo := repository.NewMySQLUserRepository(db)
	roleRepo := repository.NewMySQLRoleRepository(db)
	permRepo := repository.NewMySQLPermissionRepository(db)

	// Initialize services
	userService := service.NewUserService(userRepo, roleRepo, passwordHasher, auditLogger)
	roleService := service.NewRoleService(roleRepo, auditLogger)
	permService := service.NewPermissionService(permRepo, auditLogger)

	// Initialize handlers
	return &Router{
		userHandler:       NewUserHandler(userService),
		roleHandler:       NewRoleHandler(roleService),
		permissionHandler: NewPermissionHandler(permService),
		jwtMiddleware:     jwtMiddleware,
		permMiddleware:    permMiddleware,
	}
}

// RegisterRoutes registers all user management routes.
func (r *Router) RegisterRoutes(engine *gin.Engine, permissionService *authService.PermissionService) {
	admin := engine.Group("/admin")
	admin.Use(r.jwtMiddleware.Authenticate())

	// User management routes
	users := admin.Group("/users")
	users.Use(r.permMiddleware.RequirePermission("usermanagement.read"))
	{
		users.GET("", r.userHandler.GetUsers)
		users.GET("/:id", r.userHandler.GetUser)
	}

	usersWrite := admin.Group("/users")
	usersWrite.Use(r.permMiddleware.RequirePermission("usermanagement.write"))
	{
		usersWrite.POST("", r.userHandler.CreateUser)
		usersWrite.PUT("/:id", r.userHandler.UpdateUser)
		usersWrite.POST("/:id/activate", r.userHandler.ActivateUser)
		usersWrite.POST("/:id/deactivate", r.userHandler.DeactivateUser)
		usersWrite.POST("/:id/reset-password", r.userHandler.ResetPassword)
		usersWrite.PUT("/:id/roles", r.userHandler.AssignRoles)
		usersWrite.PUT("/:id/permissions", r.userHandler.AssignPermissions)
		usersWrite.POST("/:id/copy-access", r.userHandler.CopyAccess)
		usersWrite.DELETE("/:id", r.userHandler.DeleteUser)
	}

	// Role management routes
	roles := admin.Group("/roles")
	roles.Use(r.permMiddleware.RequirePermission("usermanagement.read"))
	{
		roles.GET("", r.roleHandler.GetRoles)
		roles.GET("/:id", r.roleHandler.GetRole)
	}

	rolesWrite := admin.Group("/roles")
	rolesWrite.Use(r.permMiddleware.RequirePermission("usermanagement.write"))
	{
		rolesWrite.POST("", r.roleHandler.CreateRole)
		rolesWrite.PUT("/:id", r.roleHandler.UpdateRole)
		rolesWrite.DELETE("/:id", r.roleHandler.DeleteRole)
		rolesWrite.PUT("/:id/permissions", r.roleHandler.AssignPermissions)
	}

	// Permission management routes
	permissions := admin.Group("/permissions")
	permissions.Use(r.permMiddleware.RequirePermission("usermanagement.read"))
	{
		permissions.GET("", r.permissionHandler.GetPermissions)
	}

	permissionsWrite := admin.Group("/permissions")
	permissionsWrite.Use(r.permMiddleware.RequirePermission("usermanagement.write"))
	{
		permissionsWrite.POST("", r.permissionHandler.CreatePermission)
	}
}
