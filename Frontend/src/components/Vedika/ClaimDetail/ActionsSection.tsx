import React from 'react';
import { MedicalAction } from '../../../services/vedikaService';

interface ActionsSectionProps {
    data: MedicalAction[];
}

const ActionsSection: React.FC<ActionsSectionProps> = ({ data }) => {
    return (
        <div className="bg-white mb-6 border border-gray-300">
            <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300 text-[10px] font-bold uppercase">
                <div className="col-span-2 border-r border-gray-300 px-3 py-1">Tindakan Medis</div>
                <div className="col-span-3 border-r border-gray-300 px-3 py-1">Nama Tindakan</div>
                <div className="col-span-3 border-r border-gray-300 px-3 py-1">Dokter / Petugas</div>
                <div className="col-span-2 border-r border-gray-300 px-3 py-1 text-center">Tanggal & Jam</div>
                <div className="col-span-2 px-3 py-1 text-center">Kategori</div>
            </div>

            {(!data || data.length === 0) ? (
                <div className="p-2 text-center text-gray-400 text-[10px]">Tidak ada data tindakan medis.</div>
            ) : (
                data.map((action, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-[10px] border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                        <div className="col-span-2 border-r border-gray-300 px-3 py-0.5 bg-gray-50 font-medium">#{idx + 1} ({action.kode})</div>
                        <div className="col-span-3 border-r border-gray-300 px-3 py-0.5 uppercase">{action.nama}</div>
                        <div className="col-span-3 border-r border-gray-300 px-3 py-0.5 truncate italic">
                            {action.dokter || action.petugas || '-'}
                        </div>
                        <div className="col-span-2 border-r border-gray-300 px-3 py-0.5 text-center font-mono">
                            {action.tanggal} {action.jam}
                        </div>
                        <div className="col-span-2 px-3 py-0.5 text-center text-[9px] text-gray-500">
                            {action.kategori}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ActionsSection;
