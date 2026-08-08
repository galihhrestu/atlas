import { logAudit } from "./auditTrail";
import {
  displayText,
  getIncidentActions,
  isActionOverdue
} from "./safetyAnalytics";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatScope(filters = {}) {
  return {
    period:
      filters.dateFrom || filters.dateTo
        ? `${filters.dateFrom ? formatDate(filters.dateFrom) : "Awal data"} - ${
            filters.dateTo ? formatDate(filters.dateTo) : "Akhir data"
          }`
        : "Seluruh periode",
    department:
      filters.department && filters.department !== "All"
        ? filters.department
        : "Semua Departemen",
    location:
      filters.location && filters.location !== "All"
        ? filters.location
        : "Semua Lokasi",
    type:
      filters.type && filters.type !== "All"
        ? filters.type
        : "Semua Jenis Insiden",
    severity:
      filters.severity && filters.severity !== "All"
        ? filters.severity
        : "Semua Tingkat Keparahan",
    status:
      filters.status && filters.status !== "All"
        ? filters.status
        : "Semua Status"
  };
}

function sanitizeFilePart(value) {
  return String(value || "all-period")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildFileBase(filters = {}) {
  const from = filters.dateFrom || "all";
  const to = filters.dateTo || "period";
  return `INSIGHTK3_Safety_Report_${sanitizeFilePart(from)}_${sanitizeFilePart(
    to
  )}`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function columnName(index) {
  let result = "";
  let value = index + 1;

  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }

  return result;
}

function normalizeCell(cell) {
  if (
    cell &&
    typeof cell === "object" &&
    !Array.isArray(cell) &&
    Object.prototype.hasOwnProperty.call(cell, "value")
  ) {
    return {
      value: cell.value,
      style: cell.style || 0,
      type: cell.type || null
    };
  }

  return { value: cell, style: 0, type: null };
}

function buildCellXml(cell, rowIndex, columnIndex) {
  const normalized = normalizeCell(cell);
  const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
  const style = normalized.style ? ` s="${normalized.style}"` : "";
  const value = normalized.value;

  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${reference}"${style}><v>${value}</v></c>`;
  }

  if (typeof value === "boolean") {
    return `<c r="${reference}"${style} t="b"><v>${value ? 1 : 0}</v></c>`;
  }

  return `<c r="${reference}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(
    value ?? ""
  )}</t></is></c>`;
}

function estimateWidths(rows) {
  const columnCount = rows.reduce(
    (maximum, row) => Math.max(maximum, row.length),
    0
  );

  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const maximumLength = rows.reduce((maximum, row) => {
      const cell = normalizeCell(row[columnIndex]);
      const text = String(cell.value ?? "");
      const longestLine = text
        .split(/\r?\n/)
        .reduce((lineMax, line) => Math.max(lineMax, line.length), 0);
      return Math.max(maximum, longestLine);
    }, 8);

    return Math.min(42, Math.max(10, maximumLength + 2));
  });
}

function buildWorksheetXml(sheet) {
  const rows = safeArray(sheet.rows);
  const widths = sheet.widths || estimateWidths(rows);
  const lastColumn = columnName(
    Math.max(0, rows.reduce((max, row) => Math.max(max, row.length), 1) - 1)
  );
  const lastRow = Math.max(1, rows.length);

  const colsXml = widths
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
    )
    .join("");

  const rowsXml = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, columnIndex) =>
          buildCellXml(cell, rowIndex, columnIndex)
        )
        .join("");
      const height = row.some((cell) => String(normalizeCell(cell).value ?? "").includes("\n"))
        ? ' ht="34" customHeight="1"'
        : "";
      return `<row r="${rowIndex + 1}"${height}>${cells}</row>`;
    })
    .join("");

  const freezeRows = Number(sheet.freezeRows || 0);
  const paneXml = freezeRows
    ? `<pane ySplit="${freezeRows}" topLeftCell="A${freezeRows + 1}" activePane="bottomLeft" state="frozen"/>`
    : "";

  const autoFilterXml = sheet.autoFilter
    ? `<autoFilter ref="${sheet.autoFilter}"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0">${paneXml}</sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
  ${autoFilterXml}
  <pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>`;
}

function buildStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="5">
    <font><sz val="10"/><name val="Calibri"/></font>
    <font><b/><sz val="20"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="16"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
  </fonts>
  <fills count="6">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF172554"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD7E0EA"/></left><right style="thin"><color rgb="FFD7E0EA"/></right><top style="thin"><color rgb="FFD7E0EA"/></top><bottom style="thin"><color rgb="FFD7E0EA"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="8">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="10" fontId="3" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function crc32(bytes) {
  let crc = 0xffffffff;

  for (let index = 0; index < bytes.length; index += 1) {
    crc ^= bytes[index];

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function concatBytes(parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes =
      typeof file.content === "string"
        ? encoder.encode(file.content)
        : file.content;
    const checksum = crc32(contentBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0x0800);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, 0);
    writeUint16(localHeader, 12, 0);
    writeUint32(localHeader, 14, checksum);
    writeUint32(localHeader, 18, contentBytes.length);
    writeUint32(localHeader, 22, contentBytes.length);
    writeUint16(localHeader, 26, nameBytes.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0x0800);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, 0);
    writeUint16(centralHeader, 14, 0);
    writeUint32(centralHeader, 16, checksum);
    writeUint32(centralHeader, 20, contentBytes.length);
    writeUint32(centralHeader, 24, contentBytes.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, localOffset);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    localOffset += localHeader.length + contentBytes.length;
  });

  const localData = concatBytes(localParts);
  const centralData = concatBytes(centralParts);
  const endRecord = new Uint8Array(22);
  writeUint32(endRecord, 0, 0x06054b50);
  writeUint16(endRecord, 4, 0);
  writeUint16(endRecord, 6, 0);
  writeUint16(endRecord, 8, files.length);
  writeUint16(endRecord, 10, files.length);
  writeUint32(endRecord, 12, centralData.length);
  writeUint32(endRecord, 16, localData.length);
  writeUint16(endRecord, 20, 0);

  return concatBytes([localData, centralData, endRecord]);
}

function makeWorkbookRows({ incidents, analytics, filters }) {
  const user = getCurrentUser();
  const scope = formatScope(filters);
  const generatedAt = new Date();

  const summaryRows = [
    [{ value: "INSIGHTK3 SAFETY PERFORMANCE REPORT", style: 1 }],
    [{ value: "Management Safety Intelligence - Weekly / Monthly Reporting", style: 4 }],
    [],
    [{ value: "REPORT INFORMATION", style: 2 }],
    [{ value: "Reporting Period", style: 3 }, { value: scope.period, style: 6 }],
    [{ value: "Department", style: 3 }, { value: scope.department, style: 6 }],
    [{ value: "Location", style: 3 }, { value: scope.location, style: 6 }],
    [{ value: "Incident Type", style: 3 }, { value: scope.type, style: 6 }],
    [{ value: "Severity", style: 3 }, { value: scope.severity, style: 6 }],
    [{ value: "Workflow Status", style: 3 }, { value: scope.status, style: 6 }],
    [{ value: "Generated By", style: 3 }, { value: user.username || "Management", style: 6 }],
    [{ value: "Generated At", style: 3 }, { value: formatDateTime(generatedAt), style: 6 }],
    [{ value: "Data Confidence", style: 3 }, { value: analytics.dataQuality.confidence, style: 6 }],
    [],
    [{ value: "EXECUTIVE KPI", style: 2 }],
    [{ value: "Metric", style: 2 }, { value: "Value", style: 2 }, { value: "Interpretation", style: 2 }],
    [{ value: "Total Incident", style: 3 }, { value: analytics.totalIncident, style: 6 }, { value: "Cases in selected reporting scope", style: 6 }],
    [{ value: "High-Risk Open", style: 3 }, { value: analytics.highRiskOpen, style: 6 }, { value: "High/Critical cases not yet closed", style: 6 }],
    [{ value: "Repeat Incident Rate", style: 3 }, { value: analytics.repeatAnalysis.repeatIncidentRate / 100, style: 7 }, { value: `${analytics.repeatAnalysis.repeatIncidentCount} incident(s) linked to recurring patterns`, style: 6 }],
    [{ value: "Overdue Actions", style: 3 }, { value: analytics.actionAnalysis.overdueActions.length, style: 6 }, { value: "Corrective actions beyond target", style: 6 }],
    [{ value: "Action Completion Rate", style: 3 }, { value: analytics.actionAnalysis.completionRate / 100, style: 7 }, { value: "Completed corrective action records", style: 6 }],
    [{ value: "Evidence Coverage", style: 3 }, { value: analytics.actionAnalysis.evidenceRate / 100, style: 7 }, { value: "Completed actions with evidence", style: 6 }],
    [{ value: "Average Investigation Age", style: 3 }, { value: analytics.aging.averageAge, style: 6 }, { value: "Average age of active investigation cases (days)", style: 6 }],
    [{ value: "Average Closure Time", style: 3 }, { value: analytics.closureMetrics.averageClosureDays, style: 6 }, { value: "Average case closure duration (days)", style: 6 }],
    [],
    [{ value: "AUTOMATED MANAGEMENT INSIGHTS", style: 2 }],
    [{ value: "Level", style: 2 }, { value: "Insight", style: 2 }, { value: "Evidence / Metric", style: 2 }],
    ...safeArray(analytics.insights).map((item) => [
      { value: item.level, style: 3 },
      { value: `${item.title}: ${item.description}`, style: 6 },
      { value: item.metric, style: 6 }
    ]),
    [],
    [{ value: "MANAGEMENT PRIORITY ACTIONS", style: 2 }],
    [{ value: "Priority", style: 2 }, { value: "Issue", style: 2 }, { value: "Evidence", style: 2 }, { value: "Risk", style: 2 }, { value: "Recommended Direction", style: 2 }],
    ...safeArray(analytics.priorityActions).map((item) => [
      { value: item.priority, style: 3 },
      { value: item.issue, style: 6 },
      { value: item.evidence, style: 6 },
      { value: item.risk, style: 6 },
      { value: item.direction, style: 6 }
    ])
  ];

  const incidentRows = [
    ["Incident ID", "Date", "Time", "Reporter", "Department", "Location", "Type", "Severity", "Status", "Description", "Root Cause", "Approval By", "Created At", "Closed At"].map((value) => ({ value, style: 2 })),
    ...incidents.map((incident) => [
      incident.id,
      incident.date || "-",
      incident.time || "-",
      incident.reporter || "-",
      incident.department || "-",
      incident.location || "-",
      incident.type || incident.category || "-",
      incident.severity || "-",
      incident.status || "-",
      incident.description || "-",
      incident.investigation?.rootCause || incident.rootCause || "-",
      incident.approvalBy || "-",
      formatDateTime(incident.createdAt),
      formatDateTime(incident.closedAt)
    ].map((value) => ({ value, style: 6 })))
  ];

  const actionRows = [
    ["Incident ID", "Incident Date", "Action", "PIC", "Target Date", "Status", "Progress %", "Evidence", "Condition", "Note"].map((value) => ({ value, style: 2 })),
    ...incidents.flatMap((incident) =>
      getIncidentActions(incident).map((action) => [
        { value: incident.id, style: 6 },
        { value: incident.date || "-", style: 6 },
        { value: action.action || "-", style: 6 },
        { value: action.pic || "-", style: 6 },
        { value: action.targetDate || "-", style: 6 },
        { value: action.status || "-", style: 6 },
        { value: Number(action.progress || 0), style: 6 },
        { value: action.evidence || "-", style: 6 },
        { value: isActionOverdue(action) ? "Overdue" : "On Track", style: 6 },
        { value: action.note || "-", style: 6 }
      ])
    )
  ];

  const repeatRows = [
    ["Dimension", "Recurring Pattern", "Incident Count", "High-Risk Count", "Incident IDs"].map((value) => ({ value, style: 2 })),
    ...safeArray(analytics.repeatAnalysis.patterns).map((item) => [
      { value: item.dimension, style: 6 },
      { value: item.label, style: 6 },
      { value: item.count, style: 6 },
      { value: item.highRiskCount, style: 6 },
      { value: item.incidentIds.join(", "), style: 6 }
    ])
  ];

  const departmentRows = [
    ["Department", "Total Incident", "High/Critical", "Critical", "High", "Medium", "Low"].map((value) => ({ value, style: 2 })),
    ...safeArray(analytics.riskHeatmap).map((item) => [
      { value: item.department, style: 6 },
      { value: item.total, style: 6 },
      { value: item.Critical + item.High, style: 6 },
      { value: item.Critical, style: 6 },
      { value: item.High, style: 6 },
      { value: item.Medium, style: 6 },
      { value: item.Low, style: 6 }
    ])
  ];

  const rootCauseRows = [
    ["Root Cause", "Incident Count", "Cumulative %"].map((value) => ({ value, style: 2 })),
    ...safeArray(analytics.rootCausePareto).map((item) => [
      { value: item.name, style: 6 },
      { value: item.total, style: 6 },
      { value: item.cumulativePercentage / 100, style: 7 }
    ])
  ];

  return [
    { name: "Executive Summary", rows: summaryRows, widths: [24, 24, 64, 18, 64] },
    { name: "Incident Register", rows: incidentRows, freezeRows: 1, autoFilter: `A1:N${Math.max(1, incidentRows.length)}` },
    { name: "Corrective Actions", rows: actionRows, freezeRows: 1, autoFilter: `A1:J${Math.max(1, actionRows.length)}` },
    { name: "Repeat Analysis", rows: repeatRows, freezeRows: 1, autoFilter: `A1:E${Math.max(1, repeatRows.length)}` },
    { name: "Department Summary", rows: departmentRows, freezeRows: 1, autoFilter: `A1:G${Math.max(1, departmentRows.length)}` },
    { name: "Root Cause Pareto", rows: rootCauseRows, freezeRows: 1, autoFilter: `A1:C${Math.max(1, rootCauseRows.length)}` }
  ];
}

export function buildSafetyWorkbookBlob(payload) {
  const sheets = makeWorkbookRows(payload);
  const workbookSheetsXml = sheets
    .map(
      (sheet, index) =>
        `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
    )
    .join("");

  const workbookRelsXml = sheets
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
    )
    .join("");

  const worksheetOverrides = sheets
    .map(
      (_, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join("");

  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${worksheetOverrides}
</Types>`
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView/></bookViews>
  <sheets>${workbookSheetsXml}</sheets>
</workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRelsXml}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
    },
    { name: "xl/styles.xml", content: buildStylesXml() },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>INSIGHTK3 Safety Performance Report</dc:title>
  <dc:creator>INSIGHTK3</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>INSIGHTK3</Application>
  <TitlesOfParts><vt:vector size="${sheets.length}" baseType="lpstr">${sheets
        .map((sheet) => `<vt:lpstr>${escapeXml(sheet.name)}</vt:lpstr>`)
        .join("")}</vt:vector></TitlesOfParts>
</Properties>`
    },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      content: buildWorksheetXml(sheet)
    }))
  ];

  const bytes = createZip(files);
  return new Blob([bytes], { type: EXCEL_MIME });
}

export function exportSafetyReportToExcel(payload) {
  const incidents = safeArray(payload?.incidents);

  if (incidents.length === 0) {
    alert("Tidak ada data dalam filter saat ini untuk diekspor.");
    return;
  }

  const fileName = `${buildFileBase(payload.filters)}.xlsx`;
  const blob = buildSafetyWorkbookBlob(payload);
  downloadBlob(blob, fileName);

  logAudit({
    module: "Analytics",
    action: "EXPORT_EXCEL",
    recordId: "SAFETY-REPORT",
    description: `Management exported ${incidents.length} filtered incident record(s) to Excel.`,
    metadata: {
      filters: payload.filters,
      recordCount: incidents.length,
      fileName
    }
  });
}

function renderHtmlRows(rows, columns) {
  if (rows.length === 0) {
    return `<tr><td colspan="${columns.length}" class="empty">Tidak ada data.</td></tr>`;
  }

  return rows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => `<td>${escapeHtml(column.get(row))}</td>`)
          .join("")}</tr>`
    )
    .join("");
}

function buildPdfReportHtml({ incidents, analytics, filters }) {
  const user = getCurrentUser();
  const scope = formatScope(filters);
  const actions = incidents.flatMap((incident) =>
    getIncidentActions(incident).map((action) => ({ incident, action }))
  );

  const incidentColumns = [
    { label: "ID", get: (item) => item.id },
    { label: "Tanggal", get: (item) => item.date || "-" },
    { label: "Departemen", get: (item) => item.department || "-" },
    { label: "Lokasi", get: (item) => item.location || "-" },
    { label: "Jenis", get: (item) => item.type || item.category || "-" },
    { label: "Severity", get: (item) => item.severity || "-" },
    { label: "Status", get: (item) => item.status || "-" }
  ];

  const actionColumns = [
    { label: "Incident", get: (item) => item.incident.id },
    { label: "Tindakan", get: (item) => item.action.action || "-" },
    { label: "PIC", get: (item) => item.action.pic || "-" },
    { label: "Target", get: (item) => item.action.targetDate || "-" },
    { label: "Status", get: (item) => item.action.status || "-" },
    { label: "Progres", get: (item) => `${Number(item.action.progress || 0)}%` },
    { label: "Kondisi", get: (item) => (isActionOverdue(item.action) ? "Overdue" : "On Track") }
  ];

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<title>INSIGHTK3 Safety Performance Report</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; font-size: 10px; line-height: 1.45; }
  .toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 8px; padding: 10px; background: #fff; border-bottom: 1px solid #dbe4ef; z-index: 5; }
  .toolbar button { border: 0; border-radius: 8px; padding: 9px 14px; font-weight: 700; cursor: pointer; }
  .print { background: #2563eb; color: #fff; }
  .close { background: #e2e8f0; color: #0f172a; }
  .cover { padding: 26px; border-radius: 16px; color: #fff; background: linear-gradient(135deg,#312e81,#075985); margin-bottom: 18px; }
  .cover h1 { margin: 5px 0 8px; font-size: 25px; }
  .cover p { margin: 0; font-size: 11px; color: #dbeafe; }
  .eyebrow { font-weight: 800; letter-spacing: 1.4px; color: #7dd3fc; }
  .meta-grid, .kpi-grid { display: grid; gap: 8px; }
  .meta-grid { grid-template-columns: repeat(2,1fr); margin: 14px 0; }
  .meta { border: 1px solid #dbe4ef; border-radius: 10px; padding: 10px; background: #f8fafc; }
  .meta span, .kpi span { display: block; color: #64748b; font-size: 8px; font-weight: 700; text-transform: uppercase; }
  .meta strong { display: block; margin-top: 4px; }
  .kpi-grid { grid-template-columns: repeat(4,1fr); margin: 14px 0; }
  .kpi { border: 1px solid #dbe4ef; border-top: 4px solid #2563eb; border-radius: 10px; padding: 10px; }
  .kpi strong { display: block; margin-top: 5px; font-size: 20px; }
  h2 { margin: 18px 0 8px; font-size: 15px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
  .insight, .priority { border: 1px solid #dbe4ef; border-left: 4px solid #2563eb; border-radius: 8px; padding: 9px; margin-bottom: 7px; page-break-inside: avoid; }
  .insight strong, .priority strong { display: block; margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-top: 7px; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { background: #172554; color: #fff; text-align: left; font-size: 8px; padding: 6px; }
  td { border: 1px solid #dbe4ef; padding: 6px; vertical-align: top; font-size: 8px; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .empty { text-align: center; color: #64748b; padding: 18px; }
  .page-break { break-before: page; page-break-before: always; }
  .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #dbe4ef; color: #64748b; font-size: 8px; }
  @media print { .toolbar { display: none; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="toolbar"><button class="print" onclick="window.print()">Simpan sebagai PDF</button><button class="close" onclick="window.close()">Tutup</button></div>
<section class="cover">
  <div class="eyebrow">MANAGEMENT SAFETY REPORT</div>
  <h1>INSIGHTK3 Safety Performance Report</h1>
  <p>Laporan keselamatan mingguan / bulanan berdasarkan filter management aktif.</p>
</section>
<section class="meta-grid">
  <div class="meta"><span>Periode</span><strong>${escapeHtml(scope.period)}</strong></div>
  <div class="meta"><span>Departemen</span><strong>${escapeHtml(scope.department)}</strong></div>
  <div class="meta"><span>Lokasi</span><strong>${escapeHtml(scope.location)}</strong></div>
  <div class="meta"><span>Jenis Insiden</span><strong>${escapeHtml(scope.type)}</strong></div>
  <div class="meta"><span>Severity</span><strong>${escapeHtml(scope.severity)}</strong></div>
  <div class="meta"><span>Status</span><strong>${escapeHtml(scope.status)}</strong></div>
  <div class="meta"><span>Dibuat oleh</span><strong>${escapeHtml(user.username || "Management")}</strong></div>
  <div class="meta"><span>Waktu pembuatan</span><strong>${escapeHtml(formatDateTime(new Date()))}</strong></div>
</section>
<section class="kpi-grid">
  <div class="kpi"><span>Total Incident</span><strong>${analytics.totalIncident}</strong></div>
  <div class="kpi"><span>High-Risk Open</span><strong>${analytics.highRiskOpen}</strong></div>
  <div class="kpi"><span>Repeat Rate</span><strong>${analytics.repeatAnalysis.repeatIncidentRate}%</strong></div>
  <div class="kpi"><span>Overdue Action</span><strong>${analytics.actionAnalysis.overdueActions.length}</strong></div>
  <div class="kpi"><span>Action Completion</span><strong>${analytics.actionAnalysis.completionRate}%</strong></div>
  <div class="kpi"><span>Evidence Coverage</span><strong>${analytics.actionAnalysis.evidenceRate}%</strong></div>
  <div class="kpi"><span>Average Aging</span><strong>${analytics.aging.averageAge} hari</strong></div>
  <div class="kpi"><span>Data Confidence</span><strong>${escapeHtml(analytics.dataQuality.confidence)}</strong></div>
</section>
<h2>Executive Safety Insights</h2>
${safeArray(analytics.insights)
  .map(
    (item) => `<div class="insight"><strong>${escapeHtml(item.title)} - ${escapeHtml(item.metric)}</strong>${escapeHtml(item.description)}</div>`
  )
  .join("") || '<div class="empty">Tidak ada insight otomatis.</div>'}
<h2>Management Priority Actions</h2>
${safeArray(analytics.priorityActions)
  .map(
    (item) => `<div class="priority"><strong>Priority ${item.priority}: ${escapeHtml(item.issue)} (${escapeHtml(item.risk)})</strong><div><b>Evidence:</b> ${escapeHtml(item.evidence)}</div><div><b>Direction:</b> ${escapeHtml(item.direction)}</div></div>`
  )
  .join("") || '<div class="empty">Tidak ada prioritas mendesak.</div>'}
<div class="page-break"></div>
<h2>Incident Register</h2>
<table><thead><tr>${incidentColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead><tbody>${renderHtmlRows(incidents, incidentColumns)}</tbody></table>
<h2>Corrective Action Register</h2>
<table><thead><tr>${actionColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead><tbody>${renderHtmlRows(actions, actionColumns)}</tbody></table>
<h2>Recurring Pattern Analysis</h2>
<table><thead><tr><th>Dimension</th><th>Pattern</th><th>Jumlah Kasus</th><th>High Risk</th><th>Incident IDs</th></tr></thead><tbody>${safeArray(analytics.repeatAnalysis.patterns).length
  ? analytics.repeatAnalysis.patterns.map((item) => `<tr><td>${escapeHtml(item.dimension)}</td><td>${escapeHtml(item.label)}</td><td>${item.count}</td><td>${item.highRiskCount}</td><td>${escapeHtml(item.incidentIds.join(", "))}</td></tr>`).join("")
  : '<tr><td colspan="5" class="empty">Tidak ada pola berulang pada cakupan ini.</td></tr>'}</tbody></table>
<div class="footer">Generated by INSIGHTK3. Laporan mengikuti filter yang aktif saat ekspor dan perlu diverifikasi dalam proses pelaporan perusahaan.</div>
<script>setTimeout(function(){ window.focus(); window.print(); }, 700);</script>
</body>
</html>`;
}

export function exportSafetyReportToPdf(payload) {
  const incidents = safeArray(payload?.incidents);

  if (incidents.length === 0) {
    alert("Tidak ada data dalam filter saat ini untuk diekspor.");
    return;
  }

  const reportWindow = window.open("", "_blank", "width=1200,height=900");

  if (!reportWindow) {
    alert(
      "Popup diblokir oleh browser. Izinkan popup untuk localhost lalu coba Export PDF kembali."
    );
    return;
  }

  reportWindow.document.open();
  reportWindow.document.write(buildPdfReportHtml(payload));
  reportWindow.document.close();

  logAudit({
    module: "Analytics",
    action: "EXPORT_PDF",
    recordId: "SAFETY-REPORT",
    description: `Management prepared a PDF report from ${incidents.length} filtered incident record(s).`,
    metadata: {
      filters: payload.filters,
      recordCount: incidents.length,
      reportName: `${buildFileBase(payload.filters)}.pdf`
    }
  });
}
