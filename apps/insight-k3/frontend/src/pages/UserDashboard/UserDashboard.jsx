import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listIncidentsRequest } from "../../services/incidentService";

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

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replaceAll(" ", "_");
}

function getStatusStep(status) {
  switch (normalizeStatus(status)) {
    case "PENDING":
      return {
        current: 1,
        label: "Waiting Operator Verification"
      };

    case "REJECTED":
      return {
        current: 1,
        label: "Rejected"
      };

    case "INVESTIGATION":
      return {
        current: 3,
        label: "Investigation Process"
      };

    case "CORRECTIVE_ACTION":
      return {
        current: 4,
        label: "Corrective Action"
      };

    case "MANAGEMENT_REVIEW":
      return {
        current: 4,
        label: "Management Review"
      };

    case "CLOSED":
      return {
        current: 5,
        label: "Investigation Closed"
      };

    case "REVISION_REQUIRED":
      return {
        current: 1,
        label: "Need Revision"
      };

    default:
      return {
        current: 1,
        label: "Waiting Verification"
      };
  }
}

function UserDashboard() {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();

  const [showReport, setShowReport] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoadingReports(true);
      setReportError("");

      try {
        const response = await listIncidentsRequest(authFetch, {
          limit: 100,
          sortBy: "incidentDate",
          sortOrder: "desc"
        });

        if (active) {
          setMyReports(response.data?.incidents || []);
        }
      } catch (error) {
        if (active) {
          console.error("Gagal mengambil laporan:", error);
          setReportError(
            error.message || "Incident reports could not be loaded."
          );
        }
      } finally {
        if (active) {
          setLoadingReports(false);
        }
      }
    }

    if (user) {
      loadReports();
    }

    return () => {
      active = false;
    };
  }, [authFetch, user]);

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">User Dashboard</h1>

      <p className="page-subtitle">Safety Reporting Portal</p>

      <div className="dashboard-grid">
        <div className="action-card report-card">
          <div className="card-icon danger">
            <span>!</span>
          </div>

          <div className="card-content">
            <h2>Report Incident</h2>

            <p>
              Report unsafe action, unsafe condition, near miss, or safety
              incident.
            </p>

            <button
              className="primary-action"
              onClick={() => navigate("/create-incident")}
            >
              Create Report
            </button>
          </div>
        </div>

        <div
          className="action-card"
          onClick={() => setShowReport(true)}
          style={{
            cursor: "pointer"
          }}
        >
          <div className="card-icon blue">
            <span>▤</span>
          </div>

          <div className="card-content">
            <h2>My Report</h2>

            <div className="number">
              {loadingReports ? "..." : myReports.length}
            </div>

            <p>Submitted incident report</p>

            <button
              className="primary-action"
              onClick={(event) => {
                event.stopPropagation();
                setShowReport(true);
              }}
            >
              View History
            </button>
          </div>
        </div>

        <div className="action-card">
          <div className="card-icon green">
            <span>✓</span>
          </div>

          <div className="card-content">
            <h2>Safety Information</h2>

            <p>
              All reports will be reviewed by HSE Operator before
              investigation.
            </p>
          </div>
        </div>
      </div>

      {showReport && (
        <div className="modal-overlay">
          <div className="report-modal">
            <div className="modal-header">
              <h2>My Report History</h2>

              <button
                className="close-modal"
                onClick={() => setShowReport(false)}
              >
                ×
              </button>
            </div>

            {loadingReports ? (
              <p>Loading incident history...</p>
            ) : reportError ? (
              <p role="alert" style={{ color: "#b91c1c", fontWeight: 600 }}>
                {reportError}
              </p>
            ) : myReports.length === 0 ? (
              <p>No submitted report found.</p>
            ) : (
              myReports.map((item) => {
                const statusInfo = getStatusStep(item.status);

                return (
                  <div
                    className="report-history-card"
                    key={item.id}
                  >
                    <h3>Incident #{item.incidentCode}</h3>

                    <div className="report-info">
                      <p>
                        <b>Type:</b> {item.type || "-"}
                      </p>

                      <p>
                        <b>Date:</b> {formatDate(item.incidentDate)}
                      </p>

                      <p>
                        <b>Location:</b> {item.location || "-"}
                      </p>

                      <p>
                        <b>Current Status:</b>{" "}
                        <span className="status-badge">
                          {statusInfo.label}
                        </span>
                      </p>
                    </div>

                    <h4>Progress Timeline</h4>

                    <div className="report-timeline">
                      <div className="timeline-step active">
                        ✓ Report Submitted
                      </div>

                      <div
                        className={
                          statusInfo.current >= 2
                            ? "timeline-step active"
                            : "timeline-step"
                        }
                      >
                        {statusInfo.current >= 2
                          ? "✓ Approved by Operator"
                          : "○ Waiting Approval"}
                      </div>

                      <div
                        className={
                          statusInfo.current >= 3
                            ? "timeline-step active"
                            : "timeline-step"
                        }
                      >
                        {statusInfo.current >= 3
                          ? "✓ Investigation"
                          : "○ Investigation"}
                      </div>

                      <div
                        className={
                          statusInfo.current >= 4
                            ? "timeline-step active"
                            : "timeline-step"
                        }
                      >
                        {statusInfo.current >= 4
                          ? "✓ Corrective Action"
                          : "○ Corrective Action"}
                      </div>

                      <div
                        className={
                          statusInfo.current >= 5
                            ? "timeline-step active"
                            : "timeline-step"
                        }
                      >
                        {statusInfo.current >= 5
                          ? "✓ Closed"
                          : "○ Closed"}
                      </div>
                    </div>

                    {normalizeStatus(item.status) === "REJECTED" &&
                    item.rejectionReason ? (
                      <p style={{ marginTop: 12 }}>
                        <b>Rejection Reason:</b> {item.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
