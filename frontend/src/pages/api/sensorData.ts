import type { NextApiRequest, NextApiResponse } from 'next'
import connection from '../../db/connection'
import { SensorList, SensorData, ReadingData } from '../../@types/sensorData'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req

  switch (method) {
    case 'GET':
      try {
        const { minTime, maxTime } = req.query

        let query = 'SELECT reading, readingTime FROM sensorLog'
        if (minTime && maxTime) {
          query += ` WHERE readingTime BETWEEN '${minTime}' AND '${maxTime}'`
        }
        query += ' ORDER BY readingTime DESC'

        const result: Partial<SensorData> = {}
        for (const sensor of SensorList) {
          const [rows] = await connection.execute(query.replace('sensor', sensor))
          result[sensor] = rows as Array<ReadingData>
        }

        res.status(200).json(result)
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Something went wrong' })
      }
      break

    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
      break
  }
}
