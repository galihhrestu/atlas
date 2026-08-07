import { AlertCircle, Clock3, Eye, FileCheck2, MapPin, Radar } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Badge } from '../components/ui/Badge'
import { KpiCard } from '../components/ui/KpiCard'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useAppData } from '../context/AppDataContext'
import { formatDateTime, labelize, riskTone, visibilityTone } from '../services/format'

const colors = ['#30c67c', '#42b8e6', '#ffb000', '#ff5d5d']

export function VisibilityPage() {
  const { areas, assets } = useAppData()
  const average = Math.round(areas.reduce((sum, item) => sum + item.visibilityScore, 0) / areas.length)
  const completeness = Math.round(areas.reduce((sum, item) => sum + item.evidenceCompleteness, 0) / areas.length)
  const lowAssets = assets.filter((item) => item.visibility === 'low' || item.visibility === 'none').length
  const staleAreas = areas.filter((item) => item.daysSincePatrol >= 7).length

  const distribution = [
    { name: 'High', value: areas.filter((item) => item.visibility === 'high').length },
    { name: 'Moderate', value: areas.filter((item) => item.visibility === 'moderate').length },
    { name: 'Low', value: areas.filter((item) => item.visibility === 'low').length },
    { name: 'No visibility', value: areas.filter((item) => item.visibility === 'none').length },
  ]

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="MONITORING COVERAGE & RECENCY"
        title="Operational Visibility"
        description="Visibility measures how recent, complete, geographically supported, and admin-verified the information is for each area and asset."
      />

      <div className="kpi-grid kpi-grid--four">
        <KpiCard label="Overall Visibility" value={`${average}%`} detail="Average area visibility score" icon={Eye} trend="+3% this month" accent="green" />
        <KpiCard label="Evidence Completeness" value={`${completeness}%`} detail="GPS, photo, timestamp, and identity" icon={FileCheck2} accent="cyan" />
        <KpiCard label="Low-Visibility Assets" value={lowAssets} detail="Require a new verified observation" icon={Radar} accent="orange" />
        <KpiCard label="Stale Areas" value={staleAreas} detail="No verified patrol for seven or more days" icon={Clock3} accent="red" />
      </div>

      <div className="two-column-grid two-column-grid--balanced">
        <SectionCard title="Visibility Distribution" subtitle="Current monitoring confidence across operational areas.">
          <div className="chart-with-legend">
            <div className="chart-box chart-box--donut">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
                    {distribution.map((_, index) => <Cell key={index} fill={colors[index]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0b1826', border: '1px solid #274056', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center"><strong>{average}%</strong><span>overall</span></div>
            </div>
            <div className="chart-legend">
              {distribution.map((item, index) => <div key={item.name}><span><i style={{ background: colors[index] }} />{item.name}</span><strong>{item.value}</strong></div>)}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="How Visibility Is Determined" subtitle="A transparent score, not a black box.">
          <div className="formula-stack">
            <div><span>01</span><div><strong>Monitoring recency</strong><p>How long since the latest verified patrol or observation.</p></div><b>30%</b></div>
            <div><span>02</span><div><strong>Evidence completeness</strong><p>Presence of GPS, photo, timestamp, identity, and field notes.</p></div><b>25%</b></div>
            <div><span>03</span><div><strong>Coverage consistency</strong><p>Frequency and spread of monitoring across the relevant area.</p></div><b>25%</b></div>
            <div><span>04</span><div><strong>Admin verification</strong><p>Whether the field report has been approved by SSL.</p></div><b>20%</b></div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Area Visibility Matrix" subtitle="Low visibility directly contributes to flexible patrol priority.">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Area</th><th>Latest verified patrol</th><th>Coverage</th><th>Evidence</th><th>Visibility</th><th>Risk</th><th>Priority reason</th></tr></thead>
            <tbody>
              {[...areas].sort((a, b) => a.visibilityScore - b.visibilityScore).map((area) => (
                <tr key={area.id}>
                  <td><strong>{area.name}</strong><small><MapPin size={12} /> {area.zone}</small></td>
                  <td>{formatDateTime(area.lastPatrolAt)}<small>{area.daysSincePatrol} day(s) ago</small></td>
                  <td><ProgressBar value={area.coveragePct} compact /></td>
                  <td><ProgressBar value={area.evidenceCompleteness} compact /></td>
                  <td><div className="score-with-badge"><strong>{area.visibilityScore}</strong><Badge tone={visibilityTone(area.visibility)}>{labelize(area.visibility)}</Badge></div></td>
                  <td><div className="score-with-badge"><strong>{area.riskScore}</strong><Badge tone={riskTone(area.priority)}>{labelize(area.priority)}</Badge></div></td>
                  <td><span className="reason-cell"><AlertCircle size={14} />{area.reasons.join('; ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
