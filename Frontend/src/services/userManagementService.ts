// User Management API Service
import { apiRequest } from './authService';
import { API_ENDPOINTS } from '../config/api';

// Types
export interface User {
    id: string;
    username: string;
    email: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    roles: Role[];
    permissions: string[];
    permission_overrides?: PermissionOverride[];
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    is_system?: boolean;
    permission_count?: number;
    permissions?: Permission[];
}

export interface Permission {
    id: string;
    code: string;
    domain: string;
    action: string;
    description?: string;
}

export interface PermissionOverride {
    permission_id: string;
    permission_code: string;
    effect: 'grant' | 'revoke';
}

export interface UserFilter {
    page?: number;
    limit?: number;
    status?: string; // 'active' | 'inactive'
    role?: string;
    search?: string;
}

export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    is_active?: boolean;
}

export interface UpdateUserRequest {
    username?: string;
    email?: string;
    is_active?: boolean;
}

export interface AssignRolesRequest {
    role_ids: string[];
}

export interface AssignPermissionsRequest {
    overrides: {
        permission_id: string;
        effect: 'grant' | 'revoke';
    }[];
}

export interface CopyAccessRequest {
    source_user_id: string;
}

export interface ResetPasswordRequest {
    new_password: string;
}

// API Response types
interface UserListResponse {
    success: boolean;
    data: {
        users: User[];
        total: number;
        page: number;
        limit: number;
    };
}

interface UserResponse {
    success: boolean;
    data: User;
}

interface RolesResponse {
    success: boolean;
    data: {
        roles: Role[];
    };
}

interface PermissionsResponse {
    success: boolean;
    data: {
        permissions: Permission[];
    };
}

// Service
export const userManagementService = {
    // Users
    async getUsers(filter: UserFilter = {}): Promise<{ users: User[]; total: number; page: number; limit: number }> {
        const params = new URLSearchParams();
        if (filter.page) params.append('page', String(filter.page));
        if (filter.limit) params.append('limit', String(filter.limit));
        if (filter.status) params.append('status', filter.status);
        if (filter.role) params.append('role', filter.role);
        if (filter.search) params.append('search', filter.search);

        const query = params.toString();
        const url = `${API_ENDPOINTS.ADMIN.USERS}${query ? `?${query}` : ''}`;
        const response = await apiRequest<UserListResponse>(url, {}, { showGlobalLoading: false });
        return response.data;
    },

    async getUser(id: string): Promise<User> {
        // Button click - needs global loading
        const response = await apiRequest<UserResponse>(API_ENDPOINTS.ADMIN.USER(id));
        return response.data;
    },

    async createUser(data: CreateUserRequest): Promise<User> {
        const response = await apiRequest<UserResponse>(API_ENDPOINTS.ADMIN.USERS, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
        const response = await apiRequest<UserResponse>(API_ENDPOINTS.ADMIN.USER(id), {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    async deleteUser(id: string): Promise<void> {
        await apiRequest<void>(API_ENDPOINTS.ADMIN.USER(id), {
            method: 'DELETE',
        });
    },

    // User actions
    async assignRoles(userId: string, data: AssignRolesRequest): Promise<void> {
        await apiRequest<void>(API_ENDPOINTS.ADMIN.USER_ROLES(userId), {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async assignPermissions(userId: string, data: AssignPermissionsRequest): Promise<void> {
        await apiRequest<void>(API_ENDPOINTS.ADMIN.USER_PERMISSIONS(userId), {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async copyAccess(userId: string, data: CopyAccessRequest): Promise<void> {
        await apiRequest<void>(API_ENDPOINTS.ADMIN.USER_COPY_ACCESS(userId), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async resetPassword(userId: string, data: ResetPasswordRequest): Promise<void> {
        await apiRequest<void>(API_ENDPOINTS.ADMIN.USER_RESET_PASSWORD(userId), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async activateUser(userId: string): Promise<void> {
        await apiRequest<void>(API_ENDPOINTS.ADMIN.USER_ACTIVATE(userId), {
            method: 'POST',
        });
    },

    async deactivateUser(userId: string): Promise<void> {
        await apiRequest<void>(API_ENDPOINTS.ADMIN.USER_DEACTIVATE(userId), {
            method: 'POST',
        });
    },

    // Roles
    async getRoles(): Promise<Role[]> {
        const response = await apiRequest<RolesResponse>(API_ENDPOINTS.ADMIN.ROLES, {}, { showGlobalLoading: false });
        return response.data?.roles || [];
    },

    async getRole(id: string): Promise<Role> {
        // Button click - needs global loading
        const response = await apiRequest<{ success: boolean; data: Role }>(API_ENDPOINTS.ADMIN.ROLE(id));
        return response.data;
    },

    async createRole(data: { name: string; description?: string }): Promise<Role> {
        const response = await apiRequest<{ success: boolean; data: Role }>(API_ENDPOINTS.ADMIN.ROLES, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.data;
    },

    async updateRole(id: string, data: { name?: string; description?: string }): Promise<void> {
        await apiRequest<void>(API_ENDPOINTS.ADMIN.ROLE(id), {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteRole(id: string): Promise<void> {
        await apiRequest<void>(API_ENDPOINTS.ADMIN.ROLE(id), {
            method: 'DELETE',
        });
    },

    async assignRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
        await apiRequest<void>(API_ENDPOINTS.ADMIN.ROLE_PERMISSIONS(roleId), {
            method: 'PUT',
            body: JSON.stringify({ permission_ids: permissionIds }),
        });
    },

    // Permissions
    async getPermissions(domain?: string): Promise<Permission[]> {
        const url = domain ? `${API_ENDPOINTS.ADMIN.PERMISSIONS}?domain=${domain}` : API_ENDPOINTS.ADMIN.PERMISSIONS;
        const response = await apiRequest<PermissionsResponse>(url, {}, { showGlobalLoading: false });
        return response.data?.permissions || [];
    },
};

export default userManagementService;


