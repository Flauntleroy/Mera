// Package entity contains domain models for the Vedika module.
package entity

import "time"

// JenisPelayanan represents the type of service (Ralan/Ranap).
type JenisPelayanan string

const (
	JenisRalan JenisPelayanan = "ralan"
	JenisRanap JenisPelayanan = "ranap"
)

// ToDBValue converts JenisPelayanan to database value.
func (j JenisPelayanan) ToDBValue() string {
	switch j {
	case JenisRalan:
		return "2"
	case JenisRanap:
		return "1"
	default:
		return "2"
	}
}

// ClaimStatus represents the status of a claim.
// Status constants for Index workbench (domain-driven, not free text).
type ClaimStatus string

const (
	StatusRencana   ClaimStatus = "RENCANA"   // Episode eligible but NOT in mlite_vedika
	StatusPengajuan ClaimStatus = "PENGAJUAN" // Episode recorded in mlite_vedika
	StatusPerbaikan ClaimStatus = "PERBAIKAN" // Claim returned for correction
	StatusLengkap   ClaimStatus = "LENGKAP"   // Claim completed and ready
	StatusSetuju    ClaimStatus = "SETUJU"    // Claim approved
)

// IsValid checks if the status is a known valid status.
func (s ClaimStatus) IsValid() bool {
	switch s {
	case StatusRencana, StatusPengajuan, StatusPerbaikan, StatusLengkap, StatusSetuju:
		return true
	default:
		return false
	}
}

// DashboardSummary contains summary card data for the dashboard.
type DashboardSummary struct {
	Period    string         `json:"period"`
	Rencana   ClaimCount     `json:"rencana"`
	Pengajuan ClaimCount     `json:"pengajuan"`
	Maturasi  MaturasiPersen `json:"maturasi"`
}

// ClaimCount holds counts split by Ralan and Ranap.
type ClaimCount struct {
	Ralan int `json:"ralan"`
	Ranap int `json:"ranap"`
}

// MaturasiPersen holds maturasi percentages.
type MaturasiPersen struct {
	Ralan float64 `json:"ralan"`
	Ranap float64 `json:"ranap"`
}

// DashboardTrendItem represents daily aggregation data.
type DashboardTrendItem struct {
	Date      string     `json:"date"`
	Rencana   ClaimCount `json:"rencana"`
	Pengajuan ClaimCount `json:"pengajuan"`
}

// ClaimEpisode represents a single episode for the index list.
type ClaimEpisode struct {
	// Patient Info
	NoRawat      string `json:"no_rawat"`
	NoRkmMedis   string `json:"no_rm"`
	NamaPasien   string `json:"nama_pasien"`
	Umur         string `json:"umur,omitempty"`
	JenisKelamin string `json:"jenis_kelamin,omitempty"`
	Alamat       string `json:"alamat,omitempty"`

	// Service Info
	Jenis        string `json:"jenis"` // ralan or ranap
	TglPelayanan string `json:"tgl_pelayanan"`
	Unit         string `json:"unit"`
	Dokter       string `json:"dokter"`
	CaraBayar    string `json:"cara_bayar"`

	// Claim Status
	Status ClaimStatus `json:"status"`
}

// IndexFilter contains filter parameters for Index workbench.
// Uses explicit date range, NOT active_period.
type IndexFilter struct {
	DateFrom string         `json:"date_from"` // Required, YYYY-MM-DD
	DateTo   string         `json:"date_to"`   // Required, YYYY-MM-DD
	Status   ClaimStatus    `json:"status"`    // Required
	Jenis    JenisPelayanan `json:"jenis"`     // Optional, ralan or ranap
	Search   string         `json:"search"`    // Optional
	Page     int            `json:"page"`
	Limit    int            `json:"limit"`
}

// ClaimDetail contains full claim context for detail view.
type ClaimDetail struct {
	// Basic Info
	NoRawat      string `json:"no_rawat"`
	NoRkmMedis   string `json:"no_rm"`
	NamaPasien   string `json:"nama_pasien"`
	Umur         string `json:"umur"`
	JenisKelamin string `json:"jenis_kelamin"`
	Alamat       string `json:"alamat"`

	// Service Info
	Jenis         string     `json:"jenis"`
	TglRegistrasi time.Time  `json:"tgl_registrasi"`
	TglKeluar     *time.Time `json:"tgl_keluar,omitempty"`
	Unit          string     `json:"unit"`
	Dokter        string     `json:"dokter"`
	CaraBayar     string     `json:"cara_bayar"`

	// SEP Info
	NoSEP   string `json:"no_sep,omitempty"`
	NoKartu string `json:"no_kartu,omitempty"`

	// Medical Data
	Diagnoses  []DiagnosisItem `json:"diagnoses"`
	Procedures []ProcedureItem `json:"procedures"`
	Documents  []DocumentItem  `json:"documents"`

	// Status
	Status ClaimStatus `json:"status"`
}

// ICD10Item represents a master ICD-10 entry.
type ICD10Item struct {
	Kode string `json:"kode"`
	Nama string `json:"nama"`
}

// ICD9Item represents a master ICD-9-CM entry.
type ICD9Item struct {
	Kode string `json:"kode"`
	Nama string `json:"nama"`
}

// DiagnosisItem represents a single diagnosis entry.
type DiagnosisItem struct {
	KodePenyakit string `json:"kode_penyakit"`
	NamaPenyakit string `json:"nama_penyakit"`
	StatusDx     string `json:"status_dx"` // Utama / Sekunder
	Prioritas    int    `json:"prioritas"`
}

// ProcedureItem represents a single procedure entry.
type ProcedureItem struct {
	Kode      string `json:"kode"`
	Nama      string `json:"nama"`
	Prioritas int    `json:"prioritas"`
}

// DocumentItem represents uploaded document metadata.
type DocumentItem struct {
	ID       string    `json:"id"`
	Nama     string    `json:"nama"`
	Kategori string    `json:"kategori"`
	FilePath string    `json:"file_path"`
	UploadAt time.Time `json:"upload_at"`
	UploadBy string    `json:"upload_by"`
}

// MedicalResume contains medical resume data.
type MedicalResume struct {
	NoRawat          string `json:"no_rawat"`
	Jenis            string `json:"jenis"`
	KeluhanUtama     string `json:"keluhan_utama"`
	PemeriksaanFisik string `json:"pemeriksaan_fisik"`
	DiagnosaAkhir    string `json:"diagnosa_akhir"`
	Terapi           string `json:"terapi"`
	Anjuran          string `json:"anjuran"`
	DokterPJ         string `json:"dokter_pj"`
}

// StatusUpdateRequest represents request to update claim status.
type StatusUpdateRequest struct {
	Status  ClaimStatus `json:"status" binding:"required"`
	Catatan string      `json:"catatan"`
}

// BatchStatusUpdateRequest represents request to batch update claim statuses.
type BatchStatusUpdateRequest struct {
	NoRawatList []string    `json:"no_rawat_list" binding:"required,min=1"`
	Status      ClaimStatus `json:"status" binding:"required"`
	Catatan     string      `json:"catatan"`
}

// BatchUpdateResult contains result of batch update operation.
type BatchUpdateResult struct {
	Updated int `json:"updated"`
	Failed  int `json:"failed"`
}

// DiagnosisUpdateRequest represents request to update diagnosis.
type DiagnosisUpdateRequest struct {
	KodePenyakit string `json:"kode_penyakit" binding:"required"`
	StatusDx     string `json:"status_dx"` // Utama / Sekunder
	Prioritas    int    `json:"prioritas"`
}

// DiagnosisSyncRequest represents bulk update of diagnoses.
type DiagnosisSyncRequest struct {
	Diagnoses []DiagnosisUpdateRequest `json:"diagnoses" binding:"required,min=1"`
}

// ProcedureUpdateRequest represents request to update procedure.
type ProcedureUpdateRequest struct {
	Kode      string `json:"kode" binding:"required"`
	Prioritas int    `json:"prioritas"`
}

// ProcedureSyncRequest represents bulk update of procedures.
type ProcedureSyncRequest struct {
	Procedures []ProcedureUpdateRequest `json:"procedures" binding:"required,min=1"`
}

// PaginatedResult wraps paginated list results.
type PaginatedResult[T any] struct {
	Data       []T   `json:"data"`
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalPages int   `json:"total_pages"`
}

// VedikaSetting represents a setting from mera_settings.
type VedikaSetting struct {
	Module       string `json:"module"`
	SettingKey   string `json:"setting_key"`
	SettingValue string `json:"setting_value"`
	ValueType    string `json:"value_type"`
	IsActive     bool   `json:"is_active"`
}

// Legacy ClaimFilter for dashboard (kept for backward compatibility).
type ClaimFilter struct {
	Jenis     JenisPelayanan `json:"jenis"`
	StartDate *time.Time     `json:"start_date"`
	EndDate   *time.Time     `json:"end_date"`
	Status    *ClaimStatus   `json:"status"`
	Search    string         `json:"search"`
	Page      int            `json:"page"`
	Limit     int            `json:"limit"`
}
