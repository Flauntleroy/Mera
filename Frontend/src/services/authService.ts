// Auth Service - API client for authentication
import { API_ENDPOINTS } from '../config/api';

// Types
export interface LoginRequest {
    username: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_at: string;
}

export interface RoleBrief {
    id: string;
    name: string;
}

export interface UserResponse {
    id: string;
    username: string;
    email: string;
    is_active: boolean;
    last_login_at?: string;
    roles: RoleBrief[];
    permissions: string[];
}

export interface LoginResponse {
    success: boolean;
    data: {
        user: UserResponse;
        tokens: TokenResponse;
        session: { id: string; created_at: string };
    };
}

export interface MeResponse {
    success: boolean;
    data: {
        user: UserResponse;
    };
}

export interface SessionItem {
    id: string;
    device_info?: string;
    ip_address?: string;
    created_at: string;
    last_seen_at: string;
    is_current: boolean;
    is_active: boolean;
    revoked_at?: string;
}

export interface SessionListResponse {
    success: boolean;
    data: {
        sessions: SessionItem[];
        total: number;
    };
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

// Token Storage
const ACCESS_TOKEN_KEY = 'simrs_access_token';
const REFRESH_TOKEN_KEY = 'simrs_refresh_token';
const USER_KEY = 'simrs_user';

export const TokenStorage = {
    getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
    getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
    getUser: (): UserResponse | null => {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },
    setTokens: (accessToken: string, refreshToken: string) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    },
    setUser: (user: UserResponse) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    clear: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
};

// API Helper - exported for use in other services
import { loadingEventBus } from '../utils/loadingEventBus';

export async function apiRequest<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const accessToken = TokenStorage.getAccessToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    // Start loading indicator
    loadingEventBus.startRequest();

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle 401 Unauthorized - clear all auth data and redirect to login
            if (response.status === 401) {
                TokenStorage.clear();
                // Redirect to login page if not already there
                if (!window.location.pathname.includes('/signin')) {
                    window.location.href = '/signin';
                }
            }
            throw data as ApiError;
        }

        return data as T;
    } finally {
        // Always stop loading, even on error
        loadingEventBus.endRequest();
    }
}

// Auth Service Functions
export const authService = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await apiRequest<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        // Store tokens and user
        if (response.success && response.data) {
            TokenStorage.setTokens(
                response.data.tokens.access_token,
                response.data.tokens.refresh_token
            );
            TokenStorage.setUser(response.data.user);
        }

        return response;
    },

    logout: async (): Promise<void> => {
        try {
            await apiRequest(API_ENDPOINTS.AUTH.LOGOUT, {
                method: 'POST',
            });
        } catch {
            // Ignore errors on logout
        } finally {
            TokenStorage.clear();
        }
    },

    refresh: async (): Promise<TokenResponse | null> => {
        const refreshToken = TokenStorage.getRefreshToken();
        if (!refreshToken) {
            return null;
        }

        try {
            const response = await apiRequest<{ success: boolean; data: { tokens: TokenResponse } }>(
                API_ENDPOINTS.AUTH.REFRESH,
                {
                    method: 'POST',
                    body: JSON.stringify({ refresh_token: refreshToken }),
                }
            );

            if (response.success && response.data) {
                TokenStorage.setTokens(
                    response.data.tokens.access_token,
                    response.data.tokens.refresh_token
                );
                return response.data.tokens;
            }
        } catch {
            TokenStorage.clear();
        }

        return null;
    },

    getMe: async (): Promise<UserResponse | null> => {
        try {
            const response = await apiRequest<MeResponse>(API_ENDPOINTS.AUTH.ME);
            if (response.success && response.data) {
                TokenStorage.setUser(response.data.user);
                return response.data.user;
            }
        } catch {
            // Token might be expired
        }
        return null;
    },

    getSessions: async (): Promise<SessionItem[]> => {
        const response = await apiRequest<SessionListResponse>(API_ENDPOINTS.AUTH.SESSIONS);
        return response.data?.sessions || [];
    },

    revokeSession: async (sessionId: string): Promise<void> => {
        await apiRequest(API_ENDPOINTS.AUTH.REVOKE_SESSION(sessionId), {
            method: 'POST',
        });
    },

    isAuthenticated: (): boolean => {
        return !!TokenStorage.getAccessToken();
    },

    hasPermission: (permission: string): boolean => {
        const user = TokenStorage.getUser();
        return user?.permissions?.includes(permission) ?? false;
    },

    hasAnyPermission: (permissions: string[]): boolean => {
        const user = TokenStorage.getUser();
        return permissions.some(p => user?.permissions?.includes(p) ?? false);
    },
};

export default authService;
