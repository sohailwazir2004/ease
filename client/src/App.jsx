// App = the "shell" of the website: header + navigation + the current page.
// Each <Route> says: "when the URL is X, show component Y".
import { Routes, Route, useMatch } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import CurrentEventBar from './components/CurrentEventBar.jsx'
import { useEvents } from './context/EventsContext.jsx'
import CreateEvent from './pages/CreateEvent.jsx'
import Customize from './pages/Customize.jsx'
import CoOrganizers from './pages/CoOrganizers.jsx'
import Templates from './pages/Templates.jsx'
import CloneEvent from './pages/CloneEvent.jsx'
import Visibility from './pages/Visibility.jsx'
import Analytics from './pages/Analytics.jsx'
import Promotions from './pages/Promotions.jsx'
import EventPage from './pages/EventPage.jsx'

export default function App() {
  // On the public event page we hide the management navigation.
  const onEventPage = useMatch('/event/:id')
  const { status, loadError, reload } = useEvents()

  return (
    <>
      <header className="app-header">
        <h1>EventEase</h1>
        <p>Create, customize and promote your events</p>
      </header>

      {!onEventPage && (
        <>
          <Navbar />
          <CurrentEventBar />
        </>
      )}

      {/* While events load from the server, or if the server is down, show that
          instead of the pages (so pages never see half-loaded data). */}
      {status === 'loading' && (
        <main><section className="card"><p className="muted">Loading your events...</p></section></main>
      )}
      {status === 'error' && (
        <main>
          <section className="card">
            <h2>Could not load events</h2>
            <p>{loadError}</p>
            <p className="muted small-text">Start the server with <code>npm run dev</code> in the server folder.</p>
            <div className="actions"><button onClick={reload}>Try again</button></div>
          </section>
        </main>
      )}

      {status === 'ready' && <main>
        <Routes>
          <Route path="/" element={<CreateEvent />} />
          <Route path="/customize" element={<Customize />} />
          <Route path="/co-organizers" element={<CoOrganizers />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/clone" element={<CloneEvent />} />
          <Route path="/visibility" element={<Visibility />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/event/:id" element={<EventPage />} />
          <Route path="*" element={<CreateEvent />} />
        </Routes>
      </main>}
    </>
  )
}
