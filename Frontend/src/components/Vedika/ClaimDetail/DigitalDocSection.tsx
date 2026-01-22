import React from 'react';
import { DigitalDocument } from '../../../services/vedikaService';

interface DigitalDocSectionProps {
    data: DigitalDocument[];
}

const DigitalDocSection: React.FC<DigitalDocSectionProps> = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="space-y-6 mb-6 print:mt-10">
            <h3 className="text-sm font-bold uppercase border-b-2 border-brand-500 pb-1 text-brand-700 flex justify-between items-center">
                <span>Lampiran Berkas Digital / Scan Dokumen</span>
                <span className="text-[10px] font-normal text-gray-400">Total: {data.length} Berkas</span>
            </h3>

            <div className="space-y-8">
                {data.map((doc, idx) => (
                    <div key={idx} className="border border-gray-200 rounded overflow-hidden shadow-sm page-break-before">
                        <div className="bg-gray-100 px-3 py-1.5 flex justify-between items-center border-b border-gray-200">
                            <div>
                                <span className="text-[10px] font-bold bg-brand-600 text-white px-2 py-0.5 rounded mr-2 uppercase">{doc.kategori}</span>
                                <span className="text-xs font-medium text-gray-700">{doc.kode}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 italic">Diunggah: {doc.uploaded_at}</span>
                        </div>

                        <div className="bg-gray-50 p-4 flex justify-center">
                            {doc.file_url.toLowerCase().endsWith('.pdf') ? (
                                <div className="w-full text-center py-12 print:py-4">
                                    <div className="inline-flex items-center gap-3 bg-red-50 text-red-700 border border-red-200 px-6 py-3 rounded-lg print:hidden">
                                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                                            <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                                        </svg>
                                        <div className="text-left">
                                            <p className="font-bold">Berkas PDF</p>
                                            <p className="text-xs">Klik untuk membuka di tab baru</p>
                                        </div>
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-xs"
                                        >
                                            Buka Berkas
                                        </a>
                                    </div>
                                    {/* Link for print context */}
                                    <p className="hidden print:block text-xs text-gray-500">
                                        Lampiran PDF: {doc.file_url}
                                    </p>
                                </div>
                            ) : (
                                <img
                                    src={doc.file_url}
                                    alt={doc.kategori}
                                    className="max-w-full h-auto border shadow-lg print:shadow-none bg-white max-h-[800px]"
                                    loading="lazy"
                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Berkas+Gambar+Tidak+Ditemukan')}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .page-break-before {
                        page-break-before: always;
                    }
                }
            `}} />
        </div>
    );
};

export default DigitalDocSection;
