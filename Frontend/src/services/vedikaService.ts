// Vedika Service - API client for Vedika (Verifikasi Digital Klaim BPJS)
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import { apiRequest, ApiError } from './authService';

// =============================================================================
// TYPES
// =============================================================================

// Dashboard Types
export interface ClaimCount {
    ralan: number;
    ranap: number;
}

export interface MaturasiPersen {
    ralan: number;
    ranap: number;
}

export interface DashboardSummary {
    period: string;
    rencana: ClaimCount;
    pengajuan: ClaimCount;
    lengkap: ClaimCount;
    perbaikan: ClaimCount;
    maturasi: MaturasiPersen;
}

export interface DashboardResponse {
    success: boolean;
    data: {
        period: string;
        summary: DashboardSummary;
    };
}

export interface TrendItem {
    date: string;
    rencana: ClaimCount;
    pengajuan: ClaimCount;
    lengkap: ClaimCount;
    perbaikan: ClaimCount;
}

export interface TrendResponse {
    success: boolean;
    data: {
        trend: TrendItem[];
    };
}

// Index Types
export type ClaimStatus = 'RENCANA' | 'PENGAJUAN' | 'PERBAIKAN' | 'LENGKAP' | 'SETUJU';
export type JenisLayanan = 'ralan' | 'ranap';

export interface IndexEpisode {
    no_rawat: string;
    no_rm: string;
    nama_pasien: string;
    jenis: JenisLayanan;
    tgl_pelayanan: string;
    unit: string;
    dokter: string;
    cara_bayar: string;
    status: ClaimStatus;
}

export interface IndexFilter {
    date_from: string;
    date_to: string;
    status: ClaimStatus;
    jenis?: JenisLayanan;
    page?: number;
    limit?: number;
    search?: string;
}

export interface IndexListResponse {
    success: boolean;
    data: {
        filter: {
            date_from: string;
            date_to: string;
            status: ClaimStatus;
            jenis: JenisLayanan;
        };
        pagination: {
            page: number;
            limit: number;
            total: number;
        };
        items: IndexEpisode[];
    };
}

// =============================================================================
// COMPREHENSIVE CLAIM DETAIL TYPES (14 SECTIONS)
// =============================================================================

export interface DiagnosisItem {
    kode_penyakit: string;
    nama_penyakit: string;
    status_dx: string; // Utama / Sekunder
    prioritas: number;
}

export interface ProcedureItem {
    kode: string;
    nama: string;
    status_px?: string; // Utama / Sekunder
    prioritas: number;
}

export interface DocumentItem {
    id: string;
    nama: string;
    kategori: string;
    file_path: string;
    upload_at: string;
    upload_by: string;
}

export interface ClaimDetail {
    no_rawat: string;
    no_rm: string;
    nama_pasien: string;
    umur: string;
    jenis_kelamin: 'L' | 'P';
    alamat: string;
    jenis: JenisLayanan;
    tgl_registrasi: string;
    tgl_keluar: string | null;
    unit: string;
    dokter: string;
    cara_bayar: string;
    no_sep: string;
    no_kartu: string;
    diagnoses: DiagnosisItem[];
    procedures: ProcedureItem[];
    documents: DocumentItem[];
    status: ClaimStatus;
    legacy_webapp_url?: string;
}

export interface ClaimDetailResponse {
    success: boolean;
    data: ClaimDetail;
}

export interface SEPDetail {
    no_sep: string;
    tgl_sep: string;
    no_kartu: string;
    no_rm: string;
    nama_peserta: string;
    peserta: string;
    tgl_lahir: string;
    jenis_kelamin: string;
    jenis_pelayanan: string;
    no_telp: string;
    kelas_rawat: string;
    kelas_hak: string;
    poli_tujuan: string;
    dpjp: string;
    faskes_perujuk: string;
    diagnosa_awal: string;
    catatan: string;
    tgl_rujukan: string;
    cob: string;
    prb_status: string;
    penjamin?: string;
    batas_rujukan?: string;
}

// Section 2: Patient & Registration
export interface PatientRegistration {
    no_rm: string;
    nama_pasien: string;
    alamat: string;
    umur: string;
    jenis_kelamin: string;
    tempat_lahir: string;
    tgl_lahir: string;
    ibu_kandung: string;
    gol_darah: string;
    status_nikah: string;
    agama: string;
    pendidikan: string;
    tgl_pertama_daftar: string;
    kecamatan: string;
    kabupaten: string;
    no_rawat: string;
    no_reg: string;
    tgl_registrasi: string;
    jam_reg: string;
    unit: string;
    kd_dokter: string;
    dokter: string;
    dpjp_list: string[];
    cara_bayar: string;
    penanggung_jawab: string;
    alamat_pj: string;
    hubungan_pj: string;
    status_lanjut: string;
}

// Section 2-continued: SOAP Examination
export interface SOAPExamination {
    tgl_perawatan: string;
    jam_rawat: string;
    suhu_tubuh: string;
    tensi: string;
    nadi: string;
    respirasi: string;
    tinggi: string;
    berat: string;
    gcs: string;
    kesadaran: string;
    keluhan: string;
    pemeriksaan: string;
    penilaian: string;
    rtl: string;
    instruksi: string;
    evaluasi: string;
    alergi: string;
    source: 'Ralan' | 'Ranap';
}

// Section 3: Medical Action
export interface MedicalAction {
    tanggal: string;
    jam: string;
    kode: string;
    nama: string;
    dokter: string;
    petugas: string;
    kategori: string;
}

// Section 3-continued: Room Stay
export interface RoomStay {
    tgl_masuk: string;
    jam_masuk: string;
    tgl_keluar: string;
    jam_keluar: string;
    lama_inap: number;
    kamar: string;
    bangsal: string;
    tarif: number;
    total_biaya: number;
    status_pulang: string;
}

// Section 4: Operation
export interface OperationItem {
    tgl_operasi: string;
    kode_paket: string;
    nama_tindakan: string;
    jenis_anastesi: string;
    status: string;
}

export interface OperationReport {
    no_rawat: string;
    tanggal: string;
    selesai_operasi: string;
    diagnosa_preop: string;
    diagnosa_postop: string;
    jaringan_dieksekusi: string;
    permintaan_pa: string;
    laporan_operasi: string;
    dokter_operator: string;
}

// Section 5: Radiology
export interface RadiologyExam {
    tgl_periksa: string;
    jam: string;
    kode: string;
    nama: string;
    dokter: string;
    petugas: string;
    biaya: number;
}

export interface RadiologyResult {
    tgl_periksa: string;
    jam: string;
    hasil: string;
    klinis: string;
    judul: string;
    kesan: string;
    saran: string;
    gambar: string[];
}

export interface RadiologyFullData {
    exams: RadiologyExam[];
    results: RadiologyResult[];
}

// Section 6: Laboratory
export interface LabDetail {
    pemeriksaan: string;
    nilai: string;
    satuan: string;
    nilai_rujukan: string;
    keterangan: string;
}

export interface LabExam {
    tgl_periksa: string;
    jam: string;
    kode: string;
    nama_tindakan: string;
    dokter: string;
    biaya: number;
    details: LabDetail[];
}

// Section 6.5: Lab PA (Pathology Anatomy)
export interface LabPAReport {
    no_rm: string;
    nama_pasien: string;
    jk_umur: string;
    alamat: string;
    no_rawat: string;
    no_order: string;
    tgl_permintaan: string;
    jam_permintaan: string;
    tgl_hasil: string;
    jam_hasil: string;
    poli: string;
    no_sediaan: string;
    pemeriksaan_pa: string;
    diagnosa_klinis: string;
    makroskopik: string;
    mikroskopik: string;
    kesimpulan: string;
    kesan: string;
    nama_dokter: string;
    kd_dokter: string;
}

// Section 7: Medicine / Pharmacy
export interface MedicineItem {
    tgl_perawatan: string;
    jam: string;
    kode_brng: string;
    nama_obat: string;
    jumlah: number;
    satuan: string;
    dosis: string;
    biaya: number;
    kategori: string;
}

// Section 8: Medical Resume
export interface MedicalResumeRalan {
    no_rawat: string;
    kd_dokter: string;
    nama_dokter: string;
    diagnosa_utama: string;
    diagnosa_sekunder1: string;
    diagnosa_sekunder2: string;
    diagnosa_sekunder3: string;
    diagnosa_sekunder4: string;
    prosedur_utama: string;
    prosedur_sekunder1: string;
    prosedur_sekunder2: string;
    prosedur_sekunder3: string;
    keluhan_utama: string;
    pemeriksaan: string;
    tensi: string;
    respirasi: string;
    nadi: string;
    dirawat_inapkan: string;
    kunjungan_awal: string;
    kunjungan_lanjutan: string;
    observasi: string;
    post_operasi: string;
}

export interface MedicalResumeRanap {
    no_rawat: string;
    kd_dokter: string;
    nama_dokter: string;
    diagnosa_awal: string;
    keluhan_utama: string;
    jalannya_penyakit: string;
    pemeriksaan_fisik: string;
    pemeriksaan_penunjang: string;
    hasil_laborat: string;
    diagnosa_utama: string;
    diagnosa_sekunder1: string;
    diagnosa_sekunder2: string;
    diagnosa_sekunder3: string;
    diagnosa_sekunder4: string;
    prosedur_utama: string;
    prosedur_sekunder1: string;
    prosedur_sekunder2: string;
    prosedur_sekunder3: string;
    obat_pulang: string;
    kondisi_pulang: string;
}

// Section 9: Billing
export interface BillingItem {
    no: number;
    nama_perawatan: string;
    pemisah: string;
    biaya: number;
    jumlah: number;
    tambahan: number;
    total_biaya: number;
}

export interface BillingCategory {
    kategori: string;
    items: BillingItem[];
    subtotal: number;
}

export interface BillingSummary {
    mode: string;
    no_nota: string;
    tgl_bayar: string;
    kasir: string;
    categories: BillingCategory[];
    jumlah_total: number;
    potongan: number;
    jumlah_bayar: number;
    terbilang: string;
}

// Section 10: SPRI
export interface SPRIDetail {
    no_surat: string;
    tgl_surat: string;
    no_kartu: string;
    nama_pasien: string;
    jenis_kelamin: string;
    tgl_lahir: string;
    diagnosa_awal: string;
    tgl_rencana: string;
    nama_dokter: string;
    nama_poli: string;
}

// Section 11-13: Digital Documents
export interface DigitalDocument {
    id: string;
    no_rawat: string;
    kode: string;
    kategori: string;
    lokasi_file: string;
    uploaded_at: string;
    file_url: string;
}

// Main comprehensive struct
export interface ClaimFullDetail {
    sep: SEPDetail | null;
    patient: PatientRegistration;
    diagnoses: DiagnosisItem[];
    procedures: ProcedureItem[];
    soap_ralan: SOAPExamination[];
    soap_ranap: SOAPExamination[];
    actions: MedicalAction[];
    room_stays: RoomStay[];
    operations: OperationItem[];
    op_reports: OperationReport[];
    radiology: RadiologyFullData;
    lab_exams: LabExam[];
    lab_pa_reports: LabPAReport[];
    medicines: MedicineItem[];
    resume_ralan: MedicalResumeRalan | null;
    resume_ranap: MedicalResumeRanap | null;
    billing: BillingSummary | null;
    spri: SPRIDetail | null;
    documents: DigitalDocument[];
    status_lanjut: string;
    claim_status: ClaimStatus;
}

export interface ClaimFullDetailResponse {
    success: boolean;
    data: ClaimFullDetail;
}

// Resume Types
export interface MedicalResume {
    no_rawat: string;
    jenis: JenisLayanan;
    keluhan_utama: string;
    pemeriksaan_fisik: string;
    diagnosa_akhir: string;
    terapi: string;
    anjuran: string;
    dokter_pj: string;
}

export interface ResumeResponse {
    success: boolean;
    data: MedicalResume;
}

// Request Types
export interface StatusUpdateRequest {
    status: ClaimStatus;
    catatan?: string;
}

export interface BatchStatusUpdateRequest {
    no_rawat_list: string[];
    status: ClaimStatus;
    catatan?: string;
}

export interface BatchUpdateResponse {
    success: boolean;
    message: string;
    data: {
        updated: number;
        failed: number;
    };
}

export interface DiagnosisUpdateRequest {
    kode_penyakit: string;
    status_dx?: 'Utama' | 'Sekunder';
    prioritas?: number;
}

export interface DiagnosisSyncRequest {
    diagnoses: DiagnosisUpdateRequest[];
}

export interface ICD10Item {
    kode: string;
    nama: string;
}

export interface ICD10SearchResponse {
    success: boolean;
    data: ICD10Item[];
}

export interface ICD9Item {
    kode: string;
    nama: string;
}

export interface ICD9SearchResponse {
    success: boolean;
    data: ICD9Item[];
}

export interface ProcedureUpdateRequest {
    kode: string;
    prioritas?: number;
}

export interface ProcedureSyncRequest {
    procedures: ProcedureUpdateRequest[];
}

export interface SuccessMessageResponse {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export type VedikaErrorCode =
    | 'INVALID_PARAMS'
    | 'VEDIKA_SETTINGS_MISSING'
    | 'INVALID_TOKEN'
    | 'PERMISSION_DENIED'
    | 'NOT_FOUND';

export interface VedikaError extends ApiError {
    error: {
        code: VedikaErrorCode;
        message: string;
    };
}

export function isSettingsMissingError(error: unknown): boolean {
    return (error as VedikaError)?.error?.code === 'VEDIKA_SETTINGS_MISSING';
}

export function isPermissionDeniedError(error: unknown): boolean {
    return (error as VedikaError)?.error?.code === 'PERMISSION_DENIED';
}

// =============================================================================
// SERVICE
// =============================================================================

export const vedikaService = {
    // Dashboard (Policy-driven - uses active_period from settings)
    getDashboard: async (): Promise<DashboardResponse> => {
        return apiRequest<DashboardResponse>(API_ENDPOINTS.VEDIKA.DASHBOARD, {}, { showGlobalLoading: false });
    },

    getDashboardTrend: async (): Promise<TrendResponse> => {
        return apiRequest<TrendResponse>(API_ENDPOINTS.VEDIKA.DASHBOARD_TREND, {}, { showGlobalLoading: false });
    },

    // Index (Data-driven - uses explicit date range)
    getIndex: async (params: IndexFilter): Promise<IndexListResponse> => {
        const searchParams = new URLSearchParams();
        searchParams.set('date_from', params.date_from);
        searchParams.set('date_to', params.date_to);
        searchParams.set('status', params.status);

        if (params.jenis) searchParams.set('jenis', params.jenis);
        if (params.page) searchParams.set('page', String(params.page));
        if (params.limit) searchParams.set('limit', String(params.limit));
        if (params.search) searchParams.set('search', params.search);

        const url = `${API_ENDPOINTS.VEDIKA.INDEX}?${searchParams.toString()}`;
        const response = await apiRequest<IndexListResponse>(url, {}, { showGlobalLoading: false });

        return response;
    },

    // Claim Detail (Button click - needs global loading)
    getClaimDetail: async (noRawat: string): Promise<ClaimDetailResponse> => {
        const response = await apiRequest<ClaimDetailResponse>(API_ENDPOINTS.VEDIKA.CLAIM(noRawat));

        return response;
    },

    // FULL Claim Detail (Button click - needs global loading)
    getClaimFullDetail: async (noRawat: string): Promise<ClaimFullDetailResponse> => {
        return apiRequest<ClaimFullDetailResponse>(API_ENDPOINTS.VEDIKA.CLAIM_FULL(noRawat));
    },

    // Claim Status Update (KEEP global loading - mutation operation)
    updateClaimStatus: async (
        noRawat: string,
        data: StatusUpdateRequest
    ): Promise<SuccessMessageResponse> => {
        return apiRequest<SuccessMessageResponse>(API_ENDPOINTS.VEDIKA.CLAIM_STATUS(noRawat), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Batch Status Update (KEEP global loading - mutation operation)
    batchUpdateStatus: async (
        data: BatchStatusUpdateRequest
    ): Promise<BatchUpdateResponse> => {
        return apiRequest<BatchUpdateResponse>(API_ENDPOINTS.VEDIKA.BATCH_STATUS, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Diagnosis Update (KEEP global loading - mutation operation)
    updateDiagnosis: async (
        noRawat: string,
        data: DiagnosisUpdateRequest
    ): Promise<SuccessMessageResponse> => {
        return apiRequest<SuccessMessageResponse>(API_ENDPOINTS.VEDIKA.CLAIM_DIAGNOSIS(noRawat), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Procedure Update (KEEP global loading - mutation operation)
    updateProcedure: async (
        noRawat: string,
        data: ProcedureUpdateRequest
    ): Promise<SuccessMessageResponse> => {
        return apiRequest<SuccessMessageResponse>(API_ENDPOINTS.VEDIKA.CLAIM_PROCEDURE(noRawat), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Resume (Button click - needs global loading)
    getResume: async (noRawat: string): Promise<ResumeResponse> => {
        const url = API_ENDPOINTS.VEDIKA.CLAIM_RESUME(noRawat);
        return apiRequest<ResumeResponse>(url);
    },

    // Search ICD-10
    searchICD10: async (query: string): Promise<ICD10Item[]> => {
        const url = `${API_ENDPOINTS.VEDIKA.ICD10_SEARCH}?search=${encodeURIComponent(query)}`;
        return apiRequest<ICD10SearchResponse>(url, {}, { showGlobalLoading: false }).then(resp => resp.data);
    },

    // Sync Diagnoses (Bulk)
    syncDiagnoses: async (
        noRawat: string,
        data: DiagnosisSyncRequest
    ): Promise<SuccessMessageResponse> => {
        return apiRequest<SuccessMessageResponse>(API_ENDPOINTS.VEDIKA.CLAIM_DIAGNOSIS(noRawat), {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Search ICD-9
    searchICD9: async (query: string): Promise<ICD9Item[]> => {
        const url = `${API_ENDPOINTS.VEDIKA.ICD9_SEARCH}?search=${encodeURIComponent(query)}`;
        return apiRequest<ICD9SearchResponse>(url, {}, { showGlobalLoading: false }).then(resp => resp.data);
    },

    // Sync Procedures (Bulk)
    syncProcedures: async (
        noRawat: string,
        data: ProcedureSyncRequest
    ): Promise<SuccessMessageResponse> => {
        return apiRequest<SuccessMessageResponse>(API_ENDPOINTS.VEDIKA.CLAIM_PROCEDURE(noRawat), {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Get Master Digital Docs
    getMasterDigitalDocs: async (): Promise<ICD10Item[]> => {
        const url = `${API_BASE_URL}/admin/vedika/claim/documents/master`;
        return apiRequest<ICD10SearchResponse>(url, {}, { showGlobalLoading: false }).then(resp => resp.data);
    },

    // Upload Document
    uploadDocument: async (
        noRawat: string,
        kode: string,
        file: File
    ): Promise<SuccessMessageResponse> => {
        const formData = new FormData();
        formData.append('kode', kode);
        formData.append('file', file);

        const url = API_ENDPOINTS.VEDIKA.CLAIM_DOCUMENTS(noRawat);
        return apiRequest<SuccessMessageResponse>(url, {
            method: 'POST',
            body: formData,
        });
    },

    // Delete Document
    deleteDocument: async (
        noRawat: string,
        kode: string,
        path: string
    ): Promise<SuccessMessageResponse> => {
        const url = `${API_ENDPOINTS.VEDIKA.CLAIM_DOCUMENTS(noRawat)}?kode=${encodeURIComponent(kode)}&path=${encodeURIComponent(path)}`;
        return apiRequest<SuccessMessageResponse>(url, {
            method: 'DELETE',
        });
    },

    // Save Resume
    saveResume: async (
        noRawat: string,
        data: Partial<MedicalResume>
    ): Promise<SuccessMessageResponse> => {
        const url = API_ENDPOINTS.VEDIKA.CLAIM_RESUME(noRawat);
        return apiRequest<SuccessMessageResponse>(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

export default vedikaService;
