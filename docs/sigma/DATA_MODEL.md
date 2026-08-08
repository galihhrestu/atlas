# SIGMA Data Model — Concept Baseline

## Main collections

```text
users/{userId}
patrolReports/{patrolId}
assets/{assetId}
findings/{findingId}
areas/{areaId}
recommendations/{recommendationId}
activities/{activityId}
reportExports/{exportId}
```

## users

- name
- email
- department
- title
- role: `user | admin`
- status: `active | inactive`
- lastAccess

## patrolReports

- patrolCode
- date
- startTime
- endTime
- team
- area
- focus
- routeType: `dynamic`
- coordinatesCount
- distanceKm
- assetsObserved
- findingsCount
- evidenceCount
- trackingRef
- riskLevel
- status: `submitted | under-review | verified | revision-required | rejected`
- notes
- submittedBy
- validatedBy
- validationNote
- createdAt

## assets

- code
- name
- category
- type: `fixed | mobile | material`
- area
- locationLabel
- coordinates
- status: `normal | attention | critical`
- visibility: `high | moderate | low | none`
- visibilityScore
- lastSeenAt
- quantity
- unit
- criticality
- evidenceCount
- moving
- owner

## findings

- code
- title
- category: `finding | incident | anomaly`
- severity
- area
- assetId
- status: `open | in-progress | resolved`
- reportedAt
- sourcePatrolId
- description
- action
- owner
- dueDate

## areas

- name
- zone
- lastPatrolAt
- daysSincePatrol
- coveragePct
- evidenceCompleteness
- visibilityScore
- visibility
- riskScore
- priority
- reasons

## recommendations

- priority
- title
- reason
- target
- owner
- due
- status

## Validation principle

Only verified patrol reports should contribute to official management KPI, monitoring coverage, visibility score, assurance performance, and official reports.
