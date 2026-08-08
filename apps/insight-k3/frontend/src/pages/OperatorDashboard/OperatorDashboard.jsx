import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOperatorDashboardRequest } from "../../services/incidentService";
import "../../styles/dashboard.css";

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

function titleCaseEnum(value) {
  if (!value) {
    return "-";
  }

  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function OperatorDashboard() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [dashboard, setDashboard] = useState({
    summary: {
      pendingApproval: 0,
      investigation: 0,
      correctiveAction: 0
    },
    pendingIncidents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getOperatorDashboardRequest(authFetch);
      setDashboard(
        response?.data || {
          summary: {
            pendingApproval: 0,
            investigation: 0,
            correctiveAction: 0
          },
          pendingIncidents: []
        }
      );
    } catch (requestError) {
      setError(requestError.message || "Operator dashboard gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summary = dashboard.summary || {};
  const pendingIncidents = dashboard.pendingIncidents || [];

  return (
    <div className="dashboard-page operator-page">
      <div className="dashboard-header">
        <h1>Operator Dashboard</h1>
        <p>HSE Operation Control Panel</p>
      </div>

      <div className="dashboard-grid">
        <div className="action-card">
          <div className="card-icon">⚠️</div>
          <div className="card-content">
            <h2>Pending Approval</h2>
            <div className="number">{summary.pendingApproval || 0}</div>
            <p>Incident Waiting Verification</p>
          </div>
        </div>

        <button
          type="button"
          className="action-card dashboard-card-button"
          onClick={() => navigate("/investigation-monitoring")}
        >
          <div className="card-icon blue">🔎</div>
          <div className="card-content">
            <h2>Investigation</h2>
            <div className="number">{summary.investigation || 0}</div>
            <p>Active Investigation</p>
          </div>
        </button>

        <button
          type="button"
          className="action-card dashboard-card-button"
          onClick={() => navigate("/investigation-monitoring")}
        >
          <div className="card-icon green">🛡️</div>
          <div className="card-content">
            <h2>Corrective Action</h2>
            <div className="number">{summary.correctiveAction || 0}</div>
            <p>Monitoring Action</p>
          </div>
        </button>
      </div>

      <div className="table-container">
        <div className="table-title-row">
          <div>
            <h2>Incoming Incident Report</h2>
            <p>Only reports waiting for operator approval are shown here.</p>
            <p>Data source: PostgreSQL</p>
          </div>

          <button
            type="button"
            className="view-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error ? (
          <div role="alert" style={{ color: "#b91c1c", marginBottom: 16 }}>
            <strong>Unable to load operator queue.</strong>
            <div>{error}</div>
          </div>
        ) : null}

        <div className="responsive-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Date</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Location</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && pendingIncidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-cell">
                    Loading incident queue...
                  </td>
                </tr>
              ) : pendingIncidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-cell">
                    No Pending Incident Report
                  </td>
                </tr>
              ) : (
                pendingIncidents.map((item) => (
                  <tr key={item.incidentCode || item.id}>
                    <td>
                      {item.reporter?.fullName ||
                        item.reporter?.username ||
                        "-"}
                    </td>
                    <td>{formatDate(item.incidentDate)}</td>
                    <td>{item.type || "-"}</td>
                    <td>
                      <span
                        className={`severity-badge severity-${String(
                          item.severity || "low"
                        ).toLowerCase()}`}
                      >
                        {titleCaseEnum(item.severity)}
                      </span>
                    </td>
                    <td>{item.location || "-"}</td>
                    <td>
                      <span className="status-badge pending">
                        {titleCaseEnum(item.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-button"
                        onClick={() =>
                          navigate(
                            `/operator-incident/${encodeURIComponent(
                              item.incidentCode || item.id
                            )}`
                          )
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
      </div>
    </div>
  );
}

export default OperatorDashboard;
