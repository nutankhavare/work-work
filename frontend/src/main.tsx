import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AlertProvider } from './Context/AlertContext.tsx'
import { AuthProvider } from './Context/AuthContext.tsx'
import { ConfirmProvider } from './Context/ConfirmContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AlertProvider>
      <ConfirmProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConfirmProvider>
    </AlertProvider>
  </StrictMode>,
)
