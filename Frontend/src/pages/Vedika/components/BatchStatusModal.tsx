import { useState } from 'react';
import { vedikaService, type ClaimStatus } from '../../../services/vedikaService';
import ScrollArea from '../../../components/ui/ScrollArea';

interface BatchStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    selectedNoRawatList: string[];
    onSuccess: () => void;
}

const STATUS_OPTIONS: { value: ClaimStatus; label: string; description: string }[] = [
    { value: 'RENCANA', label: 'Rencana', description: 'Klaim belum diproses' },
    { value: 'PENGAJUAN', label: 'Pengajuan', description: 'Klaim sedang diajukan' },
    { value: 'PERBAIKAN', label: 'Perbaikan', description: 'Perlu perbaikan data' },
    { value: 'LENGKAP', label: 'Lengkap', description: 'Dokumen lengkap' },
    { value: 'SETUJU', label: 'Disetujui', description: 'Klaim disetujui' },
];

export default function BatchStatusModal({
    isOpen,
    onClose,
    selectedCount,
    selectedNoRawatList,
    onSuccess,
}: BatchStatusModalProps) {
    const [selectedStatus, setSelectedStatus] = useState<ClaimStatus>('PENGAJUAN');
    const [catatan, setCatatan] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ updated: number; failed: number } | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await vedikaService.batchUpdateStatus({
                no_rawat_list: selectedNoRawatList,
                status: selectedStatus,
                catatan: catatan || undefined,
            });
            setResult(response.data);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal mengupdate status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Batch Update Status
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {selectedCount} klaim dipilih
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <ScrollArea className="px-6 py-4 space-y-4" containerClassName="max-h-[60vh]">
                    {/* Status Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status Baru
                        </label>
                        <div className="space-y-2">
                            {STATUS_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedStatus === option.value
                                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={option.value}
                                        checked={selectedStatus === option.value}
                                        onChange={() => setSelectedStatus(option.value)}
                                        className="w-4 h-4 text-brand-500 border-gray-300 focus:ring-brand-500"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {option.label}
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {option.description}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Catatan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Catatan <span className="text-gray-400">(opsional)</span>
                        </label>
                        <textarea
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            placeholder="Tambahkan catatan untuk batch update..."
                            rows={2}
                            className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Result */}
                    {result && (
                        <div className="p-3 bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20 rounded-lg">
                            <p className="text-sm text-success-600 dark:text-success-400">
                                ✓ {result.updated} klaim berhasil diupdate
                                {result.failed > 0 && `, ${result.failed} gagal`}
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 rounded-lg">
                            <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || result !== null}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        Update {selectedCount} Klaim
                    </button>
                </div>
            </div>
        </div>
    );
}
