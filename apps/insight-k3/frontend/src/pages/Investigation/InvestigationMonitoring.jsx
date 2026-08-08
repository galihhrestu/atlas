import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInvestigationMonitoringRequest } from "../../services/investigationService";
import "../../styles/dashboard.css";
import "../../styles/investigation.css";

const INVESTIGATION_STATUSES = [
  ["INVESTIGATION", "Investigation"],
  ["CORRECTIVE_ACTION", "Corrective Action"],
  ["REVISION_REQUIRED", "Revision Required"],
  ["MANAGEMENT_REVIEW", "Management Review"],
  ["CLOSED", "Closed"]
];

function titleCaseEnum(value) {
  if (!value) {
    return "-";
  }

  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID");
}

function InvestigationMonitoring() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState({
    summary: {
      activeInvestigation: 0,
      correctiveAction: 0,
      waitingManagement: 0,
      closed: 0
    },
    cases: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(
    () => ({
      search,
      status: statusFilter
    }),
    [search, statusFilter]
  );

  const loadMonitoring = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getInvestigationMonitoringRequest(
        authFetch,
        query
      );

      setData(
        response?.data || {
          summary: {
            activeInvestigation: 0,
            correctiveAction: 0,
            waitingManagement: 0,
            closed: 0
          },
          cases: []
        }
      );
    } catch (requestError) {
      setError(
        requestError.message || "Investigation monitoring gagal dimuat."
      );
      setData((current) => ({
        ...current,
        cases: []
      }));
    } finally {
      setLoading(false);
    }
  }, [authFetch, query]);

  useEffect(() => {
    loadMonitoring();
  }, [loadMonitoring]);

  function applySearch(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
  }

  const summary = data.summary || {};
  const investigationCases = data.cases || [];

  return (
    <div className="dashboard-page investigation-monitoring-page">
      <div className="dashboard-header">
        <h1>Investigation Monitoring</h1>
        <p>Monitor findings, corrective actions, evidence, and case completion.</p>
      </div>

      <div className="investigation-summary-grid">
        <div className="investigation-summary-card">
          <span>Active Investigation</span>
          <strong>{summary.activeInvestigation || 0}</strong>
        </div>
        <div className="investigation-summary-card">
          <span>Corrective Action</span>
          <strong>{summary.correctiveAction || 0}</strong>
        </div>
        <div className="investigation-summary-card">
          <span>Waiting Management</span>
          <strong>{summary.waitingManagement || 0}</strong>
        </div>
        <div className="investigation-summary-card">
          <span>Closed</span>
          <strong>{summary.closed || 0}</strong>
        </div>
      </div>

      <div className="table-container">
        <div className="investigation-filter-row">
          <div>
            <h2>Investigation Case List</h2>
            <p>Approved incidents and their current investigation stages.</p>
            <p>Data source: PostgreSQL</p>
          </div>

          <form
            className="investigation-filter-controls"
            onSubmit={applySearch}
          >
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search incident, reporter, location..."
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Status</option>
              {INVESTIGATION_STATUSES.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>

            <button type="submit" className="view-button">
              Search
            </button>
            <button
              type="button"
              className="view-button"
              onClick={resetFilters}
            >
              Reset
            </button>
          </form>
        </div>

        {error ? (
          <div role="alert" style={{ color: "#b91c1c", marginBottom: 16 }}>
            <strong>Unable to load investigation data.</strong>
            <div>{error}</div>
          </div>
        ) : null}

        <div className="responsive-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Incident</th>
                <th>Reporter</th>
                <th>Date</th>
                <th>Severity</th>
                <th>Stage</th>
                <th>Progress</th>
                <th>Condition</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && investigationCases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-cell">
                    Loading investigation cases...
                  </td>
                </tr>
              ) : investigationCases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-cell">
                    No Investigation Case Found
                  </td>
                </tr>
              ) : (
                investigationCases.map((item) => (
                  <tr key={item.incidentCode || item.id}>
                    <td>
                      <strong>{item.incidentCode || item.id}</strong>
                      <small className="table-secondary-text">
                        {item.type || "-"}
                      </small>
                    </td>
                    <td>
                      {item.reporter?.fullName ||
                        item.reporter?.username ||
                        "-"}
                    </td>
                    <td>{formatDate(item.incidentDate)}</td>
                    <td>{titleCaseEnum(item.severity)}</td>
                    <td>
                      <span
                        className={`workflow-badge ${String(
                          titleCaseEnum(item.status)
                        )
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {titleCaseEnum(item.status)}
                      </span>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${item.progress || 0}%` }}
                          />
                        </div>
                        <span>{item.progress || 0}%</span>
                      </div>
                    </td>
                    <td>
                      {item.overdue ? (
                        <span className="overdue-badge">Overdue</span>
                      ) : (
                        <span className="on-track-badge">On Track</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="view-button"
                        onClick={() =>
                          navigate(
                            `/investigation/${encodeURIComponent(
                              item.incidentCode || item.id
                            )}`
                          )
                        }
                      >
                        {["CLOSED", "MANAGEMENT_REVIEW"].includes(
                          item.status
                        )
                          ? "View"
                          : "View / Update"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InvestigationMonitoring;
