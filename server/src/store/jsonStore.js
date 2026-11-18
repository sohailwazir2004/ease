// STORAGE LAYER. The routes never touch the file directly; they only call the
// functions below (list, get, insert, update, remove). When we move to MongoDB,
// we write a new store with the SAME functions and the routes do not change.
//
// How it works: events are kept in memory and written to a JSON file after every
// change. Writes go one at a time (a queue) and use "write temp file, then rename"
// so a crash in the middle can never leave a half-written, broken file.
import { promises as fs } from 'node:fs'
import path from 'node:path'

export async function createJsonStore(filePath) {
  let events = []
  try {
    events = JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch (err) {
    if (err.code !== 'ENOENT') throw err // missing file is fine (first run)
  }

  let queue = Promise.resolve()
  function save() {
    queue = queue.then(async () => {
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      const tmp = `${filePath}.tmp`
      await fs.writeFile(tmp, JSON.stringify(events, null, 2))
      await fs.rename(tmp, filePath)
    })
    return queue
  }

  return {
    async list() {
      return structuredClone(events)
    },
    async get(id) {
      const found = events.find((e) => e.id === id)
      return found ? structuredClone(found) : null
    },
    async insert(event) {
      events.push(structuredClone(event))
      await save()
      return event
    },
    // Replaces the stored event with the given one. Returns null if it does not exist.
    async replace(id, event) {
      const index = events.findIndex((e) => e.id === id)
      if (index === -1) return null
      events[index] = structuredClone(event)
      await save()
      return event
    },
    async remove(id) {
      const before = events.length
      events = events.filter((e) => e.id !== id)
      if (events.length === before) return false
      await save()
      return true
    },
    // Waits until everything is written to disk (used by tests and shutdown).
    async flush() {
      await queue
    },
    async close() {
      await queue
    },
  }
}
