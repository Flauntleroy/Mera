import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { loadingEventBus } from '../utils/loadingEventBus';

// Types
interface ToastOptions {
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    title?: string;
}

interface ConfirmOptions {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'default';
}

interface ToastItem {
    id: number;
    message: string;
    title?: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    isExiting?: boolean;
}

interface ConfirmState {
    isOpen: boolean;
    message: string;
    title: string;
    confirmText: string;
    cancelText: string;
    variant: 'danger' | 'warning' | 'default';
    resolve: ((value: boolean) => void) | null;
}

interface UIContextType {
    toast: (message: string, options?: ToastOptions) => void;
    confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
    startLoading: (message?: string) => void;
    stopLoading: () => void;
    isLoading: boolean;
    loadingMessage: string;
}

const UIContext = createContext<UIContextType | null>(null);

export function useUI() {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within UIProvider');
    }
    return context;
}

// Icon Components
const CheckIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const WarningIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const InfoIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Toast Component with Progress Bar
function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
    const [progress, setProgress] = useState(100);

    const styles = {
        success: {
            iconBg: 'bg-green-100 dark:bg-green-500/20',
            iconColor: 'text-green-500',
            progressBg: 'bg-green-500',
            title: 'Berhasil!',
            IconComponent: CheckIcon,
        },
        error: {
            iconBg: 'bg-red-100 dark:bg-red-500/20',
            iconColor: 'text-red-500',
            progressBg: 'bg-red-500',
            title: 'Error!',
            IconComponent: XIcon,
        },
        warning: {
            iconBg: 'bg-amber-100 dark:bg-amber-500/20',
            iconColor: 'text-amber-500',
            progressBg: 'bg-amber-500',
            title: 'Peringatan!',
            IconComponent: WarningIcon,
        },
        info: {
            iconBg: 'bg-blue-100 dark:bg-blue-500/20',
            iconColor: 'text-blue-500',
            progressBg: 'bg-blue-500',
            title: 'Info',
            IconComponent: InfoIcon,
        },
    };

    const style = styles[item.type];
    const Icon = style.IconComponent;

    // Progress bar countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - (100 / (item.duration / 50));
            });
        }, 50);

        return () => clearInterval(interval);
    }, [item.duration]);

    return (
        <div
            className={`
                relative overflow-hidden min-w-[320px] rounded-lg bg-white dark:bg-gray-800
                shadow-lg border border-gray-200 dark:border-gray-700
                transition-all duration-300 ease-out
                ${item.isExiting
                    ? 'animate-toast-exit opacity-0 translate-x-full'
                    : 'animate-toast-enter'
                }
            `}
        >
            {/* Content */}
            <div className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${style.iconBg}`}>
                    <span className={style.iconColor}>
                        <Icon />
                    </span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                        {item.title || style.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {item.message}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 dark:bg-gray-700">
                <div
                    className={`h-full ${style.progressBg} transition-all duration-50 ease-linear`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

// Glassmorphism Confirm Dialog Component
function ConfirmDialog({ state, onConfirm, onCancel }: {
    state: ConfirmState;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!state.isOpen) return null;

    const variantStyles = {
        danger: {
            iconBg: 'bg-red-500/10 backdrop-blur-xl border border-red-500/20',
            iconColor: 'text-red-500',
            button: 'bg-red-500 hover:bg-red-600 text-white',
        },
        warning: {
            iconBg: 'bg-amber-500/10 backdrop-blur-xl border border-amber-500/20',
            iconColor: 'text-amber-500',
            button: 'bg-amber-500 hover:bg-amber-600 text-white',
        },
        default: {
            iconBg: 'bg-brand-500/10 backdrop-blur-xl border border-brand-500/20',
            iconColor: 'text-brand-500',
            button: 'bg-brand-500 hover:bg-brand-600 text-white',
        },
    };

    const variant = variantStyles[state.variant];

    return (
        <>
            {/* Backdrop with blur */}
            <div
                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            />

            {/* Glassmorphism Dialog */}
            <div className="fixed left-1/2 top-1/2 z-[100] w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4 animate-dialog-enter">
                <div
                    className="
                        relative overflow-hidden rounded-3xl p-8
                        bg-white/90 dark:bg-gray-900/90
                        backdrop-blur-2xl backdrop-saturate-200
                        border border-white/50 dark:border-gray-700/50
                        shadow-2xl shadow-black/10
                    "
                >
                    {/* Subtle gradient overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-gray-800/30 pointer-events-none" />

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Glassmorphism Icon Container */}
                        <div className={`mx-auto w-20 h-20 rounded-2xl ${variant.iconBg} flex items-center justify-center mb-6 shadow-lg`}>
                            {state.variant === 'danger' ? (
                                <svg className={`w-10 h-10 ${variant.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            ) : state.variant === 'warning' ? (
                                <svg className={`w-10 h-10 ${variant.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                            ) : (
                                <svg className={`w-10 h-10 ${variant.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                </svg>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-3">
                            {state.title}
                        </h3>

                        {/* Message */}
                        <p className="text-center text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            {state.message}
                        </p>

                        {/* Buttons - Solid colors, no gradient */}
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="
                                    flex-1 rounded-xl px-5 py-3.5 text-sm font-semibold
                                    bg-gray-100 hover:bg-gray-200 text-gray-700
                                    dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300
                                    transition-all duration-200
                                "
                            >
                                {state.cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                className={`
                                    flex-1 rounded-xl px-5 py-3.5 text-sm font-semibold
                                    ${variant.button}
                                    transition-all duration-200
                                    hover:shadow-lg
                                `}
                            >
                                {state.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Global Loading Bar Component
function LoadingBar({ isLoading, message }: { isLoading: boolean; message: string }) {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
            setProgress(0);

            // Animate progress from 0 to 90%
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) {
                        return prev;
                    }
                    // Slow down as it approaches 90%
                    const increment = Math.max(1, (90 - prev) / 10);
                    return Math.min(90, prev + increment);
                });
            }, 200);

            return () => clearInterval(interval);
        } else {
            // Complete the animation
            setProgress(100);
            const timeout = setTimeout(() => {
                setVisible(false);
                setProgress(0);
            }, 300);

            return () => clearTimeout(timeout);
        }
    }, [isLoading]);

    if (!visible) return null;

    return (
        <>
            {/* Top Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
                <div
                    className="h-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Loading Overlay - ALWAYS show during loading to block interaction */}
            <div
                className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[3px] flex items-center justify-center cursor-wait"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-8 py-6 shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center gap-4 animate-pulse-subtle">
                    {/* Spinner */}
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full" />
                        <div className="absolute inset-0 border-4 border-transparent border-t-brand-500 rounded-full animate-spin" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-800 dark:text-gray-100 font-semibold">
                            {message || 'Sedang memuat data...'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Mohon tunggu sebentar
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}

// Provider Component
export function UIProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        isOpen: false,
        message: '',
        title: 'Konfirmasi',
        confirmText: 'Ya',
        cancelText: 'Batal',
        variant: 'default',
        resolve: null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Use ref for stable ID counter across renders
    const toastIdRef = useRef(0);
    const loadingCountRef = useRef(0);

    // Subscribe to global loading events from apiRequest
    useEffect(() => {
        const unsubscribe = loadingEventBus.subscribe((loading) => {
            setIsLoading(loading);
            if (!loading) {
                setLoadingMessage('');
            }
        });
        return unsubscribe;
    }, []);

    const toast = useCallback((message: string, options: ToastOptions = {}) => {
        const id = ++toastIdRef.current;
        const type = options.type || 'info';
        const duration = options.duration || 4000;
        const title = options.title;

        setToasts((prev) => [...prev, { id, message, title, type, duration }]);

        // Start exit animation before removing
        setTimeout(() => {
            setToasts((prev) => prev.map((t) =>
                t.id === id ? { ...t, isExiting: true } : t
            ));
        }, duration - 300);

        // Remove after exit animation
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const confirm = useCallback((message: string, options: ConfirmOptions = {}): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                message,
                title: options.title || 'Konfirmasi',
                confirmText: options.confirmText || 'Ya',
                cancelText: options.cancelText || 'Batal',
                variant: options.variant || 'default',
                resolve,
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        confirmState.resolve?.(true);
        setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }));
    }, [confirmState]);

    const handleCancel = useCallback(() => {
        confirmState.resolve?.(false);
        setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }));
    }, [confirmState]);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Loading functions with counter for concurrent requests
    const startLoading = useCallback((message?: string) => {
        loadingCountRef.current++;
        setIsLoading(true);
        if (message) {
            setLoadingMessage(message);
        }
    }, []);

    const stopLoading = useCallback(() => {
        loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);
        if (loadingCountRef.current === 0) {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, []);

    return (
        <UIContext.Provider value={{ toast, confirm, startLoading, stopLoading, isLoading, loadingMessage }}>
            {children}

            {/* Global Loading Bar */}
            <LoadingBar isLoading={isLoading} message={loadingMessage} />

            {/* Toast Container - Over everything */}
            <div className="fixed right-6 top-6 z-[9999] flex flex-col gap-3 max-w-sm">
                {toasts.map((item) => (
                    <Toast key={item.id} item={item} onClose={() => removeToast(item.id)} />
                ))}
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                state={confirmState}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </UIContext.Provider>
    );
}
