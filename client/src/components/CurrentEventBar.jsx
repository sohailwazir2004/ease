// The "Working on: [event]" selector under the navbar.
// Customize, Co-Organizers, Templates, Visibility, Analytics and Promotions all
// act on the event chosen here.
import { useEvents } from '../context/EventsContext.jsx'

export default function CurrentEventBar() {
  const { events, selectedEvent, setSelectedId } = useEvents()
  if (events.length === 0) return null

  return (
    <div className="event-bar">
      <label htmlFor="current-event">Working on:</label>
      <select
        id="current-event"
        value={selectedEvent?.id ?? ''}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>{ev.title}</option>
        ))}
      </select>
    </div>
  )
}
