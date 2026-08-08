import { Navigate, Route, Routes } from 'react-router-dom'
import AtlasApp from './atlas/App'
import InsightK3Portal from './insight-k3/Portal'
import LrmApp from './lrm/App'
import SigmaApp from './sigma/App'
import { AppDataProvider } from './sigma/context/AppDataContext'
import { AuthProvider } from './sigma/context/AuthContext'
import { ThemeProvider } from './sigma/context/ThemeContext'
import './atlas/styles.css'
import './insight-k3/styles.css'
import './lrm/styles.css'
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

function LrmPortal() {
  return (
    <div className="lrm-app">
      <LrmApp />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AtlasApp />} />
      <Route path="/sigma/*" element={<SigmaPortal />} />
      <Route path="/lrm/*" element={<LrmPortal />} />
      <Route path="/insight-k3/*" element={<InsightK3Portal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
