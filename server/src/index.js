// Starts the server. Settings come from environment variables (or a .env file):
//   MONGODB_URI    connection string. If it is set we use MongoDB, otherwise the JSON file.
//   PORT           default 4000
//   DATA_FILE      JSON file path, only used without MongoDB (default data/events.json)
//   CLIENT_ORIGIN  the React app's address, default http://localhost:5173
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { createJsonStore } from './store/jsonStore.js'
import { createMongoStore } from './store/mongoStore.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = Number(process.env.PORT ?? 4000)

let store
let where
try {
  if (process.env.MONGODB_URI) {
    store = await createMongoStore(process.env.MONGODB_URI)
    where = 'MongoDB'
  } else {
    const dataFile = path.resolve(root, process.env.DATA_FILE ?? 'data/events.json')
    store = await createJsonStore(dataFile)
    where = `JSON file ${dataFile}`
  }
} catch (err) {
  console.error(err.message)
  console.error('Check MONGODB_URI in your .env file (password, and Atlas "Network Access" must allow your IP).')
  process.exit(1)
}

const app = createApp(store, { clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' })

const server = app.listen(port, () => {
  console.log(`EventEase API running on http://localhost:${port}`)
  console.log(`Saving data to: ${where}`)
})

// Ctrl+C: finish pending work and close the database connection before exiting.
process.on('SIGINT', async () => {
  await store.close()
  server.close(() => process.exit(0))
})
