import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    vedikaService,
    type ProcedureItem,
    type ICD9Item
} from '../../../services/vedikaService';
import authService from '../../../services/authService';
import ScrollArea from '../../../components/ui/ScrollArea';

interface ProcedureModalProps {
    isOpen: boolean;
    onClose: () => void;
    noRawat: string;
    initialProcedures: ProcedureItem[];
    onSuccess: () => void;
}

export default function ProcedureModal({
    isOpen,
    onClose,
    noRawat,
    initialProcedures,
    onSuccess,
}: ProcedureModalProps) {
    const [tempProcedures, setTempProcedures] = useState<ProcedureItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ICD9Item[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeType, setActiveType] = useState<'primary' | 'secondary'>('secondary');
    const [error, setError] = useState<string | null>(null);

    const canEdit = authService.hasPermission('vedika.claim.edit_medical_data');

    useEffect(() => {
        if (isOpen) {
            // Map procedures to include virtual status based on priority
            setTempProcedures(initialProcedures.map(p => ({
                ...p,
                status_px: p.prioritas === 1 ? 'Utama' : 'Sekunder'
            })));
            setError(null);
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isOpen, initialProcedures]);

    if (!isOpen) return null;

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const items = await vedikaService.searchICD9(query);
            setSearchResults(items);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const addProcedure = (icd: ICD9Item) => {
        if (activeType === 'primary') {
            const others = tempProcedures.filter(p => p.status_px !== 'Utama');
            setTempProcedures([
                {
                    kode: icd.kode,
                    nama: icd.nama,
                    status_px: 'Utama',
                    prioritas: 1
                },
                ...others
            ]);
        } else {
            if (tempProcedures.some(p => p.kode === icd.kode)) return;
            const currentSecondary = tempProcedures.filter(p => p.status_px !== 'Utama');
            setTempProcedures([
                ...tempProcedures,
                {
                    kode: icd.kode,
                    nama: icd.nama,
                    status_px: 'Sekunder',
                    prioritas: currentSecondary.length + 2 // Ensure > 1
                }
            ]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeProcedure = (kode: string) => {
        setTempProcedures(prev => prev.filter(p => p.kode !== kode));
    };

    const handleSave = async () => {
        const primary = tempProcedures.find(p => p.status_px === 'Utama');
        if (!primary && tempProcedures.length > 0) {
            // If there's data but no primary, suggest making the first one primary or just alert
            setError('Pilih minimal satu prosedur utama jika ada prosedur yang diinput');
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            // Ensure priority 1 is actually the primary one
            const sorted = [...tempProcedures].sort((a, b) => {
                if (a.status_px === 'Utama') return -1;
                if (b.status_px === 'Utama') return 1;
                return a.prioritas - b.prioritas;
            });

            await vedikaService.syncProcedures(noRawat, {
                procedures: sorted.map((p, idx) => ({
                    kode: p.kode,
                    prioritas: idx + 1
                }))
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menyimpan prosedur');
        } finally {
            setIsSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                            Kelola Prosedur (ICD-9-CM)
                        </h3>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{noRawat}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <ScrollArea className="p-6 space-y-6">
                    {/* Current List */}
                    <div className="space-y-4">
                        <section>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Prosedur Utama</h4>
                            {tempProcedures.filter(p => p.status_px === 'Utama').map(p => (
                                <div key={p.kode} className="flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-500/5 rounded border border-brand-100 dark:border-brand-500/20">
                                    <div className="text-sm">
                                        <span className="font-mono font-bold text-brand-700 dark:text-brand-400 mr-2">{p.kode}</span>
                                        <span className="text-gray-700 dark:text-gray-200">{p.nama}</span>
                                    </div>
                                    <button onClick={() => removeProcedure(p.kode)} className="text-gray-400 hover:text-red-500 px-2 font-bold text-lg">×</button>
                                </div>
                            ))}
                            {tempProcedures.filter(p => p.status_px === 'Utama').length === 0 && (
                                <div className="p-3 border border-dashed border-gray-200 dark:border-gray-700 rounded text-center">
                                    <span className="text-xs text-gray-400">Belum ada prosedur utama</span>
                                </div>
                            )}
                        </section>

                        <section>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Prosedur Sekunder</h4>
                            <div className="space-y-2">
                                {tempProcedures.filter(p => p.status_px !== 'Utama').map(p => (
                                    <div key={p.kode} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-100 dark:border-gray-700 font-medium">
                                        <div className="text-sm">
                                            <span className="font-mono font-bold text-gray-600 dark:text-gray-400 mr-2">{p.kode}</span>
                                            <span className="text-gray-600 dark:text-gray-300">{p.nama}</span>
                                        </div>
                                        <button onClick={() => removeProcedure(p.kode)} className="text-gray-400 hover:text-red-500 px-2 font-bold text-lg">×</button>
                                    </div>
                                ))}
                                {tempProcedures.filter(p => p.status_px !== 'Utama').length === 0 && (
                                    <div className="p-3 border border-dashed border-gray-200 dark:border-gray-700 rounded text-center">
                                        <span className="text-xs text-gray-400">Belum ada prosedur sekunder</span>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Search Section */}
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Pencarian Kode</h4>
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveType('primary')}
                                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-all ${activeType === 'primary' ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    Utama
                                </button>
                                <button
                                    onClick={() => setActiveType('secondary')}
                                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-all ${activeType === 'secondary' ? 'bg-white dark:bg-gray-700 text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    Sekunder
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder={activeType === 'primary' ? "Cari Prosedur..." : "Cari Prosedur..."}
                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 rounded-xl text-sm outline-none transition-all dark:text-white ${activeType === 'primary' ? 'border-brand-500/20 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5' : 'border-gray-200 dark:border-gray-700 focus:border-gray-400 focus:ring-4 focus:ring-gray-400/5'}`}
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />

                            {/* Dropdown Results */}
                            {searchQuery.length >= 2 && (
                                <div className="absolute z-[110] left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                                    {isSearching ? (
                                        <div className="p-6 text-center">
                                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                            <span className="text-xs text-gray-500">Mencari referensi ICD-9-CM...</span>
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                            {searchResults.map(res => (
                                                <button
                                                    key={res.kode}
                                                    onClick={() => addProcedure(res)}
                                                    className="w-full text-left px-4 py-4 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-mono font-bold text-brand-600 dark:group-hover:text-brand-400">{res.kode}</span>
                                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${activeType === 'primary' ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-600'}`}>
                                                            {activeType === 'primary' ? 'Utama' : 'Sekunder'}
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-700 dark:text-gray-300 text-xs line-clamp-2 leading-relaxed">{res.nama}</div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center">
                                            <div className="text-2xl mb-2">🔍</div>
                                            <div className="text-xs text-gray-500 font-medium italic">Prosedur tersebut tidak ditemukan</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400 italic">
                            * {activeType === 'primary' ? 'Hasil akan menggantikan Prosedur Utama saat ini.' : 'Hasil akan ditambahkan ke daftar Prosedur Sekunder.'}
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg">
                            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors uppercase tracking-widest disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !canEdit}
                        className="px-8 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest"
                    >
                        {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
