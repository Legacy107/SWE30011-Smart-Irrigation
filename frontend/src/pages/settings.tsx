import { useEffect, useState } from 'react'
import axios from 'axios'
import { Parser } from 'expr-eval';
// mui
import {
  Typography,
  Box,
  Switch,
  styled,
  Stack,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
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

export default function Settings() {
  const [useModel, setUseModel] = useState<boolean>(false)
  const [rules, setRules] = useState<string>('')
  const [simple, setSimple] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)
  const [soilMoistureThreshold, setSoilMoistureThreshold] = useState<number>(0)

  useEffect(() => {
    fetchConfigData()
  }, [])

  const fetchConfigData = async () => {
    const { data } = await axios.get<LogicConfig>('/api/logicConfig')
    setUseModel(data.useModel === 1)
    setRules(data.rules)
    setSimple(data.simple === 1)
    if (data.simple === 1)
      setSoilMoistureThreshold(parseInt(data.rules.split('<')[1]))
  }

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseModel(event.target.checked)
  }

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      setError('')

      // validate rules
      if (!useModel && !simple) {
        
        const parser = new Parser()
        const expr = parser.parse(rules)
        const result = expr.evaluate({ soilMoisture: 300, temperature: 30, humidity: 50 })
        if (typeof result !== 'boolean')
          throw new Error('Invalid rules')
      }
      
      await axios.post('/api/logicConfig', {
        useModel: useModel ? 1 : 0,
        rules: simple ? `soilMoisture < ${soilMoistureThreshold}` : rules,
        simple: simple ? 1 : 0,
      })
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
        <Typography>Rule-based</Typography>
        <Switch
          checked={useModel}
          onChange={handleSwitchChange}
          inputProps={{ 'aria-label': 'decision logic' }}
        />
        <Typography>Machine learning</Typography>
      </Stack>
      { !useModel && <>
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
