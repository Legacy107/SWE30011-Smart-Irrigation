import { useEffect, useState } from 'react'
import { useMqttState } from 'mqtt-react-hooks'
import axios from 'axios'
import { Parser } from 'expr-eval';
// mui
import {
  Typography,
  Box,
  styled,
  Stack,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  Select,
  MenuItem,
} from '@mui/material'
import LoadingButton from '@mui/lab/LoadingButton';
// types
import LogicConfig from '@/@types/logicConfig'

const RootStyle = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  flexDirection: 'column',
  maxWidth: 'clamp(300px, 95%, 1200px)',
  margin: '2rem auto',
  gap: '1rem',
}))

const MODES = ['Model', 'Rules', 'Manual']

export default function Settings() {
  const [mode, setMode] = useState<LogicConfig["mode"]>('Model')
  const [rules, setRules] = useState<string>('')
  const [simple, setSimple] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)
  const [soilMoistureThreshold, setSoilMoistureThreshold] = useState<number>(0)
  const { client: mqttClient, connectionStatus: mqttStatus } = useMqttState()

  useEffect(() => {
    fetchConfigData()
  }, [])

  const fetchConfigData = async () => {
    const { data } = await axios.get<LogicConfig>('/api/logicConfig')
    setMode(data.mode)
    setRules(data.rules)
    setSimple(data.simple === 1)
    if (data.simple === 1)
      setSoilMoistureThreshold(parseInt(data.rules.split('<')[1]))
  }

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      setError('')

      // validate rules
      if (mode === 'Rules' && !simple) {
        
        const parser = new Parser()
        const expr = parser.parse(rules)
        const result = expr.evaluate({ soilMoisture: 300, temperature: 30, humidity: 50 })
        if (typeof result !== 'boolean')
          throw new Error('Invalid rules')
      }
      
      if (!mqttClient || !mqttStatus) {
        throw new Error('Failed to connect to MQTT broker')
      }

      mqttClient.publish(
        'logic/config',
        JSON.stringify({
          mode: mode,
          rules: mode !== 'Rules' ? '' : simple ? `soilMoisture < ${soilMoistureThreshold}` : rules,
          simple: simple ? 1 : 0,
        }),
        { qos: 1 }
      )
    } catch (error) {
      console.log(error)
      console.log((error as Error).message)
      if (['Invalid rules', 'parse error'].some((msg) => 
        (error as Error).message.includes(msg)
      ))
        setError('Invalid rules')
      else
        setError('Error saving changes. Please try again later.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <RootStyle>
      <Typography fontWeight="600" fontSize="2.5rem" mb={1}>
        Settings
      </Typography>
      <Stack direction="row" alignItems="center">
        <Typography fontWeight={600} mr={2}>Decision logic: </Typography>
        <Select
          id="mode-selector"
          value={mode}
          onChange={(event) => setMode(event.target.value as LogicConfig["mode"])}
        >
          {MODES.map((key) => (
            <MenuItem key={key} value={key}>
              {key}
            </MenuItem>
          ))}
        </Select>
      </Stack>
      { mode === 'Rules' && <>
        <Stack direction="row" gap={3} alignItems="center">
          <Typography fontWeight={600}>Rules:</Typography>
          <FormGroup>
            <FormControlLabel control={
              <Checkbox
                checked={simple}
                onChange={(event) => setSimple(event.target.checked)}
              />
            } label="Simple" />
          </FormGroup>
        </Stack>
        { simple ?
          <TextField
            type='number'
            label="Soil moisture threshold"
            value={soilMoistureThreshold}
            onChange={(event) => setSoilMoistureThreshold(Number(event.target.value))}
          >
          </TextField>:
          <TextField
            fullWidth
            multiline
            value={rules}
            onChange={(event) => setRules(event.target.value)}
          />
        }
      </>}
      <LoadingButton
        loading={saving}
        onClick={handleSaveChanges}
        variant="contained"
        sx={{ marginTop: '2rem', paddingInline: '2rem' }}
      >
        Save
      </LoadingButton>
      <Snackbar
        open={!!error}
        onClose={() => setError('')}
        autoHideDuration={4000}
        message={error}
      >
        <Alert
          variant='filled'
          onClose={() => setError('')}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </RootStyle>
  )
}
