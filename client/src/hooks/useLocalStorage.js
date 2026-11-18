// A CUSTOM HOOK. A hook is a function whose name starts with "use" and that
// can use React features (like useState). This one works exactly like useState,
// but it also saves the value in the browser's localStorage so it survives refresh.
//
//   const [events, setEvents] = useLocalStorage('eventease.events', [])
//
// "events" is the current value. "setEvents" changes it AND re-draws the screen.
import { useState, useEffect } from 'react'

export default function useLocalStorage(key, initialValue) {
  // Lazy initial value: this function runs only once, on first render.
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  // useEffect runs AFTER the screen updates, every time "value" changes.
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage can be full (for example with a big image). Ignore instead of crashing.
    }
  }, [key, value])

  return [value, setValue]
}
