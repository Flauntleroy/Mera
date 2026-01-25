import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import {
    AlertIcon,
    LockIcon,
    CalenderIcon,
    TableIcon,
    CheckCircleIcon,
    DocsIcon,
    GridIcon,
    PlugInIcon,
    UserIcon,
    BoxCubeIcon
} from '../../icons';
import PageMeta from '../../components/common/PageMeta';
import VedikaSummaryCards from './components/VedikaSummaryCards';
import VedikaTrendChart from './components/VedikaTrendChart';
import VedikaMaturasiChart from './components/VedikaMaturasiChart';
import {
    vedikaService,
    isSettingsMissingError,
    isPermissionDeniedError,
    type DashboardSummary,
    type TrendItem,
} from '../../services/vedikaService';

// =============================================================================
// UI STATE TYPES
// =============================================================================

type DashboardState =
    | { status: 'loading' }
    | { status: 'error'; errorType: 'settings_missing' | 'permission_denied' | 'generic'; message: string }
    | { status: 'no_data'; period: string }
    | { status: 'success'; period: string; summary: DashboardSummary; trend: TrendItem[] };

// =============================================================================
// COMPONENT
// =============================================================================

export default function VedikaDashboard() {
    const [state, setState] = useState<DashboardState>({ status: 'loading' });

    const fetchDashboardData = useCallback(async () => {
        setState({ status: 'loading' });

        try {
            // Fetch dashboard and trend data in parallel
            const [dashboardRes, trendRes] = await Promise.all([
                vedikaService.getDashboard(),
                vedikaService.getDashboardTrend(),
            ]);

            const period = dashboardRes.data.period;
            const summary = dashboardRes.data.summary;
            const trend = trendRes.data.trend;

            // Check if there's no data
            const hasData =
                summary.rencana.ralan > 0 ||
                summary.rencana.ranap > 0 ||
                summary.pengajuan.ralan > 0 ||
                summary.pengajuan.ranap > 0 ||
                summary.lengkap.ralan > 0 ||
                summary.lengkap.ranap > 0 ||
                summary.perbaikan.ralan > 0 ||
                summary.perbaikan.ranap > 0;

            if (!hasData) {
                setState({ status: 'no_data', period });
                return;
            }

            setState({
                status: 'success',
                period,
                summary,
                trend
            });
        } catch (error) {
            if (isSettingsMissingError(error)) {
                setState({
                    status: 'error',
                    errorType: 'settings_missing',
                    message: 'Periode klaim aktif belum dikonfigurasi. Hubungi administrator untuk mengatur active_period di pengaturan sistem.',
                });
            } else if (isPermissionDeniedError(error)) {
                setState({
                    status: 'error',
                    errorType: 'permission_denied',
                    message: 'Anda tidak memiliki akses ke modul Vedika. Hubungi administrator untuk mendapatkan permission vedika.read.',
                });
            } else {
                setState({
                    status: 'error',
                    errorType: 'generic',
                    message: 'Terjadi kesalahan saat memuat data dashboard. Silakan coba lagi.',
                });
            }
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return (
        <>
            <PageMeta
                title="Dashboard Vedika | SIMRS MERA"
                description="Dashboard Verifikasi Digital Klaim BPJS - Monitoring klaim rawat jalan dan rawat inap"
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Dashboard Vedika
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Verifikasi Digital Klaim BPJS
                        </p>
                    </div>

                    {/* Active Period Badge - Read Only */}
                    {(state.status === 'success' || state.status === 'no_data') && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
                            <CalenderIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                Periode Klaim Aktif:
                            </span>
                            <span className="text-sm font-bold text-brand-800 dark:text-brand-200">
                                {formatPeriod(state.period)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content based on state */}
                {state.status === 'loading' && <LoadingState />}
                {state.status === 'error' && <ErrorState {...state} onRetry={fetchDashboardData} />}
                {state.status === 'no_data' && <NoDataState period={state.period} />}
                {state.status === 'success' && (
                    <SuccessState summary={state.summary} trend={state.trend} />
                )}
            </div>
        </>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function LoadingState() {
    return (
        <div className="space-y-6">
            {/* Skeleton Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                            <div className="space-y-2">
                                <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="w-32 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                        </div>
                        <div className="mt-5 space-y-3">
                            <div className="flex justify-between">
                                <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="w-12 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                            <div className="flex justify-between">
                                <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="w-12 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Skeleton Chart */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse">
                <div className="w-48 h-6 rounded bg-gray-200 dark:bg-gray-700 mb-6" />
                <div className="h-80 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
        </div>
    );
}

interface ErrorStateProps {
    errorType: 'settings_missing' | 'permission_denied' | 'generic';
    message: string;
    onRetry: () => void;
}

function ErrorState({ errorType, message, onRetry }: ErrorStateProps) {
    const config = {
        settings_missing: {
            icon: AlertIcon,
            title: 'Pengaturan Tidak Ditemukan',
            bgColor: 'bg-warning-50 dark:bg-warning-500/10',
            borderColor: 'border-warning-200 dark:border-warning-500/20',
            iconColor: 'text-warning-600 dark:text-warning-400',
            titleColor: 'text-warning-800 dark:text-warning-200',
        },
        permission_denied: {
            icon: LockIcon,
            title: 'Akses Ditolak',
            bgColor: 'bg-error-50 dark:bg-error-500/10',
            borderColor: 'border-error-200 dark:border-error-500/20',
            iconColor: 'text-error-600 dark:text-error-400',
            titleColor: 'text-error-800 dark:text-error-200',
        },
        generic: {
            icon: AlertIcon,
            title: 'Terjadi Kesalahan',
            bgColor: 'bg-gray-50 dark:bg-gray-500/10',
            borderColor: 'border-gray-200 dark:border-gray-500/20',
            iconColor: 'text-gray-600 dark:text-gray-400',
            titleColor: 'text-gray-800 dark:text-gray-200',
        },
    };

    const c = config[errorType];
    const Icon = c.icon;

    return (
        <div className={`rounded-2xl border ${c.borderColor} ${c.bgColor} p-8`}>
            <div className="flex flex-col items-center text-center max-w-md mx-auto">
                <div className={`w-16 h-16 rounded-full ${c.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-8 h-8 ${c.iconColor}`} />
                </div>
                <h3 className={`text-lg font-semibold ${c.titleColor} mb-2`}>
                    {c.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                </p>
                {errorType === 'generic' && (
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
                    >
                        Coba Lagi
                    </button>
                )}
            </div>
        </div>
    );
}

interface NoDataStateProps {
    period: string;
}

function NoDataState({ period }: NoDataStateProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col items-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <CalenderIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    Tidak Ada Data
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tidak ada data klaim untuk periode <strong>{formatPeriod(period)}</strong>.
                    Pastikan terdapat episode rawat jalan atau rawat inap pada periode ini.
                </p>
            </div>
        </div>
    );
}

interface SuccessStateProps {
    summary: DashboardSummary;
    trend: TrendItem[];
}

function SuccessState({ summary, trend }: SuccessStateProps) {
    return (
        <div className="space-y-10">
            {/* 1. Summary Cards (4 Cards) */}
            <VedikaSummaryCards summary={summary} />

            {/* 2. Maturasi Chart (Bar Chart) */}
            <VedikaMaturasiChart maturasi={summary.maturasi} />

            {/* 3. Navigation Grid (8 Tiles) */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Akses Cepat
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 md:gap-6">
                    {getNavigationTiles(summary.period).map((tile) => {
                        const Icon = tile.icon;
                        return (
                            <Link
                                key={tile.title}
                                to={tile.to}
                                className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] hover:border-brand-300 dark:hover:border-brand-500/50 hover:shadow-lg transition-all duration-300"
                            >
                                <div className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 group-hover:bg-brand-500 group-hover:scale-110 transition-all duration-300 mb-4`}>
                                    <Icon className="w-7 h-7 text-gray-400 dark:text-gray-500 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white text-center group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                    {tile.title}
                                </h3>
                                {/* Hover Indicator */}
                                <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-brand-500 scale-0 group-hover:scale-100 transition-transform duration-300" />
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* 4. Daily Trend Chart */}
            <VedikaTrendChart data={trend} />
        </div>
    );
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generates navigation tiles with correct period filters
 */
function getNavigationTiles(period: string) {
    const [year, month] = period.split('-').map(Number);
    const firstDay = `${period}-01`;
    const lastDayDate = new Date(year, month, 0);
    const lastDay = `${period}-${String(lastDayDate.getDate()).padStart(2, '0')}`;

    const baseUrl = '/vedika/index';
    const filterParams = `date_from=${firstDay}&date_to=${lastDay}`;

    return [
        {
            title: 'Index',
            icon: TableIcon,
            to: `${baseUrl}?${filterParams}&status=Rencana`
        },
        {
            title: 'Lengkap',
            icon: CheckCircleIcon,
            to: `${baseUrl}?${filterParams}&status=Lengkap`
        },
        {
            title: 'Pengajuan',
            icon: DocsIcon,
            to: `${baseUrl}?${filterParams}&status=Pengajuan`
        },
        {
            title: 'Perbaikan',
            icon: AlertIcon,
            to: `${baseUrl}?${filterParams}&status=Perbaikan`
        },
        {
            title: 'Mapping Inacbgs',
            icon: GridIcon,
            to: '/vedika/mapping-inacbgs'
        },
        {
            title: 'Bridging Eclaim',
            icon: PlugInIcon,
            to: '/vedika/bridging-eclaim'
        },
        {
            title: 'User Vedika',
            icon: UserIcon,
            to: '/vedika/users'
        },
        {
            title: 'Pengaturan',
            icon: BoxCubeIcon,
            to: '/vedika/settings'
        }
    ];
}

function formatPeriod(period: string): string {
    // Format "2026-01" to "Januari 2026"
    const [year, month] = period.split('-');
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${months[monthIndex]} ${year}`;
}
