import React from 'react';
import { RadiologyFullData } from '../../../services/vedikaService';

interface RadiologySectionProps {
    data: RadiologyFullData;
}

const RadiologySection: React.FC<RadiologySectionProps> = ({ data }) => {
    const hasExams = data?.exams && data.exams.length > 0;
    const hasResults = data?.results && data.results.length > 0;
    if (!hasExams && !hasResults) return null;

    return (
        <div className="space-y-4 mb-6">
            {/* Radiology Header / List */}
            {hasExams && (
                <div className="bg-white border border-gray-300">
                    <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300 text-[10px] font-bold uppercase">
                        <div className="col-span-3 border-r border-gray-300 px-3 py-1">Pemeriksaan Radiologi</div>
                        <div className="col-span-5 border-r border-gray-300 px-3 py-1">Nama Layanan</div>
                        <div className="col-span-2 border-r border-gray-300 px-3 py-1 text-center">Tgl Periksa</div>
                        <div className="col-span-2 px-3 py-1 text-right">Biaya</div>
                    </div>
                    {data.exams.map((exam, idx) => (
                        <div key={idx} className="grid grid-cols-12 text-[10px] border-b border-gray-200 last:border-b-0">
                            <div className="col-span-3 border-r border-gray-300 px-3 py-0.5">{exam.kode}</div>
                            <div className="col-span-5 border-r border-gray-300 px-3 py-0.5 uppercase">{exam.nama}</div>
                            <div className="col-span-2 border-r border-gray-300 px-3 py-0.5 text-center">{exam.tgl_periksa}</div>
                            <div className="col-span-2 px-3 py-0.5 text-right font-mono">{exam.biaya.toLocaleString('id-ID')}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Interpretation Results */}
            {hasResults && data.results.map((result, idx) => (
                <div key={idx} className="bg-white border border-gray-300">
                    <div className="bg-blue-900 text-white px-3 py-1 text-[10px] font-bold uppercase flex justify-between">
                        <span>Hasil Expertise Radiologi #{idx + 1}</span>
                        <span>{result.tgl_periksa} {result.jam}</span>
                    </div>
                    <div className="p-4 text-[11px] space-y-4">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold border-b border-gray-200 mb-2 uppercase text-gray-500 text-[10px]">Klinis / Diagnosa</h4>
                                <p className="italic">{result.klinis || '-'}</p>
                            </div>
                            <div>
                                <h4 className="font-bold border-b border-gray-200 mb-2 uppercase text-gray-500 text-[10px]">Judul Pemeriksaan</h4>
                                <p className="font-bold">{result.judul || '-'}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold border-b border-gray-200 mb-2 uppercase text-gray-500 text-[10px]">Interpretasi / Hasil</h4>
                            <div className="bg-gray-50 p-3 border border-gray-200 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                                {result.hasil}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="bg-yellow-50 p-2 border border-yellow-100">
                                <h4 className="font-bold border-b border-yellow-200 mb-1 uppercase text-yellow-700 text-[9px]">Kesan</h4>
                                <p className="font-medium">{result.kesan || '-'}</p>
                            </div>
                            <div className="bg-green-50 p-2 border border-green-100">
                                <h4 className="font-bold border-b border-green-200 mb-1 uppercase text-green-700 text-[9px]">Saran</h4>
                                <p>{result.saran || '-'}</p>
                            </div>
                        </div>

                        {/* Images Section */}
                        {result.gambar && result.gambar.length > 0 && (
                            <div className="mt-4 print:mt-10">
                                <h4 className="font-bold border-b border-gray-200 mb-4 uppercase text-gray-500 text-[10px]">Lampiran Gambar</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {result.gambar.map((img, imgIdx) => (
                                        <div key={imgIdx} className="border border-gray-200 p-1 bg-white shadow-sm">
                                            <img
                                                src={img.startsWith('http') ? img : `/radiologi/${img}`}
                                                alt={`Hasil Rad ${imgIdx + 1}`}
                                                className="w-full h-auto object-contain max-h-[300px]"
                                                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Gambar+Radiologi+Tidak+Ditemukan')}
                                            />
                                            <p className="text-[9px] text-center mt-1 text-gray-400 font-mono">{img}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RadiologySection;
