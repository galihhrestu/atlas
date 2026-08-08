const STORAGE_KEY = "auditTrail";
const MAX_LOGS = 2000;

const SENSITIVE_KEYS = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret"
];

function readAuditStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to read audit trail:", error);
    return [];
  }
}

function isSensitiveKey(key = "") {
  return SENSITIVE_KEYS.some(
    (item) => String(key).toLowerCase() === item.toLowerCase()
  );
}

function sanitizeValue(value, key = "") {
  if (isSensitiveKey(key)) {
    return "[REDACTED]";
  }

  if (value === null || value === undefined) {
    return value ?? null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([itemKey, itemValue]) => [
        itemKey,
        sanitizeValue(itemValue, itemKey)
      ])
    );
  }

  return value;
}

function valuesEqual(first, second) {
  try {
    return JSON.stringify(first) === JSON.stringify(second);
  } catch {
    return first === second;
  }
}

function collectChangedFields(
  previousValue,
  newValue,
  path = "",
  depth = 0
) {
  if (valuesEqual(previousValue, newValue)) {
    return [];
  }

  if (depth >= 4) {
    return [path || "record"];
  }

  const previousIsObject =
    previousValue &&
    typeof previousValue === "object" &&
    !Array.isArray(previousValue);

  const newIsObject =
    newValue &&
    typeof newValue === "object" &&
    !Array.isArray(newValue);

  if (previousIsObject && newIsObject) {
    const keys = new Set([
      ...Object.keys(previousValue),
      ...Object.keys(newValue)
    ]);

    return [...keys].flatMap((key) => {
      const childPath = path ? `${path}.${key}` : key;

      return collectChangedFields(
        previousValue[key],
        newValue[key],
        childPath,
        depth + 1
      );
    });
  }

  return [path || "record"];
}

function getCurrentActor(explicitActor, explicitRole) {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  return {
    actor: explicitActor || user?.username || "System",
    role: explicitRole || user?.role || "system"
  };
}

export function getAuditLogs() {
  return readAuditStorage();
}

export function getAuditLogById(id) {
  return getAuditLogs().find(
    (item) => String(item.id) === String(id)
  );
}

export function logAudit({
  module = "System",
  action = "UPDATE",
  recordId = "",
  description = "",
  previousValue = null,
  newValue = null,
  metadata = {},
  actor,
  role
} = {}) {
  const now = new Date();
  const identity = getCurrentActor(actor, role);

  const safePreviousValue = sanitizeValue(previousValue);
  const safeNewValue = sanitizeValue(newValue);
  const safeMetadata = sanitizeValue(metadata);

  const logEntry = {
    id: `AUD-${now.getTime()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    timestamp: now.toISOString(),
    date: now.toLocaleDateString("id-ID"),
    time: now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }),
    actor: identity.actor,
    role: identity.role,
    module,
    action,
    recordId: recordId ? String(recordId) : "",
    description:
      description ||
      `${identity.actor} performed ${action} in ${module}.`,
    changedFields: collectChangedFields(
      safePreviousValue,
      safeNewValue
    ),
    previousValue: safePreviousValue,
    newValue: safeNewValue,
    metadata: safeMetadata
  };

  const logs = [logEntry, ...readAuditStorage()].slice(
    0,
    MAX_LOGS
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to save complete audit trail:", error);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(logs.slice(0, 500))
      );
    } catch (fallbackError) {
      console.error(
        "Failed to save reduced audit trail:",
        fallbackError
      );
    }
  }

  return logEntry;
}

export function exportAuditLogsToCsv(logs = getAuditLogs()) {
  const headers = [
    "Timestamp",
    "Actor",
    "Role",
    "Module",
    "Action",
    "Record ID",
    "Description",
    "Changed Fields"
  ];

  const escapeCsv = (value) => {
    const text = String(value ?? "").replaceAll('"', '""');
    return `"${text}"`;
  };

  const rows = logs.map((item) => [
    item.timestamp,
    item.actor,
    item.role,
    item.module,
    item.action,
    item.recordId,
    item.description,
    (item.changedFields || []).join(", ")
  ]);

  return [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(","))
  ].join("\n");
}
