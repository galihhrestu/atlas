export type UserRole = 'user' | 'admin'
export type ThemeMode = 'dark' | 'light'
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export type PatrolStatus = 'submitted' | 'under-review' | 'verified' | 'revision-required' | 'rejected'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type VisibilityLevel = 'high' | 'moderate' | 'low' | 'none'
export type AssetType = 'fixed' | 'mobile' | 'material'
export type AssetStatus = 'normal' | 'attention' | 'critical'
export type FindingStatus = 'open' | 'in-progress' | 'resolved'

export interface SessionUser {
  id: string
  name: string
  title: string
  department: string
  role: UserRole
  initials: string
}

export interface PatrolReport {
  id: string
  patrolCode: string
  date: string
  startTime: string
  endTime: string
  team: string
  area: string
  focus: string
  routeType: 'dynamic'
  coordinatesCount: number
  distanceKm: number
  assetsObserved: number
  findingsCount: number
  visibilityContribution: number
  riskLevel: RiskLevel
  evidenceCount: number
  submittedBy: string
  status: PatrolStatus
  notes: string
  trackingRef: string
  trackTemplateId?: string
  createdAt: string
  validatedBy?: string
  validationNote?: string
}

export interface Asset {
  id: string
  code: string
  name: string
  category: string
  type: AssetType
  area: string
  locationLabel: string
  coordinates: string
  status: AssetStatus
  visibility: VisibilityLevel
  visibilityScore: number
  lastSeenAt: string
  quantity?: number
  unit?: string
  criticality: RiskLevel
  evidenceCount: number
  moving: boolean
  owner: string
}

export interface Finding {
  id: string
  code: string
  title: string
  category: 'finding' | 'incident' | 'anomaly'
  severity: RiskLevel
  area: string
  assetId?: string
  status: FindingStatus
  reportedAt: string
  sourcePatrolId?: string
  description: string
  action: string
  owner: string
  dueDate: string
}

export interface AreaVisibility {
  id: string
  name: string
  zone: string
  lastPatrolAt: string
  daysSincePatrol: number
  coveragePct: number
  evidenceCompleteness: number
  visibilityScore: number
  visibility: VisibilityLevel
  riskScore: number
  priority: RiskLevel
  reasons: string[]
}

export interface Recommendation {
  id: string
  priority: RiskLevel
  title: string
  reason: string
  target: string
  owner: string
  due: string
  status: 'open' | 'in-progress' | 'completed'
}

export interface AppUser {
  id: string
  name: string
  email: string
  department: string
  title: string
  role: UserRole
  status: 'active' | 'inactive'
  lastAccess: string
}

export interface ActivityItem {
  id: string
  type: 'patrol' | 'asset' | 'finding' | 'validation' | 'report'
  title: string
  meta: string
  time: string
  tone: StatusTone
}

export interface AssuranceLayer {
  id: number
  key: string
  title: string
  description: string
  score: number
  tone: StatusTone
}
