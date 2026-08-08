import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getIncidents } from "../../services/incidentStorage";
import {
  buildSafetyAnalytics,
  filterIncidents,
  getFilterOptions
} from "../../services/safetyAnalytics";
import {
  exportSafetyReportToExcel,
  exportSafetyReportToPdf
} from "../../services/reportExport";
import "../../styles/dashboard.css";

const INITIAL_FILTERS = {
  dateFrom: "",
  dateTo: "",
  department: "All",
  estate: "All",
  locationType: "All",
  location: "All",
  type: "All",
  severity: "All",
  status: "All"
};

const LOCATION_TYPE_LABELS = {
  MO: "MO / Main Office",
  BLOCK_COMPARTMENT: "Block / Compartment Area",
  HAULING_ROAD: "Hauling Road",
  COMPARTMENT_ROAD: "Compartment Road"
};

function shortenAxisLabel(value, maximum = 24) {
  const text = String(value || "");
  return text.length > maximum ? `${text.slice(0, maximum - 1)}…` : text;
}


const INSIGHT_ICONS = {
  critical: "!",
  warning: "△",
  information: "i",
  positive: "✓"
};

function formatMetric(value, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return `${value}${suffix}`;
}

function EmptyChart({ message = "No data available for this selection." }) {
  return <div className="analytics-empty-state">{message}</div>;
}

function Analytics() {
  const incidents = getIncidents();
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const options = useMemo(() => getFilterOptions(incidents), [incidents]);

  const filteredIncidents = useMemo(
    () => filterIncidents(incidents, filters),
    [incidents, filters]
  );

  const analytics = useMemo(
    () => buildSafetyAnalytics(filteredIncidents),
    [filteredIncidents]
  );

  const updateFilter = (field, value) => {
    setFilters((oldFilters) => ({
      ...oldFilters,
      [field]: value
    }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const reportPayload = {
    incidents: filteredIncidents,
    analytics,
    filters
  };

  const handleExportExcel = () => {
    exportSafetyReportToExcel(reportPayload);
  };

  const handleExportPdf = () => {
    exportSafetyReportToPdf(reportPayload);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([field, value]) =>
      field.startsWith("date") ? Boolean(value) : value !== "All"
  ).length;

  const maxHeatmapValue = Math.max(
    1,
    ...analytics.riskHeatmap.flatMap((row) => [
      row.Critical,
      row.High,
      row.Medium,
      row.Low
    ])
  );

  const heatLevel = (value) => {
    if (value === 0) {
      return "heat-0";
    }

    const ratio = value / maxHeatmapValue;

    if (ratio >= 0.75) {
      return "heat-4";
    }

    if (ratio >= 0.5) {
      return "heat-3";
    }

    if (ratio >= 0.25) {
      return "heat-2";
    }

    return "heat-1";
  };

  return (
    <div className="dashboard safety-intelligence-page">
      <section className="analytics-hero">
        <div>
          <span className="analytics-eyebrow">MANAGEMENT INTELLIGENCE</span>
          <h1>Safety Intelligence & Repeat Prevention</h1>
          <p>
            Diagnose recurring patterns, action effectiveness, investigation
            delays, and the controls that require management intervention.
          </p>
        </div>

        <div className="analytics-hero-side">
          <div className="analytics-data-confidence">
            <span>Data Confidence</span>
            <strong>{analytics.dataQuality.confidence}</strong>
            <small>{analytics.totalIncident} incident records analyzed</small>
          </div>

          <div className="analytics-export-actions">
            <button
              type="button"
              className="analytics-export-button excel"
              onClick={handleExportExcel}
              disabled={filteredIncidents.length === 0}
            >
              <span aria-hidden="true">▦</span>
              Export Excel
            </button>

            <button
              type="button"
              className="analytics-export-button pdf"
              onClick={handleExportPdf}
              disabled={filteredIncidents.length === 0}
            >
              <span aria-hidden="true">▤</span>
              Export PDF
            </button>
          </div>
        </div>
      </section>

      <section className="analytics-filter-panel">
        <div className="analytics-filter-heading">
          <div>
            <h2>Analysis Scope</h2>
            <p>All metrics, charts, insights, and priorities follow this filter.</p>
          </div>

          <button type="button" onClick={resetFilters}>
            Reset Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
          </button>
        </div>

        <div className="analytics-filter-grid">
          <label>
            From
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => updateFilter("dateFrom", event.target.value)}
            />
          </label>

          <label>
            To
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateFilter("dateTo", event.target.value)}
            />
          </label>

          <label>
            Department
            <select
              value={filters.department}
              onChange={(event) =>
                updateFilter("department", event.target.value)
              }
            >
              <option value="All">All Departments</option>
              {options.departments.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estate
            <select
              value={filters.estate}
              onChange={(event) => updateFilter("estate", event.target.value)}
            >
              <option value="All">All Estates</option>
              {options.estates.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Area Type
            <select
              value={filters.locationType}
              onChange={(event) =>
                updateFilter("locationType", event.target.value)
              }
            >
              <option value="All">All Area Types</option>
              {options.locationTypes.map((item) => (
                <option value={item} key={item}>
                  {LOCATION_TYPE_LABELS[item] || item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Detailed Location
            <select
              value={filters.location}
              onChange={(event) => updateFilter("location", event.target.value)}
            >
              <option value="All">All Detailed Locations</option>
              {options.locations.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Incident Type
            <select
              value={filters.type}
              onChange={(event) => updateFilter("type", event.target.value)}
            >
              <option value="All">All Types</option>
              {options.types.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Severity
            <select
              value={filters.severity}
              onChange={(event) => updateFilter("severity", event.target.value)}
            >
              <option value="All">All Severity</option>
              {options.severities.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Workflow Status
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              <option value="All">All Status</option>
              {options.statuses.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="analytics-kpi-grid">
        <article className="analytics-kpi-card primary">
          <span>Total Incident</span>
          <strong>{analytics.totalIncident}</strong>
          <p>Cases inside the selected analysis scope</p>
        </article>

        <article
          className={`analytics-kpi-card ${
            analytics.highRiskOpen > 0 ? "danger" : "positive"
          }`}
        >
          <span>High-Risk Open</span>
          <strong>{analytics.highRiskOpen}</strong>
          <p>High/Critical cases not yet closed</p>
        </article>

        <article
          className={`analytics-kpi-card ${
            analytics.repeatAnalysis.repeatIncidentRate > 0
              ? "warning"
              : "positive"
          }`}
        >
          <span>Repeat Incident Rate</span>
          <strong>
            {formatMetric(analytics.repeatAnalysis.repeatIncidentRate, "%")}
          </strong>
          <p>
            {analytics.repeatAnalysis.repeatIncidentCount} incident(s) linked to
            recurring patterns
          </p>
        </article>

        <article
          className={`analytics-kpi-card ${
            analytics.actionAnalysis.overdueActions.length > 0
              ? "danger"
              : "positive"
          }`}
        >
          <span>Overdue Actions</span>
          <strong>{analytics.actionAnalysis.overdueActions.length}</strong>
          <p>Corrective actions beyond target completion</p>
        </article>

        <article className="analytics-kpi-card">
          <span>Action Completion</span>
          <strong>
            {formatMetric(analytics.actionAnalysis.completionRate, "%")}
          </strong>
          <p>
            {analytics.actionAnalysis.completedActions.length} of {" "}
            {analytics.actionAnalysis.allActions.length} action records completed
          </p>
        </article>

        <article className="analytics-kpi-card">
          <span>Average Closure Time</span>
          <strong>
            {analytics.closureMetrics.closedCases.length > 0
              ? `${analytics.closureMetrics.averageClosureDays}d`
              : "—"}
          </strong>
          <p>From reporting to management closure</p>
        </article>

        <article className="analytics-kpi-card">
          <span>Investigation Aging</span>
          <strong>{analytics.aging.averageAge}d</strong>
          <p>{analytics.aging.agedOver14} case(s) open longer than 14 days</p>
        </article>

        <article className="analytics-kpi-card">
          <span>Evidence Coverage</span>
          <strong>
            {formatMetric(analytics.actionAnalysis.evidenceRate, "%")}
          </strong>
          <p>Completed actions supported by evidence</p>
        </article>
      </section>

      <section className="analytics-section-card executive-insight-section">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">AUTOMATED DIAGNOSIS</span>
            <h2>Executive Safety Signals</h2>
            <p>
              Rule-based conclusions generated only from the selected incident
              records.
            </p>
          </div>
        </div>

        <div className="executive-insight-grid">
          {analytics.insights.map((insight, index) => (
            <article
              className={`executive-insight-card ${insight.level}`}
              key={`${insight.title}-${index}`}
            >
              <div className="insight-icon">
                {INSIGHT_ICONS[insight.level] || "i"}
              </div>
              <div>
                <div className="insight-title-row">
                  <h3>{insight.title}</h3>
                  <span>{insight.metric}</span>
                </div>
                <p>{insight.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="analytics-section-card">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">TREND DIAGNOSTIC</span>
            <h2>Incident, High-Risk, and Recurrence Trend</h2>
            <p>
              A repeat line that rises together with total incidents indicates
              controls are not preventing recurrence.
            </p>
          </div>
        </div>

        {analytics.monthlyTrend.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={analytics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="total"
                name="Total Incident"
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="highRisk"
                name="High Risk"
                stroke="#dc2626"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="repeated"
                name="Repeated"
                stroke="#f59e0b"
                strokeWidth={3}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </section>

      <div className="analytics-two-column">
        <section className="analytics-section-card">
          <div className="analytics-section-heading compact">
            <div>
              <span className="analytics-section-kicker">80/20 FOCUS</span>
              <h2>Root Cause Pareto</h2>
              <p>Focus management resources on the few causes driving most cases.</p>
            </div>
          </div>

          {analytics.rootCausePareto.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={analytics.rootCausePareto}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-18}
                  textAnchor="end"
                  height={95}
                  interval={0}
                  tickFormatter={(value) => shortenAxisLabel(value)}
                />
                <YAxis yAxisId="left" allowDecimals={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="total"
                  name="Incident"
                  fill="#16a34a"
                  radius={[8, 8, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativePercentage"
                  name="Cumulative %"
                  stroke="#f59e0b"
                  strokeWidth={3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="analytics-section-card">
          <div className="analytics-section-heading compact">
            <div>
              <span className="analytics-section-kicker">EXPOSURE HOTSPOT</span>
              <h2>Estate / Location Risk Concentration</h2>
              <p>Total incidents versus High/Critical exposure by estate; legacy records fall back to their saved location.</p>
            </div>
          </div>

          {analytics.locationHotspots.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={analytics.locationHotspots}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-18}
                  textAnchor="end"
                  height={85}
                  interval={0}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="total"
                  name="Total Incident"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="highRisk"
                  name="High/Critical"
                  fill="#dc2626"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <section className="analytics-section-card">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">RISK MATRIX</span>
            <h2>Department × Severity Heatmap</h2>
            <p>
              Darker cells indicate higher incident concentration and help
              management prioritize field intervention.
            </p>
          </div>
        </div>

        {analytics.riskHeatmap.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="risk-heatmap-wrapper">
            <table className="risk-heatmap-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Critical</th>
                  <th>High</th>
                  <th>Medium</th>
                  <th>Low</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {analytics.riskHeatmap.map((row) => (
                  <tr key={row.department}>
                    <td>{row.department}</td>
                    {['Critical', 'High', 'Medium', 'Low'].map((severity) => (
                      <td
                        className={`heatmap-cell ${heatLevel(row[severity])}`}
                        key={severity}
                      >
                        {row[severity]}
                      </td>
                    ))}
                    <td className="heatmap-total">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="analytics-two-column">
        <section className="analytics-section-card">
          <div className="analytics-section-heading compact">
            <div>
              <span className="analytics-section-kicker">CASE VELOCITY</span>
              <h2>Investigation Aging</h2>
              <p>Older cases indicate evidence, ownership, or capacity bottlenecks.</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={analytics.aging.buckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="total"
                name="Open Case"
                fill="#8b5cf6"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="analytics-section-card">
          <div className="analytics-section-heading compact">
            <div>
              <span className="analytics-section-kicker">WORKFLOW LOAD</span>
              <h2>Case Status Distribution</h2>
              <p>Shows where cases accumulate in the incident workflow.</p>
            </div>
          </div>

          {analytics.statusData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={analytics.statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-15}
                  textAnchor="end"
                  height={75}
                  interval={0}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="total"
                  name="Case"
                  fill="#0ea5e9"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <section className="analytics-section-card">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">CONTROL EFFECTIVENESS</span>
            <h2>Corrective Action Effectiveness Review</h2>
            <p>
              Repeated use, overdue implementation, and missing evidence are
              highlighted to prevent administrative actions from being recycled.
            </p>
          </div>
        </div>

        <div className="responsive-table-wrapper">
          <table className="analytics-table effectiveness-table">
            <thead>
              <tr>
                <th>Corrective Action</th>
                <th>Used</th>
                <th>Completed</th>
                <th>Evidence</th>
                <th>Recurring Cases</th>
                <th>Assessment</th>
                <th>Management Concern</th>
              </tr>
            </thead>
            <tbody>
              {analytics.actionAnalysis.actionEffectiveness.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-cell">
                    No corrective action data recorded.
                  </td>
                </tr>
              ) : (
                analytics.actionAnalysis.actionEffectiveness.map((item) => (
                  <tr key={`${item.action}-${item.uses}`}>
                    <td>
                      <strong>{item.action}</strong>
                      <small>{item.incidentIds.join(", ")}</small>
                    </td>
                    <td>{item.uses}</td>
                    <td>{item.completed}</td>
                    <td>{item.withEvidence}</td>
                    <td>{item.repeatedCases}</td>
                    <td>
                      <span
                        className={`effectiveness-badge ${item.status
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.concern}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analytics-section-card priority-board-section">
        <div className="analytics-section-heading">
          <div>
            <span className="analytics-section-kicker">DECISION BOARD</span>
            <h2>Management Priority Actions</h2>
            <p>
              Priorities are ranked from recurrence, severity, delay, evidence,
              and review backlog signals.
            </p>
          </div>
        </div>

        <div className="responsive-table-wrapper">
          <table className="analytics-table priority-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Issue</th>
                <th>Evidence</th>
                <th>Risk</th>
                <th>Recommended Direction</th>
              </tr>
            </thead>
            <tbody>
              {analytics.priorityActions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-table-cell">
                    No immediate management priority detected.
                  </td>
                </tr>
              ) : (
                analytics.priorityActions.map((item) => (
                  <tr key={`${item.priority}-${item.issue}`}>
                    <td>
                      <span className="priority-number">{item.priority}</span>
                    </td>
                    <td>
                      <strong>{item.issue}</strong>
                    </td>
                    <td>{item.evidence}</td>
                    <td>
                      <span
                        className={`priority-risk ${item.risk.toLowerCase()}`}
                      >
                        {item.risk}
                      </span>
                    </td>
                    <td>{item.direction}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analytics-data-quality">
        <div>
          <span>Root Cause Coverage</span>
          <strong>{analytics.dataQuality.rootCauseCoverage}%</strong>
        </div>
        <div>
          <span>Action Plan Coverage</span>
          <strong>{analytics.dataQuality.actionCoverage}%</strong>
        </div>
        <div>
          <span>Closed Case Evidence</span>
          <strong>{analytics.dataQuality.closedEvidenceCoverage}%</strong>
        </div>
        <p>
          Analytical quality depends on complete root cause, target date,
          progress, evidence, and closure records. With fewer than five cases,
          recurrence findings should be treated as directional.
        </p>
      </section>
    </div>
  );
}

export default Analytics;
