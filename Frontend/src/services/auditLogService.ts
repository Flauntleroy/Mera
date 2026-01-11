// Audit Log Service - API client for audit logs
import { API_BASE_URL } from '../config/api';
import { TokenStorage } from './authService';

// Types
export interface AuditLogEntry {
    id: string;
    ts: string;
    level: string;
    module: string;
    action: string;
    entity: {
        table: string;
        primary_key: Record<string, string>;
    };
    sql_context?: {
        operation: string;
        changed_columns?: Record<string, { old: unknown; new: unknown }>;
        inserted_data?: Record<string, unknown>;
        deleted_data?: Record<string, unknown>;
        where?: Record<string, unknown>;
    };
    business_key: string;
    actor: {
        user_id: string;
        username: string;
    };
    ip: string;
    summary: string;
}

export interface AuditLogFilter {
    from?: string;
    to?: string;
    module?: string;
    user?: string;
    action?: string;
    business_key?: string;
    page?: number;
    limit?: number;
}

export interface AuditLogListResponse {
    success: boolean;
    data: {
        logs: AuditLogEntry[];
        total: number;
        page: number;
        limit: number;
    };
}

export interface AuditLogDetailResponse {
    success: boolean;
    data: AuditLogEntry;
}

// API Helper
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const accessToken = TokenStorage.getAccessToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data as T;
}

// Audit Log Service
export const auditLogService = {
    getAuditLogs: async (filter: AuditLogFilter = {}): Promise<AuditLogListResponse['data']> => {
        const params = new URLSearchParams();

        if (filter.from) params.append('from', filter.from);
        if (filter.to) params.append('to', filter.to);
        if (filter.module) params.append('module', filter.module);
        if (filter.user) params.append('user', filter.user);
        if (filter.action) params.append('action', filter.action);
        if (filter.business_key) params.append('business_key', filter.business_key);
        params.append('page', String(filter.page || 1));
        params.append('limit', String(filter.limit || 25));

        const url = `${API_BASE_URL}/admin/audit-logs?${params.toString()}`;
        const response = await apiRequest<AuditLogListResponse>(url);
        return response.data;
    },

    getAuditLogDetail: async (id: string): Promise<AuditLogEntry> => {
        const url = `${API_BASE_URL}/admin/audit-logs/${id}`;
        const response = await apiRequest<AuditLogDetailResponse>(url);
        return response.data;
    },

    getModules: async (): Promise<string[]> => {
        const url = `${API_BASE_URL}/admin/audit-logs/modules`;
        const response = await apiRequest<{ success: boolean; data: string[] }>(url);
        return response.data;
    },
};

export default auditLogService;
