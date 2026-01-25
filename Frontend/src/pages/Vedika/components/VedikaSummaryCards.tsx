import {
    CheckCircleIcon,
    DocsIcon,
    AlertIcon
} from '../../../icons';
import type { DashboardSummary } from '../../../services/vedikaService';

interface VedikaSummaryCardsProps {
    summary: DashboardSummary;
}

export default function VedikaSummaryCards({ summary }: VedikaSummaryCardsProps) {
    const cards = [
        {
            title: 'Rencana Klaim',
            description: 'Episode eligible untuk klaim',
            icon: CheckCircleIcon,
            ralan: summary.rencana.ralan,
            ranap: summary.rencana.ranap,
            total: summary.rencana.ralan + summary.rencana.ranap,
            isPercentage: false,
            bgColor: 'bg-error-50 dark:bg-error-500/10',
            iconColor: 'text-error-600 dark:text-error-400',
            borderColor: 'border-error-200 dark:border-error-500/20',
        },
        {
            title: 'Status Lengkap',
            description: 'Klaim siap untuk diajukan',
            icon: DocsIcon,
            ralan: summary.lengkap.ralan,
            ranap: summary.lengkap.ranap,
            total: summary.lengkap.ralan + summary.lengkap.ranap,
            isPercentage: false,
            bgColor: 'bg-blue-light-50 dark:bg-blue-light-500/10',
            iconColor: 'text-blue-light-600 dark:text-blue-light-400',
            borderColor: 'border-blue-light-200 dark:border-blue-light-500/20',
        },
        {
            title: 'Status Pengajuan',
            description: 'Sudah diajukan ke Vedika',
            icon: DocsIcon,
            ralan: summary.pengajuan.ralan,
            ranap: summary.pengajuan.ranap,
            total: summary.pengajuan.ralan + summary.pengajuan.ranap,
            isPercentage: false,
            bgColor: 'bg-warning-50 dark:bg-warning-500/10',
            iconColor: 'text-warning-600 dark:text-warning-400',
            borderColor: 'border-warning-200 dark:border-warning-500/20',
        },
        {
            title: 'Status Perbaikan',
            description: 'Klaim perlu diperbaiki',
            icon: AlertIcon,
            ralan: summary.perbaikan.ralan,
            ranap: summary.perbaikan.ranap,
            total: summary.perbaikan.ralan + summary.perbaikan.ranap,
            isPercentage: false,
            bgColor: 'bg-success-50 dark:bg-success-500/10',
            iconColor: 'text-success-600 dark:text-success-400',
            borderColor: 'border-success-200 dark:border-success-500/20',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.title}
                        className={`rounded-2xl border ${card.borderColor} bg-white p-5 dark:bg-white/[0.03] md:p-6 transition-all hover:shadow-lg`}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${card.bgColor}`}>
                                <Icon className={`size-6 ${card.iconColor}`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-white">
                                    {card.title}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {card.description}
                                </p>
                            </div>
                        </div>

                        {/* Breakdown Ralan / Ranap */}
                        <div className="mt-5 space-y-3">
                            {/* Ralan */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-md bg-blue-light-100 text-blue-light-700 dark:bg-blue-light-500/20 dark:text-blue-light-300">
                                        RJ
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Rawat Jalan
                                    </span>
                                </div>
                                <span className="font-bold text-gray-800 dark:text-white text-lg">
                                    {card.isPercentage ? `${card.ralan.toFixed(1)}%` : card.ralan.toLocaleString()}
                                </span>
                            </div>

                            {/* Ranap */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-md bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                        RI
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Rawat Inap
                                    </span>
                                </div>
                                <span className="font-bold text-gray-800 dark:text-white text-lg">
                                    {card.isPercentage ? `${card.ranap.toFixed(1)}%` : card.ranap.toLocaleString()}
                                </span>
                            </div>

                            {/* Total (only for count cards) */}
                            {!card.isPercentage && (
                                <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Total
                                        </span>
                                        <span className="font-bold text-xl text-gray-900 dark:text-white">
                                            {card.total.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
