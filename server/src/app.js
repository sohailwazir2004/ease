// Builds the Express app. It takes the store as a parameter so tests can plug in
// a temporary one. Nothing here starts a server; index.js does that.
import express from 'express'
import cors from 'cors'
import { eventsRouter } from './routes/events.js'
import { errorHandler, notFound } from './middleware/errors.js'

export function createApp(store, { clientOrigin = 'http://localhost:5173' } = {}) {
  const app = express()

  app.use(cors({ origin: clientOrigin })) // lets the React app (another port) call us
  app.use(express.json({ limit: '2mb' })) // parses JSON request bodies into req.body

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
  app.use('/api/events', eventsRouter(store))

  app.use(notFound)
  app.use(errorHandler) // must be last

  return app
}
