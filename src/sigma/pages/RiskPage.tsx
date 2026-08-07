import { AlertTriangle, ArrowRight, Crosshair, Flame, MapPin, ShieldAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '../components/ui/Badge'
import { KpiCard } from '../components/ui/KpiCard'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionCard } from '../components/ui/SectionCard'
import { useAppData } from '../context/AppDataContext'
import { labelize, riskTone } from '../services/format'

export function RiskPage() {
  const { areas, recommendations, findings, assets } = useAppData()
  const riskData = [...areas].sort((a, b) => b.riskScore - a.riskScore).map((item) => ({ name: item.name.length > 18 ? `${item.name.slice(0, 18)}…` : item.name, risk: item.riskScore, visibility: item.visibilityScore }))
  const criticalFindings = findings.filter((item) => item.status !== 'resolved' && item.severity === 'critical').length
  const criticalAssets = assets.filter((item) => item.status === 'critical').length
  const highPriority = areas.filter((item) => item.priority === 'high' || item.priority === 'critical').length

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="RISK-BASED MONITORING PRIORITY"
        title="Risk & Hotspot"
        description="Prioritize flexible patrol destinations using risk exposure, unresolved findings, asset criticality, monitoring gaps, and current visibility."
      />

      <div className="kpi-grid kpi-grid--four">
        <KpiCard label="High-Priority Areas" value={highPriority} detail="Critical or high patrol priority" icon={Flame} accent="red" />
        <KpiCard label="Critical Findings" value={criticalFindings} detail="Open incidents requiring action" icon={AlertTriangle} accent="red" />
        <KpiCard label="Critical Assets" value={criticalAssets} detail="Security or location concern" icon={ShieldAlert} accent="orange" />
        <KpiCard label="Open Recommendations" value={recommendations.filter((item) => item.status !== 'completed').length} detail="Actionable patrol and monitoring decisions" icon={Crosshair} accent="gold" />
      </div>

      <div className="two-column-grid two-column-grid--wide-left">
        <SectionCard title="Risk and Visibility Comparison" subtitle="High risk combined with low visibility receives the strongest patrol priority.">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={330}>
              <BarChart data={riskData} margin={{ top: 10, right: 10, left: -18, bottom: 38 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="risk" fill="#ff7a00" radius={[4, 4, 0, 0]} name="Risk score" />
                <Bar dataKey="visibility" fill="#42b8e6" radius={[4, 4, 0, 0]} name="Visibility score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Risk Scoring Logic" subtitle="Initial system score with admin-governed validation.">
          <div className="risk-formula">
            <div><span>30%</span><strong>Incident & finding severity</strong><p>Criticality, recurrence, and unresolved exposure.</p></div>
            <div><span>25%</span><strong>Visibility gap</strong><p>Low recency, incomplete evidence, or no confirmed position.</p></div>
            <div><span>20%</span><strong>Asset criticality</strong><p>Value, mobility, security exposure, and operational importance.</p></div>
            <div><span>15%</span><strong>Coverage deficiency</strong><p>Areas not consistently visited or incompletely monitored.</p></div>
            <div><span>10%</span><strong>Action delay</strong><p>Overdue or incomplete corrective and security actions.</p></div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Patrol Priority Queue" subtitle="Flexible patrol recommendations based on the latest operational data.">
        <div className="priority-grid">
          {[...areas].sort((a, b) => b.riskScore - a.riskScore).map((area, index) => (
            <article className={`priority-card priority-card--${area.priority}`} key={area.id}>
              <div className="priority-card__rank">#{index + 1}</div>
              <div className="priority-card__score"><strong>{area.riskScore}</strong><span>risk</span></div>
              <div className="priority-card__body">
                <div><Badge tone={riskTone(area.priority)}>{labelize(area.priority)} priority</Badge><span className="priority-card__visibility">Visibility {area.visibilityScore}%</span></div>
                <h3>{area.name}</h3>
                <p>{area.reasons.join(' • ')}</p>
                <div className="priority-card__meta"><MapPin size={14} /> {area.zone} • Last verified patrol {area.daysSincePatrol} day(s) ago</div>
              </div>
              <button className="icon-button" title="Priority detail"><ArrowRight size={17} /></button>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Actionable Recommendations" subtitle="Recommendations remain traceable to their data-driven reasons.">
        <div className="recommendation-table">
          {recommendations.map((item) => (
            <div key={item.id}>
              <span className={`recommendation-table__marker recommendation-table__marker--${item.priority}`}><Crosshair size={17} /></span>
              <div><strong>{item.title}</strong><p>{item.reason}</p><small>{item.target}</small></div>
              <Badge tone={riskTone(item.priority)}>{labelize(item.priority)}</Badge>
              <div><span>Owner</span><strong>{item.owner}</strong></div>
              <div><span>Due</span><strong>{item.due}</strong></div>
              <Badge tone={item.status === 'completed' ? 'success' : item.status === 'in-progress' ? 'info' : 'warning'}>{labelize(item.status)}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
