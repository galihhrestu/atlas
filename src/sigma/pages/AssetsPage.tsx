import { Boxes, Download, Filter, MapPin, Plus, RadioTower, Search, Truck, Warehouse } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { KpiCard } from '../components/ui/KpiCard'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionCard } from '../components/ui/SectionCard'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { formatDateTime, labelize, riskTone, visibilityTone } from '../services/format'
import { exportManagementExcel } from '../services/reportExport'
import type { AssetType } from '../types'

export function AssetsPage() {
  const { user } = useAuth()
  const { assets, patrols, findings, areas } = useAppData()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | AssetType>('all')
  const [visibility, setVisibility] = useState('all')

  const filtered = useMemo(() => assets.filter((asset) => {
    const matchQuery = `${asset.code} ${asset.name} ${asset.category} ${asset.area} ${asset.locationLabel}`.toLowerCase().includes(query.toLowerCase())
    const matchType = type === 'all' || asset.type === type
    const matchVisibility = visibility === 'all' || asset.visibility === visibility
    return matchQuery && matchType && matchVisibility
  }), [assets, query, type, visibility])

  const exportExcel = () => exportManagementExcel({ patrols, assets: filtered, findings, areas, title: 'Asset Registry', periodLabel: 'Current asset monitoring data' })

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ASSET VISIBILITY REGISTRY"
        title="Asset Monitoring"
        description="Monitor fixed, mobile, and material assets with current location, evidence recency, criticality, and visibility status."
        actions={<>
          <button className="button button--secondary" onClick={exportExcel}><Download size={17} /> Excel</button>
          {user?.role === 'admin' && <Link className="button button--primary" to="/admin/data-entry"><Plus size={17} /> Register or update asset</Link>}
        </>}
      />

      <div className="kpi-grid kpi-grid--four">
        <KpiCard label="Registered Assets" value={assets.length} detail="Across fixed, mobile, and material classes" icon={Boxes} accent="gold" />
        <KpiCard label="Mobile Assets" value={assets.filter((item) => item.type === 'mobile').length} detail="Location can change dynamically" icon={Truck} accent="cyan" />
        <KpiCard label="Critical Status" value={assets.filter((item) => item.status === 'critical').length} detail="Requires immediate security attention" icon={RadioTower} accent="red" />
        <KpiCard label="Low / No Visibility" value={assets.filter((item) => ['low', 'none'].includes(item.visibility)).length} detail="Prioritize re-verification patrol" icon={Warehouse} accent="orange" />
      </div>

      <SectionCard>
        <div className="toolbar">
          <label className="search-input"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search code, asset, category, location..." /></label>
          <label className="select-control"><Filter size={16} /><select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
            <option value="all">All asset types</option><option value="fixed">Fixed assets</option><option value="mobile">Mobile assets</option><option value="material">Material / stock assets</option>
          </select></label>
          <label className="select-control"><select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
            <option value="all">All visibility</option><option value="high">High</option><option value="moderate">Moderate</option><option value="low">Low</option><option value="none">No visibility</option>
          </select></label>
          <span className="toolbar__count">{filtered.length} assets</span>
        </div>

        <div className="asset-grid">
          {filtered.map((asset) => (
            <article className="asset-card" key={asset.id}>
              <div className="asset-card__header">
                <span className={`asset-type-icon asset-type-icon--${asset.type}`}>
                  {asset.type === 'mobile' ? <Truck size={20} /> : asset.type === 'material' ? <Warehouse size={20} /> : <RadioTower size={20} />}
                </span>
                <div><small>{asset.code}</small><h3>{asset.name}</h3><p>{asset.category}</p></div>
                <Badge tone={asset.status === 'normal' ? 'success' : asset.status === 'critical' ? 'danger' : 'warning'}>{labelize(asset.status)}</Badge>
              </div>
              <div className="asset-card__location"><MapPin size={16} /><div><span>{asset.area}</span><strong>{asset.locationLabel}</strong><small>{asset.coordinates}</small></div></div>
              <div className="asset-card__stats">
                <div><span>Visibility</span><Badge tone={visibilityTone(asset.visibility)}>{labelize(asset.visibility)}</Badge></div>
                <div><span>Score</span><strong>{asset.visibilityScore}%</strong></div>
                <div><span>Criticality</span><Badge tone={riskTone(asset.criticality)}>{labelize(asset.criticality)}</Badge></div>
              </div>
              <div className="asset-card__footer">
                <span>Last seen<br /><strong>{formatDateTime(asset.lastSeenAt)}</strong></span>
                <span>Evidence<br /><strong>{asset.evidenceCount}</strong></span>
                {asset.quantity !== undefined && <span>Recorded stock<br /><strong>{asset.quantity.toLocaleString()} {asset.unit}</strong></span>}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
