import { useEffect, useState } from 'react'
import { useMqttState } from 'mqtt-react-hooks'
import { useSubscription } from 'mqtt-react-hooks'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'
// mui
import {
  Box,
  Stack,
  Switch,
  Typography,
  Select,
  MenuItem,
  styled
} from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
// components
import ComboChart from '@/components/ComboChart'
import AreaChart from '@/components/AreaChart'
import { StatusData } from '@/@types/statusData'
import LineChart from '@/components/LineChart'
import DataTable from '@/components/DataTable'
// types
import { SensorData } from '@/@types/sensorData'

const RootStyle = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 'clamp(300px, 95%, 1200px)',
  margin: '2rem auto',
  gap: '1rem',
}))

const timeRanges = {
  '5 minutes': 3600000 / 12,
  '30 mintues': 3600000 / 2,
  '1 hour': 3600000,
  '3 hours': 3 * 3600000,
  '6 hours': 6 * 3600000,
}

export default function Home() {
  const [status, setStatus] = useState<number>(0)
  const [data, setData] = useState<SensorData | null>(null)
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [minTime, setMinTime] = useState<Dayjs | null>(dayjs(new Date()).subtract(6, 'hour'))
  const [maxTime, setMaxTime] = useState<Dayjs | null>(dayjs(new Date()))
  const { client: mqttClient, connectionStatus: mqttStatus } = useMqttState()
  const { message: statusMessage } = useSubscription([ 'status/reading' ])
  const { message: sensorMessage } = useSubscription([ 'sensor/#' ])
  const [isLive, setIsLive] = useState<boolean>(true)
  const [xRange, setXRange] = useState<keyof typeof timeRanges>('30 mintues')

  useEffect(() => {
    if (!statusMessage || !isLive)
      return
    const data = JSON.parse(statusMessage?.message as string)
    setStatusData((statusData) => [...statusData as StatusData, {
      status: parseInt(data.status),
      readingTime: data.readingTime,
    }])
  }, [statusMessage])

  useEffect(() => {
    if (!sensorMessage || !isLive)
      return
    const sensor = sensorMessage?.topic?.split('/')[1]
    const messageData = JSON.parse(sensorMessage?.message as string)
    const newSensorData = { ...data } as SensorData
    newSensorData[sensor as keyof SensorData].push(messageData)
    setData(newSensorData)
  }, [sensorMessage])

  useEffect(() => {
    fetchLatestStatus()
  }, [])

  useEffect(() => {
    fetchSensorData()
    fetchStatusData()
  }, [minTime, maxTime, isLive])

  const fetchSensorData = async () => {
    try {
      const result = await axios.get<SensorData>(
        '/api/sensorData',
        {
          params: {
            minTime: minTime?.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
            maxTime: maxTime?.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
          },
        }
      )
      setData(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  const fetchStatusData = async () => {
    try {
      const result = await axios.get<StatusData>(
        '/api/statusData',
        {
          params: {
            minTime: minTime?.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
            maxTime: maxTime?.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
          },
        }
      )
      setStatusData(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  const fetchLatestStatus = async () => {
    try {
      const result = await axios.get<StatusData>('/api/statusData')
      setStatus(result.data[0].status)
    } catch (error) {
      console.log(error)
    }
  }

  const handleStatusChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      if (!mqttClient) {
        console.log('Cannot publish')
        return
      }
      mqttClient.publish(
        'status/control',
        JSON.stringify({ status: event.target.checked ? 'True' : 'False' }),
        { qos: 1 }
      )
      setStatus(event.target.checked ? 1 : 0)
    } catch (error) {
      console.log(error)
    }
  }

  const handleLiveToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMinTime(dayjs(new Date()).subtract(5, 'hour'))
    setMaxTime(dayjs(new Date()))
    setIsLive(event.target.checked)
  }

  return (
    <RootStyle>
      <Typography fontWeight="600" fontSize="2.5rem" mb={1}>
        Dashboard
      </Typography>
      <Typography fontWeight="600">
        MQTT Status: {mqttStatus ? 'Connected' : 'Disconnected'}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography fontWeight="600">Irrigation Status:</Typography>
        <Switch
          disabled={!mqttStatus}
          checked={status === 1}
          onChange={handleStatusChange}
          inputProps={{ 'aria-label': 'irrigation status' }}
        />
        <Typography>{status === 1 ? 'ON' : 'OFF'}</Typography>
      </Stack>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack direction="row" gap={2} alignItems="center">
          {/* Add toggle switch for live data */}
          <Typography fontWeight="600">Live Data:</Typography>
          <Switch
            checked={isLive}
            onChange={handleLiveToggle}
            inputProps={{ 'aria-label': 'live data toggle switch' }}
            />
          { isLive ?
            <Select
              id="time-range-selector"
              value={xRange}
              onChange={(event) => 
                setXRange(event.target.value as keyof typeof timeRanges)
              }
            >
              {Object.keys(timeRanges).map((key) => (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              ))}
            </Select> :
            <>
              <DateTimePicker
                sx={{ marginLeft: '1rem' }}
                label="From"
                value={minTime}
                onChange={(newValue) => setMinTime(newValue)}
                disabled={isLive}
              />
              <DateTimePicker
                label="To"
                value={maxTime}
                onChange={(newValue) => setMaxTime(newValue)}
                disabled={isLive}
              />
            </>
          }
        </Stack>
      </LocalizationProvider>
      {(typeof window !== 'undefined') && data && statusData &&
        <ComboChart
          data={data}
          statusData={statusData}
          isLive={isLive}
          xRange={timeRanges[xRange]}
        />
      }
      <Box sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr));'
      }}>
        {(typeof window !== 'undefined') && statusData &&
          <AreaChart data={statusData} isLive={isLive} xRange={timeRanges[xRange]} />
        }
        {(typeof window !== 'undefined') && data &&
          Object.entries(data).map(([key, data]) => (
            <LineChart
              key={key}
              dataKey={key as keyof SensorData}
              data={data}
              isLive={isLive}
              xRange={timeRanges[xRange]}
            />
          ))
        }
      </Box>
      {data && statusData && <DataTable data={data} statusData={statusData} />}
    </RootStyle>
  )
}
