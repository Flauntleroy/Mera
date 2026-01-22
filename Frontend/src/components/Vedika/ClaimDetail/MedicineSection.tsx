import React from 'react';
import { MedicineItem } from '../../../services/vedikaService';

interface MedicineSectionProps {
    data: MedicineItem[];
}

const MedicineSection: React.FC<MedicineSectionProps> = ({ data }) => {
    return (
        <div className="bg-white mb-6 border border-gray-300">
            <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300 text-[10px] font-bold uppercase">
                <div className="col-span-1 border-r border-gray-300 px-3 py-1 text-center">No</div>
                <div className="col-span-4 border-r border-gray-300 px-3 py-1">Nama Obat / BMHP</div>
                <div className="col-span-1 border-r border-gray-300 px-3 py-1 text-center">Jumlah</div>
                <div className="col-span-1 border-r border-gray-300 px-3 py-1 text-center">Satuan</div>
                <div className="col-span-2 border-r border-gray-300 px-3 py-1">Dosis / Aturan Pakai</div>
                <div className="col-span-2 border-r border-gray-300 px-3 py-1 text-right">Biaya</div>
                <div className="col-span-1 px-3 py-1 text-center text-[9px]">Kategori</div>
            </div>

            {(!data || data.length === 0) ? (
                <div className="p-2 text-center text-gray-400 text-[10px]">Tidak ada data pemberian obat.</div>
            ) : (
                data.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 text-[10px] border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                        <div className="col-span-1 border-r border-gray-300 px-3 py-0.5 text-center group">
                            <span className="text-gray-300 group-hover:text-gray-500">{idx + 1}</span>
                        </div>
                        <div className="col-span-4 border-r border-gray-300 px-3 py-0.5 font-medium uppercase">{item.nama_obat}</div>
                        <div className="col-span-1 border-r border-gray-300 px-3 py-0.5 text-center">{item.jumlah}</div>
                        <div className="col-span-1 border-r border-gray-300 px-3 py-0.5 text-center text-[9px]">{item.satuan}</div>
                        <div className="col-span-2 border-r border-gray-300 px-3 py-0.5 italic">{item.dosis || '-'}</div>
                        <div className="col-span-2 border-r border-gray-300 px-3 py-0.5 text-right font-mono">{item.biaya.toLocaleString('id-ID')}</div>
                        <div className="col-span-1 px-3 py-0.5 text-center text-[9px] text-gray-400">{item.kategori}</div>
                    </div>
                ))
            )}

            {/* Total Row */}
            {data.length > 0 && (
                <div className="grid grid-cols-12 bg-gray-50 text-[10px] font-bold">
                    <div className="col-span-9 border-r border-gray-300 px-3 py-1 text-right uppercase">Total Biaya Obat</div>
                    <div className="col-span-2 border-r border-gray-300 px-3 py-1 text-right font-mono">
                        {data.reduce((sum, item) => sum + item.biaya, 0).toLocaleString('id-ID')}
                    </div>
                    <div className="col-span-1"></div>
                </div>
            )}
        </div>
    );
};

export default MedicineSection;
