import dynamic from 'next/dynamic'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })
import { StatusData } from '@/@types/statusData'
import { ApexOptions } from 'apexcharts'
import { colorMap, yAxisConfig, getYAxisConfig } from '@/components/ComboChart'

type AreaChartProps = {
  data: StatusData
  isLive: boolean
}

export default function AreaChart({ data, isLive }: AreaChartProps) {
  const options: ApexOptions = {
    chart: {
      id: 'status-realtime',
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 500,
        },
      },
      toolbar: {
        show: !isLive,
        autoSelected: isLive ? 'selection' : 'zoom',
      },
      zoom: {
        enabled: true,
      },
    },
    colors: [colorMap.status],
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
      range: isLive ? 21600000 : undefined, // 6 hours
      labels: {
        datetimeUTC: false,
      },
    },
    yaxis: {
      ...getYAxisConfig('status'),
      labels: {
        ...getYAxisConfig('status').labels,
        formatter: (value) => value === 0 ? 'Off' : value === 1 ? 'On' : ''
      },
    },
  }

  const series = [
    {
      name: yAxisConfig.status.seriesName,
      data: data.map((data) => [
        new Date(data.readingTime).getTime(),
        data.status
      ]),
    },
  ]

  return <Chart
    options={options}
    series={series}
    type="area"
    height={200}
  />
}