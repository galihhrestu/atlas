import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileDown,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Siren,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { AssuranceGrid } from '../components/ui/AssuranceGrid'
import { Badge } from '../components/ui/Badge'
import { KpiCard } from '../components/ui/KpiCard'
import { MapPlaceholder } from '../components/ui/MapPlaceholder'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionCard } from '../components/ui/SectionCard'
import { StatRing } from '../components/ui/StatRing'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { formatDateTime, labelize, riskTone } from '../services/format'
import { exportManagementPdf } from '../services/reportExport'

const pieColors = ['#30c67c', '#ffb000', '#ff5d5d']

export function DashboardPage() {
  const { user } = useAuth()
  const { patrols, assets, findings, areas, recommendations, activities, assurance } = useAppData()

  const stats = useMemo(() => {
    const today = '2026-08-06'
    const todayPatrols = patrols.filter((item) => item.date === today)
    const verified = todayPatrols.filter((item) => item.status === 'verified').length
    const monitoredAssets = new Set(patrols.filter((item) => item.status === 'verified').flatMap((item) => Array.from({ length: item.assetsObserved }, (_, index) => `${item.id}-${index}`))).size
    const activeFindings = findings.filter((item) => item.status !== 'resolved').length
    const lowVisibility = areas.filter((item) => item.visibility === 'low' || item.visibility === 'none').length
    const highRisk = areas.filter((item) => item.priority === 'high' || item.priority === 'critical').length
    const awaiting = patrols.filter((item) => ['submitted', 'under-review', 'revision-required'].includes(item.status)).length
    const verifiedRate = Math.round((patrols.filter((item) => item.status === 'verified').length / patrols.length) * 100)
    const avgVisibility = Math.round(areas.reduce((sum, item) => sum + item.visibilityScore, 0) / areas.length)
    return { todayPatrols, verified, monitoredAssets, activeFindings, lowVisibility, highRisk, awaiting, verifiedRate, avgVisibility }
  }, [areas, findings, patrols])

  const visibilityData = [
    { name: 'High', value: areas.filter((item) => item.visibility === 'high').length },
    { name: 'Moderate', value: areas.filter((item) => item.visibility === 'moderate').length },
    { name: 'Low / None', value: areas.filter((item) => item.visibility === 'low' || item.visibility === 'none').length },
  ]

  const handlePdf = () => exportManagementPdf({
    patrols,
    assets,
    findings,
    areas,
    title: 'Executive Monitoring Summary',
    periodLabel: 'Current Operational Snapshot',
  })

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={user?.role === 'admin' ? 'SSL ADMINISTRATION VIEW' : 'MANAGEMENT MONITORING VIEW'}
        title="Operational Monitoring Visibility & Assurance"
        description={user?.role === 'admin'
          ? 'Review incoming field data, validate patrol evidence, update asset visibility, and drive monitoring assurance.'
          : 'Monitor security and asset patrols, visibility gaps, risk priorities, and management-ready performance insights.'}
        actions={
          <button className="button button--primary" onClick={handlePdf}><FileDown size={17} /> Export summary</button>
        }
      />

      {user?.role === 'admin' && (
        <div className="admin-command-strip">
          <div>
            <span className="admin-command-strip__icon"><ClipboardCheck size={21} /></span>
            <div><strong>{stats.awaiting} reports require admin attention</strong><p>Validation decisions determine which patrol records contribute to management KPI and visibility scores.</p></div>
          </div>
          <Link to="/sigma/admin/validation" className="button button--secondary">Open validation queue <ArrowRight size={16} /></Link>
        </div>
      )}

      <div className="kpi-grid">
        <KpiCard label="Patrol Today" value={stats.todayPatrols.length} detail={`${stats.verified} verified • ${stats.todayPatrols.length - stats.verified} awaiting review`} icon={ShieldCheck} trend="Live" accent="gold" />
        <KpiCard label="Assets Monitored" value={assets.filter((item) => item.visibility !== 'none').length} detail={`${assets.length} registered assets in prototype`} icon={PackageSearch} trend="+8 this week" accent="cyan" />
        <KpiCard label="Active Findings" value={stats.activeFindings} detail={`${findings.filter((item) => item.severity === 'critical' && item.status !== 'resolved').length} critical attention`} icon={Siren} trend="Action required" accent="red" />
        <KpiCard label="Low Visibility Areas" value={stats.lowVisibility} detail="Areas requiring renewed monitoring" icon={Eye} trend="Priority input" accent="orange" />
        <KpiCard label="High-Risk Areas" value={stats.highRisk} detail="Critical or high patrol priority" icon={AlertTriangle} trend="Risk based" accent="red" />
        <KpiCard label="Verified Monitoring" value={`${stats.verifiedRate}%`} detail="Approved reports across all patrol data" icon={CheckCircle2} trend="+4%" accent="green" />
      </div>

      <div className="dashboard-main-grid">
        <SectionCard
          title="Operational Tracking Map"
          subtitle="Demo route overlay for Kutai Timur and Penajam Paser Utara, with time filtering, patrol status filtering, and visibility reading from tracked routes."
          action={<span className="live-label"><i /> Demo GPS tracking overlay</span>}
          className="dashboard-map-card"
        >
          <MapPlaceholder />
        </SectionCard>

        <div className="dashboard-side-stack">
          <SectionCard title="Visibility Overview" subtitle="Recency, completeness, and validation quality.">
            <div className="visibility-overview">
              <StatRing value={stats.avgVisibility} label="Visibility" sublabel="overall" />
              <div className="visibility-legend">
                {visibilityData.map((item, index) => (
                  <div key={item.name}><span><i style={{ background: pieColors[index] }} />{item.name}</span><strong>{item.value} areas</strong></div>
                ))}
              </div>
            </div>
            <div className="mini-pie" aria-hidden="true">
              <ResponsiveContainer width="100%" height={110}>
                <PieChart>
                  <Pie data={visibilityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={47} paddingAngle={3}>
                    {visibilityData.map((_, index) => <Cell key={index} fill={pieColors[index]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0b1826', border: '1px solid #274056', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Critical Attention" subtitle="Highest priority monitoring signals.">
            <div className="attention-list">
              {[...areas].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3).map((area) => (
                <Link to="/sigma/risk" key={area.id} className="attention-item">
                  <span className={`attention-item__score attention-item__score--${area.priority}`}>{area.riskScore}</span>
                  <div><strong>{area.name}</strong><p>{area.reasons[0]}</p></div>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="6 Monitoring Assurance Layers" subtitle="The system moves from field verification to actionable recommendations.">
        <AssuranceGrid layers={assurance} />
      </SectionCard>

      <div className="dashboard-bottom-grid">
        <SectionCard title="Recent Operational Activity" subtitle="Latest data and decisions across SIGMA." action={<Link to="/sigma/patrols" className="text-link">View all</Link>}>
          <div className="activity-list">
            {activities.slice(0, 5).map((item) => (
              <div className="activity-item" key={item.id}>
                <span className={`activity-item__dot activity-item__dot--${item.tone}`} />
                <div><strong>{item.title}</strong><p>{item.meta}</p></div>
                <time>{item.time}</time>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Operational Recommendations" subtitle="Priorities generated from risk, hotspot, and visibility gaps." action={<Link to="/sigma/risk" className="text-link">Review priorities</Link>}>
          <div className="recommendation-list">
            {recommendations.slice(0, 4).map((item) => (
              <article className="recommendation-item" key={item.id}>
                <span className={`recommendation-item__icon recommendation-item__icon--${item.priority}`}><MapPin size={16} /></span>
                <div>
                  <div className="recommendation-item__title"><strong>{item.title}</strong><Badge tone={riskTone(item.priority)}>{labelize(item.priority)}</Badge></div>
                  <p>{item.reason}</p>
                  <small>{item.owner} • {item.due}</small>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Latest Verified Patrols" subtitle="Only admin-verified records contribute to official monitoring assurance.">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Patrol Code</th><th>Date & Time</th><th>Team</th><th>Area</th><th>Assets</th><th>Evidence</th><th>Risk</th><th>Status</th></tr></thead>
            <tbody>
              {patrols.slice(0, 5).map((patrol) => (
                <tr key={patrol.id}>
                  <td><strong>{patrol.patrolCode}</strong></td>
                  <td>{formatDateTime(`${patrol.date}T${patrol.startTime}:00+08:00`)}</td>
                  <td>{patrol.team}</td>
                  <td>{patrol.area}</td>
                  <td>{patrol.assetsObserved}</td>
                  <td>{patrol.evidenceCount}</td>
                  <td><Badge tone={riskTone(patrol.riskLevel)}>{labelize(patrol.riskLevel)}</Badge></td>
                  <td><Badge tone={patrol.status === 'verified' ? 'success' : patrol.status === 'rejected' ? 'danger' : 'warning'}>{labelize(patrol.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
