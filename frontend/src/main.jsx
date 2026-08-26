import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App.jsx'

// Automatically handle new production build deployment chunk 404s cleanly
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  console.warn('[Chromolog] New version deployed. Reloading latest assets...');
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for PWA support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[Chromolog] SW registration failed:', err);
    });
  });
}
