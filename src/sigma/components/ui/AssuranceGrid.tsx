import { BarChart3, CheckCircle2, Crosshair, FileCheck2, Map, ShieldCheck } from 'lucide-react'
import type { AssuranceLayer } from '../../types'
import { ProgressBar } from './ProgressBar'

const icons = [ShieldCheck, Map, FileCheck2, BarChart3, Crosshair, CheckCircle2]

export function AssuranceGrid({ layers }: { layers: AssuranceLayer[] }) {
  return (
    <div className="assurance-grid">
      {layers.map((layer, index) => {
        const Icon = icons[index] ?? ShieldCheck
        return (
          <article className="assurance-card" key={layer.id}>
            <div className="assurance-card__number">0{layer.id}</div>
            <span className="assurance-card__icon"><Icon size={21} /></span>
            <div className="assurance-card__content">
              <strong>{layer.title}</strong>
              <p>{layer.description}</p>
              <ProgressBar value={layer.score} compact />
            </div>
            <div className="assurance-card__score">{layer.score}</div>
          </article>
        )
      })}
    </div>
  )
}
