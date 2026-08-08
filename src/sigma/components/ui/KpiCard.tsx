import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string | number
  detail: string
  icon: LucideIcon
  trend?: string
  accent?: 'gold' | 'cyan' | 'green' | 'orange' | 'red'
}

export function KpiCard({ label, value, detail, icon: Icon, trend, accent = 'gold' }: KpiCardProps) {
  return (
    <article className={`kpi-card kpi-card--${accent}`}>
      <div className="kpi-card__top">
        <span className="kpi-card__icon"><Icon size={18} /></span>
        {trend && <span className="kpi-card__trend">{trend}</span>}
      </div>
      <div className="kpi-card__value">{value}</div>
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__detail">{detail}</div>
    </article>
  )
}
