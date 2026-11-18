// Real analytics computed from the saved events. In the old app the numbers
// were typed into the HTML. Here they are calculated every time we draw.
import { useState } from 'react'
import { useEvents } from '../context/EventsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { EVENT_TYPES, RSVP_STATUSES, SOCIAL_PLATFORMS } from '../data/constants.js'
import { downloadFile, isUpcoming, toCSV } from '../utils/format.js'

const sum = (list) => list.reduce((a, b) => a + b, 0)
const totalShares = (ev) => sum(Object.values(ev.shares))

export default function Analytics() {
  const { events, selectedEvent, addRsvp, setRsvpStatus, removeRsvp } = useEvents()
  const { showToast } = useToast()
  const [guest, setGuest] = useState({ name: '', status: 'Confirmed' })

  if (events.length === 0) {
    return (
      <section className="card">
        <h2>Analytics</h2>
        <p className="muted">Create an event to see your numbers here.</p>
      </section>
    )
  }

  const upcoming = events.filter((e) => isUpcoming(e.date)).length
  const sharesByPlatform = SOCIAL_PLATFORMS.map((p) => [p, sum(events.map((e) => e.shares[p] ?? 0))])
  const maxShares = Math.max(1, ...sharesByPlatform.map(([, n]) => n))
  const byType = EVENT_TYPES.map((t) => [t, events.filter((e) => e.type === t).length]).filter(([, n]) => n > 0)

  async function handleAddGuest(e) {
    e.preventDefault()
    if (!guest.name.trim()) return showToast('⚠️ Enter the guest name.')
    const saved = await addRsvp(selectedEvent.id, { name: guest.name.trim(), status: guest.status })
    if (saved) setGuest({ name: '', status: 'Confirmed' })
  }

  const changeStatus = (id, status) => setRsvpStatus(selectedEvent.id, id, status)
  const removeGuest = (id) => removeRsvp(selectedEvent.id, id)

  function exportCSV() {
    const rows = [['Title', 'Date', 'Type', 'Host', 'Location', 'Visibility', 'Co-organizers', 'Confirmed guests', 'Total guests', 'Shares']]
    events.forEach((ev) => rows.push([
      ev.title, ev.date, ev.type, ev.host, ev.location, ev.visibility.visibility,
      ev.coOrganizers.length, ev.rsvps.filter((r) => r.status === 'Confirmed').length, ev.rsvps.length, totalShares(ev),
    ]))
    downloadFile(`eventease-analytics-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows))
    showToast('✅ CSV exported.')
  }

  const rsvpCount = (status) => selectedEvent.rsvps.filter((r) => r.status === status).length

  return (
    <>
      <section className="card">
        <h2>Overview</h2>
        <div className="stats">
          <div className="stat"><strong>{events.length}</strong><span>Events</span></div>
          <div className="stat"><strong>{upcoming}</strong><span>Upcoming</span></div>
          <div className="stat"><strong>{events.length - upcoming}</strong><span>Past</span></div>
          <div className="stat"><strong>{sum(events.map((e) => e.coOrganizers.length))}</strong><span>Co-organizers</span></div>
          <div className="stat"><strong>{sum(events.map((e) => e.rsvps.length))}</strong><span>Guests</span></div>
          <div className="stat"><strong>{sum(events.map(totalShares))}</strong><span>Shares</span></div>
        </div>

        <h3>Events by type</h3>
        {byType.map(([type, n]) => (
          <div className="bar-row" key={type}>
            <span>{type}</span>
            <progress value={n} max={events.length} />
            <span>{n}</span>
          </div>
        ))}

        <h3>Shares by platform</h3>
        {sharesByPlatform.map(([platform, n]) => (
          <div className="bar-row" key={platform}>
            <span>{platform}</span>
            <progress value={n} max={maxShares} />
            <span>{n}</span>
          </div>
        ))}

        <div className="actions"><button onClick={exportCSV}>Export as CSV</button></div>
      </section>

      <section className="card">
        <h2>RSVPs for "{selectedEvent.title}"</h2>
        <p>
          ✅ {rsvpCount('Confirmed')} confirmed · ⏳ {rsvpCount('Pending')} pending · ❌ {rsvpCount('Declined')} declined
        </p>

        <form onSubmit={handleAddGuest} className="row">
          <input type="text" placeholder="Guest name" aria-label="Guest name" value={guest.name}
            onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
          <select aria-label="Status" value={guest.status} onChange={(e) => setGuest({ ...guest, status: e.target.value })}>
            {RSVP_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button type="submit">Add Guest</button>
        </form>

        {selectedEvent.rsvps.length === 0 && <p className="muted">No guests yet.</p>}
        {selectedEvent.rsvps.map((r) => (
          <div className="guest" key={r.id}>
            <span>{r.name}</span>
            <select aria-label={`Status of ${r.name}`} value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)}>
              {RSVP_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="small danger" onClick={() => removeGuest(r.id)}>Remove</button>
          </div>
        ))}
      </section>
    </>
  )
}
