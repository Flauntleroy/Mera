import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import type { MaturasiPersen } from '../../../services/vedikaService';

interface VedikaMaturasiChartProps {
    maturasi: MaturasiPersen;
}

export default function VedikaMaturasiChart({ maturasi }: VedikaMaturasiChartProps) {
    const options: ApexOptions = {
        chart: {
            fontFamily: 'Outfit, sans-serif',
            type: 'bar',
            height: 320,
            toolbar: {
                show: false,
            },
        },
        plotOptions: {
            bar: {
                distributed: true,
                borderRadius: 8,
                columnWidth: '60%',
                dataLabels: {
                    position: 'top',
                },
            },
        },
        colors: ['#FCA5A5', '#7DD3FC', '#FDBA74'], // Red-300, Blue-300, Orange-300
        dataLabels: {
            enabled: true,
            formatter: (val: number) => `${val.toFixed(2)}%`,
            offsetY: -30,
            style: {
                fontSize: '14px',
                fontWeight: 600,
                colors: ['#374151'],
            },
        },
        xaxis: {
            categories: ['Rencana Klaim', 'Klaim Jalan', 'Klaim Inap'],
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                style: {
                    fontSize: '12px',
                    fontWeight: 500,
                },
            },
        },
        yaxis: {
            max: 100,
            labels: {
                formatter: (val: number) => `${val}%`,
            },
        },
        grid: {
            borderColor: '#F3F4F6',
            strokeDashArray: 4,
        },
        legend: {
            show: false,
        },
        tooltip: {
            theme: 'light',
            y: {
                formatter: (val: number) => `${val.toFixed(2)}%`,
            },
        },
    };

    const series = [
        {
            name: 'Maturasi',
            data: [100, maturasi.ralan, maturasi.ranap],
        },
    ];

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
                Maturasi Klaim BPJS Dalam %
            </h3>
            <div className="h-80">
                <Chart options={options} series={series} type="bar" height="100%" />
            </div>
        </div>
    );
}
