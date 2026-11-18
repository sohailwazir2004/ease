// Automated tests. Run with: npm test
// Each test starts the real app on a random port with a temporary data file,
// calls it with fetch(), and checks the answers.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createApp } from '../src/app.js'
import { createJsonStore } from '../src/store/jsonStore.js'
import { createMongoStore } from '../src/store/mongoStore.js'

// The SAME tests run against either storage:
//   npm test                          -> JSON file store (temporary file)
//   TEST_MONGODB_URI=... npm test     -> MongoDB store (temporary collection, deleted at the end)
const mongoUri = process.env.TEST_MONGODB_URI
const collection = `test_events_${Date.now()}`

let server, base, store, dir, file

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'eventease-'))
  file = path.join(dir, 'events.json')
  store = mongoUri ? await createMongoStore(mongoUri, { collection }) : await createJsonStore(file)
  server = createApp(store).listen(0)
  base = `http://localhost:${server.address().port}`
})

after(async () => {
  server.close()
  if (mongoUri) await store.drop()
  await store.close()
  await rm(dir, { recursive: true, force: true })
})

async function call(method, url, body) {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null }
}

const valid = { title: 'Product Launch', date: '2027-03-10T18:00', type: 'Webinar', host: 'Sohail' }
const create = async (over = {}) => (await call('POST', '/api/events', { ...valid, ...over })).body

test('health check', async () => {
  const r = await call('GET', '/api/health')
  assert.equal(r.status, 200)
  assert.equal(r.body.status, 'ok')
})

test('creates an event with defaults and an id', async () => {
  const r = await call('POST', '/api/events', valid)
  assert.equal(r.status, 201)
  assert.ok(r.body.id)
  assert.equal(r.body.theme, 'Purple')
  assert.deepEqual(r.body.coOrganizers, [])
})

test('rejects bad input with a clear message', async () => {
  const cases = [
    [{ ...valid, title: '  ' }, /title is required/],
    [{ ...valid, type: 'Concert' }, /type must be one of/],
    [{ ...valid, date: 'not a date' }, /date is not a valid date/],
    [{ ...valid, host: undefined }, /host is required/],
  ]
  for (const [body, message] of cases) {
    const r = await call('POST', '/api/events', body)
    assert.equal(r.status, 400)
    assert.match(r.body.error, message)
  }
})

test('rejects invalid JSON and unknown routes', async () => {
  const res = await fetch(base + '/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' })
  assert.equal(res.status, 400)
  assert.equal((await call('GET', '/api/nothing')).status, 404)
})

test('lists, searches and filters events', async () => {
  await create({ title: 'Wedding of Ali', type: 'Wedding' })
  assert.ok((await call('GET', '/api/events')).body.length >= 2)
  const found = (await call('GET', '/api/events?search=wedding')).body
  assert.ok(found.length >= 1 && found.every((e) => e.title.toLowerCase().includes('wedding')))
  const byType = (await call('GET', '/api/events?type=Wedding')).body
  assert.ok(byType.every((e) => e.type === 'Wedding'))
})

test('gets one event and answers 404 for unknown ids', async () => {
  const ev = await create()
  assert.equal((await call('GET', `/api/events/${ev.id}`)).body.title, valid.title)
  assert.equal((await call('GET', '/api/events/nope')).status, 404)
})

test('updates only allowed fields', async () => {
  const ev = await create()
  const r = await call('PUT', `/api/events/${ev.id}`, { title: 'New title', theme: 'Blue', id: 'hacked', createdAt: 'x' })
  assert.equal(r.status, 200)
  assert.equal(r.body.title, 'New title')
  assert.equal(r.body.theme, 'Blue')
  assert.equal(r.body.id, ev.id)
  assert.equal(r.body.createdAt, ev.createdAt)
  assert.equal((await call('PUT', `/api/events/${ev.id}`, { theme: 'Pink' })).status, 400)
  assert.equal((await call('PUT', `/api/events/${ev.id}`, {})).status, 400)
  assert.equal((await call('PUT', '/api/events/nope', { title: 'x' })).status, 404)
})

test('validates image and visibility', async () => {
  const ev = await create()
  assert.equal((await call('PUT', `/api/events/${ev.id}`, { image: 'http://evil/x.png' })).status, 400)
  assert.equal((await call('PUT', `/api/events/${ev.id}`, { image: 'data:image/png;base64,AAAA' })).status, 200)
  const vis = { visibility: 'private', joining: 'Anyone can join', inviteControl: 'Allow link sharing', expiration: '', roles: { organizer: true } }
  const r = await call('PUT', `/api/events/${ev.id}`, { visibility: vis })
  assert.equal(r.body.visibility.visibility, 'private')
  assert.equal(r.body.visibility.roles.viewer, false)
  assert.equal((await call('PUT', `/api/events/${ev.id}`, { visibility: { ...vis, visibility: 'secret' } })).status, 400)
})

test('deletes an event', async () => {
  const ev = await create()
  assert.equal((await call('DELETE', `/api/events/${ev.id}`)).status, 204)
  assert.equal((await call('GET', `/api/events/${ev.id}`)).status, 404)
  assert.equal((await call('DELETE', `/api/events/${ev.id}`)).status, 404)
})

test('co-organizers: add, reject duplicates and bad emails, remove', async () => {
  const ev = await create()
  const url = `/api/events/${ev.id}/co-organizers`
  const added = await call('POST', url, { email: 'A@B.com', role: 'Moderator', notify: true })
  assert.equal(added.status, 201)
  assert.equal(added.body.coOrganizers[0].email, 'a@b.com')
  assert.equal((await call('POST', url, { email: 'a@b.com', role: 'Moderator' })).status, 409)
  assert.equal((await call('POST', url, { email: 'bad', role: 'Moderator' })).status, 400)
  assert.equal((await call('POST', url, { email: 'c@d.com', role: 'Boss' })).status, 400)
  const id = added.body.coOrganizers[0].id
  assert.equal((await call('DELETE', `${url}/${id}`)).body.coOrganizers.length, 0)
  assert.equal((await call('DELETE', `${url}/${id}`)).status, 404)
})

test('rsvps: add, change status, remove', async () => {
  const ev = await create()
  const url = `/api/events/${ev.id}/rsvps`
  const added = await call('POST', url, { name: 'Alice', status: 'Confirmed' })
  assert.equal(added.status, 201)
  const id = added.body.rsvps[0].id
  assert.equal((await call('PATCH', `${url}/${id}`, { status: 'Declined' })).body.rsvps[0].status, 'Declined')
  assert.equal((await call('PATCH', `${url}/${id}`, { status: 'Maybe' })).status, 400)
  assert.equal((await call('DELETE', `${url}/${id}`)).body.rsvps.length, 0)
})

test('shares count per platform', async () => {
  const ev = await create()
  const url = `/api/events/${ev.id}/share`
  await call('POST', url, { platform: 'Twitter' })
  const r = await call('POST', url, { platform: 'Twitter' })
  assert.equal(r.body.shares.Twitter, 2)
  assert.equal((await call('POST', url, { platform: 'MySpace' })).status, 400)
})

test('clones an event: keeps settings, resets guests and shares', async () => {
  const ev = await create()
  await call('PUT', `/api/events/${ev.id}`, { theme: 'Green', location: 'Islamabad' })
  await call('POST', `/api/events/${ev.id}/rsvps`, { name: 'Bob' })
  await call('POST', `/api/events/${ev.id}/share`, { platform: 'Facebook' })
  const r = await call('POST', `/api/events/${ev.id}/clone`, { title: 'Copy', date: '2027-06-01T10:00', tag: 'Replay' })
  assert.equal(r.status, 201)
  assert.notEqual(r.body.id, ev.id)
  assert.equal(r.body.clonedFrom, ev.id)
  assert.equal(r.body.theme, 'Green')
  assert.equal(r.body.location, 'Islamabad')
  assert.deepEqual(r.body.rsvps, [])
  assert.deepEqual(r.body.shares, {})
  assert.equal((await call('POST', `/api/events/${ev.id}/clone`, { title: 'x' })).status, 400)
  assert.equal((await call('POST', '/api/events/nope/clone', { title: 'x', date: '2027-01-01' })).status, 404)
})

test('data is saved and can be loaded again by a new store', async () => {
  const ev = await create({ title: 'Persist me' })
  await store.flush()
  if (mongoUri) {
    const reopened = await createMongoStore(mongoUri, { collection })
    assert.equal((await reopened.get(ev.id)).title, 'Persist me')
    await reopened.close()
  } else {
    const onDisk = JSON.parse(await readFile(file, 'utf8'))
    assert.ok(onDisk.some((e) => e.id === ev.id))
    const reopened = await createJsonStore(file)
    assert.equal((await reopened.get(ev.id)).title, 'Persist me')
  }
})

test('stored events keep the exact shape (no _id, no extra fields)', async () => {
  const ev = await create({ title: 'Shape' })
  await call('POST', `/api/events/${ev.id}/share`, { platform: 'Facebook' })
  const fromStore = await store.get(ev.id)
  assert.equal(fromStore.id, ev.id)
  assert.equal('_id' in fromStore, false)
  assert.deepEqual(fromStore.shares, { Facebook: 1 })
  assert.deepEqual(Object.keys(fromStore).sort(), Object.keys(ev).sort())
})
