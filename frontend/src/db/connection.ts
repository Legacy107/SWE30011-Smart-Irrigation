import mysql from 'mysql2/promise'

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || '',
}

const connection = await mysql.createConnection(config)

export default connection
