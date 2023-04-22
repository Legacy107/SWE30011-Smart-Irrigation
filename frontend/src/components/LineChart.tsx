import dynamic from 'next/dynamic'
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })
import { ApexOptions } from 'apexcharts'
import { SensorData } from '@/@types/sensorData'
import { StatusData } from '@/@types/statusData'

type LineChartProps = {
  data: SensorData
  statusData: StatusData
}

const colorMap = {
  soilMoisture: '#F9CE1D',
  temperature: '#FF4560',
  humidity: '#03A9F4',
  status: '#4CAF50',
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
  status: {
    min: 0,
    max: 2,
  },
}

export default function LineChart({ data, statusData }: LineChartProps) {
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
        show: true,
      },
      zoom: {
        enabled: true,
      },
    },
    colors: Object.entries(colorMap).map(([key, color]) => color),
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
          minWidth: 40,
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
          minWidth: 40,
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
          minWidth: 40,
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
      },
      {
        ...sensorBounds.status,
        tickAmount: 2,
        axisTicks: {
          show: true
        },
        axisBorder: {
          show: true,
          color: colorMap.status
        },
        labels: {
          minWidth: 40,
          style: {
            colors: colorMap.status
          },
          formatter: (value) => value === 0 ? 'Off' : value === 1 ? 'On' : ''
        },
        title: {
          text: 'Irrigation Status',
          style: {
            color: colorMap.status
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
