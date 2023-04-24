import dynamic from 'next/dynamic'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })
import { ApexOptions } from 'apexcharts'
import { colorMap, yAxisConfig, getYAxisConfig } from '@/components/ComboChart'
import { ReadingData } from '@/@types/sensorData'

type LineChartProps = {
  dataKey: keyof typeof colorMap
  data: Array<ReadingData>
  isLive: boolean
  xRange: number
}

export default function LineChart({
  dataKey,
  data,
  isLive,
  xRange,
}: LineChartProps) {
  const options: ApexOptions = {
    chart: {
      id: `${dataKey}-realtime`,
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
    colors: [colorMap[dataKey]],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
    },
    fill: {
      type: 'solid',
    },
    markers: {
      size: 0,
    },
    xaxis: {
      type: 'datetime',
      range: isLive ? xRange : undefined,
      labels: {
        datetimeUTC: false,
      },
    },
    yaxis: {
      ...getYAxisConfig(dataKey),
      opposite: false,
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'center',
    },
  }

  const series = [{
    name: yAxisConfig[dataKey].seriesName,
    type: 'line',
    data: data.map((reading) => [
      new Date(reading.readingTime).getTime(),
      reading.reading
    ]),
  }]

  return <Chart
    options={options}
    series={series}
    type="line"
    height={200}
  />
}
