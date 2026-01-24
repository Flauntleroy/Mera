// API Configuration
export const API_BASE_URL = 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    ME: `${API_BASE_URL}/auth/me`,
    SESSIONS: `${API_BASE_URL}/auth/sessions`,
    REVOKE_SESSION: (id: string) => `${API_BASE_URL}/auth/sessions/${id}/revoke`,
  },
  ADMIN: {
    USERS: `${API_BASE_URL}/admin/users`,
    USER: (id: string) => `${API_BASE_URL}/admin/users/${id}`,
    USER_ROLES: (id: string) => `${API_BASE_URL}/admin/users/${id}/roles`,
    USER_PERMISSIONS: (id: string) => `${API_BASE_URL}/admin/users/${id}/permissions`,
    USER_COPY_ACCESS: (id: string) => `${API_BASE_URL}/admin/users/${id}/copy-access`,
    USER_RESET_PASSWORD: (id: string) => `${API_BASE_URL}/admin/users/${id}/reset-password`,
    USER_ACTIVATE: (id: string) => `${API_BASE_URL}/admin/users/${id}/activate`,
    USER_DEACTIVATE: (id: string) => `${API_BASE_URL}/admin/users/${id}/deactivate`,
    ROLES: `${API_BASE_URL}/admin/roles`,
    ROLE: (id: string) => `${API_BASE_URL}/admin/roles/${id}`,
    ROLE_PERMISSIONS: (id: string) => `${API_BASE_URL}/admin/roles/${id}/permissions`,
    PERMISSIONS: `${API_BASE_URL}/admin/permissions`,
  },
  VEDIKA: {
    DASHBOARD: `${API_BASE_URL}/admin/vedika/dashboard`,
    DASHBOARD_TREND: `${API_BASE_URL}/admin/vedika/dashboard/trend`,
    INDEX: `${API_BASE_URL}/admin/vedika/index`,
    CLAIM: (noRawat: string) => `${API_BASE_URL}/admin/vedika/claim/detail/${noRawat}`,
    CLAIM_FULL: (noRawat: string) => `${API_BASE_URL}/admin/vedika/claim/full/${noRawat}`,
    CLAIM_STATUS: (noRawat: string) => `${API_BASE_URL}/admin/vedika/claim/status/${noRawat}`,
    BATCH_STATUS: `${API_BASE_URL}/admin/vedika/claim/batch-status`,
    CLAIM_DIAGNOSIS: (noRawat: string) => `${API_BASE_URL}/admin/vedika/claim/diagnosis/${noRawat}`,
    CLAIM_PROCEDURE: (noRawat: string) => `${API_BASE_URL}/admin/vedika/claim/procedure/${noRawat}`,
    CLAIM_DOCUMENTS: (noRawat: string) => `${API_BASE_URL}/admin/vedika/claim/documents/${noRawat}`,
    CLAIM_RESUME: (noRawat: string) => `${API_BASE_URL}/admin/vedika/claim/resume/${noRawat}`,
    ICD10_SEARCH: `${API_BASE_URL}/admin/vedika/icd10`,
    ICD9_SEARCH: `${API_BASE_URL}/admin/vedika/icd9`,
  },
};
