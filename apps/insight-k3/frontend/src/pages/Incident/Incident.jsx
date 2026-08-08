import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getIncidentRequest,
  listIncidentsRequest
} from "../../services/incidentService";
import "../../styles/dashboard.css";

const STATUS_OPTIONS = [
  ["PENDING", "Pending"],
  ["REJECTED", "Rejected"],
  ["INVESTIGATION", "Investigation"],
  ["CORRECTIVE_ACTION", "Corrective Action"],
  ["MANAGEMENT_REVIEW", "Management Review"],
  ["REVISION_REQUIRED", "Revision Required"],
  ["CLOSED", "Closed"]
];

const SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const ESTATE_OPTIONS = ["MO", "Terunen", "Sepaku", "Senoni"];

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID");
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("id-ID");
}

function displayStatus(value) {
  return String(value || "-")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function displaySeverity(value) {
  const normalized = String(value || "").toUpperCase();

  if (!normalized) {
    return "-";
  }

  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function severityClass(value) {
  const normalized = String(value || "").toUpperCase();

  if (normalized === "CRITICAL" || normalized === "HIGH") {
    return "severity-high";
  }

  if (normalized === "MEDIUM") {
    return "severity-medium";
  }

  return "severity-low";
}

function statusClass(value) {
  const normalized = String(value || "").toUpperCase();

  if (normalized === "CLOSED") {
    return "status-closed";
  }

  if (normalized === "INVESTIGATION") {
    return "status-open";
  }

  return "status-progress";
}

function Incident() {
  const { authFetch } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [estate, setEstate] = useState("");
  const [page, setPage] = useState(1);

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      search,
      status,
      severity,
      estate,
      sortBy: "incidentDate",
      sortOrder: "desc"
    }),
    [estate, page, search, severity, status]
  );

  useEffect(() => {
    let active = true;

    async function loadIncidents() {
      setLoading(true);
      setError("");

      try {
        const response = await listIncidentsRequest(authFetch, query);

        if (!active) {
          return;
        }

        setIncidents(response.data?.incidents || []);
        setPagination(
          response.data?.pagination || {
            page,
            limit: 20,
            total: 0,
            totalPages: 1
          }
        );
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message || "Incident data could not be loaded."
          );
          setIncidents([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadIncidents();

    return () => {
      active = false;
    };
  }, [authFetch, page, query]);

  function applySearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setSeverity("");
    setEstate("");
    setPage(1);
  }

  async function openDetail(item) {
    setSelectedIncident(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await getIncidentRequest(
        authFetch,
        item.incidentCode || item.id
      );

      setSelectedIncident(response.data?.incident || null);
    } catch (requestError) {
      setDetailError(
        requestError.message || "Incident detail could not be loaded."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="dashboard">
      <div className="page-title">
        <h1>Incident Monitoring</h1>
        <p>K3 Incident Management & Investigation</p>
      </div>

      <div className="chart-box">
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            marginBottom: 20
          }}
        >
          <div>
            <h2 style={{ marginBottom: 4 }}>Incident List</h2>
            <p style={{ margin: 0, opacity: 0.7 }}>
              Data source: PostgreSQL
            </p>
          </div>

          <strong>{pagination.total} incident(s)</strong>
        </div>

        <form
          onSubmit={applySearch}
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(220px, 2fr) repeat(3, minmax(150px, 1fr)) auto auto",
            gap: 12,
            marginBottom: 20,
            alignItems: "end"
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>
              Search
            </label>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ID, location, department, type, reporter..."
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>
              Status
            </label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              style={{ width: "100%" }}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>
              Severity
            </label>
            <select
              value={severity}
              onChange={(event) => {
                setSeverity(event.target.value);
                setPage(1);
              }}
              style={{ width: "100%" }}
            >
              <option value="">All Severity</option>
              {SEVERITY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {displaySeverity(item)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>
              Estate
            </label>
            <select
              value={estate}
              onChange={(event) => {
                setEstate(event.target.value);
                setPage(1);
              }}
              style={{ width: "100%" }}
            >
              <option value="">All Estate</option>
              {ESTATE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

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

        {error ? (
          <p role="alert" style={{ color: "#b91c1c", fontWeight: 600 }}>
            {error}
          </p>
        ) : null}

        <div className="responsive-table-wrapper">
          <table className="incident-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Category</th>
                <th>Location</th>
                <th>Department</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reporter</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9">Loading incident data...</td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan="9">No Incident Data</td>
                </tr>
              ) : (
                incidents.map((item) => (
                  <tr key={item.id}>
                    <td>{item.incidentCode}</td>
                    <td>{formatDate(item.incidentDate)}</td>
                    <td>{item.type || "-"}</td>
                    <td>{item.location || "-"}</td>
                    <td>{item.department || "-"}</td>
                    <td>
                      <span className={severityClass(item.severity)}>
                        {displaySeverity(item.severity)}
                      </span>
                    </td>
                    <td>
                      <span className={statusClass(item.status)}>
                        {displayStatus(item.status)}
                      </span>
                    </td>
                    <td>
                      {item.reporter?.fullName ||
                        item.reporter?.username ||
                        "-"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="view-button"
                        onClick={() => openDetail(item)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginTop: 18,
            flexWrap: "wrap"
          }}
        >
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="view-button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>

            <button
              type="button"
              className="view-button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages, current + 1)
                )
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {(detailLoading || detailError || selectedIncident) && (
        <div className="modal-overlay">
          <div
            className="report-modal"
            style={{
              maxWidth: 900,
              maxHeight: "85vh",
              overflowY: "auto"
            }}
          >
            <div className="modal-header">
              <div>
                <h2>Incident Detail</h2>
                {selectedIncident ? (
                  <small>{selectedIncident.incidentCode}</small>
                ) : null}
              </div>

              <button
                className="close-modal"
                onClick={() => {
                  setSelectedIncident(null);
                  setDetailError("");
                  setDetailLoading(false);
                }}
              >
                ×
              </button>
            </div>

            {detailLoading ? <p>Loading incident detail...</p> : null}

            {detailError ? (
              <p role="alert" style={{ color: "#b91c1c", fontWeight: 600 }}>
                {detailError}
              </p>
            ) : null}

            {selectedIncident ? (
              <>
                <div className="report-info">
                  <p>
                    <b>Reporter:</b>{" "}
                    {selectedIncident.reporter?.fullName ||
                      selectedIncident.reporter?.username ||
                      "-"}
                  </p>
                  <p>
                    <b>Incident Date:</b>{" "}
                    {formatDateTime(selectedIncident.incidentDate)}
                  </p>
                  <p>
                    <b>Estate:</b> {selectedIncident.estate || "-"}
                  </p>
                  <p>
                    <b>Location:</b> {selectedIncident.location || "-"}
                  </p>
                  <p>
                    <b>Department:</b>{" "}
                    {selectedIncident.department || "-"}
                  </p>
                  <p>
                    <b>Incident Type:</b> {selectedIncident.type || "-"}
                  </p>
                  <p>
                    <b>Severity:</b>{" "}
                    {displaySeverity(selectedIncident.severity)}
                  </p>
                  <p>
                    <b>Status:</b> {displayStatus(selectedIncident.status)}
                  </p>
                  <p>
                    <b>Object Involved:</b>{" "}
                    {selectedIncident.objectInvolved || "-"}
                  </p>
                </div>

                <div style={{ marginTop: 20 }}>
                  <h3>Incident Description</h3>
                  <p>{selectedIncident.description || "-"}</p>
                </div>

                <div style={{ marginTop: 20 }}>
                  <h3>Initial Analysis</h3>
                  <div className="report-info">
                    <p>
                      <b>Unsafe Action:</b>{" "}
                      {selectedIncident.unsafeAction || "-"}
                    </p>
                    <p>
                      <b>SOP Violation:</b>{" "}
                      {selectedIncident.sopViolation === true
                        ? "Yes"
                        : selectedIncident.sopViolation === false
                          ? "No"
                          : "-"}
                    </p>
                    <p>
                      <b>Unsafe Condition:</b>{" "}
                      {selectedIncident.unsafeCondition || "-"}
                    </p>
                    <p>
                      <b>Contributing Factor:</b>{" "}
                      {selectedIncident.contributingFactor || "-"}
                    </p>
                    <p>
                      <b>Root Cause Category:</b>{" "}
                      {selectedIncident.rootCauseCategory || "-"}
                    </p>
                  </div>

                  <h4>Root Cause Description</h4>
                  <p>{selectedIncident.initialRootCause || "-"}</p>
                </div>

                {selectedIncident.rejectionReason ? (
                  <div style={{ marginTop: 20 }}>
                    <h3>Rejection / Revision Information</h3>
                    <p>{selectedIncident.rejectionReason}</p>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default Incident;
