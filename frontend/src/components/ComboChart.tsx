import dynamic from 'next/dynamic'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })
import { ApexOptions } from 'apexcharts'
import { SensorData } from '@/@types/sensorData'
import { StatusData } from '@/@types/statusData'

export const colorMap = {
  soilMoisture: '#FEB019',
  temperature: '#FF4560',
  humidity: '#03A9F4',
  status: '#4CAF50',
}

export const sensorBounds = {
  soilMoisture: {
    min: 0,
    max: 700,
  },
  temperature: {
    min: 0,
    max: 50,
  },
  humidity: {
    min: 0,
    max: 100,
  },
  status: {
    min: 0,
    max: 2,
    tickAmount: 2,
  },
}

export const yAxisConfig = {
  soilMoisture: {
    seriesName: 'Soil Moisture',
    opposite: false,
  },
  temperature: {
    seriesName: 'Temperature',
    opposite: true,
  },
  humidity: {
    seriesName: 'Humidity',
    opposite: true,
  },
  status: {
    seriesName: 'Irrigation Status',
    opposite: false,
  },
}

export const getYAxisConfig = (sensor: keyof typeof colorMap): ApexYAxis => ({
  ...sensorBounds[sensor],
  ...yAxisConfig[sensor],
  axisTicks: {
    show: true
  },
  axisBorder: {
    show: true,
    color: colorMap[sensor]
  },
  labels: {
    minWidth: 40,
    style: {
      colors: colorMap[sensor]
    }
  },
  title: {
    text: yAxisConfig[sensor].seriesName,
    style: {
      color: colorMap[sensor]
    }
  }
})

type ComboChartProps = {
  data: SensorData
  statusData: StatusData
  isLive: boolean
}

export default function ComboChart({
  data,
  statusData,
  isLive
}: ComboChartProps) {
  const options: ApexOptions = {
    chart: {
      id: 'data-realtime',
      group: 'realtime',
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
    colors: Object.entries(colorMap).map(([, color]) => color),
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: ['smooth', 'smooth', 'smooth', 'stepline'],
      width: [3, 3, 3, 1],
    },
    fill: {
      type: ['solid', 'solid', 'solid', 'gradient'],
      gradient: {
        inverseColors: false,
        shade: 'light',
        type: 'vertical',
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [5, 100, 100, 100],
      },
    },
    markers: {
      size: 0,
    },
    xaxis: {
      type: 'datetime',
      range: isLive ? 21600000 : undefined,
      labels: {
        datetimeUTC: false,
      },
    },
    yaxis: [
      getYAxisConfig('soilMoisture'),
      getYAxisConfig('temperature'),
      getYAxisConfig('humidity'),
      {
        ...getYAxisConfig('status'),
        labels: {
          ...getYAxisConfig('status').labels,
          formatter: (value) => value === 0 ? 'Off' : value === 1.0 ? 'On' : ''
        },
      }
    ],
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'center',
    },
  }

  const series = [
    {
      name: 'Soil Moisture',
      type: 'line',
      data: data.soilMoisture.map((reading) => [
        new Date(reading.readingTime).getTime(),
        reading.reading
      ]),
    },
    {
      name: 'Temperature',
      type: 'line',
      data: data.temperature.map((reading) => [
        new Date(reading.readingTime).getTime(),
        reading.reading
      ]),
    },
    {
      name: 'Humidity',
      type: 'line',
      data: data.humidity.map((reading) => [
        new Date(reading.readingTime).getTime(),
        reading.reading
      ]),
    },
    {
      name: 'Irrigation Status',
      type: 'area',
      data: statusData.map((reading) => [
        new Date(reading.readingTime).getTime(),
        reading.status
      ]),
    },
  ]

  return <Chart options={options} series={series} type="line" height={500} />
}
