import React from 'react';
import { BillingSummary } from '../../../services/vedikaService';

interface BillingSectionProps {
    data: BillingSummary | null;
}

const BillingSection: React.FC<BillingSectionProps> = ({ data }) => {
    if (!data) return (
        <div className="bg-gray-100 p-4 mb-6 text-center text-gray-500 text-xs italic border border-gray-300">
            Rincian billing belum tersedia atau transaksi belum closing.
        </div>
    );

    return (
        <div className="bg-white mb-6 border border-gray-300">
            <div className="bg-gray-900 text-white px-3 py-1 text-[10px] font-bold uppercase text-center">
                Rincian Biaya Perawatan ({data.mode === 'ralan' ? 'Rawat Jalan' : 'Rawat Inap'})
            </div>

            <div className="text-[10px]">
                {data.categories.map((cat, idx) => (
                    <div key={idx} className="border-b border-gray-200">
                        <div className="bg-gray-100 px-3 py-0.5 font-bold uppercase text-gray-700 flex justify-between border-b border-gray-200">
                            <span>{cat.kategori}</span>
                            <span className="font-mono">{cat.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                        {cat.items.map((item, iIdx) => (
                            <div key={iIdx} className="grid grid-cols-12 px-3 py-0.5 hover:bg-gray-50">
                                <div className="col-span-1 text-gray-300">#{iIdx + 1}</div>
                                <div className="col-span-7">{item.nama_perawatan}</div>
                                <div className="col-span-1 text-center">{item.jumlah}x</div>
                                <div className="col-span-3 text-right font-mono italic">
                                    {((item.biaya * item.jumlah) + item.tambahan).toLocaleString('id-ID')}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Total Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-300">
                <div className="flex justify-end items-center gap-8 mb-2">
                    <span className="text-xs uppercase font-bold text-gray-500">Subtotal Biaya</span>
                    <span className="text-sm font-mono font-bold">{data.jumlah_total.toLocaleString('id-ID')}</span>
                </div>
                {data.potongan > 0 && (
                    <div className="flex justify-end items-center gap-8 mb-2 text-red-600">
                        <span className="text-xs uppercase font-bold">Potongan / Diskon</span>
                        <span className="text-sm font-mono font-bold">-{data.potongan.toLocaleString('id-ID')}</span>
                    </div>
                )}
                <div className="flex justify-end items-center gap-8 mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                    <span className="text-sm uppercase font-black text-gray-800">Total Yang Harus Dibayar</span>
                    <span className="text-2xl font-mono font-black text-green-700">Rp {data.jumlah_bayar.toLocaleString('id-ID')}</span>
                </div>
                <div className="mt-4 p-2 bg-green-50 border border-green-100 text-[10px] italic text-green-800 text-right">
                    Terbilang: <strong>{data.terbilang} Rupiah</strong>
                </div>
            </div>
        </div>
    );
};

export default BillingSection;
