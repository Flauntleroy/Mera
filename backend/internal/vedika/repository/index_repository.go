package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/clinova/simrs/backend/internal/vedika/entity"
)

// IndexRepository handles Index workbench data access.
// Uses explicit date range filtering, NOT active_period.
type IndexRepository interface {
	// List episodes by date range and status
	ListByDateRange(ctx context.Context, filter entity.IndexFilter) (*entity.PaginatedResult[entity.ClaimEpisode], error)
	// Get claim detail
	GetClaimDetail(ctx context.Context, noRawat string) (*entity.ClaimDetail, error)
	// Get episode status (RENCANA if not in mlite_vedika)
	GetEpisodeStatus(ctx context.Context, noRawat string) (entity.ClaimStatus, error)
	// Update claim status
	UpdateClaimStatus(ctx context.Context, noRawat string, status entity.ClaimStatus, username string, catatan string) error
	// Get diagnoses
	GetDiagnoses(ctx context.Context, noRawat string) ([]entity.DiagnosisItem, error)
	// Get procedures
	GetProcedures(ctx context.Context, noRawat string) ([]entity.ProcedureItem, error)
	// Add/Update diagnosis
	AddDiagnosis(ctx context.Context, noRawat string, req entity.DiagnosisUpdateRequest) error
	// Sync diagnoses (Bulk update)
	SyncDiagnoses(ctx context.Context, noRawat string, diagnoses []entity.DiagnosisUpdateRequest, statusLanjut string) error
	// Get episode type (Ralan/Ranap)
	GetEpisodeType(ctx context.Context, noRawat string) (string, error)
	// Search ICD-10
	SearchICD10(ctx context.Context, query string) ([]entity.ICD10Item, error)
	// Add/Update procedure
	AddProcedure(ctx context.Context, noRawat string, req entity.ProcedureUpdateRequest) error
	// Sync procedures (Bulk update)
	SyncProcedures(ctx context.Context, noRawat string, procedures []entity.ProcedureUpdateRequest) error
	// Search ICD-9
	SearchICD9(ctx context.Context, query string) ([]entity.ICD9Item, error)
	// Get documents
	GetDocuments(ctx context.Context, noRawat string) ([]entity.DocumentItem, error)
	// Get resume
	GetResume(ctx context.Context, noRawat string) (*entity.MedicalResume, error)
	// Update resume
	UpdateResume(ctx context.Context, noRawat string, resume *entity.MedicalResume) error
	// Get master digital document types
	GetMasterDigitalDocs(ctx context.Context) ([]entity.ICD10Item, error)
	// Add digital document record
	AddDigitalDocument(ctx context.Context, noRawat string, kode string, lokasiFile string) error
	// Delete digital document record
	DeleteDigitalDocument(ctx context.Context, noRawat string, kode string, lokasiFile string) error
}

// MySQLIndexRepository implements IndexRepository.
type MySQLIndexRepository struct {
	db *sql.DB
}

// NewMySQLIndexRepository creates a new index repository.
func NewMySQLIndexRepository(db *sql.DB) *MySQLIndexRepository {
	return &MySQLIndexRepository{db: db}
}

// ListByDateRange lists episodes by date range and status.
// Date logic: RALAN uses tgl_registrasi, RANAP uses tgl_keluar.
func (r *MySQLIndexRepository) ListByDateRange(ctx context.Context, filter entity.IndexFilter) (*entity.PaginatedResult[entity.ClaimEpisode], error) {
	// Validate required fields
	if filter.DateFrom == "" || filter.DateTo == "" {
		return nil, fmt.Errorf("date_from and date_to are required")
	}
	if !filter.Status.IsValid() {
		return nil, fmt.Errorf("invalid status: %s", filter.Status)
	}

	// Determine query based on status
	switch filter.Status {
	case entity.StatusRencana:
		return r.listRencana(ctx, filter)
	default:
		return r.listByStatus(ctx, filter)
	}
}

// listRencana lists episodes NOT in mlite_vedika.
func (r *MySQLIndexRepository) listRencana(ctx context.Context, filter entity.IndexFilter) (*entity.PaginatedResult[entity.ClaimEpisode], error) {
	var query, countQuery string
	var args, countArgs []interface{}

	if filter.Jenis == entity.JenisRanap {
		// RANAP: use kamar_inap.tgl_keluar
		baseWhere := `
			ki.tgl_keluar IS NOT NULL
			AND ki.tgl_keluar BETWEEN ? AND ?
			AND rp.status_lanjut = 'Ranap'
			AND rp.stts != 'Batal'
			AND rp.no_rawat NOT IN (SELECT no_rawat FROM mlite_vedika)
		`
		countArgs = []interface{}{filter.DateFrom, filter.DateTo}
		args = []interface{}{filter.DateFrom, filter.DateTo}

		if filter.Search != "" {
			baseWhere += " AND (p.nm_pasien LIKE ? OR rp.no_rawat LIKE ? OR rp.no_rkm_medis LIKE ?)"
			searchPattern := "%" + filter.Search + "%"
			countArgs = append(countArgs, searchPattern, searchPattern, searchPattern)
			args = append(args, searchPattern, searchPattern, searchPattern)
		}

		countQuery = fmt.Sprintf(`
			SELECT COUNT(DISTINCT rp.no_rawat) FROM reg_periksa rp
			INNER JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
			INNER JOIN kamar_inap ki ON rp.no_rawat = ki.no_rawat
			WHERE %s
		`, baseWhere)

		query = fmt.Sprintf(`
			SELECT
				rp.no_rawat,
				rp.no_rkm_medis,
				p.nm_pasien,
				'ranap' as jenis,
				DATE(MAX(ki.tgl_keluar)) as tgl_pelayanan,
				COALESCE(b.nm_bangsal, '') as unit,
				COALESCE(d.nm_dokter, '') as dokter,
				pj.png_jawab as cara_bayar
			FROM reg_periksa rp
			INNER JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
			INNER JOIN penjab pj ON rp.kd_pj = pj.kd_pj
			INNER JOIN kamar_inap ki ON rp.no_rawat = ki.no_rawat
			LEFT JOIN kamar km ON ki.kd_kamar = km.kd_kamar
			LEFT JOIN bangsal b ON km.kd_bangsal = b.kd_bangsal
			LEFT JOIN dokter d ON rp.kd_dokter = d.kd_dokter
			WHERE %s
			GROUP BY rp.no_rawat
			ORDER BY MAX(ki.tgl_keluar) DESC
			LIMIT ? OFFSET ?
		`, baseWhere)
	} else {
		// RALAN: use reg_periksa.tgl_registrasi
		baseWhere := `
			rp.tgl_registrasi BETWEEN ? AND ?
			AND rp.status_lanjut = 'Ralan'
			AND rp.stts != 'Batal'
			AND rp.no_rawat NOT IN (SELECT no_rawat FROM mlite_vedika)
		`
		countArgs = []interface{}{filter.DateFrom, filter.DateTo}
		args = []interface{}{filter.DateFrom, filter.DateTo}

		if filter.Search != "" {
			baseWhere += " AND (p.nm_pasien LIKE ? OR rp.no_rawat LIKE ? OR rp.no_rkm_medis LIKE ?)"
			searchPattern := "%" + filter.Search + "%"
			countArgs = append(countArgs, searchPattern, searchPattern, searchPattern)
			args = append(args, searchPattern, searchPattern, searchPattern)
		}

		countQuery = fmt.Sprintf(`
			SELECT COUNT(*) FROM reg_periksa rp
			INNER JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
			WHERE %s
		`, baseWhere)

		query = fmt.Sprintf(`
			SELECT
				rp.no_rawat,
				rp.no_rkm_medis,
				p.nm_pasien,
				'ralan' as jenis,
				DATE(rp.tgl_registrasi) as tgl_pelayanan,
				COALESCE(pol.nm_poli, '') as unit,
				COALESCE(d.nm_dokter, '') as dokter,
				pj.png_jawab as cara_bayar
			FROM reg_periksa rp
			INNER JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
			INNER JOIN penjab pj ON rp.kd_pj = pj.kd_pj
			LEFT JOIN poliklinik pol ON rp.kd_poli = pol.kd_poli
			LEFT JOIN dokter d ON rp.kd_dokter = d.kd_dokter
			WHERE %s
			ORDER BY rp.tgl_registrasi DESC
			LIMIT ? OFFSET ?
		`, baseWhere)
	}

	// Get total count
	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&total); err != nil {
		return nil, fmt.Errorf("failed to count rencana: %w", err)
	}

	// Get paginated data
	offset := (filter.Page - 1) * filter.Limit
	args = append(args, filter.Limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list rencana: %w", err)
	}
	defer rows.Close()

	var episodes []entity.ClaimEpisode
	for rows.Next() {
		var ep entity.ClaimEpisode
		if err := rows.Scan(
			&ep.NoRawat,
			&ep.NoRkmMedis,
			&ep.NamaPasien,
			&ep.Jenis,
			&ep.TglPelayanan,
			&ep.Unit,
			&ep.Dokter,
			&ep.CaraBayar,
		); err != nil {
			return nil, fmt.Errorf("failed to scan rencana: %w", err)
		}
		ep.Status = entity.StatusRencana
		episodes = append(episodes, ep)
	}

	if episodes == nil {
		episodes = []entity.ClaimEpisode{}
	}

	totalPages := int(total) / filter.Limit
	if int(total)%filter.Limit > 0 {
		totalPages++
	}

	return &entity.PaginatedResult[entity.ClaimEpisode]{
		Data:       episodes,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

// listByStatus lists episodes in mlite_vedika filtered by status.
func (r *MySQLIndexRepository) listByStatus(ctx context.Context, filter entity.IndexFilter) (*entity.PaginatedResult[entity.ClaimEpisode], error) {
	whereClause := `
		UPPER(mv.status) = UPPER(?)
		AND mv.tgl_registrasi BETWEEN ? AND ?
	`
	args := []interface{}{string(filter.Status), filter.DateFrom, filter.DateTo}

	if filter.Jenis != "" {
		whereClause += " AND mv.jenis = ?"
		args = append(args, filter.Jenis.ToDBValue())
	}

	if filter.Search != "" {
		whereClause += " AND (p.nm_pasien LIKE ? OR mv.no_rawat LIKE ? OR mv.no_rkm_medis LIKE ?)"
		searchPattern := "%" + filter.Search + "%"
		args = append(args, searchPattern, searchPattern, searchPattern)
	}

	// Count query
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) FROM mlite_vedika mv
		INNER JOIN pasien p ON mv.no_rkm_medis = p.no_rkm_medis
		WHERE %s
	`, whereClause)

	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("failed to count by status: %w", err)
	}

	// Data query
	offset := (filter.Page - 1) * filter.Limit
	dataQuery := fmt.Sprintf(`
		SELECT
			mv.no_rawat,
			mv.no_rkm_medis,
			p.nm_pasien,
			CASE WHEN mv.jenis = '1' THEN 'ranap' ELSE 'ralan' END as jenis,
			DATE(mv.tgl_registrasi) as tgl_pelayanan,
			CASE 
				WHEN mv.jenis = '1' THEN COALESCE(b.nm_bangsal, '')
				ELSE COALESCE(pol.nm_poli, '')
			END as unit,
			COALESCE(d.nm_dokter, '') as dokter,
			COALESCE(pj.png_jawab, '') as cara_bayar,
			mv.status
		FROM mlite_vedika mv
		INNER JOIN pasien p ON mv.no_rkm_medis = p.no_rkm_medis
		LEFT JOIN reg_periksa rp ON mv.no_rawat = rp.no_rawat
		LEFT JOIN penjab pj ON rp.kd_pj = pj.kd_pj
		LEFT JOIN poliklinik pol ON rp.kd_poli = pol.kd_poli
		LEFT JOIN dokter d ON rp.kd_dokter = d.kd_dokter
		LEFT JOIN kamar_inap ki ON mv.no_rawat = ki.no_rawat AND mv.jenis = '1'
		LEFT JOIN kamar km ON ki.kd_kamar = km.kd_kamar
		LEFT JOIN bangsal b ON km.kd_bangsal = b.kd_bangsal
		WHERE %s
		GROUP BY mv.no_rawat
		ORDER BY mv.tanggal DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	args = append(args, filter.Limit, offset)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list by status: %w", err)
	}
	defer rows.Close()

	var episodes []entity.ClaimEpisode
	for rows.Next() {
		var ep entity.ClaimEpisode
		var status string
		if err := rows.Scan(
			&ep.NoRawat,
			&ep.NoRkmMedis,
			&ep.NamaPasien,
			&ep.Jenis,
			&ep.TglPelayanan,
			&ep.Unit,
			&ep.Dokter,
			&ep.CaraBayar,
			&status,
		); err != nil {
			return nil, fmt.Errorf("failed to scan by status: %w", err)
		}
		ep.Status = entity.ClaimStatus(status)
		episodes = append(episodes, ep)
	}

	if episodes == nil {
		episodes = []entity.ClaimEpisode{}
	}

	totalPages := int(total) / filter.Limit
	if int(total)%filter.Limit > 0 {
		totalPages++
	}

	return &entity.PaginatedResult[entity.ClaimEpisode]{
		Data:       episodes,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetClaimDetail returns full claim context.
func (r *MySQLIndexRepository) GetClaimDetail(ctx context.Context, noRawat string) (*entity.ClaimDetail, error) {
	query := `
		SELECT
			rp.no_rawat,
			rp.no_rkm_medis,
			p.nm_pasien,
			CONCAT(rp.umurdaftar, ' ', rp.sttsumur) as umur,
			p.jk,
			p.alamat,
			CASE WHEN rp.status_lanjut = 'Ranap' THEN 'ranap' ELSE 'ralan' END as jenis,
			rp.tgl_registrasi,
			COALESCE(pol.nm_poli, b.nm_bangsal, '') as unit,
			COALESCE(d.nm_dokter, '') as dokter,
			pj.png_jawab as cara_bayar,
			COALESCE(bs.no_sep, '') as no_sep,
			COALESCE(bs.no_kartu, '') as no_kartu,
			COALESCE(mv.status, '') as status
		FROM reg_periksa rp
		INNER JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
		INNER JOIN penjab pj ON rp.kd_pj = pj.kd_pj
		LEFT JOIN dokter d ON rp.kd_dokter = d.kd_dokter
		LEFT JOIN poliklinik pol ON rp.kd_poli = pol.kd_poli
		LEFT JOIN kamar_inap ki ON rp.no_rawat = ki.no_rawat
		LEFT JOIN kamar km ON ki.kd_kamar = km.kd_kamar
		LEFT JOIN bangsal b ON km.kd_bangsal = b.kd_bangsal
		LEFT JOIN bridging_sep bs ON rp.no_rawat = bs.no_rawat
		LEFT JOIN mlite_vedika mv ON rp.no_rawat = mv.no_rawat
		WHERE rp.no_rawat = ?
		LIMIT 1
	`

	var detail entity.ClaimDetail
	var status string
	if err := r.db.QueryRowContext(ctx, query, noRawat).Scan(
		&detail.NoRawat,
		&detail.NoRkmMedis,
		&detail.NamaPasien,
		&detail.Umur,
		&detail.JenisKelamin,
		&detail.Alamat,
		&detail.Jenis,
		&detail.TglRegistrasi,
		&detail.Unit,
		&detail.Dokter,
		&detail.CaraBayar,
		&detail.NoSEP,
		&detail.NoKartu,
		&status,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("claim not found: %s", noRawat)
		}
		return nil, fmt.Errorf("failed to get claim detail: %w", err)
	}

	// Set status
	if status == "" {
		detail.Status = entity.StatusRencana
	} else {
		detail.Status = entity.ClaimStatus(status)
	}

	// Load diagnoses
	diagnoses, _ := r.GetDiagnoses(ctx, noRawat)
	detail.Diagnoses = diagnoses

	// Load procedures
	procedures, _ := r.GetProcedures(ctx, noRawat)
	detail.Procedures = procedures

	// Load documents
	documents, _ := r.GetDocuments(ctx, noRawat)
	detail.Documents = documents

	return &detail, nil
}

// GetEpisodeStatus returns the current status of an episode.
func (r *MySQLIndexRepository) GetEpisodeStatus(ctx context.Context, noRawat string) (entity.ClaimStatus, error) {
	var status string
	err := r.db.QueryRowContext(ctx, `
		SELECT COALESCE(status, '') FROM mlite_vedika WHERE no_rawat = ?
	`, noRawat).Scan(&status)

	if err == sql.ErrNoRows || status == "" {
		return entity.StatusRencana, nil
	}
	if err != nil {
		return "", fmt.Errorf("failed to get status: %w", err)
	}

	return entity.ClaimStatus(status), nil
}

// UpdateClaimStatus updates or inserts claim status in mlite_vedika.
func (r *MySQLIndexRepository) UpdateClaimStatus(ctx context.Context, noRawat string, status entity.ClaimStatus, username string, catatan string) error {
	// 1. Resolve real username if 'username' is actually a UserID (passed by getActor)
	var realUsername string
	err := r.db.QueryRowContext(ctx, "SELECT username FROM mera_users WHERE id = ? OR username = ?", username, username).Scan(&realUsername)
	if err == nil {
		username = realUsername
	}

	// 2. Fetch episode metadata from reg_periksa
	var noRkmMedis, tglRegistrasiRaw, jenis string
	err = r.db.QueryRowContext(ctx, `
		SELECT no_rkm_medis, tgl_registrasi, 
		CASE WHEN status_lanjut = 'Ranap' THEN '1' ELSE '2' END
		FROM reg_periksa WHERE no_rawat = ?
	`, noRawat).Scan(&noRkmMedis, &tglRegistrasiRaw, &jenis)
	if err != nil {
		return fmt.Errorf("episode not found: %w", err)
	}

	// Ensure tgl_registrasi is strictly YYYY-MM-DD (take first 10 chars)
	tglRegistrasi := tglRegistrasiRaw
	if len(tglRegistrasi) > 10 {
		tglRegistrasi = tglRegistrasi[:10]
	}

	// Get SEP if exists
	var noSEP string
	r.db.QueryRowContext(ctx, `SELECT COALESCE(no_sep, '') FROM bridging_sep WHERE no_rawat = ?`, noRawat).Scan(&noSEP)

	// Upsert into mlite_vedika
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO mlite_vedika (tanggal, no_rkm_medis, no_rawat, tgl_registrasi, nosep, jenis, status, username)
		VALUES (CURDATE(), ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE status = ?, username = ?
	`, noRkmMedis, noRawat, tglRegistrasi, noSEP, jenis, string(status), username, string(status), username)
	if err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}

	// Add feedback if catatan provided
	if strings.TrimSpace(catatan) != "" {
		_, err = r.db.ExecContext(ctx, `
			INSERT INTO mlite_vedika_feedback (nosep, tanggal, catatan, username)
			VALUES (?, CURDATE(), ?, ?)
		`, noSEP, catatan, username)
		if err != nil {
			// Non-fatal, just log
			fmt.Printf("failed to add feedback: %v\n", err)
		}
	}

	return nil
}

// GetEpisodeType returns the episode type (Ralan or Ranap) from reg_periksa.
func (r *MySQLIndexRepository) GetEpisodeType(ctx context.Context, noRawat string) (string, error) {
	var statusLanjut string
	err := r.db.QueryRowContext(ctx, "SELECT status_lanjut FROM reg_periksa WHERE no_rawat = ?", noRawat).Scan(&statusLanjut)
	if err != nil {
		return "", fmt.Errorf("failed to get episode type: %w", err)
	}
	return statusLanjut, nil
}

// GetDiagnoses returns diagnoses for an episode.
func (r *MySQLIndexRepository) GetDiagnoses(ctx context.Context, noRawat string) ([]entity.DiagnosisItem, error) {
	noRawat = strings.TrimPrefix(noRawat, "/")
	rows, err := r.db.QueryContext(ctx, `
		SELECT dp.kd_penyakit, py.nm_penyakit, dp.status, dp.prioritas
		FROM diagnosa_pasien dp
		INNER JOIN penyakit py ON dp.kd_penyakit = py.kd_penyakit
		WHERE dp.no_rawat = ?
		ORDER BY dp.prioritas
	`, noRawat)
	if err != nil {
		return nil, fmt.Errorf("failed to get diagnoses: %w", err)
	}
	defer rows.Close()

	var diagnoses []entity.DiagnosisItem
	for rows.Next() {
		var d entity.DiagnosisItem
		var rawStatus string
		if err := rows.Scan(&d.KodePenyakit, &d.NamaPenyakit, &rawStatus, &d.Prioritas); err != nil {
			return nil, fmt.Errorf("failed to scan diagnosis: %w", err)
		}

		// Map priority to StatusDx for frontend (Utama/Sekunder)
		if d.Prioritas == 1 {
			d.StatusDx = "Utama"
		} else {
			d.StatusDx = "Sekunder"
		}

		diagnoses = append(diagnoses, d)
	}

	if diagnoses == nil {
		diagnoses = []entity.DiagnosisItem{}
	}

	return diagnoses, nil
}

// GetProcedures returns procedures for an episode.
func (r *MySQLIndexRepository) GetProcedures(ctx context.Context, noRawat string) ([]entity.ProcedureItem, error) {
	noRawat = strings.TrimPrefix(noRawat, "/")
	rows, err := r.db.QueryContext(ctx, `
		SELECT pp.kode, i.deskripsi_panjang, pp.prioritas
		FROM prosedur_pasien pp
		INNER JOIN icd9 i ON pp.kode = i.kode
		WHERE pp.no_rawat = ?
		ORDER BY pp.prioritas
	`, noRawat)
	if err != nil {
		return nil, fmt.Errorf("failed to get procedures: %w", err)
	}
	defer rows.Close()

	var procedures []entity.ProcedureItem
	for rows.Next() {
		var p entity.ProcedureItem
		if err := rows.Scan(&p.Kode, &p.Nama, &p.Prioritas); err != nil {
			return nil, fmt.Errorf("failed to scan procedure: %w", err)
		}
		procedures = append(procedures, p)
	}

	if procedures == nil {
		procedures = []entity.ProcedureItem{}
	}

	return procedures, nil
}

// AddDiagnosis adds or updates a diagnosis.
func (r *MySQLIndexRepository) AddDiagnosis(ctx context.Context, noRawat string, req entity.DiagnosisUpdateRequest) error {
	statusLanjut, err := r.GetEpisodeType(ctx, noRawat)
	if err != nil {
		return fmt.Errorf("failed to get episode type: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO diagnosa_pasien (no_rawat, kd_penyakit, status, prioritas, status_penyakit)
		VALUES (?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE status = ?, prioritas = ?
	`, noRawat, req.KodePenyakit, statusLanjut, req.Prioritas, "Lama", statusLanjut, req.Prioritas)
	if err != nil {
		return fmt.Errorf("failed to add diagnosis: %w", err)
	}

	return nil
}

// SyncDiagnoses deletes existing diagnoses and inserts new ones in a transaction.
func (r *MySQLIndexRepository) SyncDiagnoses(ctx context.Context, noRawat string, diagnoses []entity.DiagnosisUpdateRequest, statusLanjut string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Delete existing ones
	_, err = tx.ExecContext(ctx, "DELETE FROM diagnosa_pasien WHERE no_rawat = ?", noRawat)
	if err != nil {
		return fmt.Errorf("failed to delete existing diagnoses: %w", err)
	}

	// 2. Insert new ones
	for _, d := range diagnoses {
		statusDx := d.StatusDx
		if statusDx == "" {
			statusDx = "Sekunder"
		}

		// Map status to Ralan/Ranap based on episode
		// SIMRS Legacy uses 'status' column for Ralan/Ranap
		// and 'prioritas' column (1 for Utama, >1 for Sekunder)
		// and 'status_penyakit' column (usually 'Lama')

		_, err = tx.ExecContext(ctx, `
			INSERT INTO diagnosa_pasien (no_rawat, kd_penyakit, status, prioritas, status_penyakit)
			VALUES (?, ?, ?, ?, ?)
		`, noRawat, d.KodePenyakit, statusLanjut, d.Prioritas, "Lama")
		if err != nil {
			return fmt.Errorf("failed to insert diagnosis %s: %w", d.KodePenyakit, err)
		}
	}

	return tx.Commit()
}

// SearchICD10 searches for ICD-10 entries by code or name.
func (r *MySQLIndexRepository) SearchICD10(ctx context.Context, query string) ([]entity.ICD10Item, error) {
	searchPattern := "%" + query + "%"
	rows, err := r.db.QueryContext(ctx, `
		SELECT kd_penyakit, nm_penyakit 
		FROM penyakit 
		WHERE kd_penyakit LIKE ? OR nm_penyakit LIKE ?
		LIMIT 20
	`, searchPattern, searchPattern)
	if err != nil {
		return nil, fmt.Errorf("failed to search ICD-10: %w", err)
	}
	defer rows.Close()

	var results []entity.ICD10Item
	for rows.Next() {
		var item entity.ICD10Item
		if err := rows.Scan(&item.Kode, &item.Nama); err != nil {
			return nil, fmt.Errorf("failed to scan ICD-10 result: %w", err)
		}
		results = append(results, item)
	}

	if results == nil {
		results = []entity.ICD10Item{}
	}

	return results, nil
}

// AddProcedure adds or updates a procedure.
func (r *MySQLIndexRepository) AddProcedure(ctx context.Context, noRawat string, req entity.ProcedureUpdateRequest) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO prosedur_pasien (no_rawat, kode, prioritas)
		VALUES (?, ?, ?)
		ON DUPLICATE KEY UPDATE prioritas = ?
	`, noRawat, req.Kode, req.Prioritas, req.Prioritas)
	if err != nil {
		return fmt.Errorf("failed to add procedure: %w", err)
	}

	return nil
}

// SyncProcedures deletes existing procedures and inserts new ones in a transaction.
func (r *MySQLIndexRepository) SyncProcedures(ctx context.Context, noRawat string, procedures []entity.ProcedureUpdateRequest) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Delete existing ones
	_, err = tx.ExecContext(ctx, "DELETE FROM prosedur_pasien WHERE no_rawat = ?", noRawat)
	if err != nil {
		return fmt.Errorf("failed to delete existing procedures: %w", err)
	}

	// 2. Insert new ones
	statusLanjut, _ := r.GetEpisodeType(ctx, noRawat)
	for _, p := range procedures {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO prosedur_pasien (no_rawat, kode, status, prioritas)
			VALUES (?, ?, ?, ?)
		`, noRawat, p.Kode, statusLanjut, p.Prioritas)
		if err != nil {
			return fmt.Errorf("failed to insert procedure %s: %w", p.Kode, err)
		}
	}

	return tx.Commit()
}

// SearchICD9 searches for ICD-9-CM entries by code or description.
func (r *MySQLIndexRepository) SearchICD9(ctx context.Context, query string) ([]entity.ICD9Item, error) {
	searchPattern := "%" + query + "%"
	rows, err := r.db.QueryContext(ctx, `
		SELECT kode, deskripsi_panjang 
		FROM icd9 
		WHERE kode LIKE ? OR deskripsi_pendek LIKE ? OR deskripsi_panjang LIKE ?
		LIMIT 20
	`, searchPattern, searchPattern, searchPattern)
	if err != nil {
		return nil, fmt.Errorf("failed to search ICD-9: %w", err)
	}
	defer rows.Close()

	var results []entity.ICD9Item
	for rows.Next() {
		var item entity.ICD9Item
		if err := rows.Scan(&item.Kode, &item.Nama); err != nil {
			return nil, fmt.Errorf("failed to scan ICD-9 result: %w", err)
		}
		results = append(results, item)
	}

	if results == nil {
		results = []entity.ICD9Item{}
	}

	return results, nil
}

// GetDocuments returns uploaded documents for an episode.
func (r *MySQLIndexRepository) GetDocuments(ctx context.Context, noRawat string) ([]entity.DocumentItem, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT 
			bdp.kode as id,
			COALESCE(mbd.nama, bdp.kode) as nama,
			COALESCE(mbd.nama, bdp.kode) as kategori,
			bdp.lokasi_file as file_path
		FROM berkas_digital_perawatan bdp
		LEFT JOIN master_berkas_digital mbd ON bdp.kode = mbd.kode
		WHERE bdp.no_rawat = ?
	`, noRawat)
	if err != nil {
		return nil, fmt.Errorf("failed to get documents: %w", err)
	}
	defer rows.Close()

	var docs []entity.DocumentItem
	for rows.Next() {
		var d entity.DocumentItem
		if err := rows.Scan(&d.ID, &d.Nama, &d.Kategori, &d.FilePath); err != nil {
			return nil, fmt.Errorf("failed to scan document: %w", err)
		}
		docs = append(docs, d)
	}

	if docs == nil {
		docs = []entity.DocumentItem{}
	}

	return docs, nil
}

// GetResume returns medical resume for an episode.
func (r *MySQLIndexRepository) GetResume(ctx context.Context, noRawat string) (*entity.MedicalResume, error) {
	// First check if Ranap or Ralan
	var statusLanjut string
	if err := r.db.QueryRowContext(ctx, `SELECT status_lanjut FROM reg_periksa WHERE no_rawat = ?`, noRawat).Scan(&statusLanjut); err != nil {
		return nil, fmt.Errorf("episode not found: %w", err)
	}

	resume := &entity.MedicalResume{
		NoRawat: noRawat,
	}

	if statusLanjut == "Ranap" {
		resume.Jenis = "ranap"
		// Query resume_pasien_ranap
		err := r.db.QueryRowContext(ctx, `
			SELECT 
				COALESCE(keluhan_utama, ''),
				COALESCE(pemeriksaan_fisik, ''),
				COALESCE(diagnosa_utama, ''),
				COALESCE(obat_pulang, ''),
				COALESCE(diet, ''),
				COALESCE(kd_dokter, '')
			FROM resume_pasien_ranap
			WHERE no_rawat = ?
		`, noRawat).Scan(
			&resume.KeluhanUtama,
			&resume.PemeriksaanFisik,
			&resume.DiagnosaAkhir,
			&resume.Terapi,
			&resume.Anjuran,
			&resume.DokterPJ,
		)
		if err != nil && err != sql.ErrNoRows {
			return nil, fmt.Errorf("failed to get ranap resume: %w", err)
		}
	} else {
		resume.Jenis = "ralan"
		// Query resume_pasien
		err := r.db.QueryRowContext(ctx, `
			SELECT 
				COALESCE(keluhan_utama, ''),
				COALESCE(pemeriksaan_penunjang, ''),
				COALESCE(diagnosa_utama, ''),
				COALESCE(obat_pulang, ''),
				COALESCE(jalannya_penyakit, ''),
				COALESCE(kd_dokter, '')
			FROM resume_pasien
			WHERE no_rawat = ?
		`, noRawat).Scan(
			&resume.KeluhanUtama,
			&resume.PemeriksaanFisik,
			&resume.DiagnosaAkhir,
			&resume.Terapi,
			&resume.Anjuran,
			&resume.DokterPJ,
		)
		if err != nil && err != sql.ErrNoRows {
			return nil, fmt.Errorf("failed to get ralan resume: %w", err)
		}
	}

	return resume, nil
}

// UpdateResume updates medical resume for an episode.
func (r *MySQLIndexRepository) UpdateResume(ctx context.Context, noRawat string, resume *entity.MedicalResume) error {
	statusLanjut, err := r.GetEpisodeType(ctx, noRawat)
	if err != nil {
		return fmt.Errorf("failed to get episode type: %w", err)
	}

	if statusLanjut == "Ranap" {
		_, err = r.db.ExecContext(ctx, `
			INSERT INTO resume_pasien_ranap (
				no_rawat, kd_dokter, diagnosa_awal, alasan, keluhan_utama, pemeriksaan_fisik, 
				jalannya_penyakit, pemeriksaan_penunjang, hasil_laborat, tindakan_dan_operasi, 
				obat_di_rs, diagnosa_utama, kd_diagnosa_utama, diagnosa_sekunder, kd_diagnosa_sekunder,
				diagnosa_sekunder2, kd_diagnosa_sekunder2, diagnosa_sekunder3, kd_diagnosa_sekunder3,
				diagnosa_sekunder4, kd_diagnosa_sekunder4, prosedur_utama, kd_prosedur_utama,
				prosedur_sekunder, kd_prosedur_sekunder, prosedur_sekunder2, kd_prosedur_sekunder2,
				prosedur_sekunder3, kd_prosedur_sekunder3, alergi, diet, lab_belum, edukasi, 
				cara_keluar, keadaan, dilanjutkan, kontrol, obat_pulang
			)
			VALUES (
				?, ?, '-', '-', ?, ?, 
				'-', '-', '-', '-', 
				'-', ?, '-', '-', '-',
				'-', '-', '-', '-',
				'-', '-', '-', '-',
				'-', '-', '-', '-',
				'-', '-', '-', ?, '-', '-',
				'Atas Izin Dokter', 'Membaik', 'Kembali Ke RS', CURDATE(), ?
			)
			ON DUPLICATE KEY UPDATE kd_dokter = VALUES(kd_dokter), keluhan_utama = VALUES(keluhan_utama), 
			pemeriksaan_fisik = VALUES(pemeriksaan_fisik), diagnosa_utama = VALUES(diagnosa_utama), 
			obat_pulang = VALUES(obat_pulang), diet = VALUES(diet)
		`, noRawat, resume.DokterPJ, resume.KeluhanUtama, resume.PemeriksaanFisik, resume.DiagnosaAkhir, resume.Anjuran, resume.Terapi)
	} else {
		// Update resume_pasien
		_, err = r.db.ExecContext(ctx, `
			INSERT INTO resume_pasien (
				no_rawat, kd_dokter, keluhan_utama, jalannya_penyakit, pemeriksaan_penunjang, 
				hasil_laborat, diagnosa_utama, kd_diagnosa_utama, diagnosa_sekunder, kd_diagnosa_sekunder,
				diagnosa_sekunder2, kd_diagnosa_sekunder2, diagnosa_sekunder3, kd_diagnosa_sekunder3,
				diagnosa_sekunder4, kd_diagnosa_sekunder4, prosedur_utama, kd_prosedur_utama,
				prosedur_sekunder, kd_prosedur_sekunder, prosedur_sekunder2, kd_prosedur_sekunder2,
				prosedur_sekunder3, kd_prosedur_sekunder3, kondisi_pulang, obat_pulang
			)
			VALUES (
				?, ?, ?, ?, ?, 
				'-', ?, '-', '-', '-',
				'-', '-', '-', '-',
				'-', '-', '-', '-',
				'-', '-', '-', '-',
				'-', '-', 'Hidup', ?
			)
			ON DUPLICATE KEY UPDATE kd_dokter = VALUES(kd_dokter), keluhan_utama = VALUES(keluhan_utama), 
			jalannya_penyakit = VALUES(jalannya_penyakit), pemeriksaan_penunjang = VALUES(pemeriksaan_penunjang), 
			diagnosa_utama = VALUES(diagnosa_utama), obat_pulang = VALUES(obat_pulang)
		`, noRawat, resume.DokterPJ, resume.KeluhanUtama, resume.Anjuran, resume.PemeriksaanFisik, resume.DiagnosaAkhir, resume.Terapi)
	}

	if err != nil {
		return fmt.Errorf("failed to update resume: %w", err)
	}

	return nil
}

// GetMasterDigitalDocs returns master data for digital documents.
func (r *MySQLIndexRepository) GetMasterDigitalDocs(ctx context.Context) ([]entity.ICD10Item, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT kode, nama FROM master_berkas_digital ORDER BY nama")
	if err != nil {
		return nil, fmt.Errorf("failed to get master digital docs: %w", err)
	}
	defer rows.Close()

	var results []entity.ICD10Item
	for rows.Next() {
		var item entity.ICD10Item
		if err := rows.Scan(&item.Kode, &item.Nama); err != nil {
			return nil, fmt.Errorf("failed to scan master digital doc: %w", err)
		}
		results = append(results, item)
	}
	return results, nil
}

// AddDigitalDocument adds a record to berkas_digital_perawatan.
func (r *MySQLIndexRepository) AddDigitalDocument(ctx context.Context, noRawat string, kode string, lokasiFile string) error {
	fmt.Printf("DEBUG: Adding document: noRawat=[%s], kode=[%s], lokasiFile=[%s]\n", noRawat, kode, lokasiFile)
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO berkas_digital_perawatan (no_rawat, kode, lokasi_file)
		VALUES (?, ?, ?)
		ON DUPLICATE KEY UPDATE lokasi_file = VALUES(lokasi_file)
	`, noRawat, kode, lokasiFile)
	if err != nil {
		fmt.Printf("DEBUG: Error adding document: %v\n", err)
		return fmt.Errorf("failed to add digital document: %w", err)
	}
	rows, _ := res.RowsAffected()
	fmt.Printf("DEBUG: Document added, rows affected: %d\n", rows)
	return nil
}

// DeleteDigitalDocument deletes a record from berkas_digital_perawatan.
func (r *MySQLIndexRepository) DeleteDigitalDocument(ctx context.Context, noRawat string, kode string, lokasiFile string) error {
	_, err := r.db.ExecContext(ctx, `
		DELETE FROM berkas_digital_perawatan 
		WHERE no_rawat = ? AND kode = ? AND lokasi_file = ?
	`, noRawat, kode, lokasiFile)
	if err != nil {
		return fmt.Errorf("failed to delete digital document: %w", err)
	}
	return nil
}
