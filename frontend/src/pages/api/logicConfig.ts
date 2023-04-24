import type { NextApiRequest, NextApiResponse } from 'next'
import connection from '../../db/connection'
import LogicConfig from '@/@types/logicConfig'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req

  switch (method) {
    case 'GET':
      try {
        let query = 'SELECT useModel, rules, simple FROM logicConfig LIMIT 1'
        const [rows] = await connection.execute(query)
        res.status(200).json((rows as Array<LogicConfig>)[0])
      } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Something went wrong' })
      }
      break

    case 'POST':
      try {
        const { useModel, rules, simple } = req.body
        let query = `
          UPDATE logicConfig
          SET useModel = ${useModel}, rules = '${rules}', simple = ${simple}
        `
        console.log(query)
        const [rows] = await connection.execute(query)
        console.log(rows)
        res.status(200).json({ message: 'Success' })
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
