import { Navigate, Route, Routes } from 'react-router-dom'
import AtlasApp from './atlas/App'
import SigmaApp from './sigma/App'
import { AppDataProvider } from './sigma/context/AppDataContext'
import { AuthProvider } from './sigma/context/AuthContext'
import { ThemeProvider } from './sigma/context/ThemeContext'
import './atlas/styles.css'
import './sigma/styles/globals.css'
import './root.css'

function SigmaPortal() {
  return (
    <div className="sigma-app">
      <ThemeProvider>
        <AuthProvider>
          <AppDataProvider>
            <SigmaApp />
          </AppDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AtlasApp />} />
      <Route path="/sigma/*" element={<SigmaPortal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
