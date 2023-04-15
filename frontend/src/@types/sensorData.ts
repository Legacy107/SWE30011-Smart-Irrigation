export type SensorData = {
  temperature: Array<ReadingData>;
  humidity: Array<ReadingData>;
  soilMoisture: Array<ReadingData>;
}

export type ReadingData = {
  reading: number;
  readingTime: string;
}

export const SensorList: Array<keyof SensorData> = [
  'temperature',
  'humidity',
  'soilMoisture',
]
