import React from 'react';
import { SEPDetail } from '../../../services/vedikaService';

interface SEPSectionProps {
    data: SEPDetail | null;
}

const SEPSection: React.FC<SEPSectionProps> = ({ data }) => {
    if (!data) {
        return (
            <div className="bg-white p-8 mb-4 border border-dashed border-gray-300 text-center text-gray-500 rounded">
                Data SEP tidak ditemukan atau belum ada SEP untuk nomor rawat ini.
            </div>
        );
    }

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
                    <h2 className="text-2xl font-bold tracking-widest uppercase">Surat Eligibilitas Peserta</h2>
                </div>
            </div>

            {/* Barcode Mockup */}
            <div className="flex justify-center mb-6">
                <div className="border border-black px-4 py-2 flex flex-col items-center">
                    <div className="h-10 w-64 bg-black mb-1"></div>
                    <span className="text-xs font-mono font-bold">{data.no_sep}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-sm">
                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">No. SEP</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold">{data.no_sep}</span>
                </div>
                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">Peserta</span>
                    <span className="mr-2">:</span>
                    <span>{data.peserta}</span>
                </div>

                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">Tgl. SEP</span>
                    <span className="mr-2">:</span>
                    <span>{data.tgl_sep}</span>
                </div>
                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">COB</span>
                    <span className="mr-2">:</span>
                    <span>{data.cob || '-'}</span>
                </div>

                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">No. Kartu</span>
                    <span className="mr-2">:</span>
                    <span>{data.no_kartu} (MR: {data.no_rm})</span>
                </div>
                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">Jns. Rawat</span>
                    <span className="mr-2">:</span>
                    <span>{data.jenis_pelayanan}</span>
                </div>

                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">Nama Peserta</span>
                    <span className="mr-2">:</span>
                    <span className="uppercase font-bold">{data.nama_peserta}</span>
                </div>
                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">Kls. Rawat</span>
                    <span className="mr-2">:</span>
                    <span>Kelas {data.kelas_rawat}</span>
                </div>

                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">Tgl. Lahir</span>
                    <span className="mr-2">:</span>
                    <span>{data.tgl_lahir} Kelamin: {data.jenis_kelamin}</span>
                </div>
                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">Penjamin</span>
                    <span className="mr-2">:</span>
                    <span>-</span>
                </div>

                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">No. Telepon</span>
                    <span className="mr-2">:</span>
                    <span>{data.no_telp}</span>
                </div>
                <div className="flex border-b border-gray-100 py-1 invisible">
                    <span className="w-32 font-medium"></span>
                    <span className="mr-2"></span>
                    <span></span>
                </div>

                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">Sub/Spesialis</span>
                    <span className="mr-2">:</span>
                    <span>{data.poli_tujuan}</span>
                </div>
                <div className="flex mt-8 col-start-2 row-start-7 row-span-4 justify-end items-end">
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] mb-1 italic">Pasien/Keluarga Pasien</p>
                        <div className="w-20 h-20 border border-black mb-1 p-1">
                            {/* QR Code Placeholder */}
                            <div className="w-full h-full bg-[repeating-conic-gradient(#000_0%_25%,#fff_0%_50%)] bg-[length:10px_10px]"></div>
                        </div>
                        <p className="text-[10px] font-bold underline uppercase">{data.nama_peserta}</p>
                    </div>
                </div>

                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">DPJP Yg Melayani</span>
                    <span className="mr-2">:</span>
                    <span className="uppercase">{data.dpjp}</span>
                </div>

                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">Faskes Perujuk</span>
                    <span className="mr-2">:</span>
                    <span>{data.faskes_perujuk}</span>
                </div>

                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">Diagnosa Awal</span>
                    <span className="mr-2">:</span>
                    <span>{data.diagnosa_awal}</span>
                </div>

                <div className="flex border-b border-gray-100 py-1">
                    <span className="w-32 font-medium">Catatan</span>
                    <span className="mr-2">:</span>
                    <span>{data.catatan}</span>
                </div>
            </div>

            <div className="mt-8 text-[10px] text-gray-500 italic">
                <p>* Saya menyetujui BPJS Kesehatan menggunakan informasi medis pasien bila diperlukan.</p>
                <p>* SEP bukan sebagai bukti penjaminan peserta</p>
                <p>Cetakan 1: {new Date().toLocaleString('id-ID')}</p>
            </div>
        </div>
    );
};

export default SEPSection;
