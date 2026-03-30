import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './assets/styles/index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster 
      richColors 
      closeButton 
      duration={2000} 
      position="bottom-left" 
      />
  </StrictMode>,
)
