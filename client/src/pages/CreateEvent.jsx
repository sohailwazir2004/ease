// Home page: create, edit, search and delete events.
// Compare with saveEvent / fetchEvents / deleteEvent in the old ft.js:
// the old code read inputs with getElementById and built HTML strings.
// Here React does that for us: we only change STATE, and the screen follows.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvents } from '../context/EventsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { EVENT_TYPES, THEMES } from '../data/constants.js'
import { formatDateTime, isUpcoming } from '../utils/format.js'

const emptyForm = { title: '', date: '', type: '', host: '' }

export default function CreateEvent() {
  const { showToast } = useToast()
  const { events, selectedEvent, setSelectedId, addEvent, updateEvent, deleteEvent } = useEvents()

  // STATE: what the user is typing, which event (if any) is being edited,
  // and the search / filter boxes. Each piece of changing data gets its own state.
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  // One handler for all inputs. e.target.name tells us WHICH field changed.
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // "async" because we now WAIT for the server's answer before moving on.
  async function handleSubmit(e) {
    e.preventDefault() // stop the browser from reloading the page

    if (!form.title.trim() || !form.date || !form.type || !form.host.trim()) {
      showToast('⚠️ Please fill in all fields.')
      return
    }

    const data = { ...form, title: form.title.trim(), host: form.host.trim() }

    // The server answers with the saved event, or null if it said no
    // (an error message was already shown). Only clear the form on success.
    const saved = editingId ? await updateEvent(editingId, data) : await addEvent(data)
    if (!saved) return

    showToast(editingId ? '✅ Event updated!' : '✅ Event created! Now customize it or invite co-organizers.')
    setForm(emptyForm)
    setEditingId(null)
  }

  function startEdit(ev) {
    setForm({ title: ev.title, date: ev.date, type: ev.type, host: ev.host })
    setEditingId(ev.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setForm(emptyForm)
    setEditingId(null)
  }

  async function handleDelete(ev) {
    if (!window.confirm(`Delete "${ev.title}"? This cannot be undone.`)) return
    if (!(await deleteEvent(ev.id))) return
    if (editingId === ev.id) cancelEdit()
    showToast('✅ Event deleted.')
  }

  // Derived data: filter + sort every time we draw. No extra state needed.
  const visibleEvents = events
    .filter((ev) => typeFilter === 'All' || ev.type === typeFilter)
    .filter((ev) => ev.title.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <>
      <section className="card">
        <h2>{editingId ? 'Edit Event' : 'Create Event'}</h2>

        {/* "Controlled inputs": value comes from state, onChange updates state */}
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Event title</label>
          <input id="title" name="title" type="text" placeholder="e.g. Product Launch"
            value={form.title} onChange={handleChange} />

          <div className="row">
            <div>
              <label htmlFor="date">Date and time</label>
              <input id="date" name="date" type="datetime-local"
                value={form.date} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="type">Event type</label>
              <select id="type" name="type" value={form.type} onChange={handleChange}>
                <option value="">Select event type</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="host">Host</label>
          <input id="host" name="host" type="text" placeholder="Who is hosting?"
            value={form.host} onChange={handleChange} />

          <div className="actions">
            <button type="submit">{editingId ? 'Save Changes' : 'Create Event'}</button>
            {editingId && <button type="button" className="secondary" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Your Events ({events.length})</h2>

        {events.length > 0 && (
          <div className="row">
            <input type="search" placeholder="Search by title..." aria-label="Search events"
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <select aria-label="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option>All</option>
              {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        )}

        {events.length === 0 && <p className="muted">No events yet. Create your first one above.</p>}
        {events.length > 0 && visibleEvents.length === 0 && <p className="muted">No events match your search.</p>}

        {/* .map() turns each event object into a card. "key" helps React track items. */}
        {visibleEvents.map((ev) => {
          const isSelected = selectedEvent?.id === ev.id
          return (
            <article className={`event-card${isSelected ? ' selected' : ''}`} key={ev.id}
              style={{ borderLeftColor: THEMES[ev.theme]?.main }}>
              <div className="event-card-top">
                <h3>{ev.title}</h3>
                <span className="badge">{ev.type}</span>
                <span className={`badge ${isUpcoming(ev.date) ? 'badge-ok' : 'badge-muted'}`}>
                  {isUpcoming(ev.date) ? 'Upcoming' : 'Past'}
                </span>
              </div>
              <p>📅 {formatDateTime(ev.date)}</p>
              <p>🎤 {ev.host}{ev.location && <> · 📍 {ev.location}</>}</p>
              <div className="actions">
                <button className="small" onClick={() => { setSelectedId(ev.id); showToast(`Now working on "${ev.title}"`) }}
                  disabled={isSelected}>
                  {isSelected ? 'Selected' : 'Select'}
                </button>
                <Link className="btn-link small" to={`/event/${ev.id}`}>View page</Link>
                <button className="small secondary" onClick={() => startEdit(ev)}>Edit</button>
                <button className="small danger" onClick={() => handleDelete(ev)}>Delete</button>
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}
