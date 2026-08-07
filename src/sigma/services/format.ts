import type { RiskLevel, StatusTone, VisibilityLevel } from '../types'

export function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

export function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function labelize(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())
}

export function riskTone(value: RiskLevel): StatusTone {
  if (value === 'critical') return 'danger'
  if (value === 'high') return 'warning'
  if (value === 'medium') return 'info'
  return 'success'
}

export function visibilityTone(value: VisibilityLevel): StatusTone {
  if (value === 'none') return 'danger'
  if (value === 'low') return 'warning'
  if (value === 'moderate') return 'info'
  return 'success'
}
