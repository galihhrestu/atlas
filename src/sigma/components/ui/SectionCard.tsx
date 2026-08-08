import type { ReactNode } from 'react'

export function SectionCard({ title, subtitle, action, children, className = '' }: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`section-card ${className}`}>
      {(title || action) && (
        <div className="section-card__header">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="section-card__body">{children}</div>
    </section>
  )
}
