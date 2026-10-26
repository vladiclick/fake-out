import { createRoot } from 'react-dom/client';
import { GameProvider } from './store/gameStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import App from './App';

// Service worker intentionally NOT registered: a cache-first SW served stale
// module chunks and crashed the app. Any previously-installed SW self-destructs
// via the kill-switch in /public/sw.js. (App stays installable via the manifest.)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <GameProvider>
      <App />
    </GameProvider>
  </ErrorBoundary>,
);
