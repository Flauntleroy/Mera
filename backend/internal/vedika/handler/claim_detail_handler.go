package handler

import (
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/internal/auth/handler/middleware"
	"github.com/clinova/simrs/backend/internal/vedika/service"
	"github.com/clinova/simrs/backend/pkg/audit"
	"github.com/clinova/simrs/backend/pkg/response"
)

// ClaimDetailHandler handles comprehensive claim detail HTTP requests.
type ClaimDetailHandler struct {
	claimDetailSvc *service.ClaimDetailService
}

// NewClaimDetailHandler creates a new claim detail handler.
func NewClaimDetailHandler(claimDetailSvc *service.ClaimDetailService) *ClaimDetailHandler {
	return &ClaimDetailHandler{claimDetailSvc: claimDetailSvc}
}

// GetClaimFullDetail handles GET /admin/vedika/claim/:no_rawat/full
// Returns comprehensive claim data with all 14 sections for "Lihat Data Klaim" feature.
func (h *ClaimDetailHandler) GetClaimFullDetail(c *gin.Context) {
	noRawat := decodeNoRawatParam(c.Param("no_rawat"))
	actor := getClaimActor(c)
	ip := c.ClientIP()

	detail, err := h.claimDetailSvc.GetClaimFullDetail(c.Request.Context(), noRawat, actor, ip)
	if err != nil {
		handleVedikaError(c, err)
		return
	}

	response.Success(c, detail)
}

// decodeNoRawatParam decodes URL-encoded no_rawat parameter.
func decodeNoRawatParam(encoded string) string {
	// If it came from a wildcard (*no_rawat), it might start with a /
	encoded = strings.TrimPrefix(encoded, "/")

	decoded, err := url.QueryUnescape(encoded)
	if err != nil {
		return encoded
	}
	return decoded
}

// getClaimActor extracts audit actor from gin context.
func getClaimActor(c *gin.Context) audit.Actor {
	userID := middleware.GetUserID(c)
	return audit.Actor{UserID: userID, Username: userID}
}
