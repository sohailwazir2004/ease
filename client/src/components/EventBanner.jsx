// Shows how an event page looks (theme color, picture, title, details).
// Used twice: as the LIVE PREVIEW in Customize, and on the public event page.
// Props are plain values so the component doesn't care where they come from.
import { THEMES } from '../data/constants.js'
import { formatDateTime } from '../utils/format.js'

export default function EventBanner({ event }) {
  const theme = THEMES[event.theme] ?? THEMES.Purple

  return (
    <div className="banner" style={{ borderColor: theme.main, background: theme.soft }}>
      {event.image && <img className="banner-img" src={event.image} alt={event.title} />}
      <div className="banner-body">
        <span className="badge" style={{ background: theme.main }}>{event.type}</span>
        {event.template && <span className="badge badge-outline">{event.template}</span>}
        <h2 style={{ color: theme.main }}>{event.title}</h2>
        <p>📅 {formatDateTime(event.date)}</p>
        {event.location && <p>📍 {event.location}</p>}
        <p>🎤 Hosted by {event.host}</p>
        {event.description && <p className="banner-desc">{event.description}</p>}
      </div>
    </div>
  )
}
