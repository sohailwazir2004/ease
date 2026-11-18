// Clone a REAL saved event. The copy keeps the description, theme, image,
// co-organizers and visibility; guests (RSVPs) and share counts start fresh.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEvents } from '../context/EventsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatDateTime } from '../utils/format.js'

export default function CloneEvent() {
  const { events, cloneEvent } = useEvents()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [form, setForm] = useState({ title: '', date: '', tag: '' })

  const matches = events.filter((e) => e.title.toLowerCase().includes(search.trim().toLowerCase()))

  // Choosing a source event prefills the title, as the old app did.
  function pickSource(ev) {
    setSourceId(ev.id)
    setForm({ title: `${ev.title} (Copy)`, date: '', tag: '' })
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!sourceId) return showToast('⚠️ Choose an event to clone first.')
    if (!form.title.trim() || !form.date) return showToast('⚠️ Please enter a title and a date.')

    const copy = await cloneEvent(sourceId, { title: form.title.trim(), date: form.date, tag: form.tag.trim() })
    if (!copy) return
    showToast('✅ Event cloned! You are now working on the copy.')
    navigate('/customize')
  }

  if (events.length === 0) {
    return (
      <section className="card">
        <h2>Clone an Existing Event</h2>
        <p className="muted">There is nothing to clone yet. Create an event first.</p>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Clone an Existing Event</h2>

      <label htmlFor="search">1. Find the event to copy</label>
      <input id="search" type="search" placeholder="Search by title..." value={search}
        onChange={(e) => setSearch(e.target.value)} />

      <div className="pick-list">
        {matches.length === 0 && <p className="muted">No events match.</p>}
        {matches.map((ev) => (
          <button type="button" key={ev.id}
            className={`pick${sourceId === ev.id ? ' active' : ''}`}
            onClick={() => pickSource(ev)}>
            <strong>{ev.title}</strong>
            <span>{ev.type} · {formatDateTime(ev.date)}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="title">2. New title</label>
        <input id="title" name="title" type="text" value={form.title} onChange={handleChange} />

        <label htmlFor="date">New date and time</label>
        <input id="date" name="date" type="datetime-local" value={form.date} onChange={handleChange} />

        <label htmlFor="tag">Tag (optional)</label>
        <input id="tag" name="tag" type="text" placeholder="e.g. Q3 Replay" value={form.tag} onChange={handleChange} />

        <div className="actions"><button type="submit">Save Cloned Event</button></div>
      </form>
    </section>
  )
}
