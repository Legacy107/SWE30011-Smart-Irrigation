import dynamic from 'next/dynamic'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })
import { StatusData } from '@/@types/statusData'
import { ApexOptions } from 'apexcharts'

const color = '#3F51B5';

type AreaChartProps = {
  data: StatusData
}

export default function AreaChart({ data }: AreaChartProps) {
  const options: ApexOptions = {
    chart: {
      id: 'status-realtime',
      group: '',
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 500,
        },
      },
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: true,
      },
      offsetX: -10,
    },
    colors: [color],
    title: {
      text: 'Irrigation Status',
      align: 'center',
      style: {
        color: color
      }
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'stepline',
      width: 3,
    },
    markers: {
      size: 0,
    },
    xaxis: {
      type: 'datetime',
    },
    yaxis: {
      min: 0,
      max: 2,
      tickAmount: 2,
      axisTicks: {
        show: true
      },
      axisBorder: {
        show: true,
        color: color
      },
      labels: {
        minWidth: 40,
        style: {
          colors: color
        },
        formatter: (value) => value === 0 ? 'Off' : value === 1 ? 'On' : ''
      },
    },
  }

  const series = [
    {
      name: 'Irrigation Status',
      data: data.map((data) => [
        new Date(data.readingTime).getTime(),
        data.status
      ]),
    },
  ]

  return <Chart
    style={{ paddingInline: '6.5rem' }}
    options={options}
    series={series}
    type="area"
    height={200}
  />
}