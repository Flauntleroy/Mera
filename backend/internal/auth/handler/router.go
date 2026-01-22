package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/internal/auth/handler/middleware"
	"github.com/clinova/simrs/backend/internal/auth/service"
	"github.com/clinova/simrs/backend/pkg/jwt"
)

type Router struct {
	engine           *gin.Engine
	jwtMiddleware    *middleware.JWTMiddleware
	permMiddleware   *middleware.PermissionMiddleware
	loginRateLimiter *middleware.LoginRateLimiter
	authHandler      *AuthHandler
}

func NewRouter(
	jwtManager *jwt.Manager,
	authService *service.AuthService,
	sessionService *service.SessionService,
	permissionService *service.PermissionService,
) *Router {
	engine := gin.Default()
	engine.UseRawPath = true
	engine.UnescapePathValues = false

	r := &Router{
		engine:           engine,
		jwtMiddleware:    middleware.NewJWTMiddleware(jwtManager, sessionService),
		permMiddleware:   middleware.NewPermissionMiddleware(permissionService),
		loginRateLimiter: middleware.NewDefaultLoginRateLimiter(),
		authHandler:      NewAuthHandler(authService, sessionService, permissionService),
	}
	r.setupRoutes()
	return r
}

func (r *Router) setupRoutes() {
	// Enable CORS for frontend
	r.engine.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	r.engine.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	auth := r.engine.Group("/auth")
	{
		// Login with rate limiting - max 10 attempts per 5 minutes per username+IP
		auth.POST("/login", r.loginRateLimiter.Middleware(), r.authHandler.Login)
		auth.POST("/refresh", r.authHandler.Refresh)

		protected := auth.Group("")
		protected.Use(r.jwtMiddleware.Authenticate())
		{
			protected.POST("/logout", r.authHandler.Logout)
			protected.GET("/me", r.authHandler.Me)
			protected.GET("/sessions", r.authHandler.GetSessions)
			protected.POST("/sessions/:id/revoke", r.authHandler.RevokeSession)
		}
	}
}

func (r *Router) GetEngine() *gin.Engine {
	return r.engine
}

func (r *Router) Run(addr string) error {
	return r.engine.Run(addr)
}
