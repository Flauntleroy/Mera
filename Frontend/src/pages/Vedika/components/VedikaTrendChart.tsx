import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import type { TrendItem } from '../../../services/vedikaService';

interface VedikaTrendChartProps {
    data: TrendItem[];
    title?: string;
}

export default function VedikaTrendChart({
    data,
    title = 'Trend Klaim Harian'
}: VedikaTrendChartProps) {
    // Transform data for chart
    const chartData = useMemo(() => {
        const categories = data.map((item) => formatDate(item.date));
        const rencanaSeries = data.map((item) => item.rencana.ralan + item.rencana.ranap);
        const pengajuanSeries = data.map((item) => item.pengajuan.ralan + item.pengajuan.ranap);

        return { categories, rencanaSeries, pengajuanSeries };
    }, [data]);

    const options: ApexOptions = {
        chart: {
            fontFamily: 'Outfit, sans-serif',
            type: 'line',
            height: 320,
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        colors: ['#0ba5ec', '#12b76a'], // blue-light-500 for Rencana, success-500 for Pengajuan
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        markers: {
            size: 4,
            strokeWidth: 0,
            hover: {
                size: 6,
            },
        },
        xaxis: {
            categories: chartData.categories,
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                style: {
                    colors: '#98a2b3', // gray-400
                    fontSize: '12px',
                },
            },
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#98a2b3', // gray-400
                    fontSize: '12px',
                },
                formatter: (val: number) => Math.round(val).toString(),
            },
        },
        grid: {
            borderColor: '#e4e7ec', // gray-200
            strokeDashArray: 3,
            xaxis: {
                lines: {
                    show: false,
                },
            },
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'left',
            fontFamily: 'Outfit',
            fontSize: '13px',
            markers: {
                size: 8,
                shape: 'circle',
                offsetX: -4,
            },
            itemMargin: {
                horizontal: 16,
            },
        },
        tooltip: {
            shared: true,
            intersect: false,
            theme: 'light',
            y: {
                formatter: (val: number) => `${val} klaim`,
            },
        },
        dataLabels: {
            enabled: false,
        },
    };

    const series = [
        {
            name: 'Rencana',
            data: chartData.rencanaSeries,
        },
        {
            name: 'Pengajuan',
            data: chartData.pengajuanSeries,
        },
    ];

    if (data.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    {title}
                </h3>
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    Tidak ada data trend untuk periode ini
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                {title}
            </h3>

            <div className="max-w-full overflow-x-auto custom-scrollbar">
                <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
                    <Chart options={options} series={series} type="line" height={320} />
                </div>
            </div>

            {/* Legend explanation */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Chart menampilkan total klaim (Ralan + Ranap) per hari sesuai periode klaim aktif.
                </p>
            </div>
        </div>
    );
}

// Helper function to format date
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
    });
}
