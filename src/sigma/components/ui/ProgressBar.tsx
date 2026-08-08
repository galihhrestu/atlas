export function ProgressBar({ value, label, compact = false }: { value: number; label?: string; compact?: boolean }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div className={`progress-block ${compact ? 'progress-block--compact' : ''}`}>
      {label && <div className="progress-block__label"><span>{label}</span><strong>{safe}%</strong></div>}
      <div className="progress-track"><span style={{ width: `${safe}%` }} /></div>
    </div>
  )
}
