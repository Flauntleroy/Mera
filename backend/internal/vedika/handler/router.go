// Package handler contains HTTP handlers for the Vedika module.
package handler

import (
	"database/sql"

	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/internal/auth/handler/middleware"
	"github.com/clinova/simrs/backend/internal/auth/service"
	"github.com/clinova/simrs/backend/internal/vedika/repository"
	vedikaService "github.com/clinova/simrs/backend/internal/vedika/service"
	"github.com/clinova/simrs/backend/pkg/audit"
)

// Router handles Vedika route setup.
type Router struct {
	dashboardHandler   *DashboardHandler
	workbenchHandler   *WorkbenchHandler
	claimDetailHandler *ClaimDetailHandler
	jwtMiddleware      *middleware.JWTMiddleware
	permMiddleware     *middleware.PermissionMiddleware
}

// NewRouter creates a new Vedika router.
func NewRouter(
	db *sql.DB,
	auditLogger *audit.Logger,
	jwtMiddleware *middleware.JWTMiddleware,
	permMiddleware *middleware.PermissionMiddleware,
) *Router {
	// Initialize repositories
	settingsRepo := repository.NewMySQLSettingsRepository(db)
	dashboardRepo := repository.NewMySQLDashboardRepository(db)
	indexRepo := repository.NewMySQLIndexRepository(db)
	claimDetailRepo := repository.NewMySQLClaimDetailRepository(db)

	// Initialize services
	dashboardSvc := vedikaService.NewDashboardService(settingsRepo, dashboardRepo, auditLogger)
	workbenchSvc := vedikaService.NewWorkbenchService(indexRepo, auditLogger)
	claimDetailSvc := vedikaService.NewClaimDetailService(claimDetailRepo, settingsRepo, auditLogger)

	return &Router{
		dashboardHandler:   NewDashboardHandler(dashboardSvc),
		workbenchHandler:   NewWorkbenchHandler(workbenchSvc),
		claimDetailHandler: NewClaimDetailHandler(claimDetailSvc),
		jwtMiddleware:      jwtMiddleware,
		permMiddleware:     permMiddleware,
	}
}

// RegisterRoutes registers Vedika routes on the given engine.
func (r *Router) RegisterRoutes(engine *gin.Engine, permissionService *service.PermissionService) {
	vedika := engine.Group("/admin/vedika")
	vedika.Use(r.jwtMiddleware.Authenticate())
	{
		// Dashboard endpoints (require vedika.read)
		dashboard := vedika.Group("")
		dashboard.Use(r.permMiddleware.RequirePermission("vedika.read"))
		{
			dashboard.GET("/dashboard", r.dashboardHandler.GetDashboard)
			dashboard.GET("/dashboard/trend", r.dashboardHandler.GetDashboardTrend)
		}

		// Index workbench - list endpoints (require vedika.read)
		index := vedika.Group("")
		index.Use(r.permMiddleware.RequirePermission("vedika.read"))
		{
			index.GET("/index", r.workbenchHandler.ListIndex)
		}

		// Claim detail endpoints
		claim := vedika.Group("/claim")
		{
			// View basic claim (require vedika.claim.read)
			claim.GET("/:no_rawat", r.permMiddleware.RequirePermission("vedika.claim.read"), r.workbenchHandler.GetClaimDetail)

			// View FULL claim detail - all 14 sections (require vedika.claim.read)
			claim.GET("/full/*no_rawat", r.permMiddleware.RequirePermission("vedika.claim.read"), r.claimDetailHandler.GetClaimFullDetail)

			// Update status (require vedika.claim.update_status)
			claim.POST("/:no_rawat/status", r.permMiddleware.RequirePermission("vedika.claim.update_status"), r.workbenchHandler.UpdateStatus)

			// Edit diagnosis (require vedika.claim.edit_medical_data)
			claim.POST("/:no_rawat/diagnosis", r.permMiddleware.RequirePermission("vedika.claim.edit_medical_data"), r.workbenchHandler.UpdateDiagnosis)

			// Edit procedure (require vedika.claim.edit_medical_data)
			claim.POST("/:no_rawat/procedure", r.permMiddleware.RequirePermission("vedika.claim.edit_medical_data"), r.workbenchHandler.UpdateProcedure)

			// Upload documents (require vedika.claim.upload_document)
			claim.POST("/:no_rawat/documents", r.permMiddleware.RequirePermission("vedika.claim.upload_document"), r.workbenchHandler.UploadDocument)

			// View resume (require vedika.claim.read_resume)
			claim.GET("/:no_rawat/resume", r.permMiddleware.RequirePermission("vedika.claim.read_resume"), r.workbenchHandler.GetResume)
		}
	}
}
