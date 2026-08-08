import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { AreaVisibility, Asset, Finding, PatrolReport } from '../types'

interface ReportPayload {
  patrols: PatrolReport[]
  assets: Asset[]
  findings: Finding[]
  areas: AreaVisibility[]
  title: string
  periodLabel: string
}

const dateStamp = () => new Date().toISOString().slice(0, 10)

export function exportManagementPdf({ patrols, assets, findings, areas, title, periodLabel }: ReportPayload) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFillColor(7, 16, 28)
  doc.rect(0, 0, 297, 30, 'F')
  doc.setTextColor(255, 176, 0)
  doc.setFontSize(20)
  doc.text('SIGMA', 14, 15)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.text(title, 45, 15)
  doc.setFontSize(8)
  doc.setTextColor(190, 202, 215)
  doc.text(`Operational Monitoring Visibility & Assurance • ${periodLabel}`, 45, 21)
  doc.text(`Generated ${new Date().toLocaleString('en-GB')}`, 237, 21)

  const verified = patrols.filter((item) => item.status === 'verified').length
  const activeFindings = findings.filter((item) => item.status !== 'resolved').length
  const lowVisibility = areas.filter((item) => item.visibility === 'low' || item.visibility === 'none').length

  doc.setTextColor(25, 36, 49)
  doc.setFontSize(11)
  doc.text(`Patrol reports: ${patrols.length}`, 14, 41)
  doc.text(`Verified: ${verified}`, 72, 41)
  doc.text(`Assets: ${assets.length}`, 118, 41)
  doc.text(`Active findings: ${activeFindings}`, 158, 41)
  doc.text(`Low visibility areas: ${lowVisibility}`, 225, 41)

  autoTable(doc, {
    startY: 48,
    head: [['Patrol Code', 'Date', 'Team', 'Area', 'Assets', 'Findings', 'Risk', 'Status']],
    body: patrols.map((item) => [item.patrolCode, item.date, item.team, item.area, item.assetsObserved, item.findingsCount, item.riskLevel, item.status]),
    theme: 'grid',
    headStyles: { fillColor: [13, 29, 46], textColor: [255, 176, 0] },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  })

  const nextY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90
  autoTable(doc, {
    startY: nextY + 8,
    head: [['Priority Area', 'Visibility', 'Coverage', 'Risk Score', 'Reason']],
    body: [...areas]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 6)
      .map((item) => [item.name, `${item.visibilityScore}%`, `${item.coveragePct}%`, item.riskScore, item.reasons.join('; ')]),
    theme: 'striped',
    headStyles: { fillColor: [255, 176, 0], textColor: [7, 16, 28] },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  })

  doc.save(`SIGMA_${title.replace(/\s+/g, '_')}_${dateStamp()}.pdf`)
}

export function exportManagementExcel({ patrols, assets, findings, areas, title }: ReportPayload) {
  const workbook = XLSX.utils.book_new()

  const patrolSheet = XLSX.utils.json_to_sheet(patrols.map((item) => ({
    'Patrol Code': item.patrolCode,
    Date: item.date,
    'Start Time': item.startTime,
    'End Time': item.endTime,
    Team: item.team,
    Area: item.area,
    Focus: item.focus,
    'GPS Points': item.coordinatesCount,
    'Distance (km)': item.distanceKm,
    'Assets Observed': item.assetsObserved,
    Findings: item.findingsCount,
    'Evidence Count': item.evidenceCount,
    Risk: item.riskLevel,
    Status: item.status,
    'Submitted By': item.submittedBy,
    'Validated By': item.validatedBy ?? '',
  })))

  const assetSheet = XLSX.utils.json_to_sheet(assets.map((item) => ({
    Code: item.code,
    Asset: item.name,
    Category: item.category,
    Type: item.type,
    Area: item.area,
    Location: item.locationLabel,
    Coordinates: item.coordinates,
    Status: item.status,
    Visibility: item.visibility,
    'Visibility Score': item.visibilityScore,
    'Last Seen': item.lastSeenAt,
    Quantity: item.quantity ?? '',
    Unit: item.unit ?? '',
    Criticality: item.criticality,
    Owner: item.owner,
  })))

  const findingSheet = XLSX.utils.json_to_sheet(findings.map((item) => ({
    Code: item.code,
    Type: item.category,
    Title: item.title,
    Severity: item.severity,
    Area: item.area,
    Status: item.status,
    'Reported At': item.reportedAt,
    Description: item.description,
    Action: item.action,
    Owner: item.owner,
    'Due Date': item.dueDate,
  })))

  const visibilitySheet = XLSX.utils.json_to_sheet(areas.map((item) => ({
    Area: item.name,
    Zone: item.zone,
    'Last Patrol': item.lastPatrolAt,
    'Days Since Patrol': item.daysSincePatrol,
    'Coverage %': item.coveragePct,
    'Evidence Completeness %': item.evidenceCompleteness,
    'Visibility Score': item.visibilityScore,
    Visibility: item.visibility,
    'Risk Score': item.riskScore,
    Priority: item.priority,
    Reasons: item.reasons.join('; '),
  })))

  XLSX.utils.book_append_sheet(workbook, patrolSheet, 'Patrols')
  XLSX.utils.book_append_sheet(workbook, assetSheet, 'Assets')
  XLSX.utils.book_append_sheet(workbook, findingSheet, 'Findings')
  XLSX.utils.book_append_sheet(workbook, visibilitySheet, 'Visibility')

  XLSX.writeFile(workbook, `SIGMA_${title.replace(/\s+/g, '_')}_${dateStamp()}.xlsx`)
}
