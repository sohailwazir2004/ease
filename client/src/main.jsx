// ENTRY POINT: the first JavaScript file the browser runs.
// It finds <div id="root"> in index.html and tells React to draw our app inside it.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { EventsProvider } from './context/EventsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter lets the app change "pages" by URL without reloading */}
    <BrowserRouter>
      {/* Providers make shared data available to every component inside them */}
      <ToastProvider>
        <EventsProvider>
          <App />
        </EventsProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
