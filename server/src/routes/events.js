// All /api/events routes. A "route" = HTTP method + URL + a function that answers.
// Pattern in every handler: read input -> validate -> use the store -> send JSON.
import { Router } from 'express'
import { ApiError } from '../middleware/errors.js'
import {
  buildEvent, cleanPatch, buildClone, buildCoOrganizer, buildRsvp,
  oneOf, PLATFORMS, RSVP_STATUSES,
} from '../models/event.js'

export function eventsRouter(store) {
  const router = Router()

  // Looks up the event named in the URL (/:id) or answers 404.
  async function findEvent(req) {
    const event = await store.get(req.params.id)
    if (!event) throw new ApiError(404, 'Event not found')
    return event
  }

  // Saves a changed event and sends it back.
  async function saveAndSend(res, event, status = 200) {
    await store.replace(event.id, event)
    res.status(status).json(event)
  }

  // ----- events -----

  // GET /api/events?search=launch&type=Webinar
  router.get('/', async (req, res) => {
    const search = String(req.query.search ?? '').trim().toLowerCase()
    const type = req.query.type
    const events = (await store.list())
      .filter((e) => !search || e.title.toLowerCase().includes(search))
      .filter((e) => !type || e.type === type)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    res.json(events)
  })

  // GET /api/events/:id
  router.get('/:id', async (req, res) => res.json(await findEvent(req)))

  // POST /api/events  { title, date, type, host }
  router.post('/', async (req, res) => {
    const event = await store.insert(buildEvent(req.body))
    res.status(201).json(event)
  })

  // PUT /api/events/:id  { any editable fields }
  router.put('/:id', async (req, res) => {
    const event = await findEvent(req)
    await saveAndSend(res, { ...event, ...cleanPatch(req.body) })
  })

  // DELETE /api/events/:id
  router.delete('/:id', async (req, res) => {
    if (!(await store.remove(req.params.id))) throw new ApiError(404, 'Event not found')
    res.status(204).end()
  })

  // POST /api/events/:id/clone  { title, date, tag }
  router.post('/:id/clone', async (req, res) => {
    const source = await findEvent(req)
    res.status(201).json(await store.insert(buildClone(source, req.body)))
  })

  // ----- co-organizers (stored inside the event) -----

  router.post('/:id/co-organizers', async (req, res) => {
    const event = await findEvent(req)
    const person = buildCoOrganizer(req.body)
    if (event.coOrganizers.some((c) => c.email === person.email)) {
      throw new ApiError(409, 'This person is already a co-organizer')
    }
    event.coOrganizers.push(person)
    await saveAndSend(res, event, 201)
  })

  router.delete('/:id/co-organizers/:coId', async (req, res) => {
    const event = await findEvent(req)
    const before = event.coOrganizers.length
    event.coOrganizers = event.coOrganizers.filter((c) => c.id !== req.params.coId)
    if (event.coOrganizers.length === before) throw new ApiError(404, 'Co-organizer not found')
    await saveAndSend(res, event)
  })

  // ----- RSVPs -----

  router.post('/:id/rsvps', async (req, res) => {
    const event = await findEvent(req)
    event.rsvps.push(buildRsvp(req.body))
    await saveAndSend(res, event, 201)
  })

  router.patch('/:id/rsvps/:rsvpId', async (req, res) => {
    const event = await findEvent(req)
    const rsvp = event.rsvps.find((r) => r.id === req.params.rsvpId)
    if (!rsvp) throw new ApiError(404, 'RSVP not found')
    rsvp.status = oneOf(req.body?.status, 'status', RSVP_STATUSES)
    await saveAndSend(res, event)
  })

  router.delete('/:id/rsvps/:rsvpId', async (req, res) => {
    const event = await findEvent(req)
    const before = event.rsvps.length
    event.rsvps = event.rsvps.filter((r) => r.id !== req.params.rsvpId)
    if (event.rsvps.length === before) throw new ApiError(404, 'RSVP not found')
    await saveAndSend(res, event)
  })

  // ----- shares -----

  // POST /api/events/:id/share  { platform }  -> adds 1 to that platform's count
  router.post('/:id/share', async (req, res) => {
    const event = await findEvent(req)
    const platform = oneOf(req.body?.platform, 'platform', PLATFORMS)
    event.shares[platform] = (event.shares[platform] ?? 0) + 1
    await saveAndSend(res, event)
  })

  return router
}
