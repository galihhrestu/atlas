import {
  CalendarRange,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  MapPinned,
  Maximize2,
  Minimize2,
  Route as RouteIcon,
  ShieldAlert,
} from 'lucide-react'
import L, { type LatLngExpression } from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import {
  Circle,
  LayersControl,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  ScaleControl,
  TileLayer,
  useMap,
  ZoomControl,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppData } from '../../context/AppDataContext'
import { formatDateTime, labelize, riskTone } from '../../services/format'
import { Badge } from './Badge'

type MapSite = 'kaltim' | 'kutim' | 'ppu'
type TimeFilter = '1d' | '3d' | '7d' | '30d' | 'all'
type StatusFilter = 'verified' | 'review' | 'all'
type ZoneRisk = 'medium' | 'high' | 'critical'

interface DemoZone {
  id: string
  name: string
  shortLabel: string
  site: Exclude<MapSite, 'kaltim'>
  risk: ZoneRisk
  position: LatLngExpression
  radius: number
  primaryAsset: string
  visibilityBase: number
  detail: string
}

interface TrackTemplate {
  id: string
  label: string
  site: Exclude<MapSite, 'kaltim'>
  areaIds: string[]
  positions: LatLngExpression[]
}

const DEMO_NOW = new Date('2026-08-06T23:59:59+08:00')

const demoZones: DemoZone[] = [
  {
    id: 'zone-kutim-west',
    name: 'Western Hauling Corridor',
    shortLabel: 'West Corridor',
    site: 'kutim',
    risk: 'high',
    position: [0.42, 117.34],
    radius: 9500,
    primaryAsset: 'Hauling road segment and vehicle corridor',
    visibilityBase: 44,
    detail: 'Main hauling corridor with intermittent vehicle movement and visibility gaps.',
  },
  {
    id: 'zone-kutim-north',
    name: 'Northern Boundary',
    shortLabel: 'North Boundary',
    site: 'kutim',
    risk: 'medium',
    position: [0.68, 117.49],
    radius: 8500,
    primaryAsset: 'Boundary markers and communication watchpoints',
    visibilityBase: 71,
    detail: 'Boundary line requiring periodic patrol verification and legal marker inspection.',
  },
  {
    id: 'zone-kutim-workshop',
    name: 'Workshop & Fuel Storage',
    shortLabel: 'Workshop & Fuel',
    site: 'kutim',
    risk: 'critical',
    position: [0.52, 117.60],
    radius: 8500,
    primaryAsset: 'Fuel storage, workshop, and parked heavy equipment',
    visibilityBase: 88,
    detail: 'Critical security zone containing fuel stock, workshop assets, and movement-sensitive equipment.',
  },
  {
    id: 'zone-kutim-blockc',
    name: 'Block C Mobile Asset Corridor',
    shortLabel: 'Block C Corridor',
    site: 'kutim',
    risk: 'high',
    position: [0.32, 117.48],
    radius: 10000,
    primaryAsset: 'Mobile generator, excavator, and moving plantation support assets',
    visibilityBase: 66,
    detail: 'Mobile-asset corridor where asset location changes are frequent and require confirmation.',
  },
  {
    id: 'zone-kutim-east',
    name: 'Eastern Water Facility',
    shortLabel: 'East Water Facility',
    site: 'kutim',
    risk: 'medium',
    position: [0.48, 117.80],
    radius: 8000,
    primaryAsset: 'Water pump station and reservoir support points',
    visibilityBase: 82,
    detail: 'Water infrastructure area with routine patrol verification and utility checks.',
  },
  {
    id: 'zone-ppu-south',
    name: 'Southern Fertilizer Warehouse',
    shortLabel: 'PPU Warehouse',
    site: 'ppu',
    risk: 'critical',
    position: [-1.25, 116.72],
    radius: 10500,
    primaryAsset: 'Fertilizer storage and associated material stock',
    visibilityBase: 36,
    detail: 'Material-storage zone in Penajam Paser Utara requiring stronger patrol assurance.',
  },
]

const trackTemplates: Record<string, TrackTemplate> = {
  'route-alpha': {
    id: 'route-alpha',
    label: 'Kutai Timur • Workshop & Fuel Storage',
    site: 'kutim',
    areaIds: ['zone-kutim-workshop', 'zone-kutim-east'],
    positions: [
      [0.46, 117.51], [0.48, 117.55], [0.51, 117.59], [0.52, 117.64],
      [0.51, 117.69], [0.50, 117.74], [0.48, 117.80], [0.46, 117.84],
    ],
  },
  'route-bravo': {
    id: 'route-bravo',
    label: 'Kutai Timur • Northern Boundary',
    site: 'kutim',
    areaIds: ['zone-kutim-north'],
    positions: [
      [0.62, 117.37], [0.66, 117.41], [0.69, 117.46], [0.70, 117.51],
      [0.69, 117.56], [0.67, 117.62], [0.65, 117.68],
    ],
  },
  'route-charlie': {
    id: 'route-charlie',
    label: 'Kutai Timur • Block C Mobile Asset Corridor',
    site: 'kutim',
    areaIds: ['zone-kutim-blockc', 'zone-kutim-west'],
    positions: [
      [0.42, 117.34], [0.39, 117.38], [0.36, 117.42], [0.33, 117.46],
      [0.31, 117.50], [0.30, 117.55], [0.32, 117.60],
    ],
  },
  'route-delta': {
    id: 'route-delta',
    label: 'Kutai Timur • Eastern Water Facility',
    site: 'kutim',
    areaIds: ['zone-kutim-east'],
    positions: [
      [0.55, 117.72], [0.53, 117.75], [0.50, 117.78], [0.48, 117.80],
      [0.45, 117.82], [0.42, 117.85],
    ],
  },
  'route-night': {
    id: 'route-night',
    label: 'Penajam Paser Utara • Southern Warehouse & Fuel Route',
    site: 'ppu',
    areaIds: ['zone-ppu-south'],
    positions: [
      [-1.18, 116.67], [-1.21, 116.69], [-1.24, 116.71], [-1.26, 116.73],
      [-1.27, 116.76], [-1.25, 116.78], [-1.22, 116.77],
    ],
  },
}

function parseWindowDays(value: TimeFilter) {
  if (value === '1d') return 1
  if (value === '3d') return 3
  if (value === '7d') return 7
  if (value === '30d') return 30
  return Number.POSITIVE_INFINITY
}

function routeTone(status: string) {
  if (status === 'verified') return { color: '#f6b11a', chip: 'success' as const, label: 'Verified' }
  if (status === 'rejected') return { color: '#ff5d5d', chip: 'danger' as const, label: 'Rejected' }
  return { color: '#f6b11a', chip: 'warning' as const, label: 'Pending review' }
}

function zoneCoverageState(trackStatuses: string[], risk: ZoneRisk) {
  const hasVerified = trackStatuses.includes('verified')
  const hasReview = trackStatuses.some((status) => status !== 'verified' && status !== 'rejected')

  if (hasVerified) {
    return {
      label: 'Covered',
      tone: 'success' as const,
      color: '#2bd674',
      fillColor: risk === 'critical' ? '#ff4f4f' : '#2bd674',
      markerTone: 'green',
    }
  }
  if (hasReview) {
    return {
      label: 'Waiting validation',
      tone: 'warning' as const,
      color: '#f6b11a',
      fillColor: '#f6b11a',
      markerTone: 'amber',
    }
  }
  return {
    label: 'Not covered',
    tone: 'danger' as const,
    color: risk === 'critical' ? '#ff4f4f' : '#f6b11a',
    fillColor: risk === 'critical' ? '#ff4f4f' : '#f6b11a',
    markerTone: risk === 'critical' ? 'red' : 'amber',
  }
}

function createPulseIcon(tone: string) {
  return L.divIcon({
    className: 'sigma-leaflet-marker-wrap',
    html: `<span class="sigma-leaflet-marker sigma-leaflet-marker--${tone}"><span class="sigma-leaflet-marker__pulse"></span><span class="sigma-leaflet-marker__core"></span></span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -20],
  })
}


function MapAutoResize() {
  const map = useMap()

  useEffect(() => {
    const mapContainer = map.getContainer()
    const shell = mapContainer.parentElement

    const refreshMapSize = () => {
      window.requestAnimationFrame(() => {
        map.invalidateSize({
          pan: false,
          debounceMoveend: true,
        })
      })
    }

    refreshMapSize()

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(refreshMapSize)
      : null

    resizeObserver?.observe(mapContainer)
    if (shell) resizeObserver?.observe(shell)

    window.addEventListener('resize', refreshMapSize)

    // Recheck after layout/sidebar transitions and first paint.
    const timers = [80, 260, 520].map((delay) =>
      window.setTimeout(refreshMapSize, delay),
    )

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', refreshMapSize)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [map])

  return null
}

function MapViewport({ site }: { site: MapSite }) {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize({
      pan: false,
      debounceMoveend: true,
    })

    if (site === 'kutim') map.flyTo([0.49, 117.58], 9, { duration: 0.8 })
    else if (site === 'ppu') map.flyTo([-1.25, 116.72], 10, { duration: 0.8 })
    else map.flyTo([-0.20, 117.04], 7, { duration: 0.8 })
  }, [map, site])

  return null
}

export function MapPlaceholder() {
  const { patrols } = useAppData()
  const [siteFilter, setSiteFilter] = useState<MapSite>('kaltim')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (!isExpanded) return

    const previousBodyOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExpanded(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExpanded])

  const filtered = useMemo(() => {
    const maxDays = parseWindowDays(timeFilter)
    const trackedPatrols = patrols.filter((patrol) => patrol.trackTemplateId && trackTemplates[patrol.trackTemplateId])

    const selectedTracks = trackedPatrols
      .filter((patrol) => {
        const patrolDate = new Date(`${patrol.date}T23:59:59+08:00`)
        const dayDiff = Math.floor((DEMO_NOW.getTime() - patrolDate.getTime()) / 86400000)
        const template = trackTemplates[patrol.trackTemplateId!]
        const matchesTime = maxDays === Number.POSITIVE_INFINITY ? true : dayDiff < maxDays
        const matchesSite = siteFilter === 'kaltim' ? true : template.site === siteFilter
        const matchesStatus = statusFilter === 'all'
          ? true
          : statusFilter === 'verified'
            ? patrol.status === 'verified'
            : ['submitted', 'under-review', 'revision-required'].includes(patrol.status)
        return matchesTime && matchesSite && matchesStatus
      })
      .map((patrol) => ({ patrol, template: trackTemplates[patrol.trackTemplateId!] }))

    const zones = demoZones
      .filter((zone) => siteFilter === 'kaltim' ? true : zone.site === siteFilter)
      .map((zone) => {
        const related = selectedTracks.filter((item) => item.template.areaIds.includes(zone.id))
        const statuses = related.map((item) => item.patrol.status)
        const latest = [...related].sort((a, b) => new Date(b.patrol.createdAt).getTime() - new Date(a.patrol.createdAt).getTime())[0]
        const coverage = zoneCoverageState(statuses, zone.risk)
        const visibilityScore = Math.max(18, Math.min(98, zone.visibilityBase + (statuses.includes('verified') ? 10 : statuses.length ? 3 : -7)))
        return {
          ...zone,
          coverage,
          relatedCount: related.length,
          lastPatrol: latest ? formatDateTime(latest.patrol.createdAt) : 'No patrol in current filter',
          visibilityScore,
        }
      })

    const verifiedCovered = zones.filter((zone) => zone.coverage.label === 'Covered').length
    const attentionZones = zones.filter((zone) => (zone.risk === 'high' || zone.risk === 'critical') && zone.coverage.label !== 'Covered').length
    const highRiskTotal = zones.filter((zone) => zone.risk === 'high' || zone.risk === 'critical').length
    const highRiskCovered = zones.filter((zone) => (zone.risk === 'high' || zone.risk === 'critical') && zone.coverage.label === 'Covered').length

    return {
      tracks: selectedTracks,
      zones,
      metrics: {
        trackCount: selectedTracks.length,
        verifiedCoveragePct: zones.length ? Math.round((verifiedCovered / zones.length) * 100) : 0,
        highRiskCovered,
        highRiskTotal,
        attentionZones,
      },
    }
  }, [patrols, siteFilter, statusFilter, timeFilter])

  return (
    <>
      {isExpanded && (
        <button
          type="button"
          className="tracking-demo-map__backdrop"
          onClick={() => setIsExpanded(false)}
          aria-label="Tutup tampilan maps yang diperluas"
        />
      )}

      <div className={`tracking-demo-map tracking-demo-map--leaflet${isExpanded ? ' tracking-demo-map--expanded' : ''}`}>
      {isExpanded && (
        <button
          type="button"
          className="tracking-demo-map__expanded-close"
          onClick={() => setIsExpanded(false)}
          aria-label="Kembalikan ukuran maps"
          title="Kembalikan ukuran maps"
        >
          <Minimize2 size={15} />
          <span>Kembalikan</span>
        </button>
      )}

      <div className="tracking-demo-map__controls">
        <div className="tracking-demo-map__filters">
          <label>
            <span><MapPinned size={14} /> Site</span>
            <select value={siteFilter} onChange={(event) => setSiteFilter(event.target.value as MapSite)}>
              <option value="kaltim">Kalimantan Timur • All Demo Areas</option>
              <option value="kutim">Kutai Timur</option>
              <option value="ppu">Penajam Paser Utara</option>
            </select>
          </label>
          <label>
            <span><CalendarRange size={14} /> Time filter</span>
            <select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}>
              <option value="1d">Last 1 day</option>
              <option value="3d">Last 3 days</option>
              <option value="7d">Last 1 week</option>
              <option value="30d">Last 1 month</option>
              <option value="all">All demo data</option>
            </select>
          </label>
          <label>
            <span><Filter size={14} /> Patrol status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">All routes</option>
              <option value="verified">Verified only</option>
              <option value="review">Submitted / under review</option>
            </select>
          </label>
        </div>
        <div className="tracking-demo-map__actions">
          <button
            type="button"
            className="button button--secondary button--small tracking-demo-map__expand-button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-expanded={isExpanded}
            aria-controls="sigma-leaflet-map-shell"
            title={isExpanded ? 'Kembalikan ukuran maps' : 'Perluas maps'}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isExpanded ? 'Kembalikan' : 'Perluas'}</span>
          </button>
        </div>
      </div>

      <div className="tracking-demo-map__meta-strip">
        <span><RouteIcon size={15} /> Real basemap demo: Satellite + OpenStreetMap</span>
        <span><CheckCircle2 size={15} /> Click a pulsing point to open operational data</span>
        <span><ShieldAlert size={15} /> Demo coordinates are illustrative, not official concession coordinates</span>
      </div>

      <div className="sigma-leaflet-map-shell" id="sigma-leaflet-map-shell">
        <MapContainer
          center={[-0.20, 117.04]}
          zoom={7}
          zoomControl={false}
          scrollWheelZoom
          className="sigma-leaflet-map"
        >
          <MapAutoResize />
          <MapViewport site={siteFilter} />
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satellite">
              <TileLayer
                attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="OpenStreetMap">
              <TileLayer
                attribution="© OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          <ZoomControl position="bottomright" />
          <ScaleControl position="bottomleft" imperial={false} />

          {filtered.zones.map((zone) => (
            <Circle
              key={`circle-${zone.id}`}
              center={zone.position}
              radius={zone.radius}
              pathOptions={{
                color: zone.coverage.color,
                fillColor: zone.coverage.fillColor,
                fillOpacity: zone.risk === 'critical' ? 0.23 : 0.14,
                weight: 2.2,
                dashArray: zone.coverage.label === 'Waiting validation' ? '8 7' : undefined,
              }}
            />
          ))}

          {filtered.tracks.map(({ patrol, template }) => {
            const tone = routeTone(patrol.status)
            return (
              <Polyline
                key={patrol.id}
                positions={template.positions}
                pathOptions={{
                  color: tone.color,
                  weight: 4,
                  opacity: 0.95,
                  dashArray: '3 12',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              >
                <Popup className="sigma-map-popup">
                  <div className="sigma-map-popup__content">
                    <strong>{patrol.patrolCode}</strong>
                    <span>{template.label}</span>
                    <small>{patrol.team} • {formatDateTime(patrol.createdAt)}</small>
                    <Badge tone={tone.chip}>{tone.label}</Badge>
                  </div>
                </Popup>
              </Polyline>
            )
          })}

          {filtered.zones.map((zone) => (
            <Marker key={`marker-${zone.id}`} position={zone.position} icon={createPulseIcon(zone.coverage.markerTone)}>
              <Popup className="sigma-map-popup" maxWidth={340}>
                <div className="sigma-map-popup__content sigma-map-popup__content--zone">
                  <div className="sigma-map-popup__title-row">
                    <strong>{zone.name}</strong>
                    <div>
                      <Badge tone={riskTone(zone.risk)}>{labelize(zone.risk)}</Badge>
                      <Badge tone={zone.coverage.tone}>{zone.coverage.label}</Badge>
                    </div>
                  </div>
                  <p>{zone.detail}</p>
                  <dl className="sigma-map-popup__grid">
                    <div><dt>Site</dt><dd>{zone.site === 'kutim' ? 'Kutai Timur' : 'Penajam Paser Utara'}</dd></div>
                    <div><dt>Visibility</dt><dd>{zone.visibilityScore}%</dd></div>
                    <div><dt>Routes in filter</dt><dd>{zone.relatedCount}</dd></div>
                    <div><dt>Last patrol</dt><dd>{zone.lastPatrol}</dd></div>
                    <div className="sigma-map-popup__wide"><dt>Primary asset</dt><dd>{zone.primaryAsset}</dd></div>
                  </dl>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="tracking-demo-map__legend-card">
        <h4>Operational legend</h4>
        <div className="tracking-demo-map__legend-grid">
          <div><i className="legend-line legend-line--gold" /> Patrol route</div>
          <div><i className="legend-zone legend-zone--green" /> Covered zone</div>
          <div><i className="legend-zone legend-zone--amber" /> Waiting validation</div>
          <div><i className="legend-zone legend-zone--red" /> High-risk / hotspot</div>
          <div><i className="legend-point legend-point--green" /> Clickable pulsing point</div>
        </div>
      </div>

      <div className="tracking-demo-map__summary-grid">
        <article className="tracking-demo-map__metric-card">
          <span className="tracking-demo-map__metric-icon tracking-demo-map__metric-icon--gold"><RouteIcon size={18} /></span>
          <div>
            <strong>{filtered.metrics.trackCount}</strong>
            <p>Routes shown on map</p>
            <small>Filtered by site, time window, and patrol status.</small>
          </div>
        </article>
        <article className="tracking-demo-map__metric-card">
          <span className="tracking-demo-map__metric-icon tracking-demo-map__metric-icon--green"><Eye size={18} /></span>
          <div>
            <strong>{filtered.metrics.verifiedCoveragePct}%</strong>
            <p>Visibility coverage</p>
            <small>Calculated from zones with at least one verified patrol route.</small>
          </div>
        </article>
        <article className="tracking-demo-map__metric-card">
          <span className="tracking-demo-map__metric-icon tracking-demo-map__metric-icon--red"><ShieldAlert size={18} /></span>
          <div>
            <strong>{filtered.metrics.highRiskCovered}/{filtered.metrics.highRiskTotal}</strong>
            <p>High-risk zones covered</p>
            <small>{filtered.metrics.attentionZones} high-risk zone(s) still require patrol attention.</small>
          </div>
        </article>
      </div>

      <div className="tracking-demo-map__insight-grid">
        <section className="tracking-demo-map__insight-card">
          <div className="tracking-demo-map__insight-header">
            <h4>Tracking routes in current filter</h4>
            <Badge tone="info">Demo overlay</Badge>
          </div>
          <div className="tracking-demo-map__track-list">
            {filtered.tracks.length === 0 && <p className="tracking-demo-map__empty">No demo routes match the current filter.</p>}
            {filtered.tracks.map(({ patrol, template }) => {
              const tone = routeTone(patrol.status)
              return (
                <article key={patrol.id} className="tracking-demo-map__track-item">
                  <div>
                    <strong>{patrol.patrolCode}</strong>
                    <p>{template.label}</p>
                    <small>{patrol.team} • {formatDateTime(patrol.createdAt)}</small>
                  </div>
                  <Badge tone={tone.chip}>{tone.label}</Badge>
                </article>
              )
            })}
          </div>
        </section>

        <section className="tracking-demo-map__insight-card">
          <div className="tracking-demo-map__insight-header">
            <h4>Area visibility from tracking</h4>
            <Badge tone="neutral">Time-window based</Badge>
          </div>
          <div className="tracking-demo-map__zone-list">
            {filtered.zones.map((zone) => (
              <article key={zone.id} className="tracking-demo-map__zone-item">
                <div>
                  <div className="tracking-demo-map__zone-title">
                    <strong>{zone.name}</strong>
                    <Badge tone={riskTone(zone.risk)}>{labelize(zone.risk)}</Badge>
                  </div>
                  <p>Last matching patrol: {zone.lastPatrol}</p>
                  <small><Clock3 size={12} /> {zone.relatedCount} route(s) in current filter</small>
                </div>
                <Badge tone={zone.coverage.tone}>{zone.coverage.label}</Badge>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="tracking-demo-map__footnote">
        Satellite and OpenStreetMap tiles require an internet connection while localhost is running. All route and point coordinates in this prototype are illustrative demo data; replace them with validated concession geometry and actual GPS tracks before operational use.
      </div>
      </div>
    </>
  )
}
