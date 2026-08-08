import { CheckCircle2, ClipboardPlus, FileUp, MapPin, PackagePlus, Save, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionCard } from '../components/ui/SectionCard'
import { useAppData } from '../context/AppDataContext'
import type { Asset, AssetStatus, AssetType, Finding, RiskLevel, VisibilityLevel } from '../types'

const makeId = (prefix: string) => `${prefix}-${Date.now()}`

export function AdminDataEntryPage() {
  const { addPatrol, addAsset, updateAsset, addFinding, assets } = useAppData()
  const [tab, setTab] = useState<'patrol' | 'asset' | 'finding'>('patrol')
  const [message, setMessage] = useState('')

  const [patrolForm, setPatrolForm] = useState({
    date: '2026-08-06', startTime: '14:00', endTime: '16:00', team: 'Security Team Alpha', area: '', focus: '',
    coordinatesCount: '0', distanceKm: '0', assetsObserved: '0', findingsCount: '0', evidenceCount: '0',
    riskLevel: 'medium' as RiskLevel, submittedBy: '', notes: '', trackingRef: '', trackTemplateId: 'route-alpha',
  })

  const [assetMode, setAssetMode] = useState<'new' | 'update'>('new')
  const [assetForm, setAssetForm] = useState({
    existingId: '', code: '', name: '', category: 'Heavy Equipment', type: 'mobile' as AssetType, area: '', locationLabel: '', coordinates: '',
    status: 'normal' as AssetStatus, visibility: 'moderate' as VisibilityLevel, visibilityScore: '70', lastSeenAt: '2026-08-06T14:00',
    quantity: '', unit: '', criticality: 'medium' as RiskLevel, evidenceCount: '0', moving: true, owner: '',
  })

  const [findingForm, setFindingForm] = useState({
    title: '', category: 'finding' as Finding['category'], severity: 'medium' as RiskLevel, area: '', assetId: '',
    status: 'open' as Finding['status'], reportedAt: '2026-08-06T14:00', description: '', action: '', owner: '', dueDate: '2026-08-08',
  })

  const showMessage = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 3500)
  }

  const submitPatrol = (event: FormEvent) => {
    event.preventDefault()
    const timestamp = Date.now()
    addPatrol({
      id: makeId('pat'),
      patrolCode: `SIG-PAT-${patrolForm.date.replaceAll('-', '').slice(2)}-${String(timestamp).slice(-3)}`,
      date: patrolForm.date,
      startTime: patrolForm.startTime,
      endTime: patrolForm.endTime,
      team: patrolForm.team,
      area: patrolForm.area,
      focus: patrolForm.focus,
      routeType: 'dynamic',
      coordinatesCount: Number(patrolForm.coordinatesCount),
      distanceKm: Number(patrolForm.distanceKm),
      assetsObserved: Number(patrolForm.assetsObserved),
      findingsCount: Number(patrolForm.findingsCount),
      visibilityContribution: Math.min(25, Math.max(1, Number(patrolForm.assetsObserved))),
      riskLevel: patrolForm.riskLevel,
      evidenceCount: Number(patrolForm.evidenceCount),
      submittedBy: patrolForm.submittedBy,
      status: 'submitted',
      notes: patrolForm.notes,
      trackingRef: patrolForm.trackingRef || 'No file reference entered',
      trackTemplateId: patrolForm.trackTemplateId || undefined,
      createdAt: new Date().toISOString(),
    })
    showMessage('Patrol report submitted to the SSL validation queue.')
    setPatrolForm((current) => ({ ...current, area: '', focus: '', notes: '', trackingRef: '', submittedBy: '', trackTemplateId: current.trackTemplateId }))
  }

  const loadExistingAsset = (id: string) => {
    const asset = assets.find((item) => item.id === id)
    if (!asset) return
    setAssetForm({
      existingId: asset.id, code: asset.code, name: asset.name, category: asset.category, type: asset.type, area: asset.area,
      locationLabel: asset.locationLabel, coordinates: asset.coordinates, status: asset.status, visibility: asset.visibility,
      visibilityScore: String(asset.visibilityScore), lastSeenAt: asset.lastSeenAt.slice(0, 16), quantity: asset.quantity?.toString() ?? '',
      unit: asset.unit ?? '', criticality: asset.criticality, evidenceCount: String(asset.evidenceCount), moving: asset.moving, owner: asset.owner,
    })
  }

  const submitAsset = (event: FormEvent) => {
    event.preventDefault()
    const asset: Asset = {
      id: assetMode === 'update' ? assetForm.existingId : makeId('ast'),
      code: assetForm.code,
      name: assetForm.name,
      category: assetForm.category,
      type: assetForm.type,
      area: assetForm.area,
      locationLabel: assetForm.locationLabel,
      coordinates: assetForm.coordinates,
      status: assetForm.status,
      visibility: assetForm.visibility,
      visibilityScore: Number(assetForm.visibilityScore),
      lastSeenAt: new Date(assetForm.lastSeenAt).toISOString(),
      quantity: assetForm.quantity ? Number(assetForm.quantity) : undefined,
      unit: assetForm.unit || undefined,
      criticality: assetForm.criticality,
      evidenceCount: Number(assetForm.evidenceCount),
      moving: assetForm.moving,
      owner: assetForm.owner,
    }
    if (assetMode === 'update') updateAsset(asset)
    else addAsset(asset)
    showMessage(assetMode === 'update' ? 'Asset record and latest location updated.' : 'New asset registered successfully.')
  }

  const submitFinding = (event: FormEvent) => {
    event.preventDefault()
    const prefix = findingForm.category === 'incident' ? 'INC' : findingForm.category === 'anomaly' ? 'ANM' : 'FND'
    addFinding({
      id: makeId('fnd'), code: `${prefix}-${String(Date.now()).slice(-9)}`, title: findingForm.title, category: findingForm.category,
      severity: findingForm.severity, area: findingForm.area, assetId: findingForm.assetId || undefined, status: findingForm.status,
      reportedAt: new Date(findingForm.reportedAt).toISOString(), description: findingForm.description, action: findingForm.action,
      owner: findingForm.owner, dueDate: findingForm.dueDate,
    })
    showMessage('Finding registered and included in the operational follow-up queue.')
    setFindingForm((current) => ({ ...current, title: '', area: '', assetId: '', description: '', action: '', owner: '' }))
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="SSL ADMINISTRATION"
        title="Operational Data Entry"
        description="Enter field patrol reports, tracking references, asset locations, evidence totals, findings, incidents, and anomalies."
      />

      {message && <div className="success-banner"><CheckCircle2 size={19} />{message}</div>}

      <div className="entry-tabs">
        <button className={tab === 'patrol' ? 'active' : ''} onClick={() => setTab('patrol')}><ShieldCheck size={18} /> Patrol Report</button>
        <button className={tab === 'asset' ? 'active' : ''} onClick={() => setTab('asset')}><PackagePlus size={18} /> Asset Record</button>
        <button className={tab === 'finding' ? 'active' : ''} onClick={() => setTab('finding')}><TriangleAlert size={18} /> Finding / Incident</button>
      </div>

      {tab === 'patrol' && (
        <SectionCard title="New Security & Asset Patrol Report" subtitle="The record enters the validation queue before contributing to official dashboard KPI.">
          <form className="form-grid" onSubmit={submitPatrol}>
            <label><span>Patrol date</span><input required type="date" value={patrolForm.date} onChange={(e) => setPatrolForm({ ...patrolForm, date: e.target.value })} /></label>
            <label><span>Start time</span><input required type="time" value={patrolForm.startTime} onChange={(e) => setPatrolForm({ ...patrolForm, startTime: e.target.value })} /></label>
            <label><span>End time</span><input required type="time" value={patrolForm.endTime} onChange={(e) => setPatrolForm({ ...patrolForm, endTime: e.target.value })} /></label>
            <label><span>Security team</span><select value={patrolForm.team} onChange={(e) => setPatrolForm({ ...patrolForm, team: e.target.value })}><option>Security Team Alpha</option><option>Security Team Bravo</option><option>Security Team Charlie</option><option>Security Team Delta</option><option>Security Night Team</option></select></label>
            <label className="form-field--wide"><span>Patrol area / destination</span><input required value={patrolForm.area} onChange={(e) => setPatrolForm({ ...patrolForm, area: e.target.value })} placeholder="Example: Block C & Mobile Asset Corridor" /></label>
            <label className="form-field--wide"><span>Patrol focus / priority reason</span><input required value={patrolForm.focus} onChange={(e) => setPatrolForm({ ...patrolForm, focus: e.target.value })} placeholder="Example: Low visibility and mobile equipment verification" /></label>
            <label><span>GPS coordinate points</span><input min="0" type="number" value={patrolForm.coordinatesCount} onChange={(e) => setPatrolForm({ ...patrolForm, coordinatesCount: e.target.value })} /></label>
            <label><span>Distance (km)</span><input min="0" step="0.1" type="number" value={patrolForm.distanceKm} onChange={(e) => setPatrolForm({ ...patrolForm, distanceKm: e.target.value })} /></label>
            <label><span>Assets observed</span><input min="0" type="number" value={patrolForm.assetsObserved} onChange={(e) => setPatrolForm({ ...patrolForm, assetsObserved: e.target.value })} /></label>
            <label><span>Findings recorded</span><input min="0" type="number" value={patrolForm.findingsCount} onChange={(e) => setPatrolForm({ ...patrolForm, findingsCount: e.target.value })} /></label>
            <label><span>Evidence count</span><input min="0" type="number" value={patrolForm.evidenceCount} onChange={(e) => setPatrolForm({ ...patrolForm, evidenceCount: e.target.value })} /></label>
            <label><span>Field risk level</span><select value={patrolForm.riskLevel} onChange={(e) => setPatrolForm({ ...patrolForm, riskLevel: e.target.value as RiskLevel })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
            <label><span>Submitted by</span><input required value={patrolForm.submittedBy} onChange={(e) => setPatrolForm({ ...patrolForm, submittedBy: e.target.value })} placeholder="Security officer / team leader" /></label>
            <label><span>Tracking file reference</span><input value={patrolForm.trackingRef} onChange={(e) => setPatrolForm({ ...patrolForm, trackingRef: e.target.value })} placeholder="GPX, KML, CSV, XLSX, or system reference" /></label>
            <label><span>Demo route template</span><select value={patrolForm.trackTemplateId} onChange={(e) => setPatrolForm({ ...patrolForm, trackTemplateId: e.target.value })}>
              <option value="route-alpha">Kutai Timur • Workshop & Fuel Storage</option>
              <option value="route-bravo">Kutai Timur • Northern Boundary</option>
              <option value="route-charlie">Kutai Timur • Block C Mobile Asset Corridor</option>
              <option value="route-delta">Kutai Timur • Eastern Water Facility</option>
              <option value="route-night">Penajam Paser Utara • Southern Warehouse & Fuel Route</option>
            </select></label>
            <label className="form-field--wide"><span>Field notes</span><textarea required rows={4} value={patrolForm.notes} onChange={(e) => setPatrolForm({ ...patrolForm, notes: e.target.value })} placeholder="Summarize observed conditions, asset locations, security issues, and follow-up needs." /></label>
            <div className="file-drop form-field--wide"><FileUp size={22} /><div><strong>Evidence upload integration placeholder</strong><span>Photo, GPS, and supporting file storage will be connected during Firebase Storage integration. For this demo, the selected route template will render a patrol line on the Kaltim concession map after the record is submitted.</span></div><Badge tone="neutral">TRACKING DEMO READY</Badge></div>
            <div className="form-actions form-field--wide"><button className="button button--primary" type="submit"><Save size={17} /> Submit for validation</button></div>
          </form>
        </SectionCard>
      )}

      {tab === 'asset' && (
        <SectionCard title="Register or Update Asset" subtitle="Supports fixed assets, mobile assets, and material or stock assets such as fertilizer and fuel.">
          <div className="mode-toggle"><button className={assetMode === 'new' ? 'active' : ''} onClick={() => setAssetMode('new')}>Register new asset</button><button className={assetMode === 'update' ? 'active' : ''} onClick={() => setAssetMode('update')}>Update existing asset</button></div>
          <form className="form-grid" onSubmit={submitAsset}>
            {assetMode === 'update' && <label className="form-field--wide"><span>Select asset</span><select required value={assetForm.existingId} onChange={(e) => loadExistingAsset(e.target.value)}><option value="">Choose an existing asset...</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.code} — {asset.name}</option>)}</select></label>}
            <label><span>Asset code</span><input required value={assetForm.code} onChange={(e) => setAssetForm({ ...assetForm, code: e.target.value })} /></label>
            <label><span>Asset name</span><input required value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} /></label>
            <label><span>Category</span><input required value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })} /></label>
            <label><span>Asset type</span><select value={assetForm.type} onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value as AssetType, moving: e.target.value === 'mobile' })}><option value="fixed">Fixed asset</option><option value="mobile">Mobile asset</option><option value="material">Material / stock asset</option></select></label>
            <label><span>Operational area</span><input required value={assetForm.area} onChange={(e) => setAssetForm({ ...assetForm, area: e.target.value })} /></label>
            <label><span>Location label</span><input required value={assetForm.locationLabel} onChange={(e) => setAssetForm({ ...assetForm, locationLabel: e.target.value })} /></label>
            <label className="form-field--wide"><span>Coordinates</span><div className="input-with-icon"><MapPin size={16} /><input required value={assetForm.coordinates} onChange={(e) => setAssetForm({ ...assetForm, coordinates: e.target.value })} placeholder="Latitude, longitude or developer system reference" /></div></label>
            <label><span>Asset condition</span><select value={assetForm.status} onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value as AssetStatus })}><option value="normal">Normal</option><option value="attention">Attention</option><option value="critical">Critical</option></select></label>
            <label><span>Visibility level</span><select value={assetForm.visibility} onChange={(e) => setAssetForm({ ...assetForm, visibility: e.target.value as VisibilityLevel })}><option value="high">High</option><option value="moderate">Moderate</option><option value="low">Low</option><option value="none">No visibility</option></select></label>
            <label><span>Visibility score</span><input min="0" max="100" type="number" value={assetForm.visibilityScore} onChange={(e) => setAssetForm({ ...assetForm, visibilityScore: e.target.value })} /></label>
            <label><span>Last seen / verified</span><input type="datetime-local" value={assetForm.lastSeenAt} onChange={(e) => setAssetForm({ ...assetForm, lastSeenAt: e.target.value })} /></label>
            <label><span>Criticality</span><select value={assetForm.criticality} onChange={(e) => setAssetForm({ ...assetForm, criticality: e.target.value as RiskLevel })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
            <label><span>Evidence count</span><input min="0" type="number" value={assetForm.evidenceCount} onChange={(e) => setAssetForm({ ...assetForm, evidenceCount: e.target.value })} /></label>
            <label><span>Quantity (optional)</span><input min="0" type="number" value={assetForm.quantity} onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })} /></label>
            <label><span>Unit (optional)</span><input value={assetForm.unit} onChange={(e) => setAssetForm({ ...assetForm, unit: e.target.value })} placeholder="litre, bag, unit..." /></label>
            <label className="form-field--wide"><span>Asset owner / responsible department</span><input required value={assetForm.owner} onChange={(e) => setAssetForm({ ...assetForm, owner: e.target.value })} /></label>
            <div className="form-actions form-field--wide"><button className="button button--primary" type="submit"><Save size={17} /> {assetMode === 'update' ? 'Update asset record' : 'Register asset'}</button></div>
          </form>
        </SectionCard>
      )}

      {tab === 'finding' && (
        <SectionCard title="Add Finding, Incident, or Anomaly" subtitle="Use one operational register while preserving the exact classification and required action.">
          <form className="form-grid" onSubmit={submitFinding}>
            <label className="form-field--wide"><span>Title</span><input required value={findingForm.title} onChange={(e) => setFindingForm({ ...findingForm, title: e.target.value })} /></label>
            <label><span>Classification</span><select value={findingForm.category} onChange={(e) => setFindingForm({ ...findingForm, category: e.target.value as Finding['category'] })}><option value="finding">Finding</option><option value="incident">Incident</option><option value="anomaly">Anomaly</option></select></label>
            <label><span>Severity</span><select value={findingForm.severity} onChange={(e) => setFindingForm({ ...findingForm, severity: e.target.value as RiskLevel })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
            <label><span>Area</span><input required value={findingForm.area} onChange={(e) => setFindingForm({ ...findingForm, area: e.target.value })} /></label>
            <label><span>Related asset</span><select value={findingForm.assetId} onChange={(e) => setFindingForm({ ...findingForm, assetId: e.target.value })}><option value="">No related asset</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.code} — {asset.name}</option>)}</select></label>
            <label><span>Reported date & time</span><input type="datetime-local" value={findingForm.reportedAt} onChange={(e) => setFindingForm({ ...findingForm, reportedAt: e.target.value })} /></label>
            <label><span>Status</span><select value={findingForm.status} onChange={(e) => setFindingForm({ ...findingForm, status: e.target.value as Finding['status'] })}><option value="open">Open</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option></select></label>
            <label className="form-field--wide"><span>Description</span><textarea required rows={4} value={findingForm.description} onChange={(e) => setFindingForm({ ...findingForm, description: e.target.value })} /></label>
            <label className="form-field--wide"><span>Required action</span><textarea required rows={3} value={findingForm.action} onChange={(e) => setFindingForm({ ...findingForm, action: e.target.value })} /></label>
            <label><span>Action owner</span><input required value={findingForm.owner} onChange={(e) => setFindingForm({ ...findingForm, owner: e.target.value })} /></label>
            <label><span>Due date</span><input required type="date" value={findingForm.dueDate} onChange={(e) => setFindingForm({ ...findingForm, dueDate: e.target.value })} /></label>
            <div className="form-actions form-field--wide"><button className="button button--primary" type="submit"><ClipboardPlus size={17} /> Add to findings register</button></div>
          </form>
        </SectionCard>
      )}
    </div>
  )
}
