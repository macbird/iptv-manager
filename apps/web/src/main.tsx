import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { Toaster } from 'sonner';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position="bottom-center" closeButton richColors style={{ zIndex: 99999 }} />
    <App />
  </StrictMode>,
)
