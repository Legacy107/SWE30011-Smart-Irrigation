import { useEffect, useState } from 'react'
import { useMqttState } from 'mqtt-react-hooks'
import { useSubscription } from 'mqtt-react-hooks'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'
// mui
import { Box, Stack, Switch, Typography, styled } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
// components
import LineChart from '@/components/LineChart'
import AreaChart from '@/components/AreaChart'
import { StatusData } from '@/@types/statusData'
// types
import { SensorData } from '@/@types/sensorData'

const RootStyle = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 'clamp(300px, 95%, 1200px)',
  margin: '2rem auto',
  gap: '1.5rem',
}))

export default function Home() {
  const [status, setStatus] = useState<number>(0)
  const [data, setData] = useState<SensorData | null>(null)
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  // get data from 2pm to 5pm on 15/04/2023
  // TODO: get the last 5 hours of data
  const [minTime, setMinTime] = useState<Dayjs | null>(dayjs(new Date(2023, 3, 15, 14, 0, 0)))
  const [maxTime, setMaxTime] = useState<Dayjs | null>(dayjs(new Date(2023, 3, 15, 17, 0, 0)))
  const { client: mqttClient, connectionStatus: mqttStatus } = useMqttState()

  useEffect(() => {
    fetchLatestStatus()
  }, [])

  useEffect(() => {
    fetchSensorData()
    fetchStatusData()
  }, [minTime, maxTime])

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

  return (
    <RootStyle>
      <h1>Dashboard</h1>
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
        <Stack direction="row" gap={2} mt={2}>
          <DateTimePicker
            label="From"
            value={minTime}
            onChange={(newValue) => setMinTime(newValue)}
          />
          <DateTimePicker
            label="To"
            value={maxTime}
            onChange={(newValue) => setMaxTime(newValue)}
          />
        </Stack>
      </LocalizationProvider>
      {(typeof window !== 'undefined') && data && statusData &&
        <LineChart data={data} statusData={statusData} />
      }
      {(typeof window !== 'undefined') && statusData &&
        <AreaChart data={statusData} />
      }
    </RootStyle>
  )
}
