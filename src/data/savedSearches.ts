import { useSyncExternalStore } from 'react'
import type { Signal } from './selection'

/** A serializable snapshot of the selection-console multi-criteria search. */
export interface SavedSearchFilters {
  roleIds: string[]
  signals: Signal[]
  scoreMin: number | null
  scoreMax: number | null
  reviewerIds: string[]
  genders: string[]
  experienceLevels: string[]
  nationalities: string[]
  languages: string[]
  query: string
  /** null = no filter; 'reviewed' = has at least one note; 'not_reviewed' = new, never rated */
  reviewStatus: 'reviewed' | 'not_reviewed' | null
  /** Minimum scene score (1–5) derived from rating quality; null = no filter */
  sceneStarsMin: number | null
}

export interface SavedSearch {
  id: string
  projectId: string
  name: string
  filters: SavedSearchFilters
  createdAt: string
}

const STORAGE_KEY = 'lic-saved-searches-v1'

function load(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore — demo persistence only
  }
  return []
}

let state = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore — demo persistence only
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

const projectSearchesCache = new Map<string, { source: SavedSearch[]; result: SavedSearch[] }>()

function getSavedSearches(projectId: string): SavedSearch[] {
  const cached = projectSearchesCache.get(projectId)
  if (cached && cached.source === state) return cached.result
  const result = state.filter((s) => s.projectId === projectId)
  projectSearchesCache.set(projectId, { source: state, result })
  return result
}

export function useSavedSearches(projectId: string): SavedSearch[] {
  return useSyncExternalStore(subscribe, () => getSavedSearches(projectId))
}

export function saveSearch(projectId: string, name: string, filters: SavedSearchFilters) {
  const entry: SavedSearch = {
    id: `pl-${Date.now()}`,
    projectId,
    name,
    filters,
    createdAt: new Date().toISOString(),
  }
  state = [entry, ...state]
  persist()
  emit()
}

export function deleteSearch(id: string) {
  state = state.filter((s) => s.id !== id)
  persist()
  emit()
}
