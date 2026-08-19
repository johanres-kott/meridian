import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import './i18n/index.js'
import App from './App.jsx'

// Service worker registreras här i stället för inline i index.html så att
// CSP:n kan vara utan 'unsafe-inline' för script (se vercel.json).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

Sentry.init({
  dsn: "https://ec98bb12fd87114965529f77f73e5add@o4511073057570816.ingest.de.sentry.io/4511073059930192",
  environment: window.location.hostname === "thesion.tech" ? "production" : "development",
  enabled: window.location.hostname === "thesion.tech",
  tracesSampleRate: 0.1,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div style={{ padding: 40, textAlign: "center", color: "#787b86" }}>Något gick fel. Ladda om sidan.</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
