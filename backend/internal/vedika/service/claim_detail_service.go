package service

import (
	"context"
	"fmt"

	"github.com/clinova/simrs/backend/internal/vedika/entity"
	"github.com/clinova/simrs/backend/internal/vedika/repository"
	"github.com/clinova/simrs/backend/pkg/audit"
)

// ClaimDetailService handles business logic for claim detail view.
type ClaimDetailService struct {
	claimRepo    repository.ClaimDetailRepository
	settingsRepo repository.SettingsRepository
	auditLogger  *audit.Logger
}

// NewClaimDetailService creates a new claim detail service.
func NewClaimDetailService(
	claimRepo repository.ClaimDetailRepository,
	settingsRepo repository.SettingsRepository,
	auditLogger *audit.Logger,
) *ClaimDetailService {
	return &ClaimDetailService{
		claimRepo:    claimRepo,
		settingsRepo: settingsRepo,
		auditLogger:  auditLogger,
	}
}

// GetClaimFullDetail returns comprehensive claim data for all 14 sections.
func (s *ClaimDetailService) GetClaimFullDetail(
	ctx context.Context,
	noRawat string,
	actor audit.Actor,
	ip string,
) (*entity.ClaimFullDetail, error) {
	// Validate settings exist
	if _, err := s.settingsRepo.GetAllowedCarabayar(ctx); err != nil {
		return nil, fmt.Errorf("VEDIKA_SETTINGS_MISSING: Pengaturan Vedika belum lengkap")
	}

	// Get full claim detail
	detail, err := s.claimRepo.GetClaimFullDetail(ctx, noRawat)
	if err != nil {
		return nil, fmt.Errorf("failed to get claim detail: %w", err)
	}

	// Audit log - READ
	s.auditLogger.LogInsert(audit.InsertParams{
		Module: "vedika",
		Entity: audit.Entity{
			Table:      "claim_detail_full",
			PrimaryKey: map[string]string{"no_rawat": noRawat},
		},
		InsertedData: map[string]interface{}{
			"action":   "view_claim_full_detail",
			"no_rawat": noRawat,
		},
		BusinessKey: noRawat,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Melihat detail lengkap klaim %s (14 section)", noRawat),
	})

	return detail, nil
}
