import { useState } from 'react';
import { createPortal } from 'react-dom';
import { vedikaService, type ClaimStatus } from '../../../services/vedikaService';
import ScrollArea from '../../../components/ui/ScrollArea';

interface StatusUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    noRawat: string;
    currentStatus: ClaimStatus;
    onSuccess: () => void;
}

const STATUS_OPTIONS: { value: ClaimStatus; label: string; description: string }[] = [
    { value: 'RENCANA', label: 'Rencana', description: 'Klaim belum diproses' },
    { value: 'PENGAJUAN', label: 'Pengajuan', description: 'Klaim sedang diajukan' },
    { value: 'PERBAIKAN', label: 'Perbaikan', description: 'Perlu perbaikan data' },
    { value: 'LENGKAP', label: 'Lengkap', description: 'Dokumen lengkap' },
    { value: 'SETUJU', label: 'Disetujui', description: 'Klaim disetujui' },
];

export default function StatusUpdateModal({
    isOpen,
    onClose,
    noRawat,
    currentStatus,
    onSuccess,
}: StatusUpdateModalProps) {
    const [selectedStatus, setSelectedStatus] = useState<ClaimStatus>(currentStatus);
    const [catatan, setCatatan] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (selectedStatus === currentStatus && !catatan) {
            setError('Pilih status baru atau tambahkan catatan');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await vedikaService.updateClaimStatus(noRawat, {
                status: selectedStatus,
                catatan: catatan || undefined,
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal mengupdate status');
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
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
                            Ubah Status Klaim
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                            {noRawat}
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
                            Status Klaim
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
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {option.label}
                                            </span>
                                            {option.value === currentStatus && (
                                                <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                                                    Saat ini
                                                </span>
                                            )}
                                        </div>
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
                            placeholder="Tambahkan catatan atau feedback..."
                            rows={3}
                            className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none"
                        />
                    </div>

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
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        Simpan
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
