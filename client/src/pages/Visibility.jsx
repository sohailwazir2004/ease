// Who can see and join the selected event.
// (These settings are saved on the event. Enforcing them needs a backend + login.)
import { useState } from 'react'
import { useEvents } from '../context/EventsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { VISIBILITY_OPTIONS } from '../data/constants.js'
import NoEvent from '../components/NoEvent.jsx'

const ROLE_LABELS = { organizer: 'Organizer', cohost: 'Co-host', viewer: 'Viewer', moderator: 'Moderator' }

export default function Visibility() {
  const { selectedEvent } = useEvents()
  if (!selectedEvent) return <NoEvent title="Visibility" />
  return <VisibilityForm key={selectedEvent.id} event={selectedEvent} />
}

function VisibilityForm({ event }) {
  const { updateEvent } = useEvents()
  const { showToast } = useToast()
  const [form, setForm] = useState(event.visibility)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleRole(e) {
    setForm({ ...form, roles: { ...form.roles, [e.target.name]: e.target.checked } })
  }

  async function handleSave(e) {
    e.preventDefault()
    if (await updateEvent(event.id, { visibility: form })) showToast('✅ Visibility settings saved.')
  }

  return (
    <section className="card">
      <h2>Visibility for "{event.title}"</h2>
      <form onSubmit={handleSave}>
        <label htmlFor="visibility">Who can see this event</label>
        <select id="visibility" name="visibility" value={form.visibility} onChange={handleChange}>
          {VISIBILITY_OPTIONS.visibility.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <label htmlFor="joining">Joining permission</label>
        <select id="joining" name="joining" value={form.joining} onChange={handleChange}>
          {VISIBILITY_OPTIONS.joining.map((o) => <option key={o}>{o}</option>)}
        </select>

        <label htmlFor="inviteControl">Invite control</label>
        <select id="inviteControl" name="inviteControl" value={form.inviteControl} onChange={handleChange}>
          {VISIBILITY_OPTIONS.inviteControl.map((o) => <option key={o}>{o}</option>)}
        </select>

        <label htmlFor="expiration">Access expires (optional)</label>
        <input id="expiration" name="expiration" type="datetime-local" value={form.expiration} onChange={handleChange} />

        <label>Roles with access</label>
        {Object.entries(ROLE_LABELS).map(([key, label]) => (
          <label className="check" key={key}>
            <input type="checkbox" name={key} checked={form.roles[key]} onChange={handleRole} /> {label}
          </label>
        ))}

        <div className="actions"><button type="submit">Save Settings</button></div>
      </form>
    </section>
  )
}
