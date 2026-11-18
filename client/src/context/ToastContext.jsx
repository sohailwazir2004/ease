// CONTEXT lets many components share one thing without passing it down by hand.
// Here we share a "showToast(message)" function. Any page can call it, and the
// message is drawn in ONE place (bottom of this file). This fixes the old bug
// where the confirmation message was hidden on every page except Create.
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('')

  const showToast = useCallback((text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000) // hide after 3 seconds
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && <div className="toast">{message}</div>}
    </ToastContext.Provider>
  )
}

// Small helper hook so pages can write: const { showToast } = useToast()
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}
