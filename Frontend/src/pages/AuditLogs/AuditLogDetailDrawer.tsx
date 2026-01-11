import { useAuth } from '../../context/AuthContext';
import { AuditLogEntry } from '../../services/auditLogService';

interface AuditLogDetailDrawerProps {
    log: AuditLogEntry | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function AuditLogDetailDrawer({ log, isOpen, onClose }: AuditLogDetailDrawerProps) {
    const { can } = useAuth();
    const canViewSensitive = can('auditlog.read.sensitive');

    if (!isOpen || !log) return null;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const actionLabels: Record<string, { label: string; color: string }> = {
        INSERT: { label: 'Data Ditambahkan', color: 'text-green-600 dark:text-green-400' },
        UPDATE: { label: 'Data Diubah', color: 'text-blue-600 dark:text-blue-400' },
        DELETE: { label: 'Data Dihapus', color: 'text-red-600 dark:text-red-400' },
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-xl dark:bg-gray-900">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Detail Audit Log</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Summary (Bold) */}
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <p className="text-base font-semibold text-gray-800 dark:text-white">{log.summary}</p>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Waktu" value={formatDate(log.ts)} />
                        <InfoItem label="User" value={log.actor?.username || '-'} />
                        <InfoItem label="Modul" value={log.module} />
                        <InfoItem
                            label="Aksi"
                            value={actionLabels[log.action]?.label || log.action}
                            valueClass={actionLabels[log.action]?.color}
                        />
                        {canViewSensitive && <InfoItem label="IP Address" value={log.ip} />}
                        <InfoItem label="Business Key" value={log.business_key} />
                    </div>

                    {/* Entity Info */}
                    <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                            Entitas
                        </h3>
                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-3">
                                <InfoItem label="Tabel" value={log.entity?.table || '-'} />
                                <InfoItem
                                    label="Primary Key"
                                    value={
                                        log.entity?.primary_key
                                            ? Object.entries(log.entity.primary_key)
                                                .map(([k, v]) => `${k}: ${v}`)
                                                .join(', ')
                                            : '-'
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Change Details */}
                    <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
                            Detail Perubahan
                        </h3>

                        {log.action === 'UPDATE' && log.sql_context?.changed_columns && (
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Field</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Sebelum</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Sesudah</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {Object.entries(log.sql_context.changed_columns).map(([field, change]) => (
                                            <tr key={field}>
                                                <td className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">{field}</td>
                                                <td className="px-4 py-2 text-sm text-red-600 dark:text-red-400">
                                                    {formatValue(change.old)}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-green-600 dark:text-green-400">
                                                    {formatValue(change.new)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {log.action === 'INSERT' && log.sql_context?.inserted_data && (
                            <DataDisplay title="Data yang Ditambahkan" data={log.sql_context.inserted_data} />
                        )}

                        {log.action === 'DELETE' && log.sql_context?.deleted_data && (
                            <DataDisplay title="Data yang Dihapus" data={log.sql_context.deleted_data} />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function InfoItem({
    label,
    value,
    valueClass = '',
}: {
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className={`text-sm font-medium text-gray-800 dark:text-white ${valueClass}`}>{value}</dd>
        </div>
    );
}

function DataDisplay({ title, data }: { title: string; data: Record<string, unknown> }) {
    return (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 text-xs font-medium text-gray-500">{title}</h4>
            <dl className="space-y-2">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4">
                        <dt className="text-sm text-gray-600 dark:text-gray-400">{key}</dt>
                        <dd className="text-sm font-medium text-gray-800 dark:text-white text-right">
                            {formatValue(value)}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}
