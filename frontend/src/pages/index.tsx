import { styled } from '@mui/material'
import { Box } from '@mui/system'

const RootStyle = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 'clamp(300px, 95%, 1200px)',
  margin: '2rem auto',
}))

export default function Home() {
  return (
    <RootStyle>
      <h1>Home</h1>
    </RootStyle>
  )
}
