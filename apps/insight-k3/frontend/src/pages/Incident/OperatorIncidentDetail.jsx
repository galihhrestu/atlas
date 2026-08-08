import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  decideIncidentRequest,
  getIncidentRequest
} from "../../services/incidentService";
import {
  addIncident,
  appendTimeline,
  createEmptyInvestigation,
  getIncidentById,
  updateIncident
} from "../../services/incidentStorage";
import "../../styles/dashboard.css";
import "../../styles/investigation.css";

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

function formatTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function toLegacyIncident(apiIncident) {
  return {
    id: apiIncident.incidentCode,
    databaseId: apiIncident.id,
    reporter:
      apiIncident.reporter?.username ||
      apiIncident.reporter?.fullName ||
      "Unknown",
    date: apiIncident.incidentDate
      ? new Date(apiIncident.incidentDate).toISOString().slice(0, 10)
      : "",
    time: formatTime(apiIncident.incidentDate),
    location: apiIncident.location || "",
    estate: apiIncident.estate || "",
    locationType: apiIncident.locationType || "",
    block: apiIncident.block || "",
    compartment: apiIncident.compartment || "",
    haulingRoad: apiIncident.haulingRoad || "",
    compartmentRoad: apiIncident.compartmentRoad || "",
    locationDetail: apiIncident.locationDetail || "",
    department: apiIncident.department || "",
    type: apiIncident.type || "",
    severity: titleCaseEnum(apiIncident.severity),
    object: apiIncident.objectInvolved || "",
    description: apiIncident.description || "",
    unsafeAction: apiIncident.unsafeAction || "",
    sop:
      apiIncident.sopViolation === true
        ? "Yes"
        : apiIncident.sopViolation === false
          ? "No"
          : "",
    unsafeCondition: apiIncident.unsafeCondition || "",
    factor: apiIncident.contributingFactor || "",
    rootCauseCategory: apiIncident.rootCauseCategory || "",
    rootCause: apiIncident.initialRootCause || "",
    actionPlan: apiIncident.initialActionPlan || "",
    pic: apiIncident.initialPic || "",
    target: apiIncident.initialTargetDate
      ? apiIncident.initialTargetDate.slice(0, 10)
      : "",
    file: "",
    status: titleCaseEnum(apiIncident.status),
    approvalBy: apiIncident.approvedBy?.username || "",
    approvedAt: apiIncident.approvedAt || "",
    rejectionReason: apiIncident.rejectionReason || "",
    correctiveStatus: "",
    createdAt: apiIncident.createdAt
  };
}

function syncLegacyDecision(apiIncident, operatorName) {
  try {
    const legacyId = apiIncident.incidentCode;
    const existing = getIncidentById(legacyId);
    const base = existing || toLegacyIncident(apiIncident);
    const nextStatus = titleCaseEnum(apiIncident.status);

    const changes = {
      ...base,
      status: nextStatus,
      approvalBy: apiIncident.approvedBy?.username || "",
      approvedAt: apiIncident.approvedAt || "",
      rejectedBy: apiIncident.rejectedBy?.username || "",
      rejectedAt: apiIncident.rejectedAt || "",
      rejectionReason: apiIncident.rejectionReason || ""
    };

    if (apiIncident.status === "INVESTIGATION") {
      changes.investigation =
        existing?.investigation ||
        createEmptyInvestigation(base, operatorName);
      changes.timeline = appendTimeline(
        base,
        "Approved by Operator - Investigation Started",
        { by: operatorName }
      );
    }

    if (apiIncident.status === "REJECTED") {
      changes.timeline = appendTimeline(base, "Rejected by Operator", {
        by: operatorName
      });
    }

    if (existing) {
      updateIncident(legacyId, changes, {
        skipAudit: true
      });
    } else {
      addIncident(changes, {
        skipAudit: true
      });
    }
  } catch (error) {
    console.warn(
      "Legacy investigation bridge could not be synchronized:",
      error
    );
  }
}

function OperatorIncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();
  const [incident, setIncident] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const loadIncident = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getIncidentRequest(authFetch, id);
      const loadedIncident = response?.data?.incident || null;
      setIncident(loadedIncident);
      setRejectionReason(loadedIncident?.rejectionReason || "");
    } catch (requestError) {
      setIncident(null);
      setError(requestError.message || "Incident gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, id]);

  useEffect(() => {
    loadIncident();
  }, [loadIncident]);

  const displayStatus = useMemo(
    () => titleCaseEnum(incident?.status),
    [incident?.status]
  );

  async function approveIncident() {
    if (!incident || incident.status !== "PENDING" || processing) {
      return;
    }

    const confirmed = window.confirm(
      "Approve this incident and start the investigation?"
    );

    if (!confirmed) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await decideIncidentRequest(
        authFetch,
        incident.incidentCode || incident.id,
        {
          decision: "APPROVE"
        }
      );
      const updatedIncident = response.data.incident;
      setIncident(updatedIncident);

      syncLegacyDecision(
        updatedIncident,
        user?.username || "Operator"
      );

      alert("Incident approved. Investigation has started in PostgreSQL.");
      navigate(`/investigation/${updatedIncident.incidentCode}`);
    } catch (requestError) {
      setError(requestError.message || "Incident gagal disetujui.");
    } finally {
      setProcessing(false);
    }
  }

  async function rejectIncident() {
    if (!incident || incident.status !== "PENDING" || processing) {
      return;
    }

    const cleanedReason = rejectionReason.trim();

    if (cleanedReason.length < 3) {
      setError("Please enter the rejection reason (minimum 3 characters).");
      return;
    }

    const confirmed = window.confirm(
      "Reject this incident report? This decision will be saved to PostgreSQL."
    );

    if (!confirmed) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await decideIncidentRequest(
        authFetch,
        incident.incidentCode || incident.id,
        {
          decision: "REJECT",
          rejectionReason: cleanedReason
        }
      );
      const updatedIncident = response.data.incident;
      setIncident(updatedIncident);

      syncLegacyDecision(
        updatedIncident,
        user?.username || "Operator"
      );

      alert("Incident report rejected and saved to PostgreSQL.");
      navigate("/operator-dashboard");
    } catch (requestError) {
      setError(requestError.message || "Incident gagal ditolak.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <h2>Loading Incident...</h2>
        <p>Reading incident data from PostgreSQL.</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="dashboard-page">
        <h2>Incident Not Found</h2>
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
        <button
          className="primary-action"
          onClick={() => navigate("/operator-dashboard")}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="incident-detail-page">
      <div className="incident-header">
        <div>
          <h1>Incident Verification</h1>
          <p>Review the report before approval or rejection.</p>
          <small>Data source: PostgreSQL</small>
        </div>

        <div
          className={`incident-status ${String(displayStatus)
            .toLowerCase()
            .replace(/\s+/g, "-")}`}
        >
          {displayStatus}
        </div>
      </div>

      {error ? (
        <div className="detail-card" role="alert">
          <strong style={{ color: "#b91c1c" }}>Action failed</strong>
          <p>{error}</p>
        </div>
      ) : null}

      <div className="detail-card">
        <h2>👤 Reporter Information</h2>
        <div className="profile-box">
          <div className="avatar">👤</div>
          <div>
            <h3>
              {incident.reporter?.fullName ||
                incident.reporter?.username ||
                "-"}
            </h3>
            <p>
              {incident.reporter?.username
                ? `@${incident.reporter.username}`
                : "Incident Reporter"}
            </p>
          </div>
        </div>
      </div>

      <div className="detail-card">
        <h2>📋 Incident Summary</h2>
        <div className="info-grid verification-info-grid">
          <div>
            <label>Incident ID</label>
            <strong>{incident.incidentCode || "-"}</strong>
          </div>
          <div>
            <label>Incident Type</label>
            <strong>{incident.type || "-"}</strong>
          </div>
          <div>
            <label>Severity</label>
            <strong>{titleCaseEnum(incident.severity)}</strong>
          </div>
          <div>
            <label>Location</label>
            <strong>{incident.location || "-"}</strong>
          </div>
          <div>
            <label>Department</label>
            <strong>{incident.department || "-"}</strong>
          </div>
          <div>
            <label>Date</label>
            <strong>{formatDate(incident.incidentDate)}</strong>
          </div>
          <div>
            <label>Time</label>
            <strong>{formatTime(incident.incidentDate)}</strong>
          </div>
          <div>
            <label>Object Involved</label>
            <strong>{incident.objectInvolved || "-"}</strong>
          </div>
          <div>
            <label>Estate</label>
            <strong>{incident.estate || "-"}</strong>
          </div>
        </div>
      </div>

      <div className="detail-card">
        <h2>⚠️ Incident Description</h2>
        <p>{incident.description || "-"}</p>
      </div>

      <div className="detail-card">
        <h2>🔎 Initial Analysis from Reporter</h2>
        <div className="info-grid verification-info-grid">
          <div>
            <label>Unsafe Action</label>
            <strong>{incident.unsafeAction || "-"}</strong>
          </div>
          <div>
            <label>SOP Violation</label>
            <strong>
              {incident.sopViolation === true
                ? "Yes"
                : incident.sopViolation === false
                  ? "No"
                  : "-"}
            </strong>
          </div>
          <div>
            <label>Unsafe Condition</label>
            <strong>{incident.unsafeCondition || "-"}</strong>
          </div>
          <div>
            <label>Contributing Factor</label>
            <strong>{incident.contributingFactor || "-"}</strong>
          </div>
          <div>
            <label>Primary Root Cause Category</label>
            <strong>{incident.rootCauseCategory || "-"}</strong>
          </div>
        </div>

        <h3>Initial Root Cause Description</h3>
        <p>{incident.initialRootCause || "-"}</p>
      </div>

      <div className="detail-card">
        <h2>🛡️ Initial Corrective Action Proposal</h2>
        <p>{incident.initialActionPlan || "-"}</p>
        <div className="info-grid verification-info-grid">
          <div>
            <label>PIC</label>
            <strong>{incident.initialPic || "-"}</strong>
          </div>
          <div>
            <label>Target Completion</label>
            <strong>{formatDate(incident.initialTargetDate)}</strong>
          </div>
        </div>
      </div>

      {incident.status === "PENDING" ? (
        <div className="detail-card approval-decision-card">
          <h2>Operator Decision</h2>

          <label>Rejection Reason</label>
          <textarea
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Required only when the report is rejected"
            disabled={processing}
          />

          <div className="approval-box">
            <button
              className="approve-btn"
              onClick={approveIncident}
              disabled={processing}
            >
              {processing ? "Processing..." : "Approve / Start Investigation"}
            </button>

            <button
              className="reject-btn"
              onClick={rejectIncident}
              disabled={processing}
            >
              {processing ? "Processing..." : "Reject Report"}
            </button>
          </div>
        </div>
      ) : (
        <div className="detail-card">
          <h2>Decision Information</h2>
          <p>
            Status: <b>{displayStatus}</b>
          </p>

          {incident.approvedBy ? (
            <>
              <p>
                Approved By: <b>{incident.approvedBy.username}</b>
              </p>
              <p>
                Approval Date: <b>{formatDate(incident.approvedAt)}</b>
              </p>
            </>
          ) : null}

          {incident.rejectedBy ? (
            <>
              <p>
                Rejected By: <b>{incident.rejectedBy.username}</b>
              </p>
              <p>
                Rejection Date: <b>{formatDate(incident.rejectedAt)}</b>
              </p>
            </>
          ) : null}

          {incident.rejectionReason ? (
            <p>
              Rejection Reason: <b>{incident.rejectionReason}</b>
            </p>
          ) : null}

          {["INVESTIGATION", "CORRECTIVE_ACTION", "REVISION_REQUIRED"].includes(
            incident.status
          ) ? (
            <button
              className="primary-action"
              onClick={() => navigate(`/investigation/${incident.incidentCode}`)}
            >
              Open Investigation
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default OperatorIncidentDetail;
