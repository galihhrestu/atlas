import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getIncidents } from "../../services/incidentStorage";
import { buildSafetyAnalytics } from "../../services/safetyAnalytics";
import "../../styles/dashboard.css";
import "../../styles/investigation.css";

function ManagementDashboard() {
  const navigate = useNavigate();
  const incidents = getIncidents();
  const analytics = useMemo(
    () => buildSafetyAnalytics(incidents),
    [incidents]
  );

  const investigationCount = incidents.filter((item) =>
    ["Investigation", "Revision Required"].includes(item.status)
  ).length;

  const correctiveCount = incidents.filter(
    (item) => item.status === "Corrective Action"
  ).length;

  const finalReports = incidents.filter(
    (item) => item.status === "Management Review"
  );

  const executiveSignals = analytics.insights.slice(0, 4);
  const topPriorities = analytics.priorityActions.slice(0, 4);

  return (
    <div className="dashboard management-command-center">
      <section className="management-command-header">
        <div>
          <span>EXECUTIVE COMMAND CENTER</span>
          <h1>Management Dashboard</h1>
          <p>
            Current exposure, investigation bottlenecks, recurring patterns, and
            decisions requiring management attention.
          </p>
        </div>

        <button type="button" onClick={() => navigate("/analytics")}>
          Open Safety Intelligence →
        </button>
      </section>

      <section className="management-executive-kpis">
        <article>
          <span>Total Incident</span>
          <strong>{analytics.totalIncident}</strong>
          <small>All recorded cases</small>
        </article>

        <article className={analytics.highRiskOpen > 0 ? "critical" : "positive"}>
          <span>High-Risk Open</span>
          <strong>{analytics.highRiskOpen}</strong>
          <small>High/Critical not closed</small>
        </article>

        <article
          className={
            analytics.repeatAnalysis.repeatIncidentRate > 0
              ? "warning"
              : "positive"
          }
        >
          <span>Repeat Incident Rate</span>
          <strong>{analytics.repeatAnalysis.repeatIncidentRate}%</strong>
          <small>Cases linked to recurring patterns</small>
        </article>

        <article
          className={
            analytics.actionAnalysis.overdueActions.length > 0
              ? "critical"
              : "positive"
          }
        >
          <span>Overdue Actions</span>
          <strong>{analytics.actionAnalysis.overdueActions.length}</strong>
          <small>Past target completion</small>
        </article>

        <article className={finalReports.length > 0 ? "review" : "positive"}>
          <span>Waiting Review</span>
          <strong>{finalReports.length}</strong>
          <small>Final report decisions</small>
        </article>

        <article>
          <span>Action Completion</span>
          <strong>{analytics.actionAnalysis.completionRate}%</strong>
          <small>Corrective action execution</small>
        </article>
      </section>

      <section className="management-signal-panel">
        <div className="management-panel-heading">
          <div>
            <span>AUTOMATED SAFETY SIGNALS</span>
            <h2>What Management Needs to Know</h2>
            <p>Signals are generated from actual incident and action records.</p>
          </div>

          <button type="button" onClick={() => navigate("/analytics")}>
            View Full Diagnosis
          </button>
        </div>

        <div className="management-signal-grid">
          {executiveSignals.map((signal, index) => (
            <article
              className={`management-signal-card ${signal.level}`}
              key={`${signal.title}-${index}`}
            >
              <div>
                <span>{signal.metric}</span>
                <h3>{signal.title}</h3>
              </div>
              <p>{signal.description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="management-overview-grid">
        <section className="chart-box management-trend-card">
          <div className="management-panel-heading compact">
            <div>
              <span>PERFORMANCE TREND</span>
              <h2>Incident vs Repeat Pattern</h2>
              <p>Recurrence should decline as corrective actions become effective.</p>
            </div>
          </div>

          {analytics.monthlyTrend.length === 0 ? (
            <div className="analytics-empty-state">No trend data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={310}>
              <LineChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Incident"
                  stroke="#2563eb"
                  strokeWidth={4}
                />
                <Line
                  type="monotone"
                  dataKey="repeated"
                  name="Repeated"
                  stroke="#f59e0b"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="highRisk"
                  name="High Risk"
                  stroke="#dc2626"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="chart-box management-hotspot-card">
          <div className="management-panel-heading compact">
            <div>
              <span>HOTSPOT</span>
              <h2>Top Risk Locations</h2>
              <p>Locations with the highest incident and high-risk concentration.</p>
            </div>
          </div>

          {analytics.locationHotspots.length === 0 ? (
            <div className="analytics-empty-state">No location data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={analytics.locationHotspots.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-15}
                  textAnchor="end"
                  height={70}
                  interval={0}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="total"
                  name="Total"
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

      <section className="chart-box management-priority-panel">
        <div className="management-panel-heading">
          <div>
            <span>MANAGEMENT INTERVENTION</span>
            <h2>Priority Decision Board</h2>
            <p>Highest-priority issues that require action or escalation.</p>
          </div>

          <button type="button" onClick={() => navigate("/analytics")}>
            Open Detailed Board
          </button>
        </div>

        <div className="management-priority-list">
          {topPriorities.length === 0 ? (
            <div className="analytics-empty-state">
              No immediate intervention priority detected.
            </div>
          ) : (
            topPriorities.map((item) => (
              <article key={`${item.priority}-${item.issue}`}>
                <span className="management-priority-number">
                  {item.priority}
                </span>
                <div>
                  <div className="management-priority-title">
                    <h3>{item.issue}</h3>
                    <span className={`priority-risk ${item.risk.toLowerCase()}`}>
                      {item.risk}
                    </span>
                  </div>
                  <p>{item.evidence}</p>
                  <strong>{item.direction}</strong>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="chart-box management-review-table">
        <div className="table-title-row">
          <div>
            <h2>Final Reports Waiting for Review</h2>
            <p>Review, return for revision, or close completed investigations.</p>
          </div>
        </div>

        <div className="responsive-table-wrapper">
          <table className="incident-table">
            <thead>
              <tr>
                <th>Incident</th>
                <th>Reporter</th>
                <th>Date</th>
                <th>Severity</th>
                <th>Submitted By</th>
                <th>Submitted At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {finalReports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-cell">
                    No Final Report Waiting for Review
                  </td>
                </tr>
              ) : (
                finalReports.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.id}</strong>
                      <small className="table-secondary-text">
                        {item.type || "-"}
                      </small>
                    </td>
                    <td>{item.reporter || "-"}</td>
                    <td>{item.date || "-"}</td>
                    <td>{item.severity || "-"}</td>
                    <td>{item.investigation?.submittedBy || "-"}</td>
                    <td>
                      {item.investigation?.submittedAt
                        ? new Date(
                            item.investigation.submittedAt
                          ).toLocaleString("id-ID")
                        : "-"}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/management-incident/${item.id}`)
                        }
                      >
                        Review Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="management-workflow-strip">
        <div>
          <span>Active Investigation</span>
          <strong>{investigationCount}</strong>
        </div>
        <div>
          <span>Corrective Action</span>
          <strong>{correctiveCount}</strong>
        </div>
        <div>
          <span>Average Case Age</span>
          <strong>{analytics.aging.averageAge} days</strong>
        </div>
        <div>
          <span>Closed Cases</span>
          <strong>{analytics.closedCount}</strong>
        </div>
        <div>
          <span>Data Confidence</span>
          <strong>{analytics.dataQuality.confidence}</strong>
        </div>
      </section>
    </div>
  );
}

export default ManagementDashboard;
