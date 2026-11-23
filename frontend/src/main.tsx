import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:'
const isElectronBuild = import.meta.env.BASE_URL === './'

// Service worker quebra no Electron (file://) e pode deixar a tela branca
if (!isFileProtocol && !isElectronBuild) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
