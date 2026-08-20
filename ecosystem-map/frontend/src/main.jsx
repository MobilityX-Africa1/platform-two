import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SIDEBAR_WIDTH_STORAGE_KEY } from './components/LeftPanel.jsx'

// A real browser refresh re-runs this module before React mounts — reset the
// sidebar to its default width on a fresh load, but leave the route alone so
// a reload keeps the user on the page they were actually looking at.
window.localStorage.removeItem(SIDEBAR_WIDTH_STORAGE_KEY)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
