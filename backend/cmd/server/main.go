// Package main is the entry point for the SIMRS Authentication Service.
package main

import (
	"log"
	"path/filepath"

	"github.com/clinova/simrs/backend/internal/auth/handler"
	"github.com/clinova/simrs/backend/internal/auth/handler/middleware"
	"github.com/clinova/simrs/backend/internal/auth/repository"
	"github.com/clinova/simrs/backend/internal/auth/service"
	"github.com/clinova/simrs/backend/internal/common/config"
	"github.com/clinova/simrs/backend/internal/common/database"
	usermgmtHandler "github.com/clinova/simrs/backend/internal/usermanagement/handler"
	"github.com/clinova/simrs/backend/pkg/audit"
	"github.com/clinova/simrs/backend/pkg/jwt"
	"github.com/clinova/simrs/backend/pkg/password"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	db, err := database.NewMySQLConnection(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Println("Connected to database:", cfg.Database.DBName)

	// Initialize audit logger
	auditLogPath := filepath.Join("storage", "logs", "audit")
	auditLogger, err := audit.NewLogger(auditLogPath)
	if err != nil {
		log.Fatalf("Failed to initialize audit logger: %v", err)
	}
	defer auditLogger.Close()
	log.Println("Audit logger initialized:", auditLogPath)

	// Initialize repositories
	userRepo := repository.NewMySQLUserRepository(db)
	roleRepo := repository.NewMySQLRoleRepository(db)
	permissionRepo := repository.NewMySQLPermissionRepository(db)
	sessionRepo := repository.NewMySQLSessionRepository(db)

	_ = roleRepo // Available for future role management

	// Initialize utilities
	jwtManager := jwt.NewManager(cfg.JWT.Secret, cfg.JWT.AccessTokenExpiry, cfg.JWT.RefreshTokenExpiry)
	passwordHasher := password.NewHasher(cfg.Bcrypt.Cost)

	// Initialize services (with audit logger)
	authService := service.NewAuthService(userRepo, sessionRepo, permissionRepo, jwtManager, passwordHasher, auditLogger)
	sessionService := service.NewSessionService(sessionRepo, userRepo, auditLogger)
	permissionService := service.NewPermissionService(permissionRepo, userRepo)

	// Initialize auth router
	authRouter := handler.NewRouter(jwtManager, authService, sessionService, permissionService)

	// Initialize middleware for other routers
	jwtMiddleware := middleware.NewJWTMiddleware(jwtManager, sessionService)
	permMiddleware := middleware.NewPermissionMiddleware(permissionService)

	// Initialize user management router
	usermgmtRouter := usermgmtHandler.NewRouter(db, auditLogger, passwordHasher, jwtMiddleware, permMiddleware)
	usermgmtRouter.RegisterRoutes(authRouter.GetEngine(), permissionService)

	// Start server
	addr := ":" + cfg.Server.Port
	log.Printf("Starting SIMRS Auth Service on %s", addr)
	log.Println("API Endpoints:")
	log.Println("  Auth:")
	log.Println("    POST /auth/login")
	log.Println("    POST /auth/logout")
	log.Println("    POST /auth/refresh")
	log.Println("    GET  /auth/me")
	log.Println("    GET  /auth/sessions")
	log.Println("    POST /auth/sessions/:id/revoke")
	log.Println("  User Management:")
	log.Println("    GET/POST  /admin/users")
	log.Println("    GET/PUT   /admin/users/:id")
	log.Println("    POST      /admin/users/:id/copy-access")
	log.Println("  Role Management:")
	log.Println("    GET/POST  /admin/roles")
	log.Println("    PUT/DEL   /admin/roles/:id")
	log.Println("  Permission Management:")
	log.Println("    GET/POST  /admin/permissions")

	if err := authRouter.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
