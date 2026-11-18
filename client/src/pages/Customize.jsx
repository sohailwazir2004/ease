// Customize the look of the selected event's page, with a LIVE PREVIEW.
// The preview works because the form values are state: every keystroke
// changes state, React redraws, and the preview shows the new values instantly.
import { useState } from 'react'
import { useEvents } from '../context/EventsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { THEMES } from '../data/constants.js'
import EventBanner from '../components/EventBanner.jsx'
import NoEvent from '../components/NoEvent.jsx'

const MAX_IMAGE_BYTES = 500 * 1024

export default function Customize() {
  const { selectedEvent } = useEvents()
  if (!selectedEvent) return <NoEvent title="Customize Event Page" />

  // key={...} makes React throw away the form and start fresh whenever the
  // user switches to a different event. Without it the old values would stay.
  return <CustomizeForm key={selectedEvent.id} event={selectedEvent} />
}

function CustomizeForm({ event }) {
  const { updateEvent } = useEvents()
  const { showToast } = useToast()

  const [form, setForm] = useState({
    title: event.title,
    location: event.location,
    description: event.description,
    theme: event.theme,
    image: event.image,
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Turn the chosen picture into text (a "data URL") so it can live in localStorage.
  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      showToast('⚠️ Image is too big. Please choose one under 500 KB.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }))
    reader.readAsDataURL(file)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      showToast('⚠️ The title cannot be empty.')
      return
    }
    const saved = await updateEvent(event.id, { ...form, title: form.title.trim(), location: form.location.trim() })
    if (saved) showToast('✅ Event page saved!')
  }

  return (
    <>
      <section className="card">
        <h2>Customize Event Page</h2>
        <form onSubmit={handleSave}>
          <label htmlFor="title">Event title</label>
          <input id="title" name="title" type="text" value={form.title} onChange={handleChange} />

          <label htmlFor="location">Location</label>
          <input id="location" name="location" type="text" placeholder="e.g. Islamabad Club or Zoom link"
            value={form.location} onChange={handleChange} />

          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows="4" placeholder="Tell guests what to expect"
            value={form.description} onChange={handleChange} />

          <label>Color theme</label>
          <div className="swatches">
            {Object.entries(THEMES).map(([name, colors]) => (
              <button type="button" key={name} title={name} aria-label={name}
                className={`swatch${form.theme === name ? ' active' : ''}`}
                style={{ background: colors.main }}
                onClick={() => setForm({ ...form, theme: name })} />
            ))}
            <span className="muted">{form.theme}</span>
          </div>

          <label htmlFor="image">Cover image (under 500 KB)</label>
          <input id="image" type="file" accept="image/*" onChange={handleImage} />
          {form.image && (
            <button type="button" className="small secondary"
              onClick={() => setForm({ ...form, image: null })}>Remove image</button>
          )}

          <div className="actions">
            <button type="submit">Save Changes</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Live Preview</h2>
        <EventBanner event={{ ...event, ...form }} />
      </section>
    </>
  )
}
