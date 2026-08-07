import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SIDEBAR_WIDTH_STORAGE_KEY } from './components/LeftPanel.jsx'

// A real browser refresh re-runs this module before React mounts, so this is
// the point to snap the app back to its "fresh load" state: default sidebar
// width and the dashboard route, regardless of where the tab was left.
window.localStorage.removeItem(SIDEBAR_WIDTH_STORAGE_KEY)
if (window.location.pathname !== '/') {
  window.history.replaceState(null, '', '/')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
