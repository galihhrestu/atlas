import { Activity, BarChart3, CheckCircle2, Gauge, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AssuranceGrid } from '../components/ui/AssuranceGrid'
import { KpiCard } from '../components/ui/KpiCard'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useAppData } from '../context/AppDataContext'
import { performanceTrend } from '../data/seed'

export function PerformancePage() {
  const { assurance, patrols, findings, areas } = useAppData()
  const completion = Math.round((patrols.filter((item) => item.status === 'verified').length / patrols.length) * 100)
  const resolution = Math.round((findings.filter((item) => item.status === 'resolved').length / findings.length) * 100)
  const coverage = Math.round(areas.reduce((sum, item) => sum + item.coveragePct, 0) / areas.length)
  const assuranceIndex = Math.round(assurance.reduce((sum, item) => sum + item.score, 0) / assurance.length)

  const teamPerformance = [
    { team: 'Security Team Alpha', completion: 96, evidence: 94, findings: 87 },
    { team: 'Security Team Bravo', completion: 88, evidence: 91, findings: 82 },
    { team: 'Security Team Charlie', completion: 84, evidence: 79, findings: 90 },
    { team: 'Security Team Delta', completion: 92, evidence: 89, findings: 86 },
    { team: 'Security Night Team', completion: 78, evidence: 72, findings: 84 },
  ]

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="MONITORING EFFECTIVENESS"
        title="Performance & Assurance"
        description="Evaluate patrol completion, evidence quality, area coverage, finding closure, and the six-layer SIGMA Assurance Index."
      />

      <div className="kpi-grid kpi-grid--four">
        <KpiCard label="SIGMA Assurance Index" value={assuranceIndex} detail="Average across six assurance layers" icon={Gauge} trend="+2 points" accent="gold" />
        <KpiCard label="Verified Completion" value={`${completion}%`} detail="Patrol records approved by SSL" icon={CheckCircle2} accent="green" />
        <KpiCard label="Average Coverage" value={`${coverage}%`} detail="Coverage across operational areas" icon={BarChart3} accent="cyan" />
        <KpiCard label="Finding Resolution" value={`${resolution}%`} detail="Resolved findings in current data" icon={Activity} accent="orange" />
      </div>

      <SectionCard title="Six-Month Monitoring Trend" subtitle="A management view of assurance, coverage, and completion performance.">
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={performanceTrend} margin={{ top: 10, right: 20, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="assuranceGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffb000" stopOpacity={0.35}/><stop offset="95%" stopColor="#ffb000" stopOpacity={0}/></linearGradient>
                <linearGradient id="coverageGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#42b8e6" stopOpacity={0.28}/><stop offset="95%" stopColor="#42b8e6" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend />
              <Area type="monotone" dataKey="assurance" stroke="#ffb000" fill="url(#assuranceGradient)" strokeWidth={2.5} name="Assurance Index" />
              <Area type="monotone" dataKey="coverage" stroke="#42b8e6" fill="url(#coverageGradient)" strokeWidth={2.5} name="Coverage" />
              <Area type="monotone" dataKey="completion" stroke="#30c67c" fillOpacity={0} strokeWidth={2.5} name="Patrol Completion" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="6 Monitoring Assurance Layers" subtitle="Each score is visible and traceable to its operating purpose.">
        <AssuranceGrid layers={assurance} />
      </SectionCard>

      <div className="two-column-grid two-column-grid--wide-left">
        <SectionCard title="Team Monitoring Performance" subtitle="Prototype team comparison based on completion, evidence, and finding quality.">
          <div className="team-performance">
            {teamPerformance.map((team) => (
              <article key={team.team}>
                <div><strong>{team.team}</strong><span>{Math.round((team.completion + team.evidence + team.findings) / 3)} overall</span></div>
                <ProgressBar value={team.completion} label="Completion" />
                <ProgressBar value={team.evidence} label="Evidence quality" />
                <ProgressBar value={team.findings} label="Finding quality" />
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Management Interpretation" subtitle="What the current indicators mean.">
          <div className="insight-stack">
            <div className="insight-item insight-item--positive"><TrendingUp size={19} /><div><strong>Assurance is improving</strong><p>The six-month trend shows consistent growth from 69 to 82.</p></div></div>
            <div className="insight-item insight-item--warning"><Activity size={19} /><div><strong>Coverage remains the key constraint</strong><p>Coverage is improving but still trails patrol completion.</p></div></div>
            <div className="insight-item insight-item--warning"><CheckCircle2 size={19} /><div><strong>Finding closure needs stronger follow-up</strong><p>Open and in-progress actions continue to reduce effectiveness.</p></div></div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
