import React from 'react';
import { OperationItem, OperationReport } from '../../../services/vedikaService';

interface OperationSectionProps {
    ops: OperationItem[];
    reports: OperationReport[];
}

const OperationSection: React.FC<OperationSectionProps> = ({ ops, reports }) => {
    const hasOps = ops && ops.length > 0;
    const hasReports = reports && reports.length > 0;
    if (!hasOps && !hasReports) return null;

    return (
        <div className="space-y-4 mb-6">
            {/* Operation List Table */}
            {hasOps && (
                <div className="bg-white border border-gray-300">
                    <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300 text-[10px] font-bold uppercase">
                        <div className="col-span-3 border-r border-gray-300 px-3 py-1">Tindakan Operasi</div>
                        <div className="col-span-5 border-r border-gray-300 px-3 py-1">Nama Paket/Tindakan</div>
                        <div className="col-span-2 border-r border-gray-300 px-3 py-1 text-center">Tgl Operasi</div>
                        <div className="col-span-2 px-3 py-1 text-center">Anastesi</div>
                    </div>
                    {ops.map((op, idx) => (
                        <div key={idx} className="grid grid-cols-12 text-[10px] border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                            <div className="col-span-3 border-r border-gray-300 px-3 py-0.5 font-medium">{op.kode_paket}</div>
                            <div className="col-span-5 border-r border-gray-300 px-3 py-0.5 uppercase">{op.nama_tindakan}</div>
                            <div className="col-span-2 border-r border-gray-300 px-3 py-0.5 text-center font-mono">{op.tgl_operasi}</div>
                            <div className="col-span-2 px-3 py-0.5 text-center">{op.jenis_anastesi}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Operation Reports */}
            {hasReports && reports.map((report, idx) => (
                <div key={idx} className="bg-white border border-gray-300">
                    <div className="bg-gray-800 text-white px-3 py-1 text-[10px] font-bold uppercase flex justify-between">
                        <span>Laporan Operasi #{idx + 1}</span>
                        <span>Operator: {report.dokter_operator}</span>
                    </div>
                    <div className="p-3 text-[10px] space-y-2">
                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-6 border-b border-gray-100 pb-1">
                                <span className="font-bold block uppercase text-gray-500 text-[9px]">Diagnosa Pre-Op</span>
                                <p className="mt-1">{report.diagnosa_preop || '-'}</p>
                            </div>
                            <div className="col-span-6 border-b border-gray-100 pb-1">
                                <span className="font-bold block uppercase text-gray-500 text-[9px]">Diagnosa Post-Op</span>
                                <p className="mt-1">{report.diagnosa_postop || '-'}</p>
                            </div>
                        </div>
                        <div>
                            <span className="font-bold block uppercase text-gray-500 text-[9px]">Laporan Tindakan</span>
                            <div className="mt-1 p-2 bg-gray-50 border border-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                                {report.laporan_operasi}
                            </div>
                        </div>
                        <div className="flex justify-between text-[9px] italic text-gray-400">
                            <span>Mulai: {report.tanggal}</span>
                            <span>Selesai: {report.selesai_operasi}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OperationSection;
