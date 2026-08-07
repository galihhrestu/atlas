import { ArrowRight, BarChart3, Eye, FileSpreadsheet, ShieldCheck } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getAtlasHomePath, publicAssetPath } from '../../runtime'

export function LoginPage() {
  const { user, login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  if (user) return <Navigate to="/dashboard" replace />

  const enter = (role: 'user' | 'admin') => {
    login(role)
    navigate('/dashboard')
  }

  return (
    <div className="login-page">
      <div className="login-page__ambient login-page__ambient--one" />
      <div className="login-page__ambient login-page__ambient--two" />
      <a className="login-home-link" href={getAtlasHomePath()}>← ATLAS Webmap</a>
      <button className="login-theme" onClick={toggleTheme}>{theme === 'dark' ? 'Light mode' : 'Night mode'}</button>

      <section className="login-hero">
        <div className="login-brand">
          <img src={publicAssetPath('sigma-mark.svg')} alt="SIGMA" />
          <div><strong>SIGMA</strong><span>Operational Monitoring Assurance</span></div>
        </div>
        <div className="login-hero__eyebrow">GA & SE • SSL DEPARTMENT • IMPROVEMENT PLAN</div>
        <h1>From monitoring activity to <em>monitoring assurance.</em></h1>
        <p>SIGMA helps operational teams verify security and asset patrol activities, improve visibility, identify high-risk areas, and prioritize supervision efforts.</p>

        <div className="login-capabilities">
          <article><ShieldCheck size={20} /><div><strong>Verified Monitoring</strong><span>GPS, evidence, timestamp, and admin validation.</span></div></article>
          <article><Eye size={20} /><div><strong>Operational Visibility</strong><span>Know what has been seen, where, and how recently.</span></div></article>
          <article><BarChart3 size={20} /><div><strong>Risk-Based Patrol</strong><span>Priorities based on hotspots and visibility gaps.</span></div></article>
          <article><FileSpreadsheet size={20} /><div><strong>Management Reporting</strong><span>Generate PDF and Excel reports instantly.</span></div></article>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel__header">
          <span>LOCAL PROTOTYPE</span>
          <h2>Choose demo access</h2>
          <p>No password is required for this localhost review package.</p>
        </div>

        <button className="access-card" onClick={() => enter('user')}>
          <span className="access-card__icon"><Eye size={22} /></span>
          <div><strong>Authorized User</strong><small>Management / appointed viewer</small><p>Monitor data, review performance, filter information, and export PDF or Excel reports.</p></div>
          <ArrowRight size={19} />
        </button>

        <button className="access-card access-card--admin" onClick={() => enter('admin')}>
          <span className="access-card__icon"><ShieldCheck size={22} /></span>
          <div><strong>SSL Administrator</strong><small>Social, Security & Legal Department</small><p>Enter field data, register assets, validate patrol evidence, and manage monitoring records.</p></div>
          <ArrowRight size={19} />
        </button>

        <div className="login-panel__note">
          Data is stored locally in the browser for this prototype. Firebase configuration is prepared for the next integration stage.
        </div>
      </section>
    </div>
  )
}
