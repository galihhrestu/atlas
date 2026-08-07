import type { CSSProperties } from 'react'

export function StatRing({ value, label, sublabel }: { value: number; label: string; sublabel?: string }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div className="stat-ring" style={{ '--ring-value': `${safe * 3.6}deg` } as CSSProperties}>
      <div className="stat-ring__inner">
        <strong>{safe}%</strong>
        <span>{label}</span>
        {sublabel && <small>{sublabel}</small>}
      </div>
    </div>
  )
}
