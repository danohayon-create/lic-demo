import { useSyncExternalStore } from 'react'

export type AuditionFormat = 'open-call' | 'invited' | 'in-house'
export type RoleCastingStatus = 'not-opened' | 'ready' | 'ongoing'

export type RoleCastingState = {
  format: AuditionFormat
  status: RoleCastingStatus
}

type ProjectCastingState = Record<string, RoleCastingState>

const STORAGE_KEY = 'lic-casting-state'

function load(): Record<string, ProjectCastingState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

let store = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore — demo persistence only
  }
}

function emit() {
  listeners.forEach((l) => l())
}

export function setProjectCasting(projectId: string, roles: ProjectCastingState) {
  store = { ...store, [projectId]: roles }
  persist()
  emit()
}

export function setRoleCastingStatus(projectId: string, roleId: string, status: RoleCastingStatus) {
  const project = store[projectId] ?? {}
  const current = project[roleId] ?? { format: 'open-call' as AuditionFormat, status: 'ready' as RoleCastingStatus }
  store = { ...store, [projectId]: { ...project, [roleId]: { ...current, status } } }
  persist()
  emit()
}

// Stable empty object so repeated calls for a project with no data return the
// same reference — required by useSyncExternalStore (a fresh {} every call
// would look like a perpetual store change and loop forever).
const EMPTY_PROJECT_CASTING: ProjectCastingState = {}

export function getProjectCasting(projectId: string): ProjectCastingState {
  return store[projectId] ?? EMPTY_PROJECT_CASTING
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useProjectCasting(projectId: string): ProjectCastingState {
  return useSyncExternalStore(subscribe, () => getProjectCasting(projectId))
}

// ── Demo defaults (used until the wizard publishes a casting) ─────────────────

export const ROLE_CASTING_DEFAULTS: Record<string, { format: AuditionFormat; status: RoleCastingStatus; gender: string; age: string; hasBrief: boolean }> = {
  'chloe-marchand':      { format: 'open-call', status: 'ready',      gender: 'F', age: '35–45', hasBrief: true },
  'agnes-marchand-film': { format: 'invited',   status: 'not-opened', gender: 'F', age: '60–70', hasBrief: false },
  'remy-jourdain':       { format: 'in-house',  status: 'not-opened', gender: 'M', age: '40–50', hasBrief: false },
  'la-temoin-film':      { format: 'open-call', status: 'ready',      gender: 'F', age: '25–35', hasBrief: false },
}
