import React from 'react';
import { SOAPExamination } from '../../../services/vedikaService';

interface SOAPSectionProps {
    data: SOAPExamination[];
    jenis: string; // ralan or ranap
}

const SOAPSection: React.FC<SOAPSectionProps> = ({ data, jenis }) => {
    return (
        <div className="bg-white mb-6 border border-gray-300 overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300 text-[10px] font-bold text-center uppercase">
                <div className="col-span-2 border-r border-gray-300 py-1">Tanggal</div>
                <div className="col-span-1 border-r border-gray-300 py-1">Suhu(C)</div>
                <div className="col-span-1 border-r border-gray-300 py-1">Tensi</div>
                <div className="col-span-1 border-r border-gray-300 py-1">Nadi(/menit)</div>
                <div className="col-span-1 border-r border-gray-300 py-1">RR(/menit)</div>
                <div className="col-span-1 border-r border-gray-300 py-1">Tinggi(Cm)</div>
                <div className="col-span-1 border-r border-gray-300 py-1">Berat(Kg)</div>
                <div className="col-span-1 border-r border-gray-300 py-1">GCS(E,V,M)</div>
                <div className="col-span-3 py-1">Kesadaran</div>
            </div>

            {(!data || data.length === 0) ? (
                <div className="p-4 text-center text-gray-500 text-xs">Belum ada pemeriksaan {jenis === 'ranap' ? 'rawat inap' : 'rawat jalan'}.</div>
            ) : (
                data.map((exam, idx) => (
                    <div key={idx} className="border-b border-gray-300 last:border-b-0">
                        {/* Vital Signs Row */}
                        <div className="grid grid-cols-12 text-[10px] border-b border-gray-200">
                            <div className="col-span-2 border-r border-gray-300 p-1 flex items-center justify-center font-bold">
                                {exam.tgl_perawatan} {exam.jam_rawat}
                            </div>
                            <div className="col-span-1 border-r border-gray-300 p-1 flex justify-center">{exam.suhu_tubuh || '-'}</div>
                            <div className="col-span-1 border-r border-gray-300 p-1 flex justify-center">{exam.tensi || '-'}</div>
                            <div className="col-span-1 border-r border-gray-300 p-1 flex justify-center">{exam.nadi || '-'}</div>
                            <div className="col-span-1 border-r border-gray-300 p-1 flex justify-center">{exam.respirasi || '-'}</div>
                            <div className="col-span-1 border-r border-gray-300 p-1 flex justify-center">{exam.tinggi || '-'}</div>
                            <div className="col-span-1 border-r border-gray-300 p-1 flex justify-center">{exam.berat || '-'}</div>
                            <div className="col-span-1 border-r border-gray-300 p-1 flex justify-center">{exam.gcs || '-'}</div>
                            <div className="col-span-3 p-1 flex justify-center">{exam.kesadaran || '-'}</div>
                        </div>

                        {/* SOAP Body */}
                        <div className="text-[10px]">
                            <SOAPRow label="Subjek" value={exam.keluhan} />
                            <SOAPRow label="Objek" value={exam.pemeriksaan} />
                            <SOAPRow label="Asesmen" value={exam.penilaian} />
                            <SOAPRow label="Plan" value={exam.rtl} />
                            <SOAPRow label="Instruksi" value={exam.instruksi} />
                            <SOAPRow label="Evaluasi" value={exam.evaluasi} />
                            <SOAPRow label="Alergi" value={exam.alergi} />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

const SOAPRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex border-b border-gray-100 last:border-b-0 group">
        <div className="w-[100px] px-2 py-0.5 border-r border-gray-300 font-medium bg-gray-50 group-hover:bg-gray-100 transition-colors uppercase">{label}</div>
        <div className="w-[10px] flex justify-center border-r border-gray-300">:</div>
        <div className="flex-1 px-2 py-0.5 whitespace-pre-wrap">{value || '-'}</div>
    </div>
);

export default SOAPSection;
