// Auth Context - Global authentication state management
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, UserResponse, TokenStorage } from '../services/authService';

interface AuthContextType {
    user: UserResponse | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    can: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            const accessToken = TokenStorage.getAccessToken();

            // No token = not authenticated, skip API calls
            if (!accessToken) {
                TokenStorage.clear();
                setIsLoading(false);
                return;
            }

            try {
                // Validate token by fetching current user
                const currentUser = await authService.getMe();
                if (currentUser) {
                    setUser(currentUser);
                } else {
                    // Token invalid, try refresh
                    const tokens = await authService.refresh();
                    if (tokens) {
                        const refreshedUser = await authService.getMe();
                        setUser(refreshedUser);
                    } else {
                        // Refresh also failed, clear everything
                        TokenStorage.clear();
                    }
                }
            } catch {
                // Any error means auth failed, clear tokens
                TokenStorage.clear();
            }

            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        try {
            const response = await authService.login({ username, password });
            if (response.success && response.data) {
                setUser(response.data.user);
                return { success: true };
            }
            return { success: false, error: 'Login failed' };
        } catch (err: unknown) {
            const error = err as { error?: { message?: string } };
            return {
                success: false,
                error: error?.error?.message || 'Login failed'
            };
        }
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
    }, []);

    const can = useCallback((permission: string) => {
        return user?.permissions?.includes(permission) ?? false;
    }, [user]);

    const hasRole = useCallback((role: string) => {
        return user?.roles?.some(r => r.name === role) ?? false;
    }, [user]);

    const refreshUser = useCallback(async () => {
        const currentUser = await authService.getMe();
        if (currentUser) {
            setUser(currentUser);
        }
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        can,
        hasRole,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
