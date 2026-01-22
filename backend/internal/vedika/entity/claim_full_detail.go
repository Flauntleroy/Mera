// Package entity contains domain models for the Vedika module.
package entity

import "time"

// =============================================================================
// SEP (Surat Eligibilitas Peserta) - Section 1
// =============================================================================

// SEPDetail contains complete SEP information from bridging_sep.
type SEPDetail struct {
	NoSEP          string `json:"no_sep"`
	TglSEP         string `json:"tgl_sep"`
	NoKartu        string `json:"no_kartu"`
	NoRM           string `json:"no_rm"`
	NamaPeserta    string `json:"nama_peserta"`
	Peserta        string `json:"peserta"` // Jenis peserta
	TglLahir       string `json:"tgl_lahir"`
	JenisKelamin   string `json:"jenis_kelamin"`
	JenisPelayanan string `json:"jenis_pelayanan"` // Rawat Jalan / Rawat Inap
	NoTelp         string `json:"no_telp"`
	KelasRawat     string `json:"kelas_rawat"`
	KelasHak       string `json:"kelas_hak"`
	PoliTujuan     string `json:"poli_tujuan"`
	DPJP           string `json:"dpjp"` // Nama dokter
	FaskesPerujuk  string `json:"faskes_perujuk"`
	DiagnosaAwal   string `json:"diagnosa_awal"`
	Catatan        string `json:"catatan"`
	TglRujukan     string `json:"tgl_rujukan"`
	MasaBerlaku    string `json:"masa_berlaku"`
	COB            string `json:"cob"`        // Coordination of Benefit
	PRBStatus      string `json:"prb_status"` // dari bpjs_prb
}

// =============================================================================
// Patient & Registration - Section 2
// =============================================================================

// PatientRegistration contains extended patient and registration data.
type PatientRegistration struct {
	// Patient Data
	NoRM             string `json:"no_rm"`
	NamaPasien       string `json:"nama_pasien"`
	Alamat           string `json:"alamat"`
	Umur             string `json:"umur"`
	JenisKelamin     string `json:"jenis_kelamin"`
	TempatLahir      string `json:"tempat_lahir"`
	TglLahir         string `json:"tgl_lahir"`
	IbuKandung       string `json:"ibu_kandung"`
	GolDarah         string `json:"gol_darah"`
	StatusNikah      string `json:"status_nikah"`
	Agama            string `json:"agama"`
	Pendidikan       string `json:"pendidikan"`
	TglPertamaDaftar string `json:"tgl_pertama_daftar"`
	Kecamatan        string `json:"kecamatan"`
	Kabupaten        string `json:"kabupaten"`

	// Registration Data
	NoRawat         string   `json:"no_rawat"`
	NoReg           string   `json:"no_reg"`
	TglRegistrasi   string   `json:"tgl_registrasi"`
	JamReg          string   `json:"jam_reg"`
	Unit            string   `json:"unit"`      // Poliklinik atau Bangsal
	Dokter          string   `json:"dokter"`    // Single for Ralan
	DPJPList        []string `json:"dpjp_list"` // Multiple for Ranap
	CaraBayar       string   `json:"cara_bayar"`
	PenanggungJawab string   `json:"penanggung_jawab"`
	AlamatPJ        string   `json:"alamat_pj"`
	HubunganPJ      string   `json:"hubungan_pj"`
	StatusLanjut    string   `json:"status_lanjut"` // Ralan / Ranap
}

// =============================================================================
// SOAP Examination - Section 2 (continued)
// =============================================================================

// SOAPExamination contains SOAP examination data from pemeriksaan_ralan/ranap.
type SOAPExamination struct {
	TglPerawatan string `json:"tgl_perawatan"`
	JamRawat     string `json:"jam_rawat"`
	SuhuTubuh    string `json:"suhu_tubuh"`
	Tensi        string `json:"tensi"`
	Nadi         string `json:"nadi"`
	Respirasi    string `json:"respirasi"`
	Tinggi       string `json:"tinggi"`
	Berat        string `json:"berat"`
	GCS          string `json:"gcs"` // E,V,M format
	Kesadaran    string `json:"kesadaran"`
	Keluhan      string `json:"keluhan"`     // Subjek
	Pemeriksaan  string `json:"pemeriksaan"` // Objek
	Penilaian    string `json:"penilaian"`   // Asesmen
	RTL          string `json:"rtl"`         // Plan
	Instruksi    string `json:"instruksi"`
	Evaluasi     string `json:"evaluasi"`
	Alergi       string `json:"alergi"`
}

// =============================================================================
// Medical Actions - Section 3
// =============================================================================

// MedicalAction represents a medical procedure/treatment.
type MedicalAction struct {
	Tanggal  string `json:"tanggal"`
	Jam      string `json:"jam"`
	Kode     string `json:"kode"`
	Nama     string `json:"nama"`
	Dokter   string `json:"dokter"`
	Petugas  string `json:"petugas"`
	Kategori string `json:"kategori"` // ralan_dr, ralan_pr, ralan_drpr, ranap_dr, ranap_pr, ranap_drpr
}

// =============================================================================
// Room Stay - Section 3 (continued)
// =============================================================================

// RoomStay contains room/ward stay information for inpatients.
type RoomStay struct {
	TglMasuk     string  `json:"tgl_masuk"`
	JamMasuk     string  `json:"jam_masuk"`
	TglKeluar    string  `json:"tgl_keluar"`
	JamKeluar    string  `json:"jam_keluar"`
	LamaInap     int     `json:"lama_inap"` // days
	Kamar        string  `json:"kamar"`
	Bangsal      string  `json:"bangsal"`
	Tarif        float64 `json:"tarif"`
	TotalBiaya   float64 `json:"total_biaya"`
	StatusPulang string  `json:"status_pulang"`
}

// =============================================================================
// Operation - Section 4
// =============================================================================

// OperationItem represents an operation/surgery.
type OperationItem struct {
	TglOperasi    string `json:"tgl_operasi"`
	KodePaket     string `json:"kode_paket"`
	NamaTindakan  string `json:"nama_tindakan"`
	JenisAnastesi string `json:"jenis_anastesi"`
	Status        string `json:"status"` // Ralan / Ranap
}

// OperationReport contains the operation report details.
type OperationReport struct {
	NoRawat            string `json:"no_rawat"`
	Tanggal            string `json:"tanggal"`
	SelesaiOperasi     string `json:"selesai_operasi"`
	DiagnosaPreop      string `json:"diagnosa_preop"`
	DiagnosaPostop     string `json:"diagnosa_postop"`
	JaringanDieksekusi string `json:"jaringan_dieksekusi"`
	PermintaanPA       string `json:"permintaan_pa"`
	LaporanOperasi     string `json:"laporan_operasi"`
	DokterOperator     string `json:"dokter_operator"`
}

// =============================================================================
// Radiology - Section 5
// =============================================================================

// RadiologyExam represents a radiology examination.
type RadiologyExam struct {
	TglPeriksa string  `json:"tgl_periksa"`
	Jam        string  `json:"jam"`
	Kode       string  `json:"kode"`
	Nama       string  `json:"nama"`
	Dokter     string  `json:"dokter"`
	Petugas    string  `json:"petugas"`
	Biaya      float64 `json:"biaya"`
}

// RadiologyResult contains radiology interpretation results.
type RadiologyResult struct {
	TglPeriksa string   `json:"tgl_periksa"`
	Jam        string   `json:"jam"`
	Hasil      string   `json:"hasil"`
	Klinis     string   `json:"klinis"`
	Judul      string   `json:"judul"`
	Kesan      string   `json:"kesan"`
	Saran      string   `json:"saran"`
	Gambar     []string `json:"gambar"` // File paths
}

// RadiologyFullData combines exam and results.
type RadiologyFullData struct {
	Exams   []RadiologyExam   `json:"exams"`
	Results []RadiologyResult `json:"results"`
}

// =============================================================================
// Laboratory - Section 6
// =============================================================================

// LabDetail represents a single lab parameter result.
type LabDetail struct {
	Pemeriksaan  string `json:"pemeriksaan"`
	Nilai        string `json:"nilai"`
	Satuan       string `json:"satuan"`
	NilaiRujukan string `json:"nilai_rujukan"`
	Keterangan   string `json:"keterangan"`
}

// LabExam represents a lab examination with its details.
type LabExam struct {
	TglPeriksa   string      `json:"tgl_periksa"`
	Jam          string      `json:"jam"`
	Kode         string      `json:"kode"`
	NamaTindakan string      `json:"nama_tindakan"`
	Dokter       string      `json:"dokter"`
	Biaya        float64     `json:"biaya"`
	Details      []LabDetail `json:"details"`
}

// =============================================================================
// Medicine / Pharmacy - Section 7
// =============================================================================

// MedicineItem represents medicine given to patient.
type MedicineItem struct {
	TglPerawatan string  `json:"tgl_perawatan"`
	Jam          string  `json:"jam"`
	KodeBrng     string  `json:"kode_brng"`
	NamaObat     string  `json:"nama_obat"`
	Jumlah       float64 `json:"jumlah"`
	Satuan       string  `json:"satuan"`
	Dosis        string  `json:"dosis"`
	Biaya        float64 `json:"biaya"`
	Kategori     string  `json:"kategori"` // pemberian, operasi, resep_pulang
}

// =============================================================================
// Medical Resume - Section 8
// =============================================================================

// MedicalResumeRalan contains outpatient resume data.
type MedicalResumeRalan struct {
	NoRawat           string `json:"no_rawat"`
	KdDokter          string `json:"kd_dokter"`
	NamaDokter        string `json:"nama_dokter"`
	DiagnosaUtama     string `json:"diagnosa_utama"`
	DiagnosaSekunder1 string `json:"diagnosa_sekunder1"`
	DiagnosaSekunder2 string `json:"diagnosa_sekunder2"`
	DiagnosaSekunder3 string `json:"diagnosa_sekunder3"`
	DiagnosaSekunder4 string `json:"diagnosa_sekunder4"`
	ProsedurUtama     string `json:"prosedur_utama"`
	ProsedurSekunder1 string `json:"prosedur_sekunder1"`
	ProsedurSekunder2 string `json:"prosedur_sekunder2"`
	ProsedurSekunder3 string `json:"prosedur_sekunder3"`
	KeluhanUtama      string `json:"keluhan_utama"`
	Pemeriksaan       string `json:"pemeriksaan"`
	Tensi             string `json:"tensi"`
	Respirasi         string `json:"respirasi"`
	Nadi              string `json:"nadi"`
	DirawatInapkan    string `json:"dirawat_inapkan"`    // Ya/Tidak
	KunjunganAwal     string `json:"kunjungan_awal"`     // Ya/Tidak
	KunjunganLanjutan string `json:"kunjungan_lanjutan"` // Ya/Tidak
	Observasi         string `json:"observasi"`
	PostOperasi       string `json:"post_operasi"`
}

// MedicalResumeRanap contains inpatient resume data.
type MedicalResumeRanap struct {
	NoRawat              string `json:"no_rawat"`
	KdDokter             string `json:"kd_dokter"`
	NamaDokter           string `json:"nama_dokter"`
	DiagnosaAwal         string `json:"diagnosa_awal"`
	KeluhanUtama         string `json:"keluhan_utama"`
	JalannyaPenyakit     string `json:"jalannya_penyakit"`
	PemeriksaanFisik     string `json:"pemeriksaan_fisik"`
	PemeriksaanPenunjang string `json:"pemeriksaan_penunjang"`
	HasilLaborat         string `json:"hasil_laborat"`
	DiagnosaUtama        string `json:"diagnosa_utama"`
	DiagnosaSekunder1    string `json:"diagnosa_sekunder1"`
	DiagnosaSekunder2    string `json:"diagnosa_sekunder2"`
	DiagnosaSekunder3    string `json:"diagnosa_sekunder3"`
	DiagnosaSekunder4    string `json:"diagnosa_sekunder4"`
	ProsedurUtama        string `json:"prosedur_utama"`
	ProsedurSekunder1    string `json:"prosedur_sekunder1"`
	ProsedurSekunder2    string `json:"prosedur_sekunder2"`
	ProsedurSekunder3    string `json:"prosedur_sekunder3"`
	ObatPulang           string `json:"obat_pulang"`
	KondisiPulang        string `json:"kondisi_pulang"`
}

// =============================================================================
// Billing - Section 9
// =============================================================================

// BillingItem represents a single billing line item.
type BillingItem struct {
	No            int     `json:"no"`
	NamaPerawatan string  `json:"nama_perawatan"`
	Pemisah       string  `json:"pemisah"`
	Biaya         float64 `json:"biaya"`
	Jumlah        int     `json:"jumlah"`
	Tambahan      float64 `json:"tambahan"`
	TotalBiaya    float64 `json:"total_biaya"`
}

// BillingCategory represents a billing category (e.g., Obat, Jasa Dokter).
type BillingCategory struct {
	Kategori string        `json:"kategori"`
	Items    []BillingItem `json:"items"`
	Subtotal float64       `json:"subtotal"`
}

// BillingSummary contains complete billing data.
type BillingSummary struct {
	Mode        string            `json:"mode"` // legacy or mlite
	Categories  []BillingCategory `json:"categories"`
	JumlahTotal float64           `json:"jumlah_total"`
	Potongan    float64           `json:"potongan"`
	JumlahBayar float64           `json:"jumlah_bayar"`
	Terbilang   string            `json:"terbilang"`
}

// =============================================================================
// SPRI (Surat Perintah Rawat Inap) - Section 10
// =============================================================================

// SPRIDetail contains SPRI data from bridging_surat_pri_bpjs.
type SPRIDetail struct {
	NoSurat      string `json:"no_surat"`
	TglSurat     string `json:"tgl_surat"`
	NoKartu      string `json:"no_kartu"`
	NamaPasien   string `json:"nama_pasien"`
	JenisKelamin string `json:"jenis_kelamin"`
	TglLahir     string `json:"tgl_lahir"`
	DiagnosaAwal string `json:"diagnosa_awal"`
	TglRencana   string `json:"tgl_rencana"`
	NamaDokter   string `json:"nama_dokter"`
	NamaPoli     string `json:"nama_poli"`
}

// =============================================================================
// Digital Documents - Section 11-13
// =============================================================================

// DigitalDocument represents an uploaded document.
type DigitalDocument struct {
	ID         string    `json:"id"`
	NoRawat    string    `json:"no_rawat"`
	Kode       string    `json:"kode"`
	Kategori   string    `json:"kategori"`
	LokasiFile string    `json:"lokasi_file"`
	UploadedAt time.Time `json:"uploaded_at"`
	FileURL    string    `json:"file_url"` // Full URL for frontend
}

// =============================================================================
// MAIN COMPREHENSIVE STRUCT
// =============================================================================

// ClaimFullDetail contains all sections for the complete claim view.
type ClaimFullDetail struct {
	// Section 1: SEP
	SEP *SEPDetail `json:"sep"`

	// Section 2: Patient & Registration
	Patient PatientRegistration `json:"patient"`

	// Section 2-continued: Diagnoses (from existing entity)
	Diagnoses []DiagnosisItem `json:"diagnoses"`

	// Section 2-continued: Procedures (from existing entity)
	Procedures []ProcedureItem `json:"procedures"`

	// Section 2-continued: SOAP Examinations
	SOAPExams []SOAPExamination `json:"soap_exams"`

	// Section 3: Medical Actions
	Actions []MedicalAction `json:"actions"`

	// Section 3-continued: Room Stays (for Ranap)
	RoomStays []RoomStay `json:"room_stays"`

	// Section 4: Operations
	Operations []OperationItem   `json:"operations"`
	OpReports  []OperationReport `json:"op_reports"`

	// Section 5: Radiology
	Radiology RadiologyFullData `json:"radiology"`

	// Section 6: Laboratory
	LabExams []LabExam `json:"lab_exams"`

	// Section 7: Medicine / Pharmacy
	Medicines []MedicineItem `json:"medicines"`

	// Section 8: Medical Resume
	ResumeRalan *MedicalResumeRalan `json:"resume_ralan"`
	ResumeRanap *MedicalResumeRanap `json:"resume_ranap"`

	// Section 9: Billing
	Billing *BillingSummary `json:"billing"`

	// Section 10: SPRI
	SPRI *SPRIDetail `json:"spri"`

	// Section 11-13: Digital Documents
	Documents []DigitalDocument `json:"documents"`

	// Meta
	StatusLanjut string      `json:"status_lanjut"` // Ralan / Ranap
	ClaimStatus  ClaimStatus `json:"claim_status"`
}
