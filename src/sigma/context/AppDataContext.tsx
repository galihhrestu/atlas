import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  assuranceLayers,
  seedActivities,
  seedAreas,
  seedAssets,
  seedFindings,
  seedPatrols,
  seedRecommendations,
  seedUsers,
} from '../data/seed'
import type {
  ActivityItem,
  AppUser,
  AreaVisibility,
  Asset,
  AssuranceLayer,
  Finding,
  PatrolReport,
  PatrolStatus,
  Recommendation,
} from '../types'

interface AppDataContextValue {
  patrols: PatrolReport[]
  assets: Asset[]
  findings: Finding[]
  areas: AreaVisibility[]
  recommendations: Recommendation[]
  users: AppUser[]
  activities: ActivityItem[]
  assurance: AssuranceLayer[]
  addPatrol: (patrol: PatrolReport) => void
  addAsset: (asset: Asset) => void
  updateAsset: (asset: Asset) => void
  addFinding: (finding: Finding) => void
  updatePatrolStatus: (id: string, status: PatrolStatus, note?: string) => void
  updateUser: (user: AppUser) => void
  resetDemoData: () => void
}

const STORAGE_KEY = 'sigma-demo-data-v3-tracking-map'

interface StoredData {
  patrols: PatrolReport[]
  assets: Asset[]
  findings: Finding[]
  areas: AreaVisibility[]
  recommendations: Recommendation[]
  users: AppUser[]
  activities: ActivityItem[]
}

const createSeed = (): StoredData => ({
  patrols: seedPatrols,
  assets: seedAssets,
  findings: seedFindings,
  areas: seedAreas,
  recommendations: seedRecommendations,
  users: seedUsers,
  activities: seedActivities,
})

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoredData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return createSeed()
    try {
      return JSON.parse(stored) as StoredData
    } catch {
      return createSeed()
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const addActivity = (activity: ActivityItem) => {
    setData((current) => ({ ...current, activities: [activity, ...current.activities].slice(0, 20) }))
  }

  const value = useMemo<AppDataContextValue>(() => ({
    ...data,
    assurance: assuranceLayers,
    addPatrol: (patrol) => {
      setData((current) => ({ ...current, patrols: [patrol, ...current.patrols] }))
      addActivity({ id: `act-${Date.now()}`, type: 'patrol', title: `New patrol ${patrol.patrolCode} submitted`, meta: `${patrol.team} • ${patrol.area}`, time: 'Just now', tone: 'info' })
    },
    addAsset: (asset) => {
      setData((current) => ({ ...current, assets: [asset, ...current.assets] }))
      addActivity({ id: `act-${Date.now()}`, type: 'asset', title: `${asset.name} registered`, meta: `${asset.code} • ${asset.area}`, time: 'Just now', tone: 'success' })
    },
    updateAsset: (asset) => {
      setData((current) => ({ ...current, assets: current.assets.map((item) => item.id === asset.id ? asset : item) }))
      addActivity({ id: `act-${Date.now()}`, type: 'asset', title: `${asset.name} location updated`, meta: `${asset.locationLabel} • ${asset.visibility} visibility`, time: 'Just now', tone: 'info' })
    },
    addFinding: (finding) => {
      setData((current) => ({ ...current, findings: [finding, ...current.findings] }))
      addActivity({ id: `act-${Date.now()}`, type: 'finding', title: finding.title, meta: `${finding.category.toUpperCase()} • ${finding.area}`, time: 'Just now', tone: finding.severity === 'critical' || finding.severity === 'high' ? 'danger' : 'warning' })
    },
    updatePatrolStatus: (id, status, note) => {
      setData((current) => ({
        ...current,
        patrols: current.patrols.map((patrol) => patrol.id === id ? {
          ...patrol,
          status,
          validationNote: note,
          validatedBy: status === 'verified' ? 'Rina SSL' : patrol.validatedBy,
        } : patrol),
      }))
      addActivity({ id: `act-${Date.now()}`, type: 'validation', title: `Patrol report ${status.replace('-', ' ')}`, meta: `${id} • Admin SSL`, time: 'Just now', tone: status === 'verified' ? 'success' : status === 'rejected' ? 'danger' : 'warning' })
    },
    updateUser: (user) => setData((current) => ({ ...current, users: current.users.map((item) => item.id === user.id ? user : item) })),
    resetDemoData: () => setData(createSeed()),
  }), [data])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData must be used inside AppDataProvider')
  return context
}
