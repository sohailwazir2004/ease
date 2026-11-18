// Invite and remove co-organizers for the selected event.
// Notice the data lives INSIDE the event (event.coOrganizers). In the old app
// it was one global list shared by every event.
import { useState } from 'react'
import { useEvents } from '../context/EventsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { ROLES } from '../data/constants.js'
import { formatDateTime } from '../utils/format.js'
import NoEvent from '../components/NoEvent.jsx'

const emptyForm = { email: '', role: '', notify: false, access: false }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CoOrganizers() {
  const { selectedEvent, addCoOrganizer, removeCoOrganizer } = useEvents()
  const { showToast } = useToast()
  const [form, setForm] = useState(emptyForm)

  if (!selectedEvent) return <NoEvent title="Co-Organizers" />
  const list = selectedEvent.coOrganizers

  function handleChange(e) {
    const { name, type, checked, value } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  async function handleInvite(e) {
    e.preventDefault()
    const email = form.email.trim().toLowerCase()

    // Quick checks here give instant feedback. The server checks again anyway.
    if (!emailPattern.test(email)) return showToast('⚠️ Please enter a valid email address.')
    if (!form.role) return showToast('⚠️ Please choose a role.')
    if (list.some((c) => c.email === email)) return showToast('⚠️ This person is already added.')

    const saved = await addCoOrganizer(selectedEvent.id, { email, role: form.role, notify: form.notify, access: form.access })
    if (!saved) return
    setForm(emptyForm)
    showToast(`✅ ${email} added as ${form.role}.`)
  }

  async function handleRemove(id) {
    if (await removeCoOrganizer(selectedEvent.id, id)) showToast('✅ Co-organizer removed.')
  }

  return (
    <>
      <section className="card">
        <h2>Co-Organizers for "{selectedEvent.title}"</h2>
        <form onSubmit={handleInvite}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="name@example.com"
            value={form.email} onChange={handleChange} />

          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={form.role} onChange={handleChange}>
            <option value="">Assign role</option>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>

          <label className="check"><input name="notify" type="checkbox" checked={form.notify} onChange={handleChange} /> Send them notifications</label>
          <label className="check"><input name="access" type="checkbox" checked={form.access} onChange={handleChange} /> Grant access to edit</label>

          <div className="actions"><button type="submit">Add Co-Organizer</button></div>
        </form>
        <p className="muted small-text">Note: no email is really sent yet. That needs a backend, which we add later.</p>
      </section>

      <section className="card">
        <h2>Team ({list.length})</h2>
        {list.length === 0 && <p className="muted">No co-organizers yet.</p>}
        {list.map((c) => (
          <article className="event-card" key={c.id}>
            <div className="event-card-top">
              <h3>{c.email}</h3>
              <span className="badge">{c.role}</span>
            </div>
            <p>Notifications: {c.notify ? 'On' : 'Off'} · Edit access: {c.access ? 'Granted' : 'No'}</p>
            <p className="muted small-text">Added {formatDateTime(c.invitedAt)}</p>
            <div className="actions"><button className="small danger" onClick={() => handleRemove(c.id)}>Remove</button></div>
          </article>
        ))}
      </section>
    </>
  )
}
