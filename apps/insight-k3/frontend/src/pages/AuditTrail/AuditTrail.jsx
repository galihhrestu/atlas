import { useMemo, useState } from "react";
import {
  exportAuditLogsToCsv,
  getAuditLogs
} from "../../services/auditTrail";
import "../../styles/dashboard.css";
import "../../styles/auditTrail.css";

const CRITICAL_ACTIONS = [
  "REJECT",
  "RETURN_REVISION",
  "CLOSE_INCIDENT",
  "DELETE",
  "LOGIN_FAILED"
];

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("_", "-");
}

function formatDateTime(timestamp) {
  if (!timestamp) {
    return "-";
  }

  return new Date(timestamp).toLocaleString("id-ID");
}

function formatJson(value) {
  if (value === null || value === undefined) {
    return "No data";
  }

  return JSON.stringify(value, null, 2);
}

function AuditTrail() {
  const [logs, setLogs] = useState(() => getAuditLogs());
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const roles = useMemo(
    () =>
      [...new Set(logs.map((item) => item.role).filter(Boolean))]
        .sort(),
    [logs]
  );

  const modules = useMemo(
    () =>
      [...new Set(logs.map((item) => item.module).filter(Boolean))]
        .sort(),
    [logs]
  );

  const actions = useMemo(
    () =>
      [...new Set(logs.map((item) => item.action).filter(Boolean))]
        .sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const start = startDate
      ? new Date(`${startDate}T00:00:00`)
      : null;
    const end = endDate
      ? new Date(`${endDate}T23:59:59`)
      : null;

    return logs.filter((item) => {
      const itemDate = new Date(item.timestamp);

      if (roleFilter !== "All" && item.role !== roleFilter) {
        return false;
      }

      if (
        moduleFilter !== "All" &&
        item.module !== moduleFilter
      ) {
        return false;
      }

      if (
        actionFilter !== "All" &&
        item.action !== actionFilter
      ) {
        return false;
      }

      if (start && itemDate < start) {
        return false;
      }

      if (end && itemDate > end) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [
        item.actor,
        item.role,
        item.module,
        item.action,
        item.recordId,
        item.description,
        ...(item.changedFields || [])
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(keyword)
        );
    });
  }, [
    actionFilter,
    endDate,
    logs,
    moduleFilter,
    roleFilter,
    search,
    startDate
  ]);

  const todayKey = new Date().toDateString();

  const todayCount = logs.filter(
    (item) =>
      new Date(item.timestamp).toDateString() === todayKey
  ).length;

  const uniqueActors = new Set(
    logs.map((item) => item.actor).filter(Boolean)
  ).size;

  const criticalCount = logs.filter((item) =>
    CRITICAL_ACTIONS.includes(item.action)
  ).length;

  const refreshLogs = () => {
    setLogs(getAuditLogs());
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("All");
    setModuleFilter("All");
    setActionFilter("All");
    setStartDate("");
    setEndDate("");
  };

  const downloadCsv = () => {
    const csv = exportAuditLogsToCsv(filteredLogs);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `INSIGHTK3_Audit_Trail_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard audit-page">
      <div className="audit-hero">
        <div>
          <span className="audit-eyebrow">
            GOVERNANCE & TRACEABILITY
          </span>
          <h1>Audit Trail</h1>
          <p>
            Monitor who changed what, when it changed, and how
            every incident decision progressed.
          </p>
        </div>

        <div className="audit-hero-actions">
          <button
            type="button"
            className="audit-secondary-button"
            onClick={refreshLogs}
          >
            Refresh
          </button>
          <button
            type="button"
            className="audit-primary-button"
            onClick={downloadCsv}
            disabled={filteredLogs.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="audit-summary-grid">
        <div className="audit-summary-card">
          <span>Total Activity</span>
          <strong>{logs.length}</strong>
          <small>All recorded system actions</small>
        </div>

        <div className="audit-summary-card">
          <span>Activity Today</span>
          <strong>{todayCount}</strong>
          <small>Events recorded today</small>
        </div>

        <div className="audit-summary-card">
          <span>Active Actors</span>
          <strong>{uniqueActors}</strong>
          <small>Unique users in the history</small>
        </div>

        <div className="audit-summary-card critical">
          <span>Critical Decisions</span>
          <strong>{criticalCount}</strong>
          <small>Reject, revision, close, delete, or failed login</small>
        </div>
      </div>

      <div className="audit-filter-panel">
        <div className="audit-filter-heading">
          <div>
            <h2>Activity Explorer</h2>
            <p>
              Filter records by actor, incident, module, action,
              role, or date.
            </p>
          </div>

          <button
            type="button"
            className="audit-reset-button"
            onClick={resetFilters}
          >
            Reset Filter
          </button>
        </div>

        <div className="audit-filter-grid">
          <div className="audit-search-field">
            <label>Search</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Actor, incident ID, action, description..."
            />
          </div>

          <div>
            <label>Role</label>
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
            >
              <option value="All">All Roles</option>
              {roles.map((role) => (
                <option value={role} key={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Module</label>
            <select
              value={moduleFilter}
              onChange={(event) =>
                setModuleFilter(event.target.value)
              }
            >
              <option value="All">All Modules</option>
              {modules.map((module) => (
                <option value={module} key={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Action</label>
            <select
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(event.target.value)
              }
            >
              <option value="All">All Actions</option>
              {actions.map((action) => (
                <option value={action} key={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
            />
          </div>

          <div>
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
            />
          </div>
        </div>
      </div>

      <div className="audit-table-card">
        <div className="audit-table-heading">
          <div>
            <h2>Recorded Activity</h2>
            <p>
              Showing {filteredLogs.length} of {logs.length} events.
            </p>
          </div>

          <div className="audit-integrity-badge">
            Read-only history
          </div>
        </div>

        <div className="responsive-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Actor</th>
                <th>Module</th>
                <th>Action</th>
                <th>Record</th>
                <th>Description</th>
                <th>Changed Fields</th>
                <th>Detail</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="audit-empty-state">
                      <strong>No audit activity found.</strong>
                      <span>
                        New system actions will appear here after
                        this update is installed.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{formatDateTime(item.timestamp)}</strong>
                    </td>
                    <td>
                      <div className="audit-actor-cell">
                        <strong>{item.actor}</strong>
                        <span>{item.role}</span>
                      </div>
                    </td>
                    <td>{item.module}</td>
                    <td>
                      <span
                        className={`audit-action-badge ${slugify(
                          item.action
                        )}`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td>{item.recordId || "-"}</td>
                    <td className="audit-description-cell">
                      {item.description}
                    </td>
                    <td>
                      {(item.changedFields || []).length > 0
                        ? (item.changedFields || [])
                            .slice(0, 3)
                            .join(", ")
                        : "-"}
                      {(item.changedFields || []).length > 3 && (
                        <small className="audit-more-fields">
                          +{item.changedFields.length - 3} more
                        </small>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="audit-view-button"
                        onClick={() => setSelectedLog(item)}
                      >
                        View Changes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div
          className="modal-overlay audit-modal-overlay"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="audit-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="audit-modal-header">
              <div>
                <span className="audit-eyebrow">
                  {selectedLog.module}
                </span>
                <h2>{selectedLog.action}</h2>
                <p>{selectedLog.description}</p>
              </div>

              <button
                type="button"
                className="audit-modal-close"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </button>
            </div>

            <div className="audit-detail-grid">
              <div>
                <span>Timestamp</span>
                <strong>
                  {formatDateTime(selectedLog.timestamp)}
                </strong>
              </div>
              <div>
                <span>Actor</span>
                <strong>{selectedLog.actor}</strong>
              </div>
              <div>
                <span>Role</span>
                <strong>{selectedLog.role}</strong>
              </div>
              <div>
                <span>Record ID</span>
                <strong>{selectedLog.recordId || "-"}</strong>
              </div>
            </div>

            <div className="audit-changed-field-list">
              <span>Changed Fields</span>
              <div>
                {(selectedLog.changedFields || []).length > 0
                  ? selectedLog.changedFields.map((field) => (
                      <span key={field}>{field}</span>
                    ))
                  : "No field comparison available."}
              </div>
            </div>

            <div className="audit-change-comparison">
              <div>
                <h3>Previous Value</h3>
                <pre>
                  {formatJson(selectedLog.previousValue)}
                </pre>
              </div>

              <div>
                <h3>New Value</h3>
                <pre>
                  {formatJson(selectedLog.newValue)}
                </pre>
              </div>
            </div>

            {selectedLog.metadata &&
              Object.keys(selectedLog.metadata).length > 0 && (
                <div className="audit-metadata-block">
                  <h3>Additional Metadata</h3>
                  <pre>{formatJson(selectedLog.metadata)}</pre>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditTrail;
