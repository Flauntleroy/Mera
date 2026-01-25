package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/clinova/simrs/backend/internal/vedika/entity"
)

// DashboardRepository handles dashboard-specific data access.
// Uses active_period from mera_settings.
type DashboardRepository interface {
	CountRencanaRalan(ctx context.Context, period string, carabayar []string) (int, error)
	CountRencanaRanap(ctx context.Context, period string, carabayar []string) (int, error)
	CountPengajuanByJenis(ctx context.Context, period string, jenis entity.JenisPelayanan) (int, error)
	CountByStatusAndJenis(ctx context.Context, period string, status entity.ClaimStatus, jenis entity.JenisPelayanan) (int, error)
	GetDailyTrend(ctx context.Context, period string, carabayar []string) ([]entity.DashboardTrendItem, error)
}

// MySQLDashboardRepository implements DashboardRepository.
type MySQLDashboardRepository struct {
	db *sql.DB
}

// NewMySQLDashboardRepository creates a new dashboard repository.
func NewMySQLDashboardRepository(db *sql.DB) *MySQLDashboardRepository {
	return &MySQLDashboardRepository{db: db}
}

// buildPlaceholders creates SQL placeholders for IN clause.
func buildPlaceholders(count int) string {
	if count == 0 {
		return "''"
	}
	placeholders := make([]string, count)
	for i := range placeholders {
		placeholders[i] = "?"
	}
	return strings.Join(placeholders, ",")
}

// toInterfaceSlice converts string slice to interface slice for query args.
func toInterfaceSlice(s []string) []interface{} {
	result := make([]interface{}, len(s))
	for i, v := range s {
		result[i] = v
	}
	return result
}

// CountRencanaRalan counts RALAN episodes not in mlite_vedika.
// Uses reg_periksa.tgl_registrasi for period filtering.
// OPTIMIZED: Uses LEFT JOIN instead of NOT IN subquery for better performance.
func (r *MySQLDashboardRepository) CountRencanaRalan(ctx context.Context, period string, carabayar []string) (int, error) {
	if len(carabayar) == 0 {
		return 0, nil
	}

	query := fmt.Sprintf(`
		SELECT COUNT(*) FROM reg_periksa rp
		INNER JOIN penjab pj ON rp.kd_pj = pj.kd_pj
		LEFT JOIN mlite_vedika mv ON rp.no_rawat = mv.no_rawat AND mv.jenis = '2'
		WHERE pj.kd_pj IN (%s)
		  AND DATE_FORMAT(rp.tgl_registrasi, '%%Y-%%m') = ?
		  AND rp.status_lanjut = 'Ralan'
		  AND UPPER(rp.stts) != 'BATAL'
		  AND mv.no_rawat IS NULL
	`, buildPlaceholders(len(carabayar)))

	args := append(toInterfaceSlice(carabayar), period)

	var count int
	if err := r.db.QueryRowContext(ctx, query, args...).Scan(&count); err != nil {
		return 0, fmt.Errorf("failed to count rencana ralan: %w", err)
	}

	return count, nil
}

// CountRencanaRanap counts RANAP episodes not in mlite_vedika.
// Uses kamar_inap.tgl_keluar for period filtering. Only includes discharged patients.
// OPTIMIZED: Uses LEFT JOIN instead of NOT IN subquery for better performance.
func (r *MySQLDashboardRepository) CountRencanaRanap(ctx context.Context, period string, carabayar []string) (int, error) {
	if len(carabayar) == 0 {
		return 0, nil
	}

	query := fmt.Sprintf(`
		SELECT COUNT(DISTINCT rp.no_rawat) FROM reg_periksa rp
		INNER JOIN penjab pj ON rp.kd_pj = pj.kd_pj
		INNER JOIN kamar_inap ki ON rp.no_rawat = ki.no_rawat
		LEFT JOIN mlite_vedika mv ON rp.no_rawat = mv.no_rawat AND mv.jenis = '1'
		WHERE pj.kd_pj IN (%s)
		  AND ki.tgl_keluar IS NOT NULL
		  AND DATE_FORMAT(ki.tgl_keluar, '%%Y-%%m') = ?
		  AND rp.status_lanjut = 'Ranap'
		  AND rp.stts != 'Batal'
		  AND mv.no_rawat IS NULL
	`, buildPlaceholders(len(carabayar)))

	args := append(toInterfaceSlice(carabayar), period)

	var count int
	if err := r.db.QueryRowContext(ctx, query, args...).Scan(&count); err != nil {
		return 0, fmt.Errorf("failed to count rencana ranap: %w", err)
	}

	return count, nil
}

// CountPengajuanByJenis counts episodes in mlite_vedika by jenis.
func (r *MySQLDashboardRepository) CountPengajuanByJenis(ctx context.Context, period string, jenis entity.JenisPelayanan) (int, error) {
	// For backward compatibility or general count, but we can just use the new one with PENGAJUAN if needed.
	// Actually, the user wants "Pengajuan" to be status-specific.
	return r.CountByStatusAndJenis(ctx, period, entity.StatusPengajuan, jenis)
}

// CountByStatusAndJenis counts episodes in mlite_vedika by status and jenis.
func (r *MySQLDashboardRepository) CountByStatusAndJenis(ctx context.Context, period string, status entity.ClaimStatus, jenis entity.JenisPelayanan) (int, error) {
	query := `
		SELECT COUNT(*) FROM mlite_vedika
		WHERE DATE_FORMAT(tgl_registrasi, '%Y-%m') = ?
		  AND UPPER(status) = UPPER(?)
		  AND jenis = ?
	`

	var count int
	if err := r.db.QueryRowContext(ctx, query, period, string(status), jenis.ToDBValue()).Scan(&count); err != nil {
		return 0, fmt.Errorf("failed to count by status and jenis: %w", err)
	}

	return count, nil
}

// GetDailyTrend returns daily aggregation data for the dashboard chart.
// OPTIMIZED: Uses single query with GROUP BY instead of N+1 queries.
func (r *MySQLDashboardRepository) GetDailyTrend(ctx context.Context, period string, carabayar []string) ([]entity.DashboardTrendItem, error) {
	if len(carabayar) == 0 {
		return []entity.DashboardTrendItem{}, nil
	}

	// Single optimized query that gets all trend data in one go
	// Uses UNION ALL to combine rencana and pengajuan counts
	query := fmt.Sprintf(`
		SELECT 
			day,
			SUM(rencana_ralan) as rencana_ralan,
			SUM(rencana_ranap) as rencana_ranap,
			SUM(pengajuan_ralan) as pengajuan_ralan,
			SUM(pengajuan_ranap) as pengajuan_ranap
		FROM (
			-- Rencana Ralan (from reg_periksa)
			SELECT 
				DATE(rp.tgl_registrasi) as day,
				COUNT(*) as rencana_ralan,
				0 as rencana_ranap,
				0 as pengajuan_ralan,
				0 as pengajuan_ranap
			FROM reg_periksa rp
			INNER JOIN penjab pj ON rp.kd_pj = pj.kd_pj
			WHERE pj.kd_pj IN (%s)
			  AND DATE_FORMAT(rp.tgl_registrasi, '%%Y-%%m') = ?
			  AND rp.status_lanjut = 'Ralan'
			  AND rp.stts != 'Batal'
			GROUP BY DATE(rp.tgl_registrasi)
			
			UNION ALL
			
			-- Pengajuan Ralan (from mlite_vedika jenis=2)
			SELECT 
				DATE(tgl_registrasi) as day,
				0 as rencana_ralan,
				0 as rencana_ranap,
				COUNT(*) as pengajuan_ralan,
				0 as pengajuan_ranap
			FROM mlite_vedika
			WHERE DATE_FORMAT(tgl_registrasi, '%%Y-%%m') = ?
			  AND jenis = '2'
			GROUP BY DATE(tgl_registrasi)
			
			UNION ALL
			
			-- Pengajuan Ranap (from mlite_vedika jenis=1)
			SELECT 
				DATE(tgl_registrasi) as day,
				0 as rencana_ralan,
				0 as rencana_ranap,
				0 as pengajuan_ralan,
				COUNT(*) as pengajuan_ranap
			FROM mlite_vedika
			WHERE DATE_FORMAT(tgl_registrasi, '%%Y-%%m') = ?
			  AND jenis = '1'
			GROUP BY DATE(tgl_registrasi)
		) combined
		GROUP BY day
		ORDER BY day
	`, buildPlaceholders(len(carabayar)))

	args := append(toInterfaceSlice(carabayar), period, period, period)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get daily trend: %w", err)
	}
	defer rows.Close()

	var trend []entity.DashboardTrendItem
	for rows.Next() {
		var item entity.DashboardTrendItem
		if err := rows.Scan(
			&item.Date,
			&item.Rencana.Ralan,
			&item.Rencana.Ranap,
			&item.Pengajuan.Ralan,
			&item.Pengajuan.Ranap,
		); err != nil {
			return nil, fmt.Errorf("failed to scan trend item: %w", err)
		}
		trend = append(trend, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating trend rows: %w", err)
	}

	if trend == nil {
		trend = []entity.DashboardTrendItem{}
	}

	return trend, nil
}
