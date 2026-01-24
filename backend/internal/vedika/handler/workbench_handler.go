package handler

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/internal/vedika/entity"
	"github.com/clinova/simrs/backend/internal/vedika/service"
	"github.com/clinova/simrs/backend/pkg/response"
)

// WorkbenchHandler handles Index workbench HTTP requests.
type WorkbenchHandler struct {
	workbenchSvc *service.WorkbenchService
}

// NewWorkbenchHandler creates a new workbench handler.
func NewWorkbenchHandler(workbenchSvc *service.WorkbenchService) *WorkbenchHandler {
	return &WorkbenchHandler{workbenchSvc: workbenchSvc}
}

// ListIndex handles GET /admin/vedika/index
// Query params: date_from, date_to, status, jenis, page, limit, search
func (h *WorkbenchHandler) ListIndex(c *gin.Context) {
	filter := h.parseIndexFilter(c)
	actor := getActor(c)
	ip := c.ClientIP()

	// Validate required params
	if filter.DateFrom == "" || filter.DateTo == "" {
		response.BadRequest(c, "INVALID_PARAMS", "date_from and date_to are required")
		return
	}
	if filter.Status == "" {
		response.BadRequest(c, "INVALID_PARAMS", "status is required")
		return
	}

	result, err := h.workbenchSvc.ListIndex(c.Request.Context(), filter, actor, ip)
	if err != nil {
		handleVedikaError(c, err)
		return
	}

	response.Success(c, gin.H{
		"filter": gin.H{
			"date_from": filter.DateFrom,
			"date_to":   filter.DateTo,
			"status":    filter.Status,
			"jenis":     filter.Jenis,
		},
		"pagination": gin.H{
			"page":  result.Page,
			"limit": result.Limit,
			"total": result.Total,
		},
		"items": result.Data,
	})
}

// GetClaimDetail handles GET /admin/vedika/claim/:no_rawat
func (h *WorkbenchHandler) GetClaimDetail(c *gin.Context) {
	noRawat := decodeNoRawat(c.Param("no_rawat"))
	actor := getActor(c)
	ip := c.ClientIP()

	detail, err := h.workbenchSvc.GetClaimDetail(c.Request.Context(), noRawat, actor, ip)
	if err != nil {
		handleVedikaError(c, err)
		return
	}

	response.Success(c, detail)
}

// UpdateStatus handles POST /admin/vedika/claim/:no_rawat/status
func (h *WorkbenchHandler) UpdateStatus(c *gin.Context) {
	noRawat := decodeNoRawat(c.Param("no_rawat"))
	actor := getActor(c)
	ip := c.ClientIP()

	var req entity.StatusUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request body")
		return
	}

	if err := h.workbenchSvc.UpdateClaimStatus(c.Request.Context(), noRawat, req, actor, ip); err != nil {
		handleVedikaError(c, err)
		return
	}

	response.SuccessWithMessage(c, "Status berhasil diubah", gin.H{"status": req.Status})
}

// BatchUpdateStatus handles POST /admin/vedika/claim/batch-status
func (h *WorkbenchHandler) BatchUpdateStatus(c *gin.Context) {
	actor := getActor(c)
	ip := c.ClientIP()

	var req entity.BatchStatusUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request body")
		return
	}

	result, err := h.workbenchSvc.BatchUpdateClaimStatus(c.Request.Context(), req, actor, ip)
	if err != nil {
		handleVedikaError(c, err)
		return
	}

	response.SuccessWithMessage(c, fmt.Sprintf("%d klaim berhasil diupdate", result.Updated), result)
}

// UpdateDiagnosis handles POST /admin/vedika/claim/:no_rawat/diagnosis
func (h *WorkbenchHandler) UpdateDiagnosis(c *gin.Context) {
	noRawat := decodeNoRawat(c.Param("no_rawat"))
	actor := getActor(c)
	ip := c.ClientIP()

	var req entity.DiagnosisUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request body")
		return
	}

	if err := h.workbenchSvc.UpdateDiagnosis(c.Request.Context(), noRawat, req, actor, ip); err != nil {
		handleVedikaError(c, err)
		return
	}

	response.SuccessWithMessage(c, "Diagnosa berhasil diubah", nil)
}

// SyncDiagnoses handles PUT /admin/vedika/claim/:no_rawat/diagnosis
func (h *WorkbenchHandler) SyncDiagnoses(c *gin.Context) {
	noRawat := decodeNoRawat(c.Param("no_rawat"))
	actor := getActor(c)
	ip := c.ClientIP()

	var req entity.DiagnosisSyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request body")
		return
	}

	if err := h.workbenchSvc.SyncDiagnoses(c.Request.Context(), noRawat, req, actor, ip); err != nil {
		handleVedikaError(c, err)
		return
	}

	response.SuccessWithMessage(c, "Daftar diagnosa berhasil diperbarui", nil)
}

// UpdateProcedure handles POST /admin/vedika/claim/:no_rawat/procedure
func (h *WorkbenchHandler) UpdateProcedure(c *gin.Context) {
	noRawat := decodeNoRawat(c.Param("no_rawat"))
	actor := getActor(c)
	ip := c.ClientIP()

	var req entity.ProcedureUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request body")
		return
	}

	if err := h.workbenchSvc.UpdateProcedure(c.Request.Context(), noRawat, req, actor, ip); err != nil {
		handleVedikaError(c, err)
		return
	}

	response.SuccessWithMessage(c, "Prosedur berhasil diubah", nil)
}

// SyncProcedures handles PUT /admin/vedika/claim/:no_rawat/procedure
func (h *WorkbenchHandler) SyncProcedures(c *gin.Context) {
	noRawat := decodeNoRawat(c.Param("no_rawat"))
	actor := getActor(c)
	ip := c.ClientIP()

	var req entity.ProcedureSyncRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "INVALID_REQUEST", "Invalid request body")
		return
	}

	if err := h.workbenchSvc.SyncProcedures(c.Request.Context(), noRawat, req, actor, ip); err != nil {
		handleVedikaError(c, err)
		return
	}

	response.SuccessWithMessage(c, "Daftar prosedur berhasil diperbarui", nil)
}

// UploadDocument handles POST /admin/vedika/claim/:no_rawat/documents
// Note: File upload handling would require multipart form parsing
func (h *WorkbenchHandler) UploadDocument(c *gin.Context) {
	// TODO: Implement file upload handling
	response.Error(c, http.StatusNotImplemented, "NOT_IMPLEMENTED", "Document upload not yet implemented")
}

// GetResume handles GET /admin/vedika/claim/:no_rawat/resume
func (h *WorkbenchHandler) GetResume(c *gin.Context) {
	noRawat := decodeNoRawat(c.Param("no_rawat"))
	actor := getActor(c)
	ip := c.ClientIP()

	resume, err := h.workbenchSvc.GetResume(c.Request.Context(), noRawat, actor, ip)
	if err != nil {
		handleVedikaError(c, err)
		return
	}

	response.Success(c, resume)
}

// parseIndexFilter extracts filter parameters for Index workbench.
func (h *WorkbenchHandler) parseIndexFilter(c *gin.Context) entity.IndexFilter {
	filter := entity.IndexFilter{
		DateFrom: c.Query("date_from"),
		DateTo:   c.Query("date_to"),
		Status:   entity.ClaimStatus(c.Query("status")),
		Search:   c.Query("search"),
		Page:     1,
		Limit:    10,
	}

	// Parse jenis
	switch c.Query("jenis") {
	case "ralan":
		filter.Jenis = entity.JenisRalan
	case "ranap":
		filter.Jenis = entity.JenisRanap
	}

	// Parse pagination
	if page, err := strconv.Atoi(c.Query("page")); err == nil && page > 0 {
		filter.Page = page
	}
	if limit, err := strconv.Atoi(c.Query("limit")); err == nil && limit > 0 && limit <= 100 {
		filter.Limit = limit
	}

	return filter
}

// SearchICD10 handles GET /admin/vedika/icd10
func (h *WorkbenchHandler) SearchICD10(c *gin.Context) {
	query := c.Query("search")
	if query == "" {
		response.Success(c, []entity.ICD10Item{})
		return
	}

	results, err := h.workbenchSvc.SearchICD10(c.Request.Context(), query)
	if err != nil {
		handleVedikaError(c, err)
		return
	}

	response.Success(c, results)
}

// SearchICD9 handles GET /admin/vedika/icd9
func (h *WorkbenchHandler) SearchICD9(c *gin.Context) {
	query := c.Query("search")
	if query == "" {
		response.Success(c, []entity.ICD9Item{})
		return
	}

	results, err := h.workbenchSvc.SearchICD9(c.Request.Context(), query)
	if err != nil {
		handleVedikaError(c, err)
		return
	}

	response.Success(c, results)
}

// decodeNoRawat decodes URL-encoded no_rawat parameter.
// Also strips leading slash added by Gin wildcard routes (e.g., /*no_rawat).
func decodeNoRawat(encoded string) string {
	decoded, _ := url.QueryUnescape(strings.TrimPrefix(encoded, "/"))
	if decoded == "" {
		return encoded
	}
	return decoded
}
