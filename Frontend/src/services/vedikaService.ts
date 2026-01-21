// Vedika Service - API client for Vedika (Verifikasi Digital Klaim BPJS)
import { API_ENDPOINTS } from '../config/api';
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

// Claim Detail Types
export interface DiagnosisItem {
    kode_penyakit: string;
    nama_penyakit: string;
    status_dx: 'Utama' | 'Sekunder';
    prioritas: number;
}

export interface ProcedureItem {
    kode: string;
    nama: string;
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
}

export interface ClaimDetailResponse {
    success: boolean;
    data: ClaimDetail;
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

export interface DiagnosisUpdateRequest {
    kode_penyakit: string;
    status_dx?: 'Utama' | 'Sekunder';
    prioritas?: number;
}

export interface ProcedureUpdateRequest {
    kode: string;
    prioritas?: number;
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
        return apiRequest<DashboardResponse>(API_ENDPOINTS.VEDIKA.DASHBOARD);
    },

    getDashboardTrend: async (): Promise<TrendResponse> => {
        return apiRequest<TrendResponse>(API_ENDPOINTS.VEDIKA.DASHBOARD_TREND);
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
        return apiRequest<IndexListResponse>(url);
    },

    // Claim Detail
    getClaimDetail: async (noRawat: string): Promise<ClaimDetailResponse> => {
        return apiRequest<ClaimDetailResponse>(API_ENDPOINTS.VEDIKA.CLAIM(noRawat));
    },

    // Claim Status Update
    updateClaimStatus: async (
        noRawat: string,
        data: StatusUpdateRequest
    ): Promise<SuccessMessageResponse> => {
        return apiRequest<SuccessMessageResponse>(API_ENDPOINTS.VEDIKA.CLAIM_STATUS(noRawat), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Diagnosis Update
    updateDiagnosis: async (
        noRawat: string,
        data: DiagnosisUpdateRequest
    ): Promise<SuccessMessageResponse> => {
        return apiRequest<SuccessMessageResponse>(API_ENDPOINTS.VEDIKA.CLAIM_DIAGNOSIS(noRawat), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Procedure Update
    updateProcedure: async (
        noRawat: string,
        data: ProcedureUpdateRequest
    ): Promise<SuccessMessageResponse> => {
        return apiRequest<SuccessMessageResponse>(API_ENDPOINTS.VEDIKA.CLAIM_PROCEDURE(noRawat), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Resume (Read-only)
    getResume: async (noRawat: string): Promise<ResumeResponse> => {
        return apiRequest<ResumeResponse>(API_ENDPOINTS.VEDIKA.CLAIM_RESUME(noRawat));
    },
};

export default vedikaService;
