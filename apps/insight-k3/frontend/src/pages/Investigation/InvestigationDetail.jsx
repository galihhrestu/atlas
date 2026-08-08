import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ActionPlan from "../../components/investigation/ActionPlan";
import FiveWhy from "../../components/investigation/FiveWhy";
import Timeline from "../../components/investigation/Timeline";
import { useAuth } from "../../context/AuthContext";
import {
  addInvestigationUpdateRequest,
  getInvestigationRequest,
  saveInvestigationRequest,
  startCorrectiveActionRequest,
  submitInvestigationToManagementRequest
} from "../../services/investigationService";
import {
  addIncident,
  getIncidentById,
  updateIncident
} from "../../services/incidentStorage";
import "../../styles/dashboard.css";
import "../../styles/investigation.css";

const EMPTY_FORM = {
  investigationDate: "",
  investigator: "",
  teamMembers: "",
  method: "",
  verifiedChronology: "",
  findings: "",
  witnesses: "",
  evidenceDescription: "",
  immediateCause: "",
  rootCause: "",
  contributingFactor: "",
  fiveWhy: [],
  actions: [],
  updates: [],
  progress: 0,
  submittedAt: "",
  submittedBy: ""
};

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
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("id-ID");
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      });
}

function actionStatusToApi(value) {
  const normalized = String(value || "Open").toLowerCase();

  if (normalized === "completed") {
    return "COMPLETED";
  }

  if (normalized === "in progress") {
    return "IN_PROGRESS";
  }

  return "OPEN";
}

function buildPayload(form) {
  return {
    investigationDate: form.investigationDate || null,
    investigator: form.investigator || "",
    teamMembers: form.teamMembers || "",
    method: form.method || "",
    verifiedChronology: form.verifiedChronology || "",
    findings: form.findings || "",
    witnesses: form.witnesses || "",
    evidenceDescription: form.evidenceDescription || "",
    immediateCause: form.immediateCause || "",
    rootCause: form.rootCause || "",
    contributingFactor: form.contributingFactor || "",
    fiveWhy: (form.fiveWhy || []).map((item, index) => ({
      id: item.id || `why-${index + 1}`,
      question: item.question || `Mengapa ${index + 1}?`,
      answer: item.answer || ""
    })),
    actions: (form.actions || []).map((item) => ({
      id: item.id || null,
      action: item.action || "",
      pic: item.pic || "",
      targetDate: item.targetDate || null,
      status: actionStatusToApi(item.status),
      progress: Number(item.progress || 0),
      evidence: item.evidence || "",
      note: item.note || ""
    }))
  };
}

function toLegacyInvestigationCase(caseData) {
  const existing = getIncidentById(caseData.incidentCode);
  const legacyStatus = titleCaseEnum(caseData.status);
  const investigation = caseData.investigation || EMPTY_FORM;

  const legacyIncident = {
    ...(existing || {}),
    id: caseData.incidentCode,
    databaseId: caseData.id,
    reporter:
      caseData.reporter?.username || caseData.reporter?.fullName || "Unknown",
    date: caseData.incidentDate
      ? new Date(caseData.incidentDate).toISOString().slice(0, 10)
      : "",
    time: formatTime(caseData.incidentDate),
    location: caseData.location || "",
    estate: caseData.estate || "",
    department: caseData.department || "",
    type: caseData.type || "",
    severity: titleCaseEnum(caseData.severity),
    object: caseData.objectInvolved || "",
    description: caseData.description || "",
    unsafeAction: caseData.unsafeAction || "",
    sop:
      caseData.sopViolation === true
        ? "Yes"
        : caseData.sopViolation === false
          ? "No"
          : "",
    unsafeCondition: caseData.unsafeCondition || "",
    factor: caseData.contributingFactor || "",
    rootCauseCategory: caseData.rootCauseCategory || "",
    rootCause: caseData.initialRootCause || "",
    status: legacyStatus,
    approvedAt: caseData.approvedAt || "",
    investigation,
    timeline: caseData.timeline || [],
    managementReview: caseData.managementReview
      ? {
          status: titleCaseEnum(caseData.managementReview.status),
          note: caseData.managementReview.note || "",
          reviewedBy:
            caseData.managementReview.reviewedBy?.username || "",
          reviewedAt: caseData.managementReview.reviewedAt || ""
        }
      : existing?.managementReview
  };

  if (existing) {
    updateIncident(caseData.incidentCode, legacyIncident, {
      skipAudit: true
    });
  } else {
    addIncident(legacyIncident, {
      skipAudit: true
    });
  }
}

function InvestigationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();
  const operatorName = user?.username || user?.fullName || "Operator";
  const [incident, setIncident] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [updateNote, setUpdateNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const loadCase = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getInvestigationRequest(authFetch, id);
      const loadedCase = response?.data?.case || null;

      setIncident(loadedCase);
      setForm(loadedCase?.investigation || EMPTY_FORM);

      if (loadedCase) {
        toLegacyInvestigationCase(loadedCase);
      }
    } catch (requestError) {
      setIncident(null);
      setForm(EMPTY_FORM);
      setError(requestError.message || "Investigation gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, id]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const readOnly = useMemo(
    () => ["MANAGEMENT_REVIEW", "CLOSED"].includes(incident?.status),
    [incident?.status]
  );

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  function applyServerCase(caseData) {
    setIncident(caseData);
    setForm(caseData?.investigation || EMPTY_FORM);
    toLegacyInvestigationCase(caseData);
  }

  async function persistDraft({ showMessage = true } = {}) {
    if (!incident || readOnly) {
      return null;
    }

    const response = await saveInvestigationRequest(
      authFetch,
      incident.incidentCode || incident.id,
      buildPayload(form)
    );
    const updatedCase = response?.data?.case || null;

    if (updatedCase) {
      applyServerCase(updatedCase);
    }

    if (showMessage) {
      alert("Investigation draft saved successfully.");
    }

    return updatedCase;
  }

  async function saveDraft() {
    if (processing || readOnly) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      await persistDraft();
    } catch (requestError) {
      setError(requestError.message || "Investigation draft gagal disimpan.");
    } finally {
      setProcessing(false);
    }
  }

  async function moveToCorrectiveAction() {
    if (!incident || processing || incident.status !== "INVESTIGATION") {
      return;
    }

    if (!form.findings.trim()) {
      alert("Please complete the investigation findings.");
      return;
    }

    if (!form.rootCause.trim()) {
      alert("Please complete the root cause.");
      return;
    }

    if (form.actions.length === 0) {
      alert("Please add at least one corrective action.");
      return;
    }

    const incompleteAction = form.actions.some(
      (item) => !item.action.trim() || !item.pic.trim() || !item.targetDate
    );

    if (incompleteAction) {
      alert("Complete Action, PIC, and Target Completion for every action.");
      return;
    }

    const confirmed = window.confirm(
      "Move this investigation to Corrective Action?"
    );

    if (!confirmed) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await startCorrectiveActionRequest(
        authFetch,
        incident.incidentCode || incident.id,
        buildPayload(form)
      );
      const updatedCase = response?.data?.case || null;

      if (updatedCase) {
        applyServerCase(updatedCase);
      }

      alert("Case moved to Corrective Action.");
    } catch (requestError) {
      setError(requestError.message || "Corrective Action gagal dimulai.");
    } finally {
      setProcessing(false);
    }
  }

  async function addProgressUpdate() {
    if (!incident || processing || readOnly) {
      return;
    }

    if (!updateNote.trim()) {
      alert("Please enter the progress update note.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      await persistDraft({ showMessage: false });

      const response = await addInvestigationUpdateRequest(
        authFetch,
        incident.incidentCode || incident.id,
        {
          note: updateNote.trim()
        }
      );
      const updatedCase = response?.data?.case || null;

      if (updatedCase) {
        applyServerCase(updatedCase);
      }

      setUpdateNote("");
      alert("Progress update added.");
    } catch (requestError) {
      setError(requestError.message || "Progress update gagal ditambahkan.");
    } finally {
      setProcessing(false);
    }
  }

  async function submitToManagement() {
    if (!incident || processing || readOnly) {
      return;
    }

    if (!form.findings.trim() || !form.rootCause.trim()) {
      alert("Findings and Root Cause must be completed.");
      return;
    }

    if (form.actions.length === 0) {
      alert("At least one corrective action is required.");
      return;
    }

    const unfinishedAction = form.actions.some(
      (item) =>
        item.status !== "Completed" ||
        Number(item.progress) !== 100 ||
        !item.evidence.trim()
    );

    if (unfinishedAction) {
      alert(
        "All corrective actions must be Completed, reach 100%, and include evidence before submission."
      );
      return;
    }

    const confirmed = window.confirm(
      "Submit the final investigation report to Management?"
    );

    if (!confirmed) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await submitInvestigationToManagementRequest(
        authFetch,
        incident.incidentCode || incident.id,
        buildPayload(form)
      );
      const updatedCase = response?.data?.case || null;

      if (updatedCase) {
        applyServerCase(updatedCase);
      }

      alert("Final investigation report submitted to management.");
    } catch (requestError) {
      setError(
        requestError.message || "Final investigation report gagal dikirim."
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <h2>Loading Investigation...</h2>
        <p>Data source: PostgreSQL</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="dashboard-page">
        <h2>Investigation Not Found</h2>
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
        <button
          className="primary-action"
          onClick={() => navigate("/investigation-monitoring")}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="investigation-page">
      <div className="investigation-page-header">
        <div>
          <button
            type="button"
            className="back-link-button"
            onClick={() => navigate("/investigation-monitoring")}
          >
            ← Back to Monitoring
          </button>
          <h1>Investigation Case {incident.incidentCode}</h1>
          <p>
            Update findings, root cause, corrective actions, evidence, and final
            report.
          </p>
          <p>Data source: PostgreSQL</p>
        </div>

        <div className="investigation-header-status">
          <span>{titleCaseEnum(incident.status)}</span>
          <strong>{form.progress || 0}%</strong>
        </div>
      </div>

      {error ? (
        <div className="revision-alert">
          <strong>Unable to save the latest change</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {incident.status === "REVISION_REQUIRED" && (
        <div className="revision-alert">
          <strong>Revision Required by Management</strong>
          <p>{incident.managementReview?.note || "No review note provided."}</p>
        </div>
      )}

      {readOnly && (
        <div className="readonly-alert">
          This report is currently read-only because it has been submitted to
          management or already closed.
        </div>
      )}

      <div className="investigation-card">
        <h2 className="investigation-title">Incident Summary</h2>
        <div className="review-summary-grid incident-summary-review-grid">
          <div>
            <span>Reporter</span>
            <strong>
              {incident.reporter?.fullName ||
                incident.reporter?.username ||
                "-"}
            </strong>
          </div>
          <div>
            <span>Date & Time</span>
            <strong>
              {formatDate(incident.incidentDate)} {formatTime(incident.incidentDate)}
            </strong>
          </div>
          <div>
            <span>Type</span>
            <strong>{incident.type || "-"}</strong>
          </div>
          <div>
            <span>Severity</span>
            <strong>{titleCaseEnum(incident.severity)}</strong>
          </div>
          <div>
            <span>Location</span>
            <strong>{incident.location || "-"}</strong>
          </div>
          <div>
            <span>Department</span>
            <strong>{incident.department || "-"}</strong>
          </div>
        </div>

        <div className="incident-description-box">
          <span>Incident Description</span>
          <p>{incident.description || "-"}</p>
        </div>
      </div>

      <div className="investigation-card">
        <h2 className="investigation-title">Investigation Information</h2>

        <div className="investigation-form-grid">
          <div>
            <label>Investigation Date</label>
            <input
              type="date"
              value={form.investigationDate || ""}
              disabled={readOnly || processing}
              onChange={(event) =>
                updateField("investigationDate", event.target.value)
              }
            />
          </div>

          <div>
            <label>Lead Investigator</label>
            <input
              value={form.investigator || operatorName}
              disabled={readOnly || processing}
              onChange={(event) =>
                updateField("investigator", event.target.value)
              }
            />
          </div>

          <div>
            <label>Investigation Team</label>
            <input
              value={form.teamMembers || ""}
              disabled={readOnly || processing}
              onChange={(event) =>
                updateField("teamMembers", event.target.value)
              }
              placeholder="Names or departments"
            />
          </div>

          <div>
            <label>Investigation Method</label>
            <input
              value={form.method || ""}
              disabled={readOnly || processing}
              onChange={(event) => updateField("method", event.target.value)}
              placeholder="Interview, observation, document review..."
            />
          </div>

          <div className="field-span-2">
            <label>Verified Chronology</label>
            <textarea
              value={form.verifiedChronology || ""}
              disabled={readOnly || processing}
              onChange={(event) =>
                updateField("verifiedChronology", event.target.value)
              }
              placeholder="Chronology after investigation and verification"
            />
          </div>

          <div className="field-span-2">
            <label>Investigation Findings *</label>
            <textarea
              value={form.findings || ""}
              disabled={readOnly || processing}
              onChange={(event) => updateField("findings", event.target.value)}
              placeholder="Main findings from field investigation"
            />
          </div>

          <div>
            <label>Witnesses Interviewed</label>
            <textarea
              value={form.witnesses || ""}
              disabled={readOnly || processing}
              onChange={(event) => updateField("witnesses", event.target.value)}
            />
          </div>

          <div>
            <label>Evidence Description</label>
            <textarea
              value={form.evidenceDescription || ""}
              disabled={readOnly || processing}
              onChange={(event) =>
                updateField("evidenceDescription", event.target.value)
              }
              placeholder="Photos, documents, CCTV, interviews, etc."
            />
          </div>
        </div>
      </div>

      <div className="investigation-card">
        <h2 className="investigation-title">Root Cause Analysis</h2>

        <div className="investigation-form-grid">
          <div>
            <label>Immediate Cause</label>
            <textarea
              value={form.immediateCause || ""}
              disabled={readOnly || processing}
              onChange={(event) =>
                updateField("immediateCause", event.target.value)
              }
            />
          </div>

          <div>
            <label>Contributing Factor</label>
            <textarea
              value={form.contributingFactor || ""}
              disabled={readOnly || processing}
              onChange={(event) =>
                updateField("contributingFactor", event.target.value)
              }
            />
          </div>

          <div className="field-span-2">
            <label>Final Root Cause *</label>
            <textarea
              value={form.rootCause || ""}
              disabled={readOnly || processing}
              onChange={(event) => updateField("rootCause", event.target.value)}
            />
          </div>
        </div>
      </div>

      <FiveWhy
        items={form.fiveWhy || []}
        onChange={(items) => updateField("fiveWhy", items)}
        readOnly={readOnly || processing}
      />

      <ActionPlan
        actions={form.actions || []}
        onChange={(actions) => updateField("actions", actions)}
        readOnly={readOnly || processing}
      />

      <div className="investigation-card">
        <h2 className="investigation-title">Progress Updates</h2>

        {!readOnly && (
          <div className="progress-update-form">
            <textarea
              value={updateNote}
              disabled={processing}
              onChange={(event) => setUpdateNote(event.target.value)}
              placeholder="Write the latest investigation or corrective action progress..."
            />
            <button
              type="button"
              disabled={processing}
              onClick={addProgressUpdate}
            >
              Add Update
            </button>
          </div>
        )}

        {(form.updates || []).length === 0 ? (
          <div className="empty-investigation-state">
            No progress update recorded.
          </div>
        ) : (
          <div className="progress-update-list">
            {[...(form.updates || [])].reverse().map((item) => (
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

      {!readOnly && (
        <div className="investigation-sticky-actions">
          <button
            type="button"
            className="save-draft-button"
            disabled={processing}
            onClick={saveDraft}
          >
            {processing ? "Processing..." : "Save Draft"}
          </button>

          {incident.status === "INVESTIGATION" && (
            <button
              type="button"
              className="corrective-action-button"
              disabled={processing}
              onClick={moveToCorrectiveAction}
            >
              Start Corrective Action
            </button>
          )}

          {["CORRECTIVE_ACTION", "REVISION_REQUIRED"].includes(
            incident.status
          ) && (
            <button
              type="button"
              className="submit-management-button"
              disabled={processing}
              onClick={submitToManagement}
            >
              Submit Final Report to Management
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default InvestigationDetail;
