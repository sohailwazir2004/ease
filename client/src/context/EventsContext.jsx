// THE HEART OF THE APP.
// There is ONE list of events, and everything else (co-organizers, theme, image,
// visibility, RSVPs, shares...) lives INSIDE the event it belongs to.
//
// NEW: the list now lives on the SERVER (the database is the "source of truth").
// React keeps a copy in state so the screen can draw it. The flow of every action:
//   1. call the server        2. the server answers with the saved event
//   3. put that answer into React state        4. React redraws the screen
// If the server says no (bad input, offline...), we show a message and change nothing.
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import useLocalStorage from '../hooks/useLocalStorage.js'
import { useToast } from './ToastContext.jsx'
import * as api from '../api/events.js'

const EventsContext = createContext(null)

export function EventsProvider({ children }) {
  const { showToast } = useToast()

  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [loadError, setLoadError] = useState('')

  // These two are only about THIS browser (not shared data), so they stay in localStorage.
  const [favorites, setFavorites] = useLocalStorage('eventease.favoriteTemplates', [])
  const [selectedId, setSelectedId] = useLocalStorage('eventease.selectedEventId', null)

  // Load all events from the server. The state starts as 'loading', so the first
  // run needs no extra setStatus; it only waits for the answer.
  const fetchEvents = useCallback(async () => {
    try {
      setEvents(await api.listEvents())
      setStatus('ready')
    } catch (err) {
      setLoadError(err.message)
      setStatus('error')
    }
  }, [])

  // Runs once when the app starts. (The linter warns here, but fetchEvents only
  // sets state AFTER the server answers, which is the normal way to load data.)
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    fetchEvents()
  }, [fetchEvents])

  // The "Try again" button: show "loading" again, then ask the server again.
  function reload() {
    setStatus('loading')
    fetchEvents()
  }

  // The event the user is "working on". If none is chosen (or it was deleted),
  // fall back to the first event. This is DERIVED data: no extra state needed.
  const selectedEvent = events.find((e) => e.id === selectedId) ?? events[0] ?? null

  // Runs a server call. On failure: show the error message and return null.
  // On success: return whatever the call returned. Pages check "if (result)".
  async function attempt(action) {
    try {
      return await action()
    } catch (err) {
      showToast(`⚠️ ${err.message}`)
      return null
    }
  }

  // Put the server's version of ONE event into our list.
  function replaceEvent(updated) {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    return updated
  }

  const addEvent = (data) =>
    attempt(async () => {
      const event = await api.createEvent(data)
      setEvents((prev) => [...prev, event])
      setSelectedId(event.id)
      return event
    })

  // patch = only the fields that change, for example { theme: 'Blue' }
  const updateEvent = (id, patch) => attempt(async () => replaceEvent(await api.updateEvent(id, patch)))

  const deleteEvent = (id) =>
    attempt(async () => {
      await api.deleteEvent(id)
      setEvents((prev) => prev.filter((e) => e.id !== id))
      return true
    })

  // The SERVER makes the copy now (keeps settings, resets guests and shares).
  const cloneEvent = (sourceId, data) =>
    attempt(async () => {
      const copy = await api.cloneEvent(sourceId, data)
      setEvents((prev) => [...prev, copy])
      setSelectedId(copy.id)
      return copy
    })

  const addCoOrganizer = (id, data) => attempt(async () => replaceEvent(await api.addCoOrganizer(id, data)))
  const removeCoOrganizer = (id, coId) => attempt(async () => replaceEvent(await api.removeCoOrganizer(id, coId)))
  const addRsvp = (id, data) => attempt(async () => replaceEvent(await api.addRsvp(id, data)))
  const setRsvpStatus = (id, rsvpId, s) => attempt(async () => replaceEvent(await api.setRsvpStatus(id, rsvpId, s)))
  const removeRsvp = (id, rsvpId) => attempt(async () => replaceEvent(await api.removeRsvp(id, rsvpId)))
  const shareEvent = (id, platform) => attempt(async () => replaceEvent(await api.shareEvent(id, platform)))

  function toggleFavorite(name) {
    setFavorites((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  const value = {
    events, status, loadError, reload,
    selectedEvent, setSelectedId,
    addEvent, updateEvent, deleteEvent, cloneEvent,
    addCoOrganizer, removeCoOrganizer, addRsvp, setRsvpStatus, removeRsvp, shareEvent,
    favorites, toggleFavorite,
  }

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEvents() {
  return useContext(EventsContext)
}
