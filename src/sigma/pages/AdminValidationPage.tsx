import { CheckCircle2, Clock3, FileCheck2, FileWarning, MapPinned, RefreshCcw, Route, ShieldCheck, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionCard } from '../components/ui/SectionCard'
import { useAppData } from '../context/AppDataContext'
import { formatDate, labelize, riskTone } from '../services/format'
import type { PatrolReport, PatrolStatus } from '../types'

export function AdminValidationPage() {
  const { patrols, updatePatrolStatus } = useAppData()
  const pending = useMemo(() => patrols.filter((item) => ['submitted', 'under-review', 'revision-required'].includes(item.status)), [patrols])
  const [selectedId, setSelectedId] = useState<string | null>(pending[0]?.id ?? null)
  const [note, setNote] = useState('')
  const selected = patrols.find((item) => item.id === selectedId) ?? null

  const decide = (status: PatrolStatus) => {
    if (!selected) return
    updatePatrolStatus(selected.id, status, note || undefined)
    const remaining = pending.filter((item) => item.id !== selected.id)
    setSelectedId(remaining[0]?.id ?? null)
    setNote('')
  }

  const checks = selected ? [
    { label: 'Observer identity', value: selected.submittedBy ? 'Available' : 'Missing', pass: Boolean(selected.submittedBy) },
    { label: 'GPS tracking reference', value: selected.trackingRef || 'Missing', pass: Boolean(selected.trackingRef) },
    { label: 'GPS coordinate points', value: `${selected.coordinatesCount} points`, pass: selected.coordinatesCount > 0 },
    { label: 'Photo / field evidence', value: `${selected.evidenceCount} items`, pass: selected.evidenceCount > 0 },
    { label: 'Timestamp completeness', value: `${selected.date} ${selected.startTime}–${selected.endTime}`, pass: Boolean(selected.date && selected.startTime && selected.endTime) },
    { label: 'Monitoring category / focus', value: selected.focus, pass: Boolean(selected.focus) },
    { label: 'Field notes', value: selected.notes || 'Missing', pass: Boolean(selected.notes) },
  ] : []

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="SSL ADMIN VALIDATION"
        title="Patrol Validation Queue"
        description="Verify monitoring evidence before patrol records contribute to official coverage, visibility, performance, and management reports."
      />

      <div className="validation-summary">
        <div><Clock3 size={20} /><span>Awaiting review</span><strong>{patrols.filter((item) => item.status === 'submitted').length}</strong></div>
        <div><RefreshCcw size={20} /><span>Under review</span><strong>{patrols.filter((item) => item.status === 'under-review').length}</strong></div>
        <div><FileWarning size={20} /><span>Revision required</span><strong>{patrols.filter((item) => item.status === 'revision-required').length}</strong></div>
        <div><CheckCircle2 size={20} /><span>Verified</span><strong>{patrols.filter((item) => item.status === 'verified').length}</strong></div>
      </div>

      {pending.length === 0 ? (
        <SectionCard><EmptyState icon={FileCheck2} title="Validation queue is clear" description="All submitted patrol reports have been reviewed." /></SectionCard>
      ) : (
        <div className="validation-layout">
          <SectionCard title="Reports Requiring Attention" subtitle={`${pending.length} report(s) currently require an SSL decision.`} className="validation-list-card">
            <div className="validation-list">
              {pending.map((patrol) => (
                <button key={patrol.id} className={selectedId === patrol.id ? 'active' : ''} onClick={() => { setSelectedId(patrol.id); setNote(patrol.validationNote ?? '') }}>
                  <div><strong>{patrol.patrolCode}</strong><Badge tone={patrol.status === 'revision-required' ? 'warning' : 'info'}>{labelize(patrol.status)}</Badge></div>
                  <span>{patrol.team}</span>
                  <p>{patrol.area}</p>
                  <small>{formatDate(patrol.date)} • {patrol.evidenceCount} evidence • {patrol.coordinatesCount} GPS points</small>
                </button>
              ))}
            </div>
          </SectionCard>

          {selected && (
            <SectionCard title="Evidence Review" subtitle={`${selected.patrolCode} • ${selected.area}`} className="validation-detail-card">
              <div className="validation-hero">
                <span><ShieldCheck size={26} /></span>
                <div><strong>{selected.team}</strong><p>{selected.focus}</p></div>
                <Badge tone={riskTone(selected.riskLevel)}>{labelize(selected.riskLevel)} risk</Badge>
              </div>

              <div className="validation-facts">
                <div><span>Schedule</span><strong>{formatDate(selected.date)} • {selected.startTime}–{selected.endTime}</strong></div>
                <div><span>Route summary</span><strong>{selected.distanceKm} km • {selected.coordinatesCount} points</strong></div>
                <div><span>Observed output</span><strong>{selected.assetsObserved} assets • {selected.findingsCount} findings</strong></div>
                <div><span>Submitted by</span><strong>{selected.submittedBy}</strong></div>
              </div>

              <div className="evidence-checklist">
                {checks.map((check) => (
                  <div key={check.label} className={check.pass ? 'pass' : 'fail'}>
                    <span>{check.pass ? <CheckCircle2 size={17} /> : <XCircle size={17} />}</span>
                    <div><strong>{check.label}</strong><p>{check.value}</p></div>
                  </div>
                ))}
              </div>

              <div className="tracking-reference">
                <Route size={18} />
                <div><span>Tracking reference</span><strong>{selected.trackingRef}</strong></div>
                <Badge tone="neutral">Map integration by developer</Badge>
              </div>

              <label className="validation-note"><span>Validation note</span><textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a decision note, revision instruction, or rejection reason..." /></label>

              <div className="validation-actions">
                <button className="button button--danger" onClick={() => decide('rejected')}><XCircle size={17} /> Reject</button>
                <button className="button button--secondary" onClick={() => decide('revision-required')}><RefreshCcw size={17} /> Request revision</button>
                <button className="button button--primary" onClick={() => decide('verified')}><CheckCircle2 size={17} /> Verify report</button>
              </div>

              <div className="validation-policy"><MapPinned size={17} /><p>Only verified records should update official monitoring coverage, asset visibility, assurance performance, and management reporting.</p></div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  )
}
