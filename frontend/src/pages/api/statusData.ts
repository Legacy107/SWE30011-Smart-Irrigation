import type { NextApiRequest, NextApiResponse } from 'next'
import connection from '../../db/connection'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req

  switch (method) {
    case 'GET':
      try {
        const { minTime, maxTime } = req.query

        let query = 'SELECT status, readingTime FROM statusLog'
        if (minTime && maxTime) {
          query += ` WHERE readingTime BETWEEN '${minTime}' AND '${maxTime}'`
        }
        query += ' ORDER BY readingTime DESC'
        if (!minTime && !maxTime) {
          query += ' LIMIT 1'
        }

        const [rows] = await connection.execute(query)

        res.status(200).json(rows)
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
