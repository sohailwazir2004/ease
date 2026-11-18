// Browse templates, search them, filter by category, apply one to the selected
// event, and mark favorites. In the old app search/filter did nothing and applying
// a template changed nothing. Here applying really changes the event's theme.
import { useState } from 'react'
import { useEvents } from '../context/EventsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { TEMPLATES, TEMPLATE_CATEGORIES, THEMES } from '../data/constants.js'
import NoEvent from '../components/NoEvent.jsx'

export default function Templates() {
  const { selectedEvent, updateEvent, favorites, toggleFavorite } = useEvents()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  if (!selectedEvent) return <NoEvent title="Templates" />

  const shown = TEMPLATES
    .filter((t) => category === 'All' || t.category === category)
    .filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((t) => !onlyFavorites || favorites.includes(t.name))

  async function apply(t) {
    const saved = await updateEvent(selectedEvent.id, { template: t.name, theme: t.theme })
    if (saved) showToast(`✅ "${t.name}" applied to "${selectedEvent.title}".`)
  }

  return (
    <section className="card">
      <h2>Templates for "{selectedEvent.title}"</h2>
      <p className="muted">Current template: <strong>{selectedEvent.template ?? 'None'}</strong></p>

      <div className="row">
        <input type="search" placeholder="Search templates (e.g. wedding)" aria-label="Search templates"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All</option>
          {TEMPLATE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <label className="check">
        <input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} /> Show favorites only
      </label>

      {shown.length === 0 && <p className="muted">No templates match.</p>}

      <div className="grid">
        {shown.map((t) => {
          const isFav = favorites.includes(t.name)
          const isApplied = selectedEvent.template === t.name
          return (
            <article key={t.name} className="template-card" style={{ borderTopColor: THEMES[t.theme].main, background: THEMES[t.theme].soft }}>
              <h3>{t.name}</h3>
              <span className="badge badge-outline">{t.category}</span>
              <p>{t.description}</p>
              <div className="actions">
                <button className="small" onClick={() => apply(t)} disabled={isApplied}>{isApplied ? 'Applied' : 'Apply'}</button>
                <button className="small secondary" onClick={() => toggleFavorite(t.name)}
                  aria-pressed={isFav}>{isFav ? '★ Favorite' : '☆ Favorite'}</button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
