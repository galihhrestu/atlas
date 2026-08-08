import { CalendarRange, Download, FileBarChart, FileSpreadsheet, FileText, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionCard } from '../components/ui/SectionCard'
import { useAppData } from '../context/AppDataContext'
import { exportManagementExcel, exportManagementPdf } from '../services/reportExport'

const reportTemplates = [
  { id: 'daily', title: 'Daily Patrol Report', description: 'Patrol execution, routes, assets observed, evidence, findings, and validation status.', icon: ShieldCheck, period: 'Daily' },
  { id: 'weekly', title: 'Weekly Monitoring Assurance', description: 'Management summary of verification, coverage, visibility, risk, and recommendations.', icon: FileBarChart, period: 'Weekly' },
  { id: 'visibility', title: 'Asset & Area Visibility Report', description: 'Latest positions, last-seen timestamps, low-visibility assets, and priority areas.', icon: FileSpreadsheet, period: 'Current snapshot' },
  { id: 'risk', title: 'High-Risk Area Report', description: 'Hotspots, critical assets, incidents, visibility gaps, and flexible patrol priorities.', icon: FileText, period: 'Current snapshot' },
  { id: 'monthly', title: 'Monthly Executive Summary', description: 'Leadership-ready performance, trends, assurance index, risks, and major actions.', icon: CalendarRange, period: 'Monthly' },
]

export function ReportsPage() {
  const { patrols, assets, findings, areas } = useAppData()
  const [fromDate, setFromDate] = useState('2026-08-01')
  const [toDate, setToDate] = useState('2026-08-06')
  const [lastExport, setLastExport] = useState<string | null>(null)

  const filteredPatrols = useMemo(() => patrols.filter((item) => item.date >= fromDate && item.date <= toDate), [fromDate, patrols, toDate])
  const filteredFindings = useMemo(() => findings.filter((item) => item.reportedAt.slice(0, 10) >= fromDate && item.reportedAt.slice(0, 10) <= toDate), [findings, fromDate, toDate])

  const payload = (title: string) => ({
    patrols: filteredPatrols,
    assets,
    findings: filteredFindings,
    areas,
    title,
    periodLabel: `${fromDate} to ${toDate}`,
  })

  const runPdf = (title: string) => {
    exportManagementPdf(payload(title))
    setLastExport(`${title} PDF generated just now`)
  }

  const runExcel = (title: string) => {
    exportManagementExcel(payload(title))
    setLastExport(`${title} Excel generated just now`)
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="MANAGEMENT REPORTING"
        title="Reports & Export Center"
        description="Generate management-ready PDF and Excel outputs from validated patrol, asset, finding, visibility, and risk data."
      />

      <SectionCard title="Report Period" subtitle="Choose a reporting period before generating a file.">
        <div className="report-period">
          <label><span>From date</span><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label>
          <label><span>To date</span><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></label>
          <div><span>Included records</span><strong>{filteredPatrols.length} patrols • {filteredFindings.length} findings • {assets.length} assets</strong></div>
          {lastExport && <Badge tone="success">{lastExport}</Badge>}
        </div>
      </SectionCard>

      <div className="report-template-grid">
        {reportTemplates.map(({ id, title, description, icon: Icon, period }) => (
          <article className="report-template-card" key={id}>
            <div className="report-template-card__top">
              <span><Icon size={23} /></span>
              <Badge tone="neutral">{period}</Badge>
            </div>
            <h2>{title}</h2>
            <p>{description}</p>
            <div className="report-template-card__stats">
              <div><span>Patrols</span><strong>{filteredPatrols.length}</strong></div>
              <div><span>Assets</span><strong>{assets.length}</strong></div>
              <div><span>Findings</span><strong>{filteredFindings.length}</strong></div>
            </div>
            <div className="report-template-card__actions">
              <button className="button button--primary" onClick={() => runPdf(title)}><FileText size={16} /> PDF</button>
              <button className="button button--secondary" onClick={() => runExcel(title)}><FileSpreadsheet size={16} /> Excel</button>
            </div>
          </article>
        ))}
      </div>

      <SectionCard title="Data Governance Note" subtitle="How the prototype treats official reporting data.">
        <div className="governance-note">
          <span><Download size={22} /></span>
          <div>
            <strong>Verified patrol records should be the official management source.</strong>
            <p>The prototype exports the selected records for review. During Firebase integration, official report templates can enforce verified-only data, approval signatures, document numbers, company branding, and audit history.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
