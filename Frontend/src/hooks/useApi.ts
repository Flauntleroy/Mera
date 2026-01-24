// useApi hook - Wrapper for API calls with automatic loading state
import { useCallback } from 'react';
import { useUI } from '../context/UIContext';
import { apiRequest as baseApiRequest, ApiError } from '../services/authService';

interface UseApiOptions {
    showLoading?: boolean;
    loadingMessage?: string;
}

export function useApi() {
    const { startLoading, stopLoading, toast } = useUI();

    const request = useCallback(
        async <T>(
            url: string,
            options: RequestInit = {},
            apiOptions: UseApiOptions = {}
        ): Promise<T> => {
            const { showLoading = true, loadingMessage } = apiOptions;

            if (showLoading) {
                startLoading(loadingMessage);
            }

            try {
                const result = await baseApiRequest<T>(url, options);
                return result;
            } catch (error) {
                const apiError = error as ApiError;
                toast(apiError?.error?.message || 'Terjadi kesalahan', { type: 'error' });
                throw error;
            } finally {
                if (showLoading) {
                    stopLoading();
                }
            }
        },
        [startLoading, stopLoading, toast]
    );

    // Helper methods for common HTTP verbs
    const get = useCallback(
        <T>(url: string, options?: UseApiOptions): Promise<T> => {
            return request<T>(url, { method: 'GET' }, options);
        },
        [request]
    );

    const post = useCallback(
        <T>(url: string, body?: unknown, options?: UseApiOptions): Promise<T> => {
            return request<T>(
                url,
                {
                    method: 'POST',
                    body: body ? JSON.stringify(body) : undefined,
                },
                options
            );
        },
        [request]
    );

    const put = useCallback(
        <T>(url: string, body?: unknown, options?: UseApiOptions): Promise<T> => {
            return request<T>(
                url,
                {
                    method: 'PUT',
                    body: body ? JSON.stringify(body) : undefined,
                },
                options
            );
        },
        [request]
    );

    const patch = useCallback(
        <T>(url: string, body?: unknown, options?: UseApiOptions): Promise<T> => {
            return request<T>(
                url,
                {
                    method: 'PATCH',
                    body: body ? JSON.stringify(body) : undefined,
                },
                options
            );
        },
        [request]
    );

    const del = useCallback(
        <T>(url: string, options?: UseApiOptions): Promise<T> => {
            return request<T>(url, { method: 'DELETE' }, options);
        },
        [request]
    );

    return {
        request,
        get,
        post,
        put,
        patch,
        delete: del,
    };
}

export default useApi;
