// Shown by pages that need a selected event when there are no events yet.
import { Link } from 'react-router-dom'

export default function NoEvent({ title }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p className="muted">You need an event first. This page works on one event at a time.</p>
      <p><Link className="btn-link" to="/">Create your first event</Link></p>
    </section>
  )
}
