import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '@/layouts'
import { Connector } from 'mqtt-react-hooks'

const mqttUri = `wss://${process.env.NEXT_PUBLIC_MQTT_HOST}:${process.env.NEXT_PUBLIC_MQTT_PORT}/mqtt`
const mqttOptions = {
  username: process.env.NEXT_PUBLIC_MQTT_USER,
  password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
  clientId: 'nextjs-mqtt-client',
  reconnectPeriod: 2000,
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Connector brokerUrl={mqttUri} options={mqttOptions}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </Connector>
  )
}
