import { Bell, ChevronDown, LogOut, Menu, Moon, RotateCcw, Sun, UserCog } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAppData } from '../../context/AppDataContext'
import { useTheme } from '../../context/ThemeContext'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout, switchRole } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { resetDemoData } = useAppData()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="icon-button topbar__menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
        <div className="topbar__context">
          <span>GA & SE / SSL Department</span>
          <strong>Operational Monitoring Center</strong>
        </div>
      </div>

      <div className="topbar__right">
        <div className="system-status"><i /> System operational</div>
        <button className="icon-button" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon-button notification-button" title="Notifications">
          <Bell size={18} />
          <span>4</span>
        </button>
        <div className="profile-menu">
          <button className="profile-button" onClick={() => setProfileOpen((value) => !value)}>
            <span className="profile-avatar">{user?.initials}</span>
            <span className="profile-button__text">
              <strong>{user?.name}</strong>
              <small>{user?.title}</small>
            </span>
            <ChevronDown size={15} />
          </button>
          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown__header">
                <strong>{user?.department}</strong>
                <span>{user?.role === 'admin' ? 'Administrator access' : 'Read and report access'}</span>
              </div>
              <button onClick={() => { switchRole(user?.role === 'admin' ? 'user' : 'admin'); setProfileOpen(false) }}>
                <UserCog size={16} /> Switch to {user?.role === 'admin' ? 'User' : 'Admin'} demo
              </button>
              <button onClick={() => { resetDemoData(); setProfileOpen(false) }}>
                <RotateCcw size={16} /> Reset demo data
              </button>
              <button onClick={logout}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
