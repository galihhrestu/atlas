import { Download, Filter, FileText, MapPin, Plus, Route, ShieldCheck, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { SectionCard } from '../components/ui/SectionCard'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { formatDate, labelize, riskTone } from '../services/format'
import { exportManagementExcel } from '../services/reportExport'
import type { PatrolReport, PatrolStatus } from '../types'

export function PatrolsPage() {
  const { user } = useAuth()
  const { patrols, assets, findings, areas } = useAppData()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | PatrolStatus>('all')
  const [selected, setSelected] = useState<PatrolReport | null>(null)

  const filtered = useMemo(() => patrols.filter((patrol) => {
    const haystack = `${patrol.patrolCode} ${patrol.team} ${patrol.area} ${patrol.focus}`.toLowerCase()
    const matchesQuery = haystack.includes(query.toLowerCase())
    return matchesQuery && (status === 'all' || patrol.status === status)
  }), [patrols, query, status])

  const exportExcel = () => exportManagementExcel({ patrols: filtered, assets, findings, areas, title: 'Patrol Monitoring', periodLabel: 'Filtered patrol records' })

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="SECURITY & ASSET PATROL"
        title="Patrol Monitoring"
        description="Monitor dynamic patrol activity, field evidence, tracking references, observed assets, findings, and admin validation status."
        actions={<>
          <button className="button button--secondary" onClick={exportExcel}><Download size={17} /> Excel</button>
          {user?.role === 'admin' && <Link className="button button--primary" to="/admin/data-entry"><Plus size={17} /> Add patrol report</Link>}
        </>}
      />

      <div className="summary-strip">
        <div><span>Total records</span><strong>{patrols.length}</strong></div>
        <div><span>Verified</span><strong>{patrols.filter((item) => item.status === 'verified').length}</strong></div>
        <div><span>Awaiting review</span><strong>{patrols.filter((item) => ['submitted', 'under-review'].includes(item.status)).length}</strong></div>
        <div><span>Revision required</span><strong>{patrols.filter((item) => item.status === 'revision-required').length}</strong></div>
        <div><span>Total distance</span><strong>{patrols.reduce((sum, item) => sum + item.distanceKm, 0).toFixed(1)} km</strong></div>
      </div>

      <SectionCard>
        <div className="toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder="Search patrol code, team, area, or focus..." />
          <label className="select-control"><Filter size={16} /><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under-review">Under review</option>
            <option value="verified">Verified</option>
            <option value="revision-required">Revision required</option>
            <option value="rejected">Rejected</option>
          </select></label>
          <span className="toolbar__count">{filtered.length} records</span>
        </div>

        <div className="table-wrap">
          <table className="data-table data-table--interactive">
            <thead><tr><th>Patrol</th><th>Schedule</th><th>Team & Area</th><th>Tracking</th><th>Observed</th><th>Risk</th><th>Validation</th></tr></thead>
            <tbody>
              {filtered.map((patrol) => (
                <tr key={patrol.id} onClick={() => setSelected(patrol)}>
                  <td><strong>{patrol.patrolCode}</strong><small>{patrol.focus}</small></td>
                  <td>{formatDate(patrol.date)}<small>{patrol.startTime}–{patrol.endTime}</small></td>
                  <td>{patrol.team}<small>{patrol.area}</small></td>
                  <td><span className="inline-metric"><Route size={14} />{patrol.distanceKm} km</span><small>{patrol.coordinatesCount} GPS points</small></td>
                  <td>{patrol.assetsObserved} assets<small>{patrol.findingsCount} findings • {patrol.evidenceCount} evidence</small></td>
                  <td><Badge tone={riskTone(patrol.riskLevel)}>{labelize(patrol.riskLevel)}</Badge></td>
                  <td><Badge tone={patrol.status === 'verified' ? 'success' : patrol.status === 'rejected' ? 'danger' : 'warning'}>{labelize(patrol.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {selected && (
        <div className="detail-overlay" onClick={() => setSelected(null)}>
          <aside className="detail-panel" onClick={(event) => event.stopPropagation()}>
            <div className="detail-panel__header"><div><span>PATROL DETAIL</span><h2>{selected.patrolCode}</h2></div><button className="icon-button" onClick={() => setSelected(null)}><X size={19} /></button></div>
            <div className="detail-panel__hero">
              <span><ShieldCheck size={28} /></span>
              <div><strong>{selected.team}</strong><p>{selected.area}</p></div>
              <Badge tone={selected.status === 'verified' ? 'success' : 'warning'}>{labelize(selected.status)}</Badge>
            </div>
            <div className="detail-grid">
              <div><span>Date</span><strong>{formatDate(selected.date)}</strong></div><div><span>Time</span><strong>{selected.startTime}–{selected.endTime}</strong></div>
              <div><span>GPS points</span><strong>{selected.coordinatesCount}</strong></div><div><span>Distance</span><strong>{selected.distanceKm} km</strong></div>
              <div><span>Assets observed</span><strong>{selected.assetsObserved}</strong></div><div><span>Evidence</span><strong>{selected.evidenceCount}</strong></div>
            </div>
            <div className="detail-section"><span>Patrol focus</span><p>{selected.focus}</p></div>
            <div className="detail-section"><span>Field notes</span><p>{selected.notes}</p></div>
            <div className="detail-section"><span>Tracking reference</span><p className="file-reference"><FileText size={16} />{selected.trackingRef}</p></div>
            <div className="detail-section"><span>Validation</span><p>{selected.validatedBy ? `Verified by ${selected.validatedBy}` : selected.validationNote ?? 'Awaiting SSL administrator review.'}</p></div>
            <div className="detail-panel__footer"><button className="button button--secondary"><MapPin size={16} /> Map handled by developer</button></div>
          </aside>
        </div>
      )}
    </div>
  )
}
