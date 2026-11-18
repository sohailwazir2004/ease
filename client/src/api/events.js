// One small function per thing the server can do.
// They mirror the table in server/README.md.
import { request } from './client.js'

export const listEvents = () => request('GET', '/events')
export const createEvent = (data) => request('POST', '/events', data)
export const updateEvent = (id, patch) => request('PUT', `/events/${id}`, patch)
export const deleteEvent = (id) => request('DELETE', `/events/${id}`)
export const cloneEvent = (id, data) => request('POST', `/events/${id}/clone`, data)

export const addCoOrganizer = (id, data) => request('POST', `/events/${id}/co-organizers`, data)
export const removeCoOrganizer = (id, coId) => request('DELETE', `/events/${id}/co-organizers/${coId}`)

export const addRsvp = (id, data) => request('POST', `/events/${id}/rsvps`, data)
export const setRsvpStatus = (id, rsvpId, status) => request('PATCH', `/events/${id}/rsvps/${rsvpId}`, { status })
export const removeRsvp = (id, rsvpId) => request('DELETE', `/events/${id}/rsvps/${rsvpId}`)

export const shareEvent = (id, platform) => request('POST', `/events/${id}/share`, { platform })
