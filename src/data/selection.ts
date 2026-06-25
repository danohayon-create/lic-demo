import { useSyncExternalStore } from 'react'
import { teamById } from './team'
import type { Signal } from './types'

export type { Signal }

export type CandidateStatus = 'new' | 'no-go' | 'shortlisted' | 'callback' | 'offer' | 'cast'
export type RolePipelineStatus = 'New' | 'Viewed' | 'Reviewed' | 'Shortlisted' | 'Callback' | 'Offer' | 'Cast'

export type Candidate = {
  id: string
  roleId: string
  name: string
  age: number
  city: string
  good: number
  maybe: number
  no: number
  status: CandidateStatus
  /** Self-tape video — falls back to the generic demo audition when absent. */
  video?: string
  /** Profile photo (extracted from the audition) — falls back to initials when absent. */
  avatar?: string

  // ── Talent-sheet criteria (for the multi-criteria search) ──
  gender?: 'F' | 'M'
  experienceLevel?: string
  nationality?: string
  languages?: string[]

  /** Each teammate's individual vote — team member id → signal. Powers the
   *  "other ratings" bubbles and the "reviewed by" filter. */
  raterVotes?: Record<string, Signal>
}

export const PIPELINE_STATUSES: RolePipelineStatus[] = [
  'New', 'Viewed', 'Reviewed', 'Shortlisted', 'Callback', 'Offer', 'Cast',
]

export const BOARD_COLUMNS: CandidateStatus[] = ['new', 'no-go', 'shortlisted', 'callback', 'offer', 'cast']

export const BOARD_COLUMN_LABELS: Record<CandidateStatus, RolePipelineStatus> = {
  new: 'New',
  'no-go': 'Reviewed',
  shortlisted: 'Shortlisted',
  callback: 'Callback',
  offer: 'Offer',
  cast: 'Cast',
}

/** Columns a card cannot be dragged out of — candidates here must go through a review first. */
export const LOCKED_COLUMNS = new Set<CandidateStatus>(['new'])

/** Columns where only one candidate may be present at a time. */
const SINGLE_OCCUPANT_COLUMNS = new Set<CandidateStatus>(['offer', 'cast'])

/** Score below which a reviewed candidate is automatically a No Go. */
const NO_GO_THRESHOLD = 60

/** Weighted "Let It Cast" score (0–100) from the good/maybe/no-go tally. */
export function candidateScore(c: Candidate): number {
  const total = c.good + c.maybe + c.no
  if (total === 0) return 0
  return Math.round((c.good * 100 + c.maybe * 50) / total)
}

// ── Seed candidates (Les Ombres de Midi) ───────────────────────────────────────

const seedCandidates: Candidate[] = [
  // Inspectrice Chloé Marchand (Lead) — scores: 90, 80, 60, 83, 50, 38
  { id: 'cand-1',  roleId: 'chloe-marchand', name: 'Camille Vidal',  age: 38, city: 'Marseille', good: 4, maybe: 1, no: 0, status: 'offer',       video: '/media/Camille Vidal.mp4', avatar: '/avatars/camille-vidal.jpg',
    gender: 'F', experienceLevel: 'Established', nationality: 'French', languages: ['French', 'English'],
    raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'julie-cohen': 'good', 'lara-khan': 'maybe' } },
  { id: 'cand-2',  roleId: 'chloe-marchand', name: 'Sarah Lefèvre',  age: 41, city: 'Paris',      good: 3, maybe: 2, no: 0, status: 'callback',    video: '/media/Sarah Lefevre.mp4', avatar: '/avatars/sarah-lefevre.jpg',
    gender: 'F', experienceLevel: 'Star', nationality: 'French', languages: ['French', 'English', 'Spanish'],
    raterVotes: { 'peter-known': 'good', 'eden-tov': 'maybe', 'julie-cohen': 'good' } },
  { id: 'cand-3',  roleId: 'chloe-marchand', name: 'Nadia Ferrand',  age: 36, city: 'Lyon',        good: 2, maybe: 2, no: 1, status: 'callback',    video: '/media/Nadia Ferrand.mp4', avatar: '/avatars/nadia-ferrand.jpg',
    gender: 'F', experienceLevel: 'Mid-career', nationality: 'French', languages: ['French', 'English'],
    raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe', 'lara-khan': 'no' } },
  { id: 'cand-4',  roleId: 'chloe-marchand', name: 'Inès Karim',     age: 37, city: 'Paris',      good: 2, maybe: 1, no: 0, status: 'shortlisted', video: '/media/Ines Karim.mp4', avatar: '/avatars/ines-karim.jpg',
    gender: 'F', experienceLevel: 'Mid-career', nationality: 'French', languages: ['French', 'English', 'Arabic'],
    raterVotes: { 'peter-known': 'good', 'julie-cohen': 'good' } },
  { id: 'cand-5',  roleId: 'chloe-marchand', name: 'Hannah Levy',    age: 39, city: 'New York',   good: 1, maybe: 2, no: 1, status: 'no-go',       video: '/media/Hannah Levy.mp4', avatar: '/avatars/hannah-levy.jpg',
    gender: 'F', experienceLevel: 'Established', nationality: 'American', languages: ['English', 'Hebrew'],
    raterVotes: { 'eden-tov': 'maybe', 'lara-khan': 'no' } },
  { id: 'cand-6',  roleId: 'chloe-marchand', name: 'Eva Sokolov',    age: 40, city: 'Berlin',     good: 1, maybe: 1, no: 2, status: 'no-go',       video: '/media/Eva Sokolov.mp4', avatar: '/avatars/eva-sokolov.jpg',
    gender: 'F', experienceLevel: 'Mid-career', nationality: 'German', languages: ['German', 'English'],
    raterVotes: { 'peter-known': 'no', 'julie-cohen': 'no' } },

  // Capitaine Rémy Jourdain (Supporting) — scores: 88, 75, 63, 50
  { id: 'cand-7',  roleId: 'remy-jourdain', name: 'Thomas Granger',  age: 45, city: 'Marseille',  good: 3, maybe: 1, no: 0, status: 'shortlisted', video: '/media/Thomas Granger.mp4', avatar: '/avatars/thomas-granger.jpg',
    gender: 'M', experienceLevel: 'Established', nationality: 'French', languages: ['French', 'English'],
    raterVotes: { 'peter-known': 'good', 'eden-tov': 'good', 'lara-khan': 'good' } },
  { id: 'cand-8',  roleId: 'remy-jourdain', name: 'Marc Dubreuil',   age: 48, city: 'Lyon',        good: 2, maybe: 2, no: 0, status: 'shortlisted', video: '/media/Marc Dubreuil.mp4', avatar: '/avatars/marc-dubreuil.jpg',
    gender: 'M', experienceLevel: 'Star', nationality: 'French', languages: ['French', 'English'],
    raterVotes: { 'eden-tov': 'good', 'julie-cohen': 'maybe' } },
  { id: 'cand-9',  roleId: 'remy-jourdain', name: 'Karim Belkacem',  age: 43, city: 'Marseille',  good: 2, maybe: 1, no: 1, status: 'shortlisted', video: '/media/Karim Belkacem.mp4', avatar: '/avatars/karim-belkacem.jpg',
    gender: 'M', experienceLevel: 'Mid-career', nationality: 'French', languages: ['French', 'Arabic', 'English'],
    raterVotes: { 'peter-known': 'good', 'lara-khan': 'no' } },
  { id: 'cand-10', roleId: 'remy-jourdain', name: 'Julien Faure',    age: 46, city: 'Toulouse',   good: 1, maybe: 1, no: 1, status: 'no-go',       video: '/media/Julien Faure.mp4', avatar: '/avatars/julien-faure.jpg',
    gender: 'M', experienceLevel: 'Emerging', nationality: 'French', languages: ['French'],
    raterVotes: { 'julie-cohen': 'no', 'eden-tov': 'maybe' } },

  // La Témoin (Supporting) — scores: 100, 75 (no dedicated audition footage yet)
  { id: 'cand-11', roleId: 'la-temoin-film', name: 'Lola Mercier',   age: 27, city: 'Marseille',  good: 2, maybe: 0, no: 0, status: 'shortlisted', avatar: '/avatars/lola-mercier.jpg',
    gender: 'F', experienceLevel: 'Emerging', nationality: 'French', languages: ['French', 'English'],
    raterVotes: { 'peter-known': 'good', 'eden-tov': 'good' } },
  { id: 'cand-12', roleId: 'la-temoin-film', name: 'Zoé Andrieu',    age: 30, city: 'Nice',        good: 1, maybe: 1, no: 0, status: 'shortlisted', avatar: '/avatars/zoe-andrieu.jpg',
    gender: 'F', experienceLevel: 'Mid-career', nationality: 'French', languages: ['French', 'Italian'],
    raterVotes: { 'julie-cohen': 'good', 'lara-khan': 'maybe' } },

  // Fresh submissions — not reviewed yet, waiting in the New column
  { id: 'cand-13', roleId: 'chloe-marchand', name: 'Anaïs Roche',    age: 34, city: 'Bordeaux',   good: 0, maybe: 0, no: 0, status: 'new', avatar: '/avatars/anais-roche.jpg',
    gender: 'F', experienceLevel: 'Emerging', nationality: 'French', languages: ['French'] },
  { id: 'cand-14', roleId: 'chloe-marchand', name: 'Lucie Fontaine', age: 39, city: 'Nantes',      good: 0, maybe: 0, no: 0, status: 'new', avatar: '/avatars/lucie-fontaine.jpg',
    gender: 'F', experienceLevel: 'Emerging', nationality: 'French', languages: ['French', 'English'] },
  { id: 'cand-15', roleId: 'remy-jourdain', name: 'Vincent Berry',   age: 44, city: 'Lille',       good: 0, maybe: 0, no: 0, status: 'new', avatar: '/avatars/vincent-berry.jpg',
    gender: 'M', experienceLevel: 'Mid-career', nationality: 'French', languages: ['French'] },

  // Agnès Marchand — casting not opened yet: no candidates
]

// ── Store (localStorage-backed, like castingState.ts) ──────────────────────────

const STORAGE_KEY = 'lic-selection-state-v7'

type PersistedState = {
  candidates: Candidate[]
  roleStatusOverrides: Record<string, RolePipelineStatus>
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore — demo persistence only
  }
  return { candidates: seedCandidates, roleStatusOverrides: {} }
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

// Cache filtered results so repeated calls return a stable reference when the
// underlying candidate list hasn't changed — required by useSyncExternalStore,
// which otherwise treats a fresh array each render as a perpetual store change.
const roleCandidatesCache = new Map<string, { source: Candidate[]; result: Candidate[] }>()

export function getCandidatesForRole(roleId: string): Candidate[] {
  const cached = roleCandidatesCache.get(roleId)
  if (cached && cached.source === state.candidates) return cached.result
  const result = state.candidates.filter((c) => c.roleId === roleId)
  roleCandidatesCache.set(roleId, { source: state.candidates, result })
  return result
}

export function useRoleCandidates(roleId: string): Candidate[] {
  return useSyncExternalStore(subscribe, () => getCandidatesForRole(roleId))
}

// Same caching strategy as `roleCandidatesCache`, keyed by the joined role ids
// so a single hook call can power a project-wide (multi-role) Kanban.
const multiRoleCandidatesCache = new Map<string, { source: Candidate[]; result: Candidate[] }>()

export function getCandidatesForRoles(roleIds: string[]): Candidate[] {
  const key = roleIds.join(',')
  const cached = multiRoleCandidatesCache.get(key)
  if (cached && cached.source === state.candidates) return cached.result
  const result = state.candidates.filter((c) => roleIds.includes(c.roleId))
  multiRoleCandidatesCache.set(key, { source: state.candidates, result })
  return result
}

/** All candidates across a set of roles — powers the project-wide selection console. */
export function useCandidatesForRoles(roleIds: string[]): Candidate[] {
  return useSyncExternalStore(subscribe, () => getCandidatesForRoles(roleIds))
}

export function useCandidate(candidateId: string): Candidate | undefined {
  return useSyncExternalStore(subscribe, () => state.candidates.find((c) => c.id === candidateId))
}

/** Move a candidate to a new board column. Offer/Cast allow only one occupant. */
export function moveCandidate(candidateId: string, status: CandidateStatus): { ok: boolean; reason?: string } {
  const candidate = state.candidates.find((c) => c.id === candidateId)
  if (!candidate) return { ok: false, reason: 'Candidate not found' }

  if (SINGLE_OCCUPANT_COLUMNS.has(status)) {
    const occupant = state.candidates.find((c) => c.roleId === candidate.roleId && c.status === status && c.id !== candidateId)
    if (occupant) {
      return { ok: false, reason: `${occupant.name} is already in ${BOARD_COLUMN_LABELS[status]} — move them first` }
    }
  }

  state = { ...state, candidates: state.candidates.map((c) => (c.id === candidateId ? { ...c, status } : c)) }
  persist()
  emit()
  return { ok: true }
}

export function rateCandidate(candidateId: string, signal: 'good' | 'maybe' | 'no') {
  state = {
    ...state,
    candidates: state.candidates.map((c) => {
      if (c.id !== candidateId) return c
      const updated = { ...c, [signal]: c[signal] + 1 }
      // Auto-sort between Reviewed / Shortlisted while the candidate hasn't been
      // manually advanced further down the pipeline yet. A first review also
      // moves a candidate out of the locked "New" column.
      if (c.status === 'new' || c.status === 'no-go' || c.status === 'shortlisted') {
        updated.status = candidateScore(updated) < NO_GO_THRESHOLD ? 'no-go' : 'shortlisted'
      }
      return updated
    }),
  }
  persist()
  emit()
}

const STATUS_RANK = PIPELINE_STATUSES

/** Highest pipeline stage reached among a role's candidates (for the dashboard default). */
export function deriveRoleStatus(candidates: Candidate[]): RolePipelineStatus {
  if (candidates.length === 0) return 'New'
  return candidates.reduce<RolePipelineStatus>((best, c) => {
    const label = BOARD_COLUMN_LABELS[c.status]
    return STATUS_RANK.indexOf(label) > STATUS_RANK.indexOf(best) ? label : best
  }, 'New')
}

export function useRoleStatus(roleId: string): RolePipelineStatus {
  const override = useSyncExternalStore(subscribe, () => state.roleStatusOverrides[roleId])
  const candidates = useRoleCandidates(roleId)
  return override ?? deriveRoleStatus(candidates)
}

export function setRoleStatus(roleId: string, status: RolePipelineStatus) {
  state = { ...state, roleStatusOverrides: { ...state.roleStatusOverrides, [roleId]: status } }
  persist()
  emit()
}

const RATER_POOL = ['ET', 'JC', 'LK', 'MS', 'AB', 'RT']

/** Individual teammate votes for "other ratings" bubbles — reads `raterVotes` when present
 *  (real, filterable reviewer identities), else falls back to a plausible reconstruction
 *  from the good/maybe/no tally (for candidates without explicit rater data). */
export function deriveTeamRatings(c: Candidate): { initials: string; signal: Signal }[] {
  if (c.raterVotes) {
    return Object.entries(c.raterVotes).map(([reviewerId, signal]) => ({
      initials: teamById[reviewerId]?.initials ?? reviewerId,
      signal,
    }))
  }
  const signals: Signal[] = [
    ...Array(c.good).fill('good' as const),
    ...Array(c.maybe).fill('maybe' as const),
    ...Array(c.no).fill('no' as const),
  ]
  return signals.map((signal, i) => ({ initials: RATER_POOL[i % RATER_POOL.length], signal }))
}

/** Weighted average rating out of 5, derived from the good/maybe/no tally. */
export function candidateAverageRating(c: Candidate): number {
  const total = c.good + c.maybe + c.no
  if (total === 0) return 0
  return Math.round(((c.good * 5 + c.maybe * 3 + c.no * 1.5) / total) * 10) / 10
}

/** Deterministic pseudo-random AI scene metrics, seeded by candidate id (demo only — no backend). */
export function deriveAiMetrics(c: Candidate): { label: string; value: number }[] {
  const seed = c.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const labels = ['Emotional range', 'Memorization', 'Eye contact', 'Pacing']
  return labels.map((label, i) => ({ label, value: 55 + ((seed * (i + 3)) % 45) }))
}

/** Candidate currently in Cast, else in Offer, for a role (used on the Wall). */
export function chosenCandidateForRole(roleId: string): Candidate | undefined {
  const candidates = getCandidatesForRole(roleId)
  return candidates.find((c) => c.status === 'cast') ?? candidates.find((c) => c.status === 'offer')
}

/** Count of candidates that have been shortlisted or moved further down the pipeline. */
export function shortlistedCountForRole(roleId: string): number {
  const shortlistRank = BOARD_COLUMNS.indexOf('shortlisted')
  return getCandidatesForRole(roleId).filter((c) => BOARD_COLUMNS.indexOf(c.status) >= shortlistRank).length
}
