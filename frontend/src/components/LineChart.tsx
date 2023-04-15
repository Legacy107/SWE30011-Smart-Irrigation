import dynamic from 'next/dynamic'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })
import { SensorData } from '@/@types/sensorData'
import { ApexOptions } from 'apexcharts'

type LineChartProps = {
  data: SensorData
}

const colorMap = {
  soilMoisture: '#ff9800',
  temperature: '#f50057',
  humidity: '#3f51b5',
}

const sensorBounds = {
  soilMoisture: {
    min: 0,
    max: 150,
  },
  temperature: {
    min: 0,
    max: 150,
  },
  humidity: {
    min: 0,
    max: 150,
  },
}

export default function LineChart({ data }: LineChartProps) {
  const options: ApexOptions = {
    chart: {
      id: 'realtime',
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
    },
    colors: [colorMap.soilMoisture, colorMap.temperature, colorMap.humidity],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
    },
    markers: {
      size: 0,
    },
    xaxis: {
      type: 'datetime',
    },
    yaxis: [
      {
        ...sensorBounds.soilMoisture,
        axisTicks: {
          show: true
        },
        axisBorder: {
          show: true,
          color: colorMap.soilMoisture
        },
        labels: {
          style: {
            colors: colorMap.soilMoisture
          }
        },
        title: {
          text: 'Soil Moisture',
          style: {
            color: colorMap.soilMoisture
          }
        }
      },
      {
        ...sensorBounds.temperature,
        opposite: true,
        axisTicks: {
          show: true
        },
        axisBorder: {
          show: true,
          color: colorMap.temperature
        },
        labels: {
          style: {
            colors: colorMap.temperature
          }
        },
        title: {
          text: 'Temperature',
          style: {
            color: colorMap.temperature
          }
        }
      },
      {
        ...sensorBounds.humidity,
        opposite: true,
        axisTicks: {
          show: true
        },
        axisBorder: {
          show: true,
          color: colorMap.humidity
        },
        labels: {
          style: {
            colors: colorMap.humidity
          }
        },
        title: {
          text: 'Humidity',
          style: {
            color: colorMap.humidity
          }
        }
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
      data: data.soilMoisture.map((reading) => [new Date(reading.readingTime).getTime(), reading.reading]),
    },
    {
      name: 'Temperature',
      data: data.temperature.map((reading) => [new Date(reading.readingTime).getTime(), reading.reading]),
    },
    {
      name: 'Humidity',
      data: data.humidity.map((reading) => [new Date(reading.readingTime).getTime(), reading.reading]),
    },
  ]

  return <Chart options={options} series={series} type="line" height={500} />
}
