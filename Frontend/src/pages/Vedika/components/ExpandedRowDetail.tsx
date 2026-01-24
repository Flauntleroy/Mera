import { useState, useEffect, useCallback } from 'react';
import {
    vedikaService,
    type IndexEpisode,
    type ClaimStatus,
    type DiagnosisItem,
    type ProcedureItem
} from '../../../services/vedikaService';
import authService from '../../../services/authService';
import DiagnosisModal from './DiagnosisModal';
import StatusUpdateModal from './StatusUpdateModal';
import ProcedureModal from './ProcedureModal';

interface ExpandedRowDetailProps {
    item: IndexEpisode;
    onRefresh: () => void;
}

const STATUS_OPTIONS: { value: ClaimStatus; label: string; color: string }[] = [
    { value: 'RENCANA', label: 'Rencana', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    { value: 'PENGAJUAN', label: 'Pengajuan', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { value: 'PERBAIKAN', label: 'Perbaikan', color: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300' },
    { value: 'LENGKAP', label: 'Lengkap', color: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' },
    { value: 'SETUJU', label: 'Disetujui', color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' },
];

export default function ExpandedRowDetail({ item, onRefresh }: ExpandedRowDetailProps) {
    // UI State
    const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([]);
    const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);

    const canEdit = authService.hasPermission('vedika.claim.edit_medical_data');

    const fetchData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const detail = await vedikaService.getClaimDetail(item.no_rawat);
            setDiagnoses(detail.data.diagnoses || []);
            setProcedures(detail.data.procedures || []);
        } catch (error) {
            console.error('Failed to fetch details:', error);
        } finally {
            setIsLoadingData(false);
        }
    }, [item.no_rawat]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const currentStatusConfig = STATUS_OPTIONS.find(o => o.value === item.status) || STATUS_OPTIONS[0];

    return (
        <tr className="bg-gray-50/50 dark:bg-gray-800/30">
            <td colSpan={8} className="px-5 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Card 1: Status Klaim Panel */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[220px]">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            STATUS KLAIM
                        </h4>

                        <div className="flex-grow">
                            <section>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-50 dark:border-gray-700 pb-1">
                                    Status Saat Ini
                                </div>
                                <div
                                    onClick={() => canEdit && setIsStatusModalOpen(true)}
                                    className={`group flex items-start gap-2 p-1.5 rounded transition-colors ${canEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default'}`}
                                >
                                    <div className="w-1 self-stretch bg-brand-500/50 rounded-full" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                                            {currentStatusConfig.label}
                                        </div>
                                        <p className="text-[9px] text-gray-500 dark:text-gray-400 font-mono uppercase tracking-tight opacity-70">
                                            {canEdit ? 'Klik untuk mengubah status' : 'Status episode'}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Card 2: Diagnosa Panel (ICD-10) */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[220px]">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            DIAGNOSA (ICD-10)
                        </h4>

                        <div className="flex-grow">
                            {isLoadingData ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Diagnosa Utama Section */}
                                    <section>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-50 dark:border-gray-700 pb-1">
                                            Diagnosa Utama
                                        </div>
                                        {diagnoses.filter(d => d.status_dx === 'Utama').map((d) => (
                                            <div
                                                key={d.kode_penyakit}
                                                onClick={() => canEdit && setIsDiagnosisModalOpen(true)}
                                                className={`group flex items-start gap-2 p-1.5 rounded transition-colors ${canEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default'}`}
                                                title={d.nama_penyakit}
                                            >
                                                <div className="w-1 self-stretch bg-brand-500/50 rounded-full" />
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-mono font-bold text-gray-900 dark:text-white mr-2">{d.kode_penyakit}</span>
                                                    <span className="text-gray-600 dark:text-gray-300 text-xs truncate block">{d.nama_penyakit}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {diagnoses.filter(d => d.status_dx === 'Utama').length === 0 && (
                                            <div
                                                onClick={() => canEdit && setIsDiagnosisModalOpen(true)}
                                                className={`text-[10px] text-gray-400 italic pl-1 py-1 rounded transition-colors ${canEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-brand-500' : ''}`}
                                            >
                                                {canEdit ? '+ Tambah diagnosa utama (Wajib)' : 'Belum ada diagnosa utama'}
                                            </div>
                                        )}
                                    </section>

                                    {/* Diagnosa Tambahan Section */}
                                    <section>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-50 dark:border-gray-700 pb-1">
                                            Diagnosa Tambahan
                                        </div>
                                        <div className="space-y-1">
                                            {diagnoses.filter(d => d.status_dx !== 'Utama').map((d) => (
                                                <div
                                                    key={d.kode_penyakit}
                                                    onClick={() => canEdit && setIsDiagnosisModalOpen(true)}
                                                    className={`group flex items-baseline gap-1.5 py-0.5 px-1 rounded transition-colors ${canEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20' : 'cursor-default'}`}
                                                    title={d.nama_penyakit}
                                                >
                                                    <span className="font-mono font-bold text-[9px] text-gray-400 dark:text-gray-500 flex-shrink-0 w-8">{d.kode_penyakit}</span>
                                                    <span className="text-gray-500 dark:text-gray-500 text-[10px] truncate block leading-tight">{d.nama_penyakit}</span>
                                                </div>
                                            ))}
                                            {diagnoses.filter(d => d.status_dx !== 'Utama').length === 0 && (
                                                <div
                                                    onClick={() => canEdit && setIsDiagnosisModalOpen(true)}
                                                    className={`text-[10px] text-gray-400 italic pl-1 py-1 rounded transition-colors ${canEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-brand-500' : ''}`}
                                                >
                                                    {canEdit ? '+ Tambah diagnosa tambahan' : 'Tidak ada diagnosa tambahan'}
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 3: Prosedur Panel (ICD-9-CM) */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[220px]">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            PROSEDUR (ICD-9-CM)
                        </h4>

                        <div className="flex-grow">
                            {isLoadingData ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Prosedur Utama Section */}
                                    <section>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-50 dark:border-gray-700 pb-1">
                                            Prosedur Utama
                                        </div>
                                        <div className="space-y-1">
                                            {procedures.filter(p => p.prioritas === 1).map((p) => (
                                                <div
                                                    key={p.kode}
                                                    onClick={() => canEdit && setIsProcedureModalOpen(true)}
                                                    className={`group flex items-start gap-2 p-1.5 rounded transition-colors ${canEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default'}`}
                                                    title={p.nama}
                                                >
                                                    <div className="w-1 self-stretch bg-brand-500/50 rounded-full" />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-mono font-bold text-gray-900 dark:text-white mr-2">{p.kode}</span>
                                                        <span className="text-gray-600 dark:text-gray-300 text-xs truncate block">{p.nama}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {procedures.filter(p => p.prioritas === 1).length === 0 && (
                                                <div
                                                    onClick={() => canEdit && setIsProcedureModalOpen(true)}
                                                    className={`text-[10px] text-gray-400 italic pl-1 py-1 rounded transition-colors ${canEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-brand-500' : ''}`}
                                                >
                                                    {canEdit ? '+ Tambah prosedur utama' : 'Belum ada prosedur utama'}
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Prosedur Tambahan Section */}
                                    <section>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-50 dark:border-gray-700 pb-1">
                                            Prosedur Tambahan
                                        </div>
                                        <div className="space-y-1">
                                            {procedures.filter(p => p.prioritas > 1).map((p) => (
                                                <div
                                                    key={p.kode}
                                                    onClick={() => canEdit && setIsProcedureModalOpen(true)}
                                                    className={`group flex items-baseline gap-1.5 py-0.5 px-1 rounded transition-colors ${canEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20' : 'cursor-default'}`}
                                                    title={p.nama}
                                                >
                                                    <span className="font-mono font-bold text-[9px] text-gray-400 dark:text-gray-500 flex-shrink-0 w-8">{p.kode}</span>
                                                    <span className="text-gray-500 dark:text-gray-500 text-[10px] truncate block leading-tight">{p.nama}</span>
                                                </div>
                                            ))}
                                            {procedures.filter(p => p.prioritas > 1).length === 0 && (
                                                <div
                                                    onClick={() => canEdit && setIsProcedureModalOpen(true)}
                                                    className={`text-[10px] text-gray-400 italic pl-1 py-1 rounded transition-colors ${canEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-brand-500' : ''}`}
                                                >
                                                    {canEdit ? '+ Tambah prosedur tambahan' : 'Tidak ada prosedur tambahan'}
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 4: Unggah Berkas */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Unggah Berkas
                        </h4>

                        <div className="flex flex-col items-center justify-center flex-grow text-center py-4">
                            <svg className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                Segera hadir:<br />Digital Medical Docs
                            </p>
                        </div>
                    </div>
                </div>
            </td>

            {/* Status Management Modal */}
            <StatusUpdateModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                noRawat={item.no_rawat}
                currentStatus={item.status}
                onSuccess={onRefresh}
            />

            {/* Diagnosis Management Modal */}
            <DiagnosisModal
                isOpen={isDiagnosisModalOpen}
                onClose={() => setIsDiagnosisModalOpen(false)}
                noRawat={item.no_rawat}
                initialDiagnoses={diagnoses}
                onSuccess={fetchData}
            />

            {/* Procedure Management Modal */}
            <ProcedureModal
                isOpen={isProcedureModalOpen}
                onClose={() => setIsProcedureModalOpen(false)}
                noRawat={item.no_rawat}
                initialProcedures={procedures}
                onSuccess={fetchData}
            />
        </tr>
    );
}
