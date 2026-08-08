import { logAudit } from "./auditTrail";

const STORAGE_KEY = "incidents";

function readStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to read incident storage:", error);
    return [];
  }
}

function pickChangedValues(source = {}, keys = []) {
  return Object.fromEntries(
    keys.map((key) => [key, source?.[key]])
  );
}

// Ambil semua incident.
export function getIncidents() {
  return readStorage();
}

// Ambil satu incident berdasarkan ID.
export function getIncidentById(id) {
  return getIncidents().find(
    (item) => String(item.id) === String(id)
  );
}

// Simpan semua incident.
export function saveIncidents(data) {
  const safeData = Array.isArray(data) ? data : [];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(safeData)
  );

  return safeData;
}

// Tambah incident baru tanpa membuang struktur lama.
export function addIncident(incident, auditOptions = {}) {
  const oldData = getIncidents();
  const newData = [...oldData, incident];

  saveIncidents(newData);

  if (!auditOptions.skipAudit) {
    logAudit({
      module: auditOptions.module || "Incident",
      action: auditOptions.action || "CREATE",
      recordId: incident.id,
      description:
        auditOptions.description ||
        `Incident ${incident.id} was created.`,
      previousValue: null,
      newValue: auditOptions.newValue || incident,
      metadata: auditOptions.metadata || {}
    });
  }

  return newData;
}

// Update incident tanpa membuang field lama.
// Parameter auditOptions bersifat opsional agar pemanggilan lama tetap berjalan.
export function updateIncident(id, changes, auditOptions = {}) {
  const oldData = getIncidents();
  let previousIncident = null;
  let updatedIncident = null;

  const updated = oldData.map((item) => {
    if (String(item.id) === String(id)) {
      previousIncident = item;
      updatedIncident = {
        ...item,
        ...changes
      };

      return updatedIncident;
    }

    return item;
  });

  saveIncidents(updated);

  if (
    previousIncident &&
    updatedIncident &&
    !auditOptions.skipAudit
  ) {
    const changedKeys = Object.keys(changes || {});

    logAudit({
      module: auditOptions.module || "Incident",
      action: auditOptions.action || "UPDATE",
      recordId: id,
      description:
        auditOptions.description ||
        `Incident ${id} was updated.`,
      previousValue:
        auditOptions.previousValue ??
        pickChangedValues(previousIncident, changedKeys),
      newValue:
        auditOptions.newValue ??
        pickChangedValues(updatedIncident, changedKeys),
      metadata: {
        changedKeys,
        ...(auditOptions.metadata || {})
      }
    });
  }

  return updated;
}

// Tambahkan satu event ke timeline incident.
export function appendTimeline(incident, step, extra = {}) {
  const now = new Date();

  return [
    ...(incident.timeline || []),
    {
      step,
      date: now.toLocaleDateString("id-ID"),
      time: now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      }),
      createdAt: now.toISOString(),
      ...extra
    }
  ];
}

// Bentuk awal data investigasi.
export function createEmptyInvestigation(
  incident = {},
  operatorName = "Operator"
) {
  const legacyActions = [];

  if (incident.actionPlan || incident.pic || incident.target) {
    legacyActions.push({
      id: `action-${Date.now()}`,
      action: incident.actionPlan || "",
      pic: incident.pic || "",
      targetDate: incident.target || "",
      status: "Open",
      progress: 0,
      evidence: "",
      note: ""
    });
  }

  return {
    startedAt: new Date().toISOString(),
    startedBy: operatorName,
    investigationDate: "",
    investigator: operatorName,
    teamMembers: "",
    method: "",
    verifiedChronology: "",
    findings: "",
    witnesses: "",
    evidenceDescription: "",
    immediateCause: "",
    rootCause: incident.rootCause || "",
    contributingFactor: incident.factor || "",
    fiveWhy: Array.from({ length: 5 }, (_, index) => ({
      id: `why-${Date.now()}-${index}`,
      question: `Mengapa ${index + 1}?`,
      answer: ""
    })),
    actions: legacyActions,
    updates: [],
    progress: 0,
    submittedAt: "",
    submittedBy: ""
  };
}

// Pastikan incident lama tetap dapat digunakan oleh modul investigasi baru.
export function normalizeInvestigation(
  incident = {},
  operatorName = "Operator"
) {
  const empty = createEmptyInvestigation(
    incident,
    operatorName
  );
  const existing = incident.investigation || {};

  const existingActions =
    existing.actions ||
    existing.correctiveAction ||
    empty.actions;

  const normalizedActions = (existingActions || []).map(
    (item, index) => ({
      id: item.id || `action-${Date.now()}-${index}`,
      action: item.action || "",
      pic: item.pic || "",
      targetDate: item.targetDate || item.target || "",
      status: item.status || "Open",
      progress:
        typeof item.progress === "number"
          ? item.progress
          : item.status === "Completed"
            ? 100
            : 0,
      evidence: item.evidence || "",
      note: item.note || ""
    })
  );

  const existingFiveWhy = existing.fiveWhy || [];
  const fiveWhy = Array.from({ length: 5 }, (_, index) => ({
    id:
      existingFiveWhy[index]?.id ||
      `why-${Date.now()}-${index}`,
    question:
      existingFiveWhy[index]?.question ||
      `Mengapa ${index + 1}?`,
    answer: existingFiveWhy[index]?.answer || ""
  }));

  return {
    ...empty,
    ...existing,
    rootCause:
      existing.rootCause ||
      incident.rootCause ||
      "",
    contributingFactor:
      existing.contributingFactor ||
      incident.factor ||
      "",
    fiveWhy,
    actions: normalizedActions,
    updates: existing.updates || []
  };
}
