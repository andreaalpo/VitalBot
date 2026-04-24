import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(
  cors({
    origin: [
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  }),
)
app.use(express.json())

app.use('/api', routes)

app.use(errorHandler)

export default app
