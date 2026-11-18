// The public page of one event, at /event/<id>. useParams() reads the id
// from the URL. This is what the share link and QR code point to.
import { useParams, Link } from 'react-router-dom'
import { useEvents } from '../context/EventsContext.jsx'
import EventBanner from '../components/EventBanner.jsx'

const VISIBILITY_TEXT = { public: 'Public event', link: 'Unlisted event', private: 'Private event (invite only)' }

export default function EventPage() {
  const { id } = useParams()
  const { events } = useEvents()
  const event = events.find((e) => e.id === id)

  if (!event) {
    return (
      <section className="card">
        <h2>Event not found</h2>
        <p className="muted">This event does not exist in this browser.</p>
        <p><Link className="btn-link" to="/">Back to EventEase</Link></p>
      </section>
    )
  }

  return (
    <section className="card">
      <EventBanner event={event} />
      <p className="muted">{VISIBILITY_TEXT[event.visibility.visibility]} · {event.visibility.joining}</p>
      {event.coOrganizers.length > 0 && (
        <p>Team: {event.coOrganizers.map((c) => `${c.email} (${c.role})`).join(', ')}</p>
      )}
      <p><Link className="btn-link" to="/">← Back to EventEase</Link></p>
    </section>
  )
}
