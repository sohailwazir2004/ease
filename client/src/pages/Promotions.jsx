// Promote the selected event: real share links, copy link, hashtags, QR code
// and a badge designer with live preview.
import { useState } from 'react'
import { useEvents } from '../context/EventsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { SOCIAL_PLATFORMS } from '../data/constants.js'
import { formatDateTime } from '../utils/format.js'
import NoEvent from '../components/NoEvent.jsx'

const BADGE_COLORS = { Gold: '#d4af37', Silver: '#9e9e9e', Bronze: '#a1673a' }

export default function Promotions() {
  const { selectedEvent } = useEvents()
  if (!selectedEvent) return <NoEvent title="Promotions" />
  return <PromotionsView key={selectedEvent.id} event={selectedEvent} />
}

function PromotionsView({ event }) {
  const { shareEvent } = useEvents()
  const { showToast } = useToast()

  const [topic, setTopic] = useState(event.title)
  const [hashtags, setHashtags] = useState([])
  const [shape, setShape] = useState('Round')
  const [color, setColor] = useState('Gold')

  // The link to this event's page. It only opens in this browser until the
  // app is deployed with a backend.
  const url = `${window.location.origin}/event/${event.id}`
  const message = `Join me at ${event.title} on ${formatDateTime(event.date)}! 🎉`

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  async function share(platform) {
    if (platform === 'Facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener')
    } else if (platform === 'Twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener')
    } else {
      // Instagram has no web share link, so we copy the text to paste into a post.
      const ok = await copyText(`${message} ${url}`)
      showToast(ok ? '✅ Text copied. Paste it into your Instagram post.' : '⚠️ Could not copy.')
    }
    shareEvent(event.id, platform) // the server adds 1 to this platform's count
  }

  async function copyLink() {
    showToast((await copyText(url)) ? '✅ Link copied to clipboard.' : '⚠️ Could not copy the link.')
  }

  function generate(e) {
    e.preventDefault()
    const base = topic.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!base) return showToast('⚠️ Enter a topic first.')
    const year = new Date(event.date).getFullYear()
    setHashtags([`#${base}${year}`, `#${base}event`, `#join${base}`, `#${base}live`, `#eventease${base}`, `#${base}community`, `#${base}experience`])
  }

  return (
    <>
      <section className="card">
        <h2>Share "{event.title}"</h2>
        <div className="actions">
          {SOCIAL_PLATFORMS.map((p) => (
            <button key={p} onClick={() => share(p)}>{p}{event.shares[p] ? ` (${event.shares[p]})` : ''}</button>
          ))}
          <button className="secondary" onClick={copyLink}>🔗 Copy Link</button>
        </div>
        <p className="muted small-text">{url}</p>
      </section>

      <section className="card">
        <h2>QR Code</h2>
        <img className="qr" alt={`QR code for ${event.title}`}
          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`} />
      </section>

      <section className="card">
        <h2>Hashtag Suggestions</h2>
        <form onSubmit={generate} className="row">
          <input type="text" value={topic} aria-label="Topic" onChange={(e) => setTopic(e.target.value)} />
          <button type="submit">Generate</button>
        </form>
        <div className="tags">
          {hashtags.map((h) => (
            <button key={h} className="tag" onClick={async () => showToast((await copyText(h)) ? `Copied ${h}` : '⚠️ Could not copy')}>{h}</button>
          ))}
        </div>
        {hashtags.length > 0 && <p className="muted small-text">Click a hashtag to copy it.</p>}
      </section>

      <section className="card">
        <h2>Design Your Badge</h2>
        <div className="row">
          <select aria-label="Shape" value={shape} onChange={(e) => setShape(e.target.value)}>
            <option>Round</option><option>Square</option>
          </select>
          <select aria-label="Color" value={color} onChange={(e) => setColor(e.target.value)}>
            {Object.keys(BADGE_COLORS).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="badge-preview"
          style={{ background: BADGE_COLORS[color], borderRadius: shape === 'Round' ? '50%' : '12px' }}>
          <span>{event.title}</span>
        </div>
      </section>
    </>
  )
}
