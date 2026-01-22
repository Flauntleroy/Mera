import React from 'react';
import { ProcedureItem } from '../../../services/vedikaService';

interface ProcedureSectionProps {
    data: ProcedureItem[];
}

const ProcedureSection: React.FC<ProcedureSectionProps> = ({ data }) => {
    return (
        <div className="bg-white mb-6 border border-gray-300">
            <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300 text-[10px] font-bold uppercase">
                <div className="col-span-2 border-r border-gray-300 px-3 py-1">Prosedur/Tindakan/ICD 9</div>
                <div className="col-span-2 border-r border-gray-300 px-3 py-1 text-center">Kode</div>
                <div className="col-span-6 border-r border-gray-300 px-3 py-1">Nama Tindakan</div>
                <div className="col-span-2 px-3 py-1 text-center">Status</div>
            </div>

            {(!data || data.length === 0) ? (
                <div className="p-2 text-center text-gray-400 text-[10px]">No procedure data available.</div>
            ) : (
                data.map((proc, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-[10px] border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                        <div className="col-span-2 border-r border-gray-300 px-3 py-0.5 bg-gray-50 font-medium">#{idx + 1}</div>
                        <div className="col-span-2 border-r border-gray-300 px-3 py-0.5 text-center font-mono font-bold">{proc.kode}</div>
                        <div className="col-span-6 border-r border-gray-300 px-3 py-0.5 uppercase">{proc.nama}</div>
                        <div className="col-span-2 px-3 py-0.5 text-center italic">Selesai</div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ProcedureSection;
