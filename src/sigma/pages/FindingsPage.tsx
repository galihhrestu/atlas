import { AlertOctagon, CheckCircle2, Download, Filter, Plus, Search, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { KpiCard } from '../components/ui/KpiCard'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionCard } from '../components/ui/SectionCard'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { formatDateTime, labelize, riskTone } from '../services/format'
import { exportManagementExcel } from '../services/reportExport'

export function FindingsPage() {
  const { user } = useAuth()
  const { findings, patrols, assets, areas } = useAppData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => findings.filter((item) => {
    const haystack = `${item.code} ${item.title} ${item.area} ${item.owner} ${item.description}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (category === 'all' || item.category === category) && (status === 'all' || item.status === status)
  }), [findings, query, category, status])

  const exportExcel = () => exportManagementExcel({ patrols, assets, findings: filtered, areas, title: 'Findings Register', periodLabel: 'Current findings data' })

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="FINDING • INCIDENT • ANOMALY"
        title="Findings Register"
        description="A unified register for patrol findings, security incidents, data anomalies, owners, due dates, and follow-up actions."
        actions={<>
          <button className="button button--secondary" onClick={exportExcel}><Download size={17} /> Excel</button>
          {user?.role === 'admin' && <Link className="button button--primary" to="/sigma/admin/data-entry"><Plus size={17} /> Add finding</Link>}
        </>}
      />

      <div className="kpi-grid kpi-grid--four">
        <KpiCard label="Open Findings" value={findings.filter((item) => item.status === 'open').length} detail="Require owner action" icon={TriangleAlert} accent="orange" />
        <KpiCard label="In Progress" value={findings.filter((item) => item.status === 'in-progress').length} detail="Action has started" icon={AlertOctagon} accent="cyan" />
        <KpiCard label="Critical" value={findings.filter((item) => item.status !== 'resolved' && item.severity === 'critical').length} detail="Immediate security attention" icon={AlertOctagon} accent="red" />
        <KpiCard label="Resolved" value={findings.filter((item) => item.status === 'resolved').length} detail="Closed with completed action" icon={CheckCircle2} accent="green" />
      </div>

      <SectionCard>
        <div className="toolbar">
          <label className="search-input"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search finding code, title, area, owner..." /></label>
          <label className="select-control"><Filter size={16} /><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All categories</option><option value="finding">Finding</option><option value="incident">Incident</option><option value="anomaly">Anomaly</option></select></label>
          <label className="select-control"><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option value="open">Open</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option></select></label>
          <span className="toolbar__count">{filtered.length} records</span>
        </div>

        <div className="finding-list">
          {filtered.map((item) => (
            <article className={`finding-row finding-row--${item.severity}`} key={item.id}>
              <div className="finding-row__severity"><AlertOctagon size={18} /><span>{labelize(item.severity)}</span></div>
              <div className="finding-row__main">
                <div><Badge tone={item.category === 'incident' ? 'danger' : item.category === 'anomaly' ? 'warning' : 'info'}>{labelize(item.category)}</Badge><small>{item.code}</small></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="finding-row__meta"><span>{item.area}</span><span>Reported {formatDateTime(item.reportedAt)}</span><span>Owner: {item.owner}</span></div>
              </div>
              <div className="finding-row__action"><span>Required action</span><p>{item.action}</p><small>Due {item.dueDate}</small></div>
              <Badge tone={item.status === 'resolved' ? 'success' : item.status === 'in-progress' ? 'info' : 'warning'}>{labelize(item.status)}</Badge>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
