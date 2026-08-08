const OPEN_STATUSES = [
  "Pending",
  "Investigation",
  "Corrective Action",
  "Revision Required",
  "Management Review"
];

const HIGH_RISK_LEVELS = ["High", "Critical"];

const SEVERITY_ORDER = ["Critical", "High", "Medium", "Low"];

const ROOT_CAUSE_ALIAS_RULES = [
  {
    label: "Lalai terhadap safety",
    keywords: [
      "lalai terhadap safety",
      "mengabaikan safety",
      "mengabaikan keselamatan",
      "kurang peduli keselamatan",
      "tidak memperhatikan safety"
    ]
  },
  {
    label: "Tidak menggunakan APD",
    keywords: [
      "tidak menggunakan apd",
      "tidak pakai apd",
      "tanpa apd",
      "not using ppe"
    ]
  },
  {
    label: "SOP tidak dipatuhi",
    keywords: [
      "sop tidak dipatuhi",
      "tidak mematuhi sop",
      "pelanggaran sop",
      "sop violation"
    ]
  },
  {
    label: "Geografis / kondisi medan",
    keywords: ["geografis", "kondisi medan", "terrain"]
  },
  {
    label: "Kondisi jalan",
    keywords: ["kondisi jalan", "jalan rusak", "road condition"]
  },
  {
    label: "Kurang pelatihan",
    keywords: ["kurang pelatihan", "belum dilatih", "training kurang"]
  },
  {
    label: "Pengawasan kurang",
    keywords: ["pengawasan kurang", "kurang pengawasan", "supervisi kurang"]
  }
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ");

  if (["", "-", "select", "unknown", "n a", "na"].includes(normalized)) {
    return "";
  }

  return normalized;
}

export function displayText(value, fallback = "Unclassified") {
  const text = String(value || "").trim();

  if (!normalizeText(text)) {
    return fallback;
  }

  return text;
}

export function parseIncidentDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfDay(date) {
  if (!date) {
    return null;
  }

  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function differenceInDays(later, earlier) {
  if (!later || !earlier) {
    return null;
  }

  const milliseconds = startOfDay(later) - startOfDay(earlier);
  return Math.max(0, Math.round(milliseconds / 86400000));
}

function getIncidentStartDate(incident) {
  return (
    parseIncidentDate(incident.createdAt) ||
    parseIncidentDate(incident.approvedAt) ||
    parseIncidentDate(incident.date)
  );
}

function getInvestigationStartDate(incident) {
  return (
    parseIncidentDate(incident.investigation?.startedAt) ||
    parseIncidentDate(incident.approvedAt) ||
    getIncidentStartDate(incident)
  );
}

function getIncidentClosedDate(incident) {
  return (
    parseIncidentDate(incident.closedAt) ||
    parseIncidentDate(incident.investigation?.submittedAt)
  );
}

export function getIncidentActions(incident) {
  const investigationActions =
    incident.investigation?.actions ||
    incident.investigation?.correctiveAction ||
    [];

  if (safeArray(investigationActions).length > 0) {
    return safeArray(investigationActions).map((action, index) => ({
      id: action.id || `${incident.id}-action-${index}`,
      incidentId: incident.id,
      incidentDate: incident.date,
      action: action.action || "",
      pic: action.pic || "",
      targetDate: action.targetDate || action.target || "",
      status: action.status || "Open",
      progress:
        typeof action.progress === "number"
          ? action.progress
          : action.status === "Completed"
            ? 100
            : 0,
      evidence: action.evidence || "",
      note: action.note || ""
    }));
  }

  if (incident.actionPlan || incident.pic || incident.target) {
    return [
      {
        id: `${incident.id}-legacy-action`,
        incidentId: incident.id,
        incidentDate: incident.date,
        action: incident.actionPlan || "",
        pic: incident.pic || "",
        targetDate: incident.target || "",
        status:
          incident.correctiveStatus ||
          (incident.status === "Closed" ? "Completed" : "Open"),
        progress: incident.status === "Closed" ? 100 : 0,
        evidence: "",
        note: ""
      }
    ];
  }

  return [];
}

export function isActionOverdue(action, referenceDate = new Date()) {
  if (!action.targetDate || action.status === "Completed") {
    return false;
  }

  const targetDate = parseIncidentDate(action.targetDate);

  if (!targetDate) {
    return false;
  }

  return startOfDay(targetDate) < startOfDay(referenceDate);
}

function getRootCause(incident) {
  return (
    incident.investigation?.rootCause ||
    incident.rootCause ||
    incident.investigation?.immediateCause ||
    incident.unsafeCondition ||
    incident.unsafeAction ||
    incident.factor ||
    ""
  );
}

function classifyLegacyRootCause(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  const matchedRule = ROOT_CAUSE_ALIAS_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))
  );

  return matchedRule?.label || displayText(value);
}

function getRootCauseCategory(incident) {
  const explicitCategory =
    incident.investigation?.rootCauseCategory || incident.rootCauseCategory;

  if (normalizeText(explicitCategory)) {
    return displayText(explicitCategory);
  }

  return classifyLegacyRootCause(getRootCause(incident));
}

function getEstate(incident) {
  return displayText(incident.estate || incident.location, "Unclassified");
}

function getRepeatKeys(incident) {
  const type = normalizeText(incident.type || incident.category);
  const location = normalizeText(incident.location);
  const department = normalizeText(incident.department);
  const rootCauseCategory = getRootCauseCategory(incident);
  const rootCause = normalizeText(rootCauseCategory);
  const unsafeAction = normalizeText(incident.unsafeAction);
  const unsafeCondition = normalizeText(incident.unsafeCondition);

  const keys = [];

  if (type && location) {
    keys.push({
      key: `type-location:${type}|${location}`,
      label: `${displayText(incident.type || incident.category)} at ${displayText(
        incident.location
      )}`,
      dimension: "Type + Location"
    });
  }

  if (type && department) {
    keys.push({
      key: `type-department:${type}|${department}`,
      label: `${displayText(
        incident.type || incident.category
      )} in ${displayText(incident.department)}`,
      dimension: "Type + Department"
    });
  }

  if (rootCause) {
    keys.push({
      key: `root-cause:${rootCause}`,
      label: displayText(rootCauseCategory),
      dimension: "Root Cause"
    });
  }

  if (unsafeAction && location) {
    keys.push({
      key: `unsafe-action:${unsafeAction}|${location}`,
      label: `${displayText(incident.unsafeAction)} at ${displayText(
        incident.location
      )}`,
      dimension: "Unsafe Action + Location"
    });
  }

  if (unsafeCondition && location) {
    keys.push({
      key: `unsafe-condition:${unsafeCondition}|${location}`,
      label: `${displayText(incident.unsafeCondition)} at ${displayText(
        incident.location
      )}`,
      dimension: "Unsafe Condition + Location"
    });
  }

  return keys;
}

function buildRepeatAnalysis(incidents) {
  const patternMap = new Map();

  incidents.forEach((incident) => {
    getRepeatKeys(incident).forEach((pattern) => {
      if (!patternMap.has(pattern.key)) {
        patternMap.set(pattern.key, {
          ...pattern,
          incidentIds: [],
          dates: [],
          severity: []
        });
      }

      const item = patternMap.get(pattern.key);
      item.incidentIds.push(String(incident.id));
      item.dates.push(incident.date || "");
      item.severity.push(incident.severity || "Low");
    });
  });

  const patterns = [...patternMap.values()]
    .filter((pattern) => new Set(pattern.incidentIds).size >= 2)
    .map((pattern) => ({
      ...pattern,
      count: new Set(pattern.incidentIds).size,
      incidentIds: [...new Set(pattern.incidentIds)],
      highRiskCount: pattern.severity.filter((level) =>
        HIGH_RISK_LEVELS.includes(level)
      ).length
    }))
    .sort((first, second) => {
      if (second.count !== first.count) {
        return second.count - first.count;
      }

      return second.highRiskCount - first.highRiskCount;
    });

  const repeatedIncidentIds = new Set();

  patterns.forEach((pattern) => {
    pattern.incidentIds.forEach((id) => repeatedIncidentIds.add(id));
  });

  return {
    patterns,
    repeatedIncidentIds,
    repeatIncidentCount: repeatedIncidentIds.size,
    repeatIncidentRate:
      incidents.length > 0
        ? Math.round((repeatedIncidentIds.size / incidents.length) * 100)
        : 0
  };
}

function buildMonthlyTrend(incidents, repeatedIncidentIds) {
  const monthMap = new Map();

  incidents.forEach((incident) => {
    const date = parseIncidentDate(incident.date || incident.createdAt);
    const key = date
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      : "Unknown";

    if (!monthMap.has(key)) {
      monthMap.set(key, {
        month: key,
        total: 0,
        highRisk: 0,
        repeated: 0,
        closed: 0
      });
    }

    const item = monthMap.get(key);
    item.total += 1;

    if (HIGH_RISK_LEVELS.includes(incident.severity)) {
      item.highRisk += 1;
    }

    if (repeatedIncidentIds.has(String(incident.id))) {
      item.repeated += 1;
    }

    if (incident.status === "Closed") {
      item.closed += 1;
    }
  });

  return [...monthMap.values()].sort((first, second) => {
    if (first.month === "Unknown") {
      return 1;
    }

    if (second.month === "Unknown") {
      return -1;
    }

    return first.month.localeCompare(second.month);
  });
}

function buildSeverityData(incidents) {
  return SEVERITY_ORDER.map((name) => ({
    name,
    total: incidents.filter((incident) => incident.severity === name).length
  }));
}

function buildStatusData(incidents) {
  const statusMap = new Map();

  incidents.forEach((incident) => {
    const status = displayText(incident.status, "Unknown");
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  return [...statusMap.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((first, second) => second.total - first.total);
}

function buildRootCausePareto(incidents) {
  const causeMap = new Map();

  incidents.forEach((incident) => {
    const rawCause = getRootCauseCategory(incident);
    const key = normalizeText(rawCause) || "unclassified";
    const label = displayText(rawCause);

    if (!causeMap.has(key)) {
      causeMap.set(key, { name: label, total: 0 });
    }

    causeMap.get(key).total += 1;
  });

  const sorted = [...causeMap.values()].sort(
    (first, second) => second.total - first.total
  );
  const totalCount = sorted.reduce((sum, item) => sum + item.total, 0);
  let cumulative = 0;

  return sorted.slice(0, 8).map((item) => {
    cumulative += item.total;

    return {
      ...item,
      cumulativePercentage:
        totalCount > 0 ? Math.round((cumulative / totalCount) * 100) : 0
    };
  });
}

function buildHotspotData(incidents, field) {
  const hotspotMap = new Map();

  incidents.forEach((incident) => {
    const rawValue = incident[field];
    const key = normalizeText(rawValue) || "unclassified";
    const label = displayText(rawValue);

    if (!hotspotMap.has(key)) {
      hotspotMap.set(key, {
        name: label,
        total: 0,
        highRisk: 0,
        repeated: 0
      });
    }

    const item = hotspotMap.get(key);
    item.total += 1;

    if (HIGH_RISK_LEVELS.includes(incident.severity)) {
      item.highRisk += 1;
    }
  });

  return [...hotspotMap.values()]
    .sort((first, second) => {
      if (second.total !== first.total) {
        return second.total - first.total;
      }

      return second.highRisk - first.highRisk;
    })
    .slice(0, 8);
}

function buildRiskHeatmap(incidents) {
  const departmentMap = new Map();

  incidents.forEach((incident) => {
    const department = displayText(incident.department);

    if (!departmentMap.has(department)) {
      departmentMap.set(department, {
        department,
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        total: 0
      });
    }

    const item = departmentMap.get(department);
    const severity = SEVERITY_ORDER.includes(incident.severity)
      ? incident.severity
      : "Low";

    item[severity] += 1;
    item.total += 1;
  });

  return [...departmentMap.values()]
    .sort((first, second) => second.total - first.total)
    .slice(0, 8);
}

function buildAgingData(incidents, referenceDate = new Date()) {
  const buckets = [
    { name: "0–7 days", total: 0 },
    { name: "8–14 days", total: 0 },
    { name: "15–30 days", total: 0 },
    { name: ">30 days", total: 0 }
  ];

  const openCases = incidents.filter(
    (incident) => OPEN_STATUSES.includes(incident.status) && incident.status !== "Pending"
  );

  const ages = [];

  openCases.forEach((incident) => {
    const startDate = getInvestigationStartDate(incident);
    const age = differenceInDays(referenceDate, startDate);

    if (age === null) {
      return;
    }

    ages.push({ incident, age });

    if (age <= 7) {
      buckets[0].total += 1;
    } else if (age <= 14) {
      buckets[1].total += 1;
    } else if (age <= 30) {
      buckets[2].total += 1;
    } else {
      buckets[3].total += 1;
    }
  });

  return {
    buckets,
    cases: ages.sort((first, second) => second.age - first.age),
    averageAge:
      ages.length > 0
        ? Math.round(ages.reduce((sum, item) => sum + item.age, 0) / ages.length)
        : 0,
    agedOver14: ages.filter((item) => item.age > 14).length,
    agedOver30: ages.filter((item) => item.age > 30).length
  };
}

function buildActionAnalysis(incidents, repeatAnalysis, referenceDate = new Date()) {
  const allActions = incidents.flatMap((incident) =>
    getIncidentActions(incident).map((action) => ({ action, incident }))
  );

  const overdueActions = allActions.filter(({ action }) =>
    isActionOverdue(action, referenceDate)
  );
  const completedActions = allActions.filter(
    ({ action }) =>
      action.status === "Completed" || Number(action.progress) === 100
  );
  const completedWithEvidence = completedActions.filter(({ action }) =>
    normalizeText(action.evidence)
  );
  const missingEvidence = completedActions.filter(
    ({ action }) => !normalizeText(action.evidence)
  );

  const actionMap = new Map();

  allActions.forEach(({ action, incident }) => {
    const key = normalizeText(action.action) || "unclassified action";
    const label = displayText(action.action, "Unclassified action");

    if (!actionMap.has(key)) {
      actionMap.set(key, {
        action: label,
        uses: 0,
        completed: 0,
        overdue: 0,
        withEvidence: 0,
        incidentIds: [],
        repeatedCases: 0
      });
    }

    const item = actionMap.get(key);
    item.uses += 1;
    item.incidentIds.push(String(incident.id));

    if (action.status === "Completed" || Number(action.progress) === 100) {
      item.completed += 1;
    }

    if (isActionOverdue(action, referenceDate)) {
      item.overdue += 1;
    }

    if (normalizeText(action.evidence)) {
      item.withEvidence += 1;
    }

    if (repeatAnalysis.repeatedIncidentIds.has(String(incident.id))) {
      item.repeatedCases += 1;
    }
  });

  const actionEffectiveness = [...actionMap.values()]
    .map((item) => {
      let status = "Monitoring";
      let concern = "Action requires more post-completion observation.";

      if (item.overdue > 0) {
        status = "Overdue";
        concern = `${item.overdue} action implementation(s) passed the target date.`;
      } else if (item.completed > 0 && item.withEvidence < item.completed) {
        status = "No Evidence";
        concern = `${item.completed - item.withEvidence} completed implementation(s) have no evidence.`;
      } else if (item.uses >= 2 && item.repeatedCases >= 2) {
        status = "Potentially Ineffective";
        concern = "The same control is repeatedly used in recurring incident patterns.";
      } else if (item.completed === item.uses && item.uses > 0) {
        status = "Completed";
        concern = "Implementation completed; continue recurrence monitoring.";
      }

      return {
        ...item,
        incidentIds: [...new Set(item.incidentIds)],
        status,
        concern
      };
    })
    .sort((first, second) => {
      const riskOrder = {
        "Potentially Ineffective": 4,
        Overdue: 3,
        "No Evidence": 2,
        Monitoring: 1,
        Completed: 0
      };

      if (riskOrder[second.status] !== riskOrder[first.status]) {
        return riskOrder[second.status] - riskOrder[first.status];
      }

      return second.uses - first.uses;
    });

  return {
    allActions,
    overdueActions,
    completedActions,
    completedWithEvidence,
    missingEvidence,
    actionEffectiveness,
    completionRate:
      allActions.length > 0
        ? Math.round((completedActions.length / allActions.length) * 100)
        : 0,
    evidenceRate:
      completedActions.length > 0
        ? Math.round(
            (completedWithEvidence.length / completedActions.length) * 100
          )
        : 0
  };
}

function buildClosureMetrics(incidents) {
  const closedCases = incidents
    .filter((incident) => incident.status === "Closed")
    .map((incident) => {
      const startedAt = getIncidentStartDate(incident);
      const closedAt = getIncidentClosedDate(incident);
      const days = differenceInDays(closedAt, startedAt);

      return { incident, days };
    })
    .filter((item) => item.days !== null);

  return {
    closedCases,
    averageClosureDays:
      closedCases.length > 0
        ? Math.round(
            closedCases.reduce((sum, item) => sum + item.days, 0) /
              closedCases.length
          )
        : 0
  };
}

function buildDataQuality(incidents, actions) {
  const total = incidents.length;
  const withRootCause = incidents.filter((incident) =>
    normalizeText(getRootCauseCategory(incident))
  ).length;
  const withAction = incidents.filter(
    (incident) => getIncidentActions(incident).length > 0
  ).length;
  const closed = incidents.filter((incident) => incident.status === "Closed");
  const closedWithEvidence = closed.filter((incident) =>
    getIncidentActions(incident).some((action) => normalizeText(action.evidence))
  ).length;

  return {
    sampleSize: total,
    rootCauseCoverage:
      total > 0 ? Math.round((withRootCause / total) * 100) : 0,
    actionCoverage: total > 0 ? Math.round((withAction / total) * 100) : 0,
    closedEvidenceCoverage:
      closed.length > 0 ? Math.round((closedWithEvidence / closed.length) * 100) : 0,
    actionRecords: actions.length,
    confidence:
      total >= 20 ? "Strong" : total >= 5 ? "Developing" : "Limited"
  };
}

function buildInsights({
  incidents,
  repeatAnalysis,
  actionAnalysis,
  aging,
  locationHotspots,
  departmentHotspots,
  highRiskOpen,
  managementReviewCount,
  dataQuality
}) {
  const insights = [];
  const topRepeat = repeatAnalysis.patterns[0];
  const topLocation = locationHotspots[0];
  const topDepartment = departmentHotspots[0];
  const ineffectiveAction = actionAnalysis.actionEffectiveness.find(
    (item) => item.status === "Potentially Ineffective"
  );

  if (topRepeat) {
    insights.push({
      level: topRepeat.highRiskCount > 0 ? "critical" : "warning",
      title: "Recurring pattern detected",
      description: `${topRepeat.label} appears in ${topRepeat.count} incidents. Review whether the existing control addresses the underlying cause, not only worker behavior.`,
      metric: `${topRepeat.count} cases`
    });
  }

  if (ineffectiveAction) {
    insights.push({
      level: "critical",
      title: "Repeated corrective action",
      description: `${ineffectiveAction.action} has been used ${ineffectiveAction.uses} times and is associated with recurring cases. Consider a stronger engineering or system control.`,
      metric: `${ineffectiveAction.uses} uses`
    });
  }

  if (actionAnalysis.overdueActions.length > 0) {
    insights.push({
      level: "critical",
      title: "Corrective action delay",
      description: `${actionAnalysis.overdueActions.length} action(s) have passed their target date and require PIC escalation.`,
      metric: `${actionAnalysis.overdueActions.length} overdue`
    });
  }

  if (aging.agedOver14 > 0) {
    insights.push({
      level: aging.agedOver30 > 0 ? "critical" : "warning",
      title: "Investigation aging",
      description: `${aging.agedOver14} active case(s) have remained open for more than 14 days.`,
      metric: `${aging.averageAge} day avg.`
    });
  }

  if (highRiskOpen > 0) {
    insights.push({
      level: "critical",
      title: "High-risk exposure remains open",
      description: `${highRiskOpen} High/Critical incident(s) are not yet closed. Prioritize control verification and management oversight.`,
      metric: `${highRiskOpen} open`
    });
  }

  if (topLocation && topLocation.total > 1) {
    insights.push({
      level: topLocation.highRisk > 0 ? "warning" : "information",
      title: "Location hotspot",
      description: `${topLocation.name} records the highest incident concentration with ${topLocation.total} case(s), including ${topLocation.highRisk} High/Critical case(s).`,
      metric: `${topLocation.total} cases`
    });
  } else if (topDepartment && topDepartment.total > 1) {
    insights.push({
      level: topDepartment.highRisk > 0 ? "warning" : "information",
      title: "Department hotspot",
      description: `${topDepartment.name} has the highest incident concentration with ${topDepartment.total} case(s).`,
      metric: `${topDepartment.total} cases`
    });
  }

  if (actionAnalysis.missingEvidence.length > 0) {
    insights.push({
      level: "warning",
      title: "Evidence control gap",
      description: `${actionAnalysis.missingEvidence.length} completed action(s) do not contain implementation evidence.`,
      metric: `${actionAnalysis.evidenceRate}% evidenced`
    });
  }

  if (managementReviewCount > 0) {
    insights.push({
      level: "information",
      title: "Management decision required",
      description: `${managementReviewCount} final investigation report(s) are waiting for management review.`,
      metric: `${managementReviewCount} review`
    });
  }

  if (incidents.length < 5) {
    insights.push({
      level: "information",
      title: "Limited analytical baseline",
      description: `Only ${incidents.length} incident record(s) are available. Patterns are directional and should not yet be treated as statistically stable.`,
      metric: dataQuality.confidence
    });
  }

  if (insights.length === 0) {
    insights.push({
      level: "positive",
      title: "No immediate systemic warning",
      description: "No repeat, overdue, or high-risk open pattern was detected in the selected data.",
      metric: "Monitor"
    });
  }

  return insights.slice(0, 8);
}

function buildPriorityActions({
  repeatAnalysis,
  actionAnalysis,
  aging,
  highRiskOpen,
  managementReviewCount
}) {
  const priorities = [];

  repeatAnalysis.patterns.slice(0, 3).forEach((pattern) => {
    priorities.push({
      score: 70 + Math.min(pattern.count * 5, 20) + pattern.highRiskCount * 5,
      issue: `Recurring: ${pattern.label}`,
      evidence: `${pattern.count} related incidents (${pattern.dimension})`,
      risk: pattern.highRiskCount > 0 ? "Critical" : "High",
      direction:
        "Review control hierarchy. Replace repeated briefing-only action with engineering, process, or supervision control where applicable."
    });
  });

  if (actionAnalysis.overdueActions.length > 0) {
    priorities.push({
      score: 88,
      issue: "Overdue corrective actions",
      evidence: `${actionAnalysis.overdueActions.length} action(s) passed target date`,
      risk: "High",
      direction:
        "Escalate PIC accountability, reset an approved recovery date, and verify interim risk control."
    });
  }

  if (highRiskOpen > 0) {
    priorities.push({
      score: 92,
      issue: "High/Critical incidents remain open",
      evidence: `${highRiskOpen} high-risk open case(s)`,
      risk: "Critical",
      direction:
        "Require management oversight, interim controls, and evidence-based closure approval."
    });
  }

  if (aging.agedOver14 > 0) {
    priorities.push({
      score: aging.agedOver30 > 0 ? 90 : 76,
      issue: "Investigation cycle delay",
      evidence: `${aging.agedOver14} case(s) older than 14 days`,
      risk: aging.agedOver30 > 0 ? "High" : "Medium",
      direction:
        "Review investigator workload, evidence bottlenecks, and escalation ownership."
    });
  }

  if (actionAnalysis.missingEvidence.length > 0) {
    priorities.push({
      score: 72,
      issue: "Action closed without evidence",
      evidence: `${actionAnalysis.missingEvidence.length} completed action(s) without evidence`,
      risk: "Medium",
      direction:
        "Do not accept action completion without photo, document, inspection result, or verification note."
    });
  }

  if (managementReviewCount > 0) {
    priorities.push({
      score: 68,
      issue: "Final reports awaiting decision",
      evidence: `${managementReviewCount} report(s) waiting for management`,
      risk: "Medium",
      direction:
        "Review promptly to avoid completed investigations remaining administratively open."
    });
  }

  return priorities
    .sort((first, second) => second.score - first.score)
    .slice(0, 8)
    .map((item, index) => ({ ...item, priority: index + 1 }));
}

export function filterIncidents(incidents, filters = {}) {
  const dateFrom = parseIncidentDate(filters.dateFrom);
  const dateTo = parseIncidentDate(filters.dateTo);

  return safeArray(incidents).filter((incident) => {
    const incidentDate = parseIncidentDate(incident.date || incident.createdAt);

    if (dateFrom && incidentDate && startOfDay(incidentDate) < startOfDay(dateFrom)) {
      return false;
    }

    if (dateTo && incidentDate && startOfDay(incidentDate) > startOfDay(dateTo)) {
      return false;
    }

    if (filters.department && filters.department !== "All") {
      if (incident.department !== filters.department) {
        return false;
      }
    }

    if (filters.estate && filters.estate !== "All") {
      if (incident.estate !== filters.estate) {
        return false;
      }
    }

    if (filters.locationType && filters.locationType !== "All") {
      if (incident.locationType !== filters.locationType) {
        return false;
      }
    }

    if (filters.location && filters.location !== "All") {
      if (incident.location !== filters.location) {
        return false;
      }
    }

    if (filters.severity && filters.severity !== "All") {
      if (incident.severity !== filters.severity) {
        return false;
      }
    }

    if (filters.status && filters.status !== "All") {
      if (incident.status !== filters.status) {
        return false;
      }
    }

    if (filters.type && filters.type !== "All") {
      if ((incident.type || incident.category) !== filters.type) {
        return false;
      }
    }

    return true;
  });
}

export function getFilterOptions(incidents) {
  const values = (field) => [
    ...new Set(
      safeArray(incidents)
        .map((incident) => incident[field])
        .filter((value) => normalizeText(value))
    )
  ].sort();

  return {
    departments: values("department"),
    estates: values("estate"),
    locationTypes: values("locationType"),
    locations: values("location"),
    severities: SEVERITY_ORDER.filter((severity) =>
      safeArray(incidents).some((incident) => incident.severity === severity)
    ),
    statuses: values("status"),
    types: [
      ...new Set(
        safeArray(incidents)
          .map((incident) => incident.type || incident.category)
          .filter((value) => normalizeText(value))
      )
    ].sort()
  };
}

export function buildSafetyAnalytics(incidents, referenceDate = new Date()) {
  const safeIncidents = safeArray(incidents);
  const repeatAnalysis = buildRepeatAnalysis(safeIncidents);
  const monthlyTrend = buildMonthlyTrend(
    safeIncidents,
    repeatAnalysis.repeatedIncidentIds
  );
  const severityData = buildSeverityData(safeIncidents);
  const statusData = buildStatusData(safeIncidents);
  const rootCausePareto = buildRootCausePareto(safeIncidents);
  const locationHotspots = buildHotspotData(
    safeIncidents.map((incident) => ({ ...incident, analyticsLocation: getEstate(incident) })),
    "analyticsLocation"
  );
  const departmentHotspots = buildHotspotData(safeIncidents, "department");
  const riskHeatmap = buildRiskHeatmap(safeIncidents);
  const aging = buildAgingData(safeIncidents, referenceDate);
  const actionAnalysis = buildActionAnalysis(
    safeIncidents,
    repeatAnalysis,
    referenceDate
  );
  const closureMetrics = buildClosureMetrics(safeIncidents);

  const highRiskOpen = safeIncidents.filter(
    (incident) =>
      HIGH_RISK_LEVELS.includes(incident.severity) &&
      incident.status !== "Closed" &&
      incident.status !== "Rejected"
  ).length;

  const managementReviewCount = safeIncidents.filter(
    (incident) => incident.status === "Management Review"
  ).length;

  const dataQuality = buildDataQuality(
    safeIncidents,
    actionAnalysis.allActions
  );

  const commonPayload = {
    incidents: safeIncidents,
    repeatAnalysis,
    actionAnalysis,
    aging,
    locationHotspots,
    departmentHotspots,
    highRiskOpen,
    managementReviewCount,
    dataQuality
  };

  return {
    totalIncident: safeIncidents.length,
    highRiskOpen,
    managementReviewCount,
    closedCount: safeIncidents.filter(
      (incident) => incident.status === "Closed"
    ).length,
    monthlyTrend,
    severityData,
    statusData,
    rootCausePareto,
    locationHotspots,
    departmentHotspots,
    riskHeatmap,
    aging,
    actionAnalysis,
    repeatAnalysis,
    closureMetrics,
    dataQuality,
    insights: buildInsights(commonPayload),
    priorityActions: buildPriorityActions(commonPayload)
  };
}
