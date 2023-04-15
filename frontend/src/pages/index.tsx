import { useEffect, useState } from 'react'
import axios from 'axios'
import { Box, Stack, styled } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { SensorData } from '../@types/sensorData'
import LineChart from '@/components/LineChart'

const RootStyle = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 'clamp(300px, 95%, 1200px)',
  margin: '2rem auto',
  gap: '1.5rem',
}))

export default function Home() {
  const [data, setData] = useState<SensorData | null>(null)
  // get data from 2pm to 5pm on 15/04/2023
  // TODO: get the last 5 hours of data
  const [minTime, setMinTime] = useState<Dayjs | null>(dayjs(new Date(2023, 3, 15, 14, 0, 0)))
  const [maxTime, setMaxTime] = useState<Dayjs | null>(dayjs(new Date(2023, 3, 15, 17, 0, 0)))

  useEffect(() => {
    fetchData()
  }, [minTime, maxTime])

  const fetchData = async () => {
    try {
      const result = await axios.get<SensorData>(
        '/api/sensorData',
        {
          params: {
            minTime: minTime?.toISOString(),
            maxTime: maxTime?.toISOString(),
          },
        }
      )
      setData(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <RootStyle>
      <h1>Dashboard</h1>
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
      {(typeof window !== 'undefined') && data && <LineChart data={data} />}
    </RootStyle>
  )
}
