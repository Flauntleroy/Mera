import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import {
    vedikaService,
    type IndexEpisode,
    type ClaimStatus,
    type JenisLayanan,
} from '../../services/vedikaService';

// =============================================================================
// TYPES
// =============================================================================

type IndexState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; items: IndexEpisode[]; pagination: { page: number; limit: number; total: number } };

interface FilterState {
    date_from: string;
    date_to: string;
    claimStatus: ClaimStatus;
    jenis: JenisLayanan;
    search: string;
    page: number;
    limit: number;
}

// =============================================================================
// HELPERS
// =============================================================================

function getDefaultDateRange(): { from: string; to: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const format = (d: Date) => d.toISOString().split('T')[0];
    return { from: format(firstDay), to: format(lastDay) };
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_CONFIG: Record<ClaimStatus, { label: string; color: string; bgColor: string }> = {
    RENCANA: { label: 'Rencana', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
    PENGAJUAN: { label: 'Pengajuan', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    PERBAIKAN: { label: 'Perbaikan', color: 'text-warning-700 dark:text-warning-300', bgColor: 'bg-warning-100 dark:bg-warning-900/30' },
    LENGKAP: { label: 'Lengkap', color: 'text-success-700 dark:text-success-300', bgColor: 'bg-success-100 dark:bg-success-900/30' },
    SETUJU: { label: 'Disetujui', color: 'text-brand-700 dark:text-brand-300', bgColor: 'bg-brand-100 dark:bg-brand-900/30' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function VedikaIndex() {
    const defaultDates = getDefaultDateRange();

    const [filters, setFilters] = useState<FilterState>({
        date_from: defaultDates.from,
        date_to: defaultDates.to,
        claimStatus: 'RENCANA',
        jenis: 'ralan',
        search: '',
        page: 1,
        limit: 10,
    });

    const [state, setState] = useState<IndexState>({ status: 'idle' });

    const fetchData = useCallback(async () => {
        setState({ status: 'loading' });

        try {
            const response = await vedikaService.getIndex({
                date_from: filters.date_from,
                date_to: filters.date_to,
                status: filters.claimStatus,
                jenis: filters.jenis,
                page: filters.page,
                limit: filters.limit,
                search: filters.search || undefined,
            });

            setState({
                status: 'success',
                items: response.data.items,
                pagination: response.data.pagination,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal memuat data';
            setState({ status: 'error', message });
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value as number : 1 }));
    };

    const totalPages = state.status === 'success' ? Math.ceil(state.pagination.total / state.pagination.limit) : 0;

    return (
        <>
            <PageMeta
                title="Index Workbench | Vedika"
                description="Kelola data klaim BPJS - Index Workbench Vedika"
            />

            <div className="space-y-6">
                {/* Header with Breadcrumb */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <Link
                                to="/vedika"
                                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                            >
                                Dashboard Vedika
                            </Link>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-gray-900 dark:text-white font-medium">Index</span>
                        </nav>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Index Workbench
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Kelola dan verifikasi data klaim BPJS
                        </p>
                    </div>
                </div>

                {/* Filters Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {/* Date From */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Tanggal Akhir
                            </label>
                            <input
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Status
                            </label>
                            <select
                                value={filters.claimStatus}
                                onChange={(e) => handleFilterChange('claimStatus', e.target.value as ClaimStatus)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                            >
                                <option value="RENCANA">Rencana</option>
                                <option value="PENGAJUAN">Pengajuan</option>
                                <option value="PERBAIKAN">Perbaikan</option>
                                <option value="LENGKAP">Lengkap</option>
                                <option value="SETUJU">Disetujui</option>
                            </select>
                        </div>

                        {/* Jenis */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Jenis Layanan
                            </label>
                            <select
                                value={filters.jenis}
                                onChange={(e) => handleFilterChange('jenis', e.target.value as JenisLayanan)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                            >
                                <option value="ralan">Rawat Jalan</option>
                                <option value="ranap">Rawat Inap</option>
                            </select>
                        </div>

                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Cari
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Nama, No RM, No Rawat..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                                />
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                    {state.status === 'loading' && <LoadingState />}
                    {state.status === 'error' && <ErrorState message={state.message} onRetry={fetchData} />}
                    {state.status === 'success' && state.items.length === 0 && <EmptyState />}
                    {state.status === 'success' && state.items.length > 0 && (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">No Rawat</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Pasien</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Tgl Pelayanan</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Unit</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Dokter</th>
                                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="text-center px-5 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {state.items.map((item) => (
                                            <tr key={item.no_rawat} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.no_rawat}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">RM: {item.no_rm}</div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.nama_pasien}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.cara_bayar}</div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                    {formatDate(item.tgl_pelayanan)}
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{item.unit}</td>
                                                <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{item.dokter}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[item.status].bgColor} ${STATUS_CONFIG[item.status].color}`}>
                                                        {STATUS_CONFIG[item.status].label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <button
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        Lihat
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Menampilkan {((filters.page - 1) * filters.limit) + 1} - {Math.min(filters.page * filters.limit, state.pagination.total)} dari {state.pagination.total} data
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleFilterChange('page', filters.page - 1)}
                                        disabled={filters.page === 1}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Sebelumnya
                                    </button>
                                    <span className="px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-white">
                                        {filters.page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handleFilterChange('page', filters.page + 1)}
                                        disabled={filters.page >= totalPages}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function LoadingState() {
    return (
        <div className="p-8">
            <div className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data...</p>
            </div>
        </div>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="p-8">
            <div className="flex flex-col items-center text-center max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-error-50 dark:bg-error-500/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Gagal Memuat Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
                <button
                    onClick={onRetry}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
                >
                    Coba Lagi
                </button>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="p-8">
            <div className="flex flex-col items-center text-center max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Tidak Ada Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tidak ada klaim yang ditemukan dengan filter yang dipilih.
                </p>
            </div>
        </div>
    );
}
