import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import './index.css'
import App from './App.tsx'

function setupPlausible() {
  const plausibleScriptSrc = import.meta.env.VITE_PLAUSIBLE_SCRIPT_SRC as string | undefined;
  if (!plausibleScriptSrc) return;

  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
  const isPrerenderCrawl = userAgent.includes('ReactSnap') || navigator.webdriver;
  if (isPrerenderCrawl) return;

  const win = window as Window & {
    plausible?: ((...args: unknown[]) => void) & {
      q?: unknown[][];
      o?: Record<string, unknown>;
      init?: (options?: Record<string, unknown>) => void;
    };
  };

  if (!win.plausible) {
    const plausibleFn: ((...args: unknown[]) => void) & { q?: unknown[][] } = (...args: unknown[]) => {
      plausibleFn.q = plausibleFn.q || [];
      plausibleFn.q.push(args);
    };
    win.plausible = plausibleFn;
  }

  if (!win.plausible.init) {
    win.plausible.init = (options: Record<string, unknown> = {}) => {
      if (!win.plausible) return;
      win.plausible.o = options;
    };
  }

  win.plausible.init();

  if (document.querySelector('script[data-plausible="true"]')) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = plausibleScriptSrc;
  script.dataset.plausible = 'true';
  document.head.appendChild(script);
}

setupPlausible();

const rootElement = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
