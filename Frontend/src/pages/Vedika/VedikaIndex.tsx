import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import {
    vedikaService,
    type IndexEpisode,
    type ClaimStatus,
    type JenisLayanan,
} from '../../services/vedikaService';
import DatePicker from '../../components/form/date-picker';
import Combobox from '../../components/ui/Combobox';
import Label from '../../components/form/Label';
import StatusUpdateModal from './components/StatusUpdateModal';
import BatchStatusModal from './components/BatchStatusModal';
import ExpandedRowDetail from './components/ExpandedRowDetail';

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

function formatToYMD(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDefaultDateRange(): { from: string; to: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return { from: formatToYMD(firstDay), to: formatToYMD(lastDay) };
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    Rencana: { label: 'Rencana', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
    Pengajuan: { label: 'Pengajuan', color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    Perbaikan: { label: 'Perbaikan', color: 'text-warning-700 dark:text-warning-300', bgColor: 'bg-warning-100 dark:bg-warning-900/30' },
    Lengkap: { label: 'Lengkap', color: 'text-success-700 dark:text-success-300', bgColor: 'bg-success-100 dark:bg-success-900/30' },
    Setuju: { label: 'Disetujui', color: 'text-brand-700 dark:text-brand-300', bgColor: 'bg-brand-100 dark:bg-brand-900/30' },
};

/**
 * Robust status lookup that handles case-insensitivity
 */
function getStatusConfig(status: string) {
    const s = (status || 'Rencana').toLowerCase();
    // Find key that matches (case-insensitive)
    const key = Object.keys(STATUS_CONFIG).find(k => k.toLowerCase() === s);
    return key ? STATUS_CONFIG[key] : STATUS_CONFIG.Rencana;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function VedikaIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const defaultDates = getDefaultDateRange();

    const [filters, setFilters] = useState<FilterState>(() => {
        const status = searchParams.get('status') as ClaimStatus || 'Rencana';
        const dateFrom = searchParams.get('date_from') || defaultDates.from;
        const dateTo = searchParams.get('date_to') || defaultDates.to;
        const jenis = searchParams.get('jenis') as JenisLayanan || 'ralan';
        const page = Number(searchParams.get('page')) || 1;

        return {
            date_from: dateFrom,
            date_to: dateTo,
            claimStatus: status,
            jenis: jenis,
            search: '',
            page: page,
            limit: 10,
        };
    });

    const [state, setState] = useState<IndexState>({ status: 'idle' });
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean; noRawat: string; currentStatus: ClaimStatus } | null>(null);
    const [batchModal, setBatchModal] = useState<{ isOpen: boolean } | null>(null);

    // Sync search params with filters (optional but good for consistency)
    useEffect(() => {
        const params = new URLSearchParams();
        params.set('status', filters.claimStatus);
        params.set('date_from', filters.date_from);
        params.set('date_to', filters.date_to);
        params.set('jenis', filters.jenis);
        if (filters.page > 1) params.set('page', String(filters.page));
        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

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

    const toggleRow = (noRawat: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(noRawat)) {
                next.delete(noRawat);
            } else {
                next.add(noRawat);
            }
            return next;
        });
    };

    const handleStatusSuccess = () => {
        fetchData(); // Refresh data after status update
    };

    const isInternalData = filters.claimStatus.toLowerCase() !== 'rencana';
    const pageTitle = isInternalData ? 'Verifikasi Workbench' : 'Index Workbench';
    const breadcrumbTitle = isInternalData ? 'Workbench' : 'Index';

    return (
        <>
            <PageMeta
                title={`${pageTitle} | Vedika SIMRS MERA`}
                description={`Kelola data klaim BPJS (${filters.claimStatus}) - ${pageTitle} Vedika`}
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
                            <span className="text-gray-900 dark:text-white font-medium">{breadcrumbTitle}</span>
                        </nav>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {pageTitle}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {isInternalData
                                ? `Mengelola klaim dengan status ${getStatusConfig(filters.claimStatus).label}`
                                : 'Kelola potensi klaim (potensi data dari Khanza)'}
                        </p>
                    </div>
                </div>

                {/* Filters Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {/* Date Range Picker */}
                        <div className="space-y-2 lg:col-span-2">
                            <Label htmlFor="date_range">Periode</Label>
                            <DatePicker
                                id="date_range"
                                mode="range"
                                defaultDate={[filters.date_from, filters.date_to]}
                                onChange={(dates: Date[] | null) => {
                                    if (dates && dates.length === 2) {
                                        setFilters(prev => ({
                                            ...prev,
                                            date_from: formatToYMD(dates[0]),
                                            date_to: formatToYMD(dates[1]),
                                            page: 1
                                        }));
                                    }
                                }}
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <Label>Status</Label>
                            <Combobox
                                options={[
                                    { value: 'Rencana', label: 'Rencana' },
                                    { value: 'Pengajuan', label: 'Pengajuan' },
                                    { value: 'Perbaikan', label: 'Perbaikan' },
                                    { value: 'Lengkap', label: 'Lengkap' },
                                    { value: 'Setuju', label: 'Disetujui' },
                                ]}
                                value={filters.claimStatus}
                                onChange={(value) => handleFilterChange('claimStatus', value as ClaimStatus)}
                                placeholder="Pilih Status..."
                                searchPlaceholder="Cari status..."
                            />
                        </div>

                        {/* Jenis */}
                        <div>
                            <Label>Jenis Layanan</Label>
                            <Combobox
                                options={[
                                    { value: 'ralan', label: 'Rawat Jalan' },
                                    { value: 'ranap', label: 'Rawat Inap' },
                                ]}
                                value={filters.jenis}
                                onChange={(value) => handleFilterChange('jenis', value as JenisLayanan)}
                                placeholder="Pilih Layanan..."
                                searchPlaceholder="Cari layanan..."
                            />
                        </div>

                        {/* Search */}
                        <div>
                            <Label>Cari</Label>
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

                {/* Batch Action Bar */}
                {selectedRows.size > 0 && (
                    <div className="rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-800 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-bold">
                                {selectedRows.size}
                            </div>
                            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                item dipilih
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setBatchModal({ isOpen: true })}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Ubah Status
                            </button>
                            <button
                                onClick={() => setSelectedRows(new Set())}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}

                {/* Batch Status Modal */}
                {batchModal?.isOpen && (
                    <BatchStatusModal
                        isOpen={true}
                        onClose={() => {
                            setBatchModal(null);
                            setSelectedRows(new Set());
                        }}
                        selectedCount={selectedRows.size}
                        selectedNoRawatList={Array.from(selectedRows)}
                        onSuccess={() => {
                            setBatchModal(null);
                            setSelectedRows(new Set());
                            fetchData();
                        }}
                    />
                )}

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
                                            <th className="px-3 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={state.status === 'success' && selectedRows.size === state.items.length && state.items.length > 0}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        if (e.target.checked && state.status === 'success') {
                                                            setSelectedRows(new Set(state.items.map(i => i.no_rawat)));
                                                        } else {
                                                            setSelectedRows(new Set());
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                                />
                                            </th>
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
                                            <React.Fragment key={item.no_rawat}>
                                                <tr
                                                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${expandedRows.has(item.no_rawat) ? 'bg-gray-50 dark:bg-gray-800/20' : ''} ${selectedRows.has(item.no_rawat) ? 'bg-brand-50 dark:bg-brand-900/10' : ''}`}
                                                    onClick={() => toggleRow(item.no_rawat)}
                                                >
                                                    <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRows.has(item.no_rawat)}
                                                            onChange={(e) => {
                                                                const newSelected = new Set(selectedRows);
                                                                if (e.target.checked) {
                                                                    newSelected.add(item.no_rawat);
                                                                } else {
                                                                    newSelected.delete(item.no_rawat);
                                                                }
                                                                setSelectedRows(newSelected);
                                                            }}
                                                            className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                                        />
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <svg
                                                                className={`w-4 h-4 text-gray-400 transition-transform ${expandedRows.has(item.no_rawat) ? 'rotate-90' : ''}`}
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.no_rawat}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">RM: {item.no_rm}</div>
                                                            </div>
                                                        </div>
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
                                                        {(() => {
                                                            const config = getStatusConfig(item.status);
                                                            return (
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                                                                    {config.label}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => setStatusModal({ isOpen: true, noRawat: item.no_rawat, currentStatus: item.status })}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                </svg>
                                                                Status
                                                            </button>
                                                            <Link
                                                                to={`/vedika/claim/${encodeURIComponent(item.no_rawat)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                Lihat
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expandedRows.has(item.no_rawat) && (
                                                    <ExpandedRowDetail
                                                        key={`${item.no_rawat}-expanded`}
                                                        item={item}
                                                        onRefresh={fetchData}
                                                    />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Data per halaman
                                        </label>
                                        <select
                                            value={filters.limit}
                                            onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Menampilkan {((filters.page - 1) * filters.limit) + 1} - {Math.min(filters.page * filters.limit, state.pagination.total)} dari {state.pagination.total} data
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleFilterChange('page', filters.page - 1)}
                                        disabled={filters.page === 1}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <span className="px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-white">
                                        {filters.page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handleFilterChange('page', filters.page + 1)}
                                        disabled={filters.page >= totalPages}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7 7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Status Update Modal */}
            {statusModal && (
                <StatusUpdateModal
                    isOpen={statusModal.isOpen}
                    onClose={() => setStatusModal(null)}
                    noRawat={statusModal.noRawat}
                    currentStatus={statusModal.currentStatus}
                    onSuccess={handleStatusSuccess}
                />
            )}
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




