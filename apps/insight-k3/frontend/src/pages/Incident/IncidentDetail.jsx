import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Approval from "../../components/investigation/Approval";
import Timeline from "../../components/investigation/Timeline";
import {
  appendTimeline,
  getIncidentById,
  normalizeInvestigation,
  updateIncident
} from "../../services/incidentStorage";
import "../../styles/dashboard.css";
import "../../styles/investigation.css";

function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(() => getIncidentById(id));
  const [managementNote, setManagementNote] = useState(
    incident?.managementReview?.note || ""
  );

  if (!incident) {
    return (
      <div className="dashboard">
        <h1>Incident Not Found</h1>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
  const managerName = user?.username || "Management";
  const investigation = normalizeInvestigation(incident);
  const canManageReview = role === "management";

  const returnForRevision = () => {
    if (!managementNote.trim()) {
      alert("Please enter the revision note.");
      return;
    }

    const now = new Date();
    const changes = {
      status: "Revision Required",
      managementReview: {
        status: "Revision Required",
        note: managementNote.trim(),
        reviewedBy: managerName,
        reviewedAt: now.toISOString()
      },
      timeline: appendTimeline(
        incident,
        "Returned to Operator for Revision",
        { by: managerName }
      )
    };

    updateIncident(id, changes, {
      module: "Management Review",
      action: "RETURN_REVISION",
      description: `Incident ${incident.id} returned to operator for revision by ${managerName}.`,
      metadata: {
        previousStatus: incident.status,
        newStatus: "Revision Required",
        reviewNote: managementNote.trim()
      }
    });
    setIncident({ ...incident, ...changes });

    alert("Report returned to operator for revision.");
    navigate("/management-dashboard");
  };

  const closeIncident = () => {
    const confirmed = window.confirm(
      "Approve this final report and close the incident?"
    );

    if (!confirmed) {
      return;
    }

    const now = new Date();
    const changes = {
      status: "Closed",
      closedBy: managerName,
      closedAt: now.toISOString(),
      managementReview: {
        status: "Approved and Closed",
        note: managementNote.trim(),
        reviewedBy: managerName,
        reviewedAt: now.toISOString()
      },
      timeline: appendTimeline(incident, "Incident Closed by Management", {
        by: managerName
      })
    };

    updateIncident(id, changes, {
      module: "Management Review",
      action: "CLOSE_INCIDENT",
      description: `Incident ${incident.id} approved and closed by ${managerName}.`,
      metadata: {
        previousStatus: incident.status,
        newStatus: "Closed",
        managementNote: managementNote.trim()
      }
    });
    setIncident({ ...incident, ...changes });

    alert("Incident closed successfully.");
    navigate("/management-dashboard");
  };

  return (
    <div className="dashboard management-incident-detail">
      <div className="page-title management-detail-title">
        <div>
          <button
            type="button"
            className="back-link-button"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <h1>Final Investigation Report</h1>
          <p>K3 Incident Management & Management Review</p>
        </div>

        <span
          className={`workflow-badge ${String(incident.status)
            .toLowerCase()
            .replaceAll(" ", "-")}`}
        >
          {incident.status}
        </span>
      </div>

      <div className="incident-header-card">
        <div className="incident-header-top">
          <div>
            <div className="incident-id">{incident.id}</div>
            <div className="incident-category">
              {incident.type || incident.category || "-"}
            </div>
          </div>
        </div>

        <div className="review-summary-grid incident-summary-review-grid">
          <div>
            <span>Reporter</span>
            <strong>{incident.reporter || "-"}</strong>
          </div>
          <div>
            <span>Incident Date</span>
            <strong>{incident.date || "-"}</strong>
          </div>
          <div>
            <span>Location</span>
            <strong>{incident.location || "-"}</strong>
          </div>
          <div>
            <span>Department</span>
            <strong>{incident.department || "-"}</strong>
          </div>
          <div>
            <span>Severity</span>
            <strong>{incident.severity || "-"}</strong>
          </div>
          <div>
            <span>Approved By</span>
            <strong>{incident.approvalBy || "-"}</strong>
          </div>
        </div>
      </div>

      <div className="investigation-card">
        <h2 className="investigation-title">Incident Description</h2>
        <p>{incident.description || "-"}</p>
      </div>

      <div className="investigation-card">
        <h2 className="investigation-title">Investigation Information</h2>

        <div className="review-summary-grid incident-summary-review-grid">
          <div>
            <span>Investigation Date</span>
            <strong>{investigation.investigationDate || "-"}</strong>
          </div>
          <div>
            <span>Lead Investigator</span>
            <strong>{investigation.investigator || "-"}</strong>
          </div>
          <div>
            <span>Investigation Team</span>
            <strong>{investigation.teamMembers || "-"}</strong>
          </div>
          <div>
            <span>Method</span>
            <strong>{investigation.method || "-"}</strong>
          </div>
        </div>

        <div className="report-content-block">
          <h3>Verified Chronology</h3>
          <p>{investigation.verifiedChronology || "-"}</p>
        </div>

        <div className="report-content-block">
          <h3>Investigation Findings</h3>
          <p>{investigation.findings || "-"}</p>
        </div>

        <div className="report-content-block">
          <h3>Witnesses Interviewed</h3>
          <p>{investigation.witnesses || "-"}</p>
        </div>

        <div className="report-content-block">
          <h3>Evidence Description</h3>
          <p>{investigation.evidenceDescription || "-"}</p>
        </div>
      </div>

      <div className="investigation-card">
        <h2 className="investigation-title">Root Cause Analysis</h2>

        <div className="root-cause-report-grid">
          <div>
            <span>Immediate Cause</span>
            <p>{investigation.immediateCause || "-"}</p>
          </div>
          <div>
            <span>Contributing Factor</span>
            <p>{investigation.contributingFactor || "-"}</p>
          </div>
          <div className="root-cause-final">
            <span>Final Root Cause</span>
            <p>{investigation.rootCause || "-"}</p>
          </div>
        </div>

        <div className="management-five-why">
          <h3>Five Why</h3>
          {investigation.fiveWhy.map((item, index) => (
            <div className="management-five-why-item" key={item.id || index}>
              <strong>{index + 1}. {item.question}</strong>
              <p>{item.answer || "-"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="investigation-card">
        <h2 className="investigation-title">Corrective Action Result</h2>

        <div className="responsive-table-wrapper">
          <table className="incident-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>PIC</th>
                <th>Target</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {investigation.actions.length === 0 ? (
                <tr>
                  <td colSpan="6">No corrective action recorded.</td>
                </tr>
              ) : (
                investigation.actions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.action || "-"}</td>
                    <td>{item.pic || "-"}</td>
                    <td>{item.targetDate || "-"}</td>
                    <td>{item.status || "-"}</td>
                    <td>{item.progress || 0}%</td>
                    <td>{item.evidence || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="investigation-card">
        <h2 className="investigation-title">Progress History</h2>

        {investigation.updates.length === 0 ? (
          <div className="empty-investigation-state">
            No progress update recorded.
          </div>
        ) : (
          <div className="progress-update-list">
            {[...investigation.updates].reverse().map((item) => (
              <div className="progress-update-item" key={item.id}>
                <div>
                  <strong>{item.by}</strong>
                  <span>
                    {item.date} {item.time}
                  </span>
                </div>
                <p>{item.note}</p>
                <small>Recorded progress: {item.progress}%</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <Timeline incident={incident} />

      {canManageReview && (
        <Approval
          incident={incident}
          note={managementNote}
          onNoteChange={setManagementNote}
          onReturn={returnForRevision}
          onClose={closeIncident}
        />
      )}
    </div>
  );
}

export default IncidentDetail;
