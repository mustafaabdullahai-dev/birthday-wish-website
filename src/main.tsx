import { createRoot } from 'react-dom/client'

import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/600-italic.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/700-italic.css'
import '@fontsource/lora/400.css'
import '@fontsource/lora/400-italic.css'
import '@fontsource/lora/600.css'
import '@fontsource/lora/600-italic.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'

import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n'

createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW is progressive enhancement — ignore failures */
    })
  })
}