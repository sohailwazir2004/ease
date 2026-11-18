// MONGODB STORAGE. It offers the SAME functions as jsonStore.js
// (list, get, insert, replace, remove, flush), so the routes do not change at all.
//
// Mongoose = a helper library for MongoDB.
//   - Schema: describes what an event document looks like (a second safety net
//     after the validation in models/event.js).
//   - Model:  the object we use to read and write the "events" collection.
import mongoose from 'mongoose'

const { Schema } = mongoose

// Small reusable pieces of the schema.
const coOrganizerSchema = new Schema(
  { id: String, email: String, role: String, notify: Boolean, access: Boolean, invitedAt: String },
  { _id: false },
)
const rsvpSchema = new Schema({ id: String, name: String, status: String }, { _id: false })

// MongoDB gives every document an "_id". We reuse our own id (a UUID text) as the _id,
// so an event keeps the same id it had before. toEvent() / toDoc() convert between
// the two shapes so the rest of the app never sees "_id".
const eventSchema = new Schema(
  {
    _id: String,
    title: { type: String, required: true },
    date: { type: String, required: true },
    type: { type: String, required: true },
    host: { type: String, required: true },
    description: String,
    location: String,
    theme: String,
    image: String, // null or a picture turned into text
    template: String,
    tag: String,
    clonedFrom: String,
    visibility: {
      visibility: String,
      joining: String,
      inviteControl: String,
      expiration: String,
      roles: { organizer: Boolean, cohost: Boolean, viewer: Boolean, moderator: Boolean },
    },
    coOrganizers: [coOrganizerSchema],
    rsvps: [rsvpSchema],
    shares: { type: Schema.Types.Mixed, default: {} }, // { Facebook: 2, Twitter: 1 }
    createdAt: String,
  },
  { versionKey: false, minimize: false }, // minimize:false keeps empty objects like shares: {}
)

// Document from the database -> plain event object used by the app.
function toEvent(doc) {
  if (!doc) return null
  const { _id, ...rest } = doc
  return { id: _id, ...rest }
}

// Event object -> document for the database.
function toDoc(event) {
  const { id, ...rest } = event
  return { _id: id, ...rest }
}

export async function createMongoStore(uri, { collection = 'events' } = {}) {
  // One connection per store. (Tests open two stores at once, so no global connection.)
  const connection = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 8000 })
  try {
    await connection.asPromise() // wait until we are really connected
  } catch (err) {
    await connection.close().catch(() => {})
    throw new Error(`Could not connect to MongoDB: ${err.message}`)
  }

  const Event = connection.model('Event', eventSchema, collection)

  return {
    async list() {
      return (await Event.find().lean()).map(toEvent)
    },
    async get(id) {
      return toEvent(await Event.findById(id).lean())
    },
    async insert(event) {
      await Event.create(toDoc(event))
      return event
    },
    // Replaces the stored event with the given one. Returns null if it does not exist.
    async replace(id, event) {
      const result = await Event.replaceOne({ _id: id }, toDoc(event))
      return result.matchedCount ? event : null
    },
    async remove(id) {
      const result = await Event.deleteOne({ _id: id })
      return result.deletedCount > 0
    },
    async flush() {}, // MongoDB saves immediately; nothing to wait for
    async close() {
      await connection.close()
    },
    // Deletes the whole collection. Used by the tests to clean up after themselves.
    async drop() {
      await Event.collection.drop().catch(() => {}) // fine if it never existed
    },
  }
}
