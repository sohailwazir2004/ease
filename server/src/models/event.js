// What an event looks like, and the rules for valid data.
// This mirrors the object used in the React app (EventsContext.jsx), so the two
// can talk to each other later without any translation.
import { randomUUID } from 'node:crypto'
import { ApiError } from '../middleware/errors.js'

export const EVENT_TYPES = ['Meeting', 'Workshop', 'Wedding', 'Party', 'Webinar', 'Other']
export const THEMES = ['Purple', 'Yellow', 'Green', 'Red', 'Blue']
export const ROLES = ['Co-organizer', 'Moderator', 'Live Streamer']
export const RSVP_STATUSES = ['Confirmed', 'Pending', 'Declined']
export const PLATFORMS = ['Facebook', 'Twitter', 'Instagram']
const VISIBILITY = ['public', 'link', 'private']
const JOINING = ['Anyone can join', 'Ask to join (approval required)', 'Only invited users can join']
const INVITE_CONTROL = ['Email-based invites only', 'Allow .edu domain', 'Allow link sharing']
const MAX_IMAGE_CHARS = 1_000_000 // about 700 KB of picture

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ---------- small validation helpers ----------
// Each one returns the cleaned value or throws a 400 error with a clear message.

export function text(value, field, { required = false, max = 200 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ApiError(400, `${field} is required`)
    return ''
  }
  if (typeof value !== 'string') throw new ApiError(400, `${field} must be text`)
  const clean = value.trim()
  if (required && !clean) throw new ApiError(400, `${field} is required`)
  if (clean.length > max) throw new ApiError(400, `${field} must be at most ${max} characters`)
  return clean
}

export function oneOf(value, field, allowed) {
  if (!allowed.includes(value)) throw new ApiError(400, `${field} must be one of: ${allowed.join(', ')}`)
  return value
}

function dateTime(value, field) {
  const clean = text(value, field, { required: true, max: 40 })
  if (Number.isNaN(Date.parse(clean))) throw new ApiError(400, `${field} is not a valid date`)
  return clean
}

function visibility(value) {
  if (typeof value !== 'object' || value === null) throw new ApiError(400, 'visibility must be an object')
  const roles = value.roles ?? {}
  return {
    visibility: oneOf(value.visibility, 'visibility.visibility', VISIBILITY),
    joining: oneOf(value.joining, 'visibility.joining', JOINING),
    inviteControl: oneOf(value.inviteControl, 'visibility.inviteControl', INVITE_CONTROL),
    expiration: text(value.expiration, 'visibility.expiration', { max: 40 }),
    roles: {
      organizer: Boolean(roles.organizer),
      cohost: Boolean(roles.cohost),
      viewer: Boolean(roles.viewer),
      moderator: Boolean(roles.moderator),
    },
  }
}

function image(value) {
  if (value === null) return null
  if (typeof value !== 'string' || !value.startsWith('data:image/')) {
    throw new ApiError(400, 'image must be null or an image data URL')
  }
  if (value.length > MAX_IMAGE_CHARS) throw new ApiError(400, 'image is too large')
  return value
}

// ---------- building and changing events ----------

export function buildEvent(body = {}) {
  return {
    id: randomUUID(),
    title: text(body.title, 'title', { required: true }),
    date: dateTime(body.date, 'date'),
    type: oneOf(body.type, 'type', EVENT_TYPES),
    host: text(body.host, 'host', { required: true }),
    description: '',
    location: '',
    theme: 'Purple',
    image: null,
    template: null,
    tag: '',
    clonedFrom: null,
    visibility: {
      visibility: 'public',
      joining: 'Anyone can join',
      inviteControl: 'Email-based invites only',
      expiration: '',
      roles: { organizer: true, cohost: true, viewer: false, moderator: false },
    },
    coOrganizers: [],
    rsvps: [],
    shares: {},
    createdAt: new Date().toISOString(),
  }
}

// Only these fields may be changed through PUT. Anything else in the request
// (id, createdAt, rsvps...) is ignored, so a client cannot overwrite them.
const editors = {
  title: (v) => text(v, 'title', { required: true }),
  date: (v) => dateTime(v, 'date'),
  type: (v) => oneOf(v, 'type', EVENT_TYPES),
  host: (v) => text(v, 'host', { required: true }),
  description: (v) => text(v, 'description', { max: 2000 }),
  location: (v) => text(v, 'location'),
  theme: (v) => oneOf(v, 'theme', THEMES),
  image,
  template: (v) => (v === null ? null : text(v, 'template', { required: true, max: 80 })),
  tag: (v) => text(v, 'tag', { max: 80 }),
  visibility,
}

export function cleanPatch(body = {}) {
  const patch = {}
  for (const [field, clean] of Object.entries(editors)) {
    if (body[field] !== undefined) patch[field] = clean(body[field])
  }
  if (Object.keys(patch).length === 0) throw new ApiError(400, 'No editable fields were sent')
  return patch
}

export function buildClone(source, body = {}) {
  return {
    ...structuredClone(source),
    id: randomUUID(),
    title: text(body.title, 'title', { required: true }),
    date: dateTime(body.date, 'date'),
    tag: text(body.tag, 'tag', { max: 80 }),
    clonedFrom: source.id,
    rsvps: [],
    shares: {},
    createdAt: new Date().toISOString(),
  }
}

export function buildCoOrganizer(body = {}) {
  const email = text(body.email, 'email', { required: true, max: 120 }).toLowerCase()
  if (!emailPattern.test(email)) throw new ApiError(400, 'email is not valid')
  return {
    id: randomUUID(),
    email,
    role: oneOf(body.role, 'role', ROLES),
    notify: Boolean(body.notify),
    access: Boolean(body.access),
    invitedAt: new Date().toISOString(),
  }
}

export function buildRsvp(body = {}) {
  return {
    id: randomUUID(),
    name: text(body.name, 'name', { required: true, max: 100 }),
    status: oneOf(body.status ?? 'Pending', 'status', RSVP_STATUSES),
  }
}
