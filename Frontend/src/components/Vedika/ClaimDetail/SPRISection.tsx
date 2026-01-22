import React from 'react';
import { SPRIDetail } from '../../../services/vedikaService';

interface SPRISectionProps {
    data: SPRIDetail | null;
}

const SPRISection: React.FC<SPRISectionProps> = ({ data }) => {
    if (!data) return null;

    return (
        <div className="bg-white p-8 mb-6 border border-gray-200 print:border-0 print:p-0">
            {/* Header BPJS */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        BPJS
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-green-700 leading-tight">BPJS Kesehatan</h1>
                        <p className="text-sm text-gray-600 font-medium">Badan Penyelenggara Jaminan Sosial</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-bold tracking-tight uppercase">Surat Perintah Rawat Inap (SPRI)</h2>
                    <p className="text-xs font-mono">{data.no_surat}</p>
                </div>
            </div>

            <div className="space-y-4 text-sm leading-relaxed">
                <p>Mohon diberikan rawat inap terhadap pasien:</p>

                <div className="grid grid-cols-1 gap-1 ml-4">
                    <div className="flex">
                        <span className="w-40">No. Kartu</span>
                        <span className="mr-2">:</span>
                        <span className="font-bold">{data.no_kartu}</span>
                    </div>
                    <div className="flex">
                        <span className="w-40">Nama Peserta</span>
                        <span className="mr-2">:</span>
                        <span className="font-bold uppercase">{data.nama_pasien}</span>
                    </div>
                    <div className="flex">
                        <span className="w-40">Tgl. Lahir / Kelamin</span>
                        <span className="mr-2">:</span>
                        <span>{data.tgl_lahir} / {data.jenis_kelamin}</span>
                    </div>
                    <div className="flex">
                        <span className="w-40">Diagnosa Awal</span>
                        <span className="mr-2">:</span>
                        <span>{data.diagnosa_awal}</span>
                    </div>
                    <div className="flex">
                        <span className="w-40">Rencana Inap</span>
                        <span className="mr-2">:</span>
                        <span className="font-bold underline">{data.tgl_rencana}</span>
                    </div>
                </div>

                <p className="mt-4">Demikian surat ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>

                <div className="mt-12 flex justify-between items-end">
                    <div className="text-xs italic text-gray-400">
                        Dicetak pada: {new Date().toLocaleString('id-ID')}
                    </div>
                    <div className="text-center w-64">
                        <p className="mb-1 text-xs">{new Date().toLocaleDateString('id-ID')}</p>
                        <p className="mb-16 font-medium">Dokter yang menyetujui,</p>
                        <p className="font-bold underline uppercase">{data.nama_dokter}</p>
                        <p className="text-[10px] text-gray-500">Spesialis: {data.nama_poli}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SPRISection;
