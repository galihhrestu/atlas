import {
  BarChart3,
  ClipboardCheck,
  FileBarChart,
  FileInput,
  Gauge,
  LayoutDashboard,
  MapPinned,
  PackageSearch,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { sigmaAsset } from '../../paths'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const primaryItems = [
  { to: '/sigma/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sigma/patrols', label: 'Patrol Monitoring', icon: ShieldCheck },
  { to: '/sigma/assets', label: 'Asset Monitoring', icon: PackageSearch },
  { to: '/sigma/visibility', label: 'Visibility', icon: MapPinned },
  { to: '/sigma/risk', label: 'Risk & Hotspot', icon: ShieldAlert },
  { to: '/sigma/findings', label: 'Findings', icon: ClipboardCheck },
  { to: '/sigma/performance', label: 'Performance', icon: Gauge },
  { to: '/sigma/reports', label: 'Reports', icon: FileBarChart },
]

const adminItems = [
  { to: '/sigma/admin/data-entry', label: 'Data Entry', icon: FileInput },
  { to: '/sigma/admin/validation', label: 'Validation Queue', icon: ClipboardCheck },
  { to: '/sigma/admin/users', label: 'User Management', icon: UsersRound },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth()

  return (
    <>
      {open && <button className="sidebar-backdrop" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <img src={sigmaAsset('sigma-mark.svg')} alt="SIGMA" />
          <div>
            <strong>SIGMA</strong>
            <span>Monitoring Assurance</span>
          </div>
          <button className="sidebar__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="sidebar__scope">
          <BarChart3 size={17} />
          <div>
            <span>Operational Scope</span>
            <strong>Security & Asset Patrol</strong>
          </div>
        </div>

        <nav className="sidebar__nav">
          <div className="sidebar__label">Monitoring Workspace</div>
          {primaryItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="sidebar__label sidebar__label--spaced">SSL Administration</div>
              {adminItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}>
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar__footer">
          <div className={`role-pill role-pill--${user?.role}`}>
            {user?.role === 'admin' ? 'ADMIN / SSL' : 'AUTHORIZED USER'}
          </div>
          <p>Operational monitoring visibility and assurance.</p>
        </div>
      </aside>
    </>
  )
}
