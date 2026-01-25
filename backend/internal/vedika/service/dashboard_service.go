// Package service contains business logic for the Vedika module.
package service

import (
	"context"
	"fmt"
	"sync"

	"github.com/clinova/simrs/backend/internal/vedika/entity"
	"github.com/clinova/simrs/backend/internal/vedika/repository"
	"github.com/clinova/simrs/backend/pkg/audit"
)

// DashboardService handles dashboard business logic.
type DashboardService struct {
	settingsRepo  repository.SettingsRepository
	dashboardRepo repository.DashboardRepository
	auditLogger   *audit.Logger
}

// NewDashboardService creates a new dashboard service.
func NewDashboardService(
	settingsRepo repository.SettingsRepository,
	dashboardRepo repository.DashboardRepository,
	auditLogger *audit.Logger,
) *DashboardService {
	return &DashboardService{
		settingsRepo:  settingsRepo,
		dashboardRepo: dashboardRepo,
		auditLogger:   auditLogger,
	}
}

// GetDashboardSummary returns the dashboard summary with all counts and maturasi.
// OPTIMIZED: Uses parallel execution for independent database queries.
func (s *DashboardService) GetDashboardSummary(ctx context.Context, actor audit.Actor, ip string) (*entity.DashboardSummary, error) {
	// Get required settings (must be sequential as other queries depend on these)
	period, err := s.settingsRepo.GetActivePeriod(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get active period: %w", err)
	}

	carabayar, err := s.settingsRepo.GetAllowedCarabayar(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get allowed carabayar: %w", err)
	}

	// Execute all count queries in parallel
	var (
		wg      sync.WaitGroup
		rencana entity.ClaimCount
		pen     entity.ClaimCount
		lenk    entity.ClaimCount
		perb    entity.ClaimCount
		setuju  entity.ClaimCount

		errRenRalan error
		errRenRanap error
		errPenRalan error
		errPenRanap error
		errLenRalan error
		errLenRanap error
		errPerRalan error
		errPerRanap error
		errSetRalan error
		errSetRanap error
	)

	wg.Add(10)

	// Rencana
	go func() {
		defer wg.Done()
		rencana.Ralan, errRenRalan = s.dashboardRepo.CountRencanaRalan(ctx, period, carabayar)
	}()
	go func() {
		defer wg.Done()
		rencana.Ranap, errRenRanap = s.dashboardRepo.CountRencanaRanap(ctx, period, carabayar)
	}()

	// Pengajuan
	go func() {
		defer wg.Done()
		pen.Ralan, errPenRalan = s.dashboardRepo.CountByStatusAndJenis(ctx, period, entity.StatusPengajuan, entity.JenisRalan)
	}()
	go func() {
		defer wg.Done()
		pen.Ranap, errPenRanap = s.dashboardRepo.CountByStatusAndJenis(ctx, period, entity.StatusPengajuan, entity.JenisRanap)
	}()

	// Lengkap
	go func() {
		defer wg.Done()
		lenk.Ralan, errLenRalan = s.dashboardRepo.CountByStatusAndJenis(ctx, period, entity.StatusLengkap, entity.JenisRalan)
	}()
	go func() {
		defer wg.Done()
		lenk.Ranap, errLenRanap = s.dashboardRepo.CountByStatusAndJenis(ctx, period, entity.StatusLengkap, entity.JenisRanap)
	}()

	// Perbaikan
	go func() {
		defer wg.Done()
		perb.Ralan, errPerRalan = s.dashboardRepo.CountByStatusAndJenis(ctx, period, entity.StatusPerbaikan, entity.JenisRalan)
	}()
	go func() {
		defer wg.Done()
		perb.Ranap, errPerRanap = s.dashboardRepo.CountByStatusAndJenis(ctx, period, entity.StatusPerbaikan, entity.JenisRanap)
	}()

	// Setuju
	go func() {
		defer wg.Done()
		setuju.Ralan, errSetRalan = s.dashboardRepo.CountByStatusAndJenis(ctx, period, entity.StatusSetuju, entity.JenisRalan)
	}()
	go func() {
		defer wg.Done()
		setuju.Ranap, errSetRanap = s.dashboardRepo.CountByStatusAndJenis(ctx, period, entity.StatusSetuju, entity.JenisRanap)
	}()

	wg.Wait()

	// Error handling
	if errRenRalan != nil || errRenRanap != nil || errPenRalan != nil || errPenRanap != nil ||
		errLenRalan != nil || errLenRanap != nil || errPerRalan != nil || errPerRanap != nil ||
		errSetRalan != nil || errSetRanap != nil {
		return nil, fmt.Errorf("failed to fetch dashboard counts")
	}

	// Calculate maturasi
	// Total processed = pengajuan + lengkap + perbaikan + setuju
	pengajuanTotalRalan := pen.Ralan + lenk.Ralan + perb.Ralan + setuju.Ralan
	pengajuanTotalRanap := pen.Ranap + lenk.Ranap + perb.Ranap + setuju.Ranap

	totalRencanaRalan := rencana.Ralan + pengajuanTotalRalan
	totalRencanaRanap := rencana.Ranap + pengajuanTotalRanap

	var maturasi entity.MaturasiPersen
	if totalRencanaRalan > 0 {
		maturasi.Ralan = float64(pengajuanTotalRalan) / float64(totalRencanaRalan) * 100
	}
	if totalRencanaRanap > 0 {
		maturasi.Ranap = float64(pengajuanTotalRanap) / float64(totalRencanaRanap) * 100
	}

	summary := &entity.DashboardSummary{
		Period: period,
		Rencana: entity.ClaimCount{
			Ralan: totalRencanaRalan,
			Ranap: totalRencanaRanap,
		},
		Pengajuan: pen,
		Lengkap:   lenk,
		Perbaikan: perb,
		Maturasi:  maturasi,
	}

	// Write audit log (async, non-blocking)
	go s.auditLogger.LogInsert(audit.InsertParams{
		Module: "vedika",
		Entity: audit.Entity{
			Table:      "dashboard",
			PrimaryKey: map[string]string{"period": period},
		},
		InsertedData: map[string]interface{}{
			"action": "view_dashboard",
			"period": period,
		},
		BusinessKey: period,
		Actor:       actor,
		IP:          ip,
		Summary:     fmt.Sprintf("Melihat dashboard Vedika periode %s", period),
	})

	return summary, nil
}

// GetDashboardTrend returns daily trend data for the dashboard chart.
func (s *DashboardService) GetDashboardTrend(ctx context.Context, actor audit.Actor, ip string) ([]entity.DashboardTrendItem, error) {
	period, err := s.settingsRepo.GetActivePeriod(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get active period: %w", err)
	}

	carabayar, err := s.settingsRepo.GetAllowedCarabayar(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get allowed carabayar: %w", err)
	}

	trend, err := s.dashboardRepo.GetDailyTrend(ctx, period, carabayar)
	if err != nil {
		return nil, fmt.Errorf("failed to get daily trend: %w", err)
	}

	return trend, nil
}
