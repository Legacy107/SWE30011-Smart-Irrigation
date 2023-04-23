export type SensorData = {
  soilMoisture: Array<ReadingData>
  temperature: Array<ReadingData>
  humidity: Array<ReadingData>
}

export type ReadingData = {
  reading: number
  readingTime: string
}

export const SensorList: Array<keyof SensorData> = [
  'soilMoisture',
  'temperature',
  'humidity',
]
