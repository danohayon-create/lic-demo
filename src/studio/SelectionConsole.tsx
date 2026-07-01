import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpDown,
  Bookmark,
  Wand2,
  Check,
  CheckCheck,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Columns2,
  Gauge,
  Grid2x2,
  HelpCircle,
  Info,
  LayoutGrid,
  List,
  Lock,
  MapPin,
  PhoneCall,
  Play,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Square,
  Star,
  Trash2,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react'
import { Avatar, Button, Card, Tag } from '@/components/ui'
import { EditModal, Field, TextArea, TextInput } from '@/components/EditModal'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import { projects, projectsById, rolesByProject, team, type Role } from '@/data'
import {
  useCandidatesForRoles,
  moveCandidate,
  rateCandidate,
  useMyVote,
  resetCandidatesForDemo,
  applyScenarioPreset,
  isNewCandidate,
  candidateScore,
  videoPerformanceScore,
  candidateAverageRating,
  deriveTeamRatings,
  BOARD_COLUMNS,
  BOARD_COLUMN_LABELS,
  LOCKED_COLUMNS,
  type Candidate,
  type CandidateStatus,
  type Signal,
} from '@/data/selection'
import { useSavedSearches, saveSearch, deleteSearch, type SavedSearchFilters } from '@/data/savedSearches'
import { Player } from './Review'
import { asset } from '@/lib/asset'

type ViewMode = 'kanban' | 'list' | 'wall'


const COLUMN_TONE: Partial<Record<CandidateStatus, string>> = {
  new: 'bg-gray-200/70 ring-gray-400/30',
  offer: 'bg-green-50/70 ring-signal-good/20',
  cast: 'bg-yellow-50/70 ring-signal-maybe/25',
}

const LOGLINE =
  "A detective obsessed with cold cases discovers that the prime suspect she's hunted for two decades could be her own mother."

/** Shared grid template for the list view — header + rows must align exactly.
 *  checkbox · photo · talent · watch · team evaluation · spacer · score · status */
const LIST_GRID = 'grid grid-cols-[24px_44px_220px_64px_160px_1fr_120px_140px] items-center gap-6'

const SIGNAL_OPTIONS: { value: Signal; label: string; dot: string }[] = [
  { value: 'good', label: 'Good match', dot: 'bg-signal-good' },
  { value: 'maybe', label: 'Maybe', dot: 'bg-signal-maybe' },
  { value: 'no', label: 'No go', dot: 'bg-signal-no' },
]

const EMPTY_FILTERS: SavedSearchFilters = {
  roleIds: [],
  signals: [],
  scoreMin: null,
  scoreMax: null,
  reviewerIds: [],
  genders: [],
  experienceLevels: [],
  nationalities: [],
  languages: [],
  query: '',
  reviewStatus: null,
  sceneStarsMin: null,
  isNewCandidateFilter: null,
  majoritySignal: null,
  statusFilter: null,
}

function activeFilterCount(f: SavedSearchFilters): number {
  return (
    f.roleIds.length +
    f.signals.length +
    f.reviewerIds.length +
    f.genders.length +
    f.experienceLevels.length +
    f.nationalities.length +
    f.languages.length +
    (f.scoreMin != null || f.scoreMax != null ? 1 : 0) +
    (f.query.trim() ? 1 : 0) +
    (f.reviewStatus != null ? 1 : 0) +
    (f.sceneStarsMin != null ? 1 : 0) +
    (f.isNewCandidateFilter ? 1 : 0) +
    (f.majoritySignal != null ? 1 : 0) +
    (f.statusFilter != null ? 1 : 0)
  )
}

export function SelectionConsole() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('p') || 'les-ombres-de-midi'
  const initialRoleId = searchParams.get('role') || ''

  const project = projectsById[projectId] ?? projectsById['les-ombres-de-midi']
  const roles = rolesByProject(project.id)
  const allRoleIds = useMemo(() => roles.map((r) => r.id), [roles])
  const rolesById = useMemo(
    () => Object.fromEntries(roles.map((r) => [r.id, r])) as Record<string, Role>,
    [roles],
  )

  // Unfiltered — powers the header counters.
  const allCandidates = useCandidatesForRoles(allRoleIds)

  const [filters, setFilters] = useState<SavedSearchFilters>(() => ({
    ...EMPTY_FILTERS,
    roleIds: initialRoleId ? [initialRoleId] : [],
  }))

  const nationalityOptions = useMemo(
    () => Array.from(new Set(allCandidates.map((c) => c.nationality).filter(Boolean))) as string[],
    [allCandidates],
  )
  const languageOptions = useMemo(
    () => Array.from(new Set(allCandidates.flatMap((c) => c.languages ?? []))).sort(),
    [allCandidates],
  )
  const experienceOptions = useMemo(
    () => Array.from(new Set(allCandidates.map((c) => c.experienceLevel).filter(Boolean))) as string[],
    [allCandidates],
  )

  const filteredCandidates = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return allCandidates.filter((c) => {
      if (filters.roleIds.length > 0 && !filters.roleIds.includes(c.roleId)) return false
      if (filters.signals.length > 0 && !filters.signals.some((s) => c[s] > 0)) return false
      const score = candidateScore(c)
      if (filters.scoreMin != null && score < filters.scoreMin) return false
      if (filters.scoreMax != null && score > filters.scoreMax) return false
      if (filters.reviewerIds.length > 0) {
        const reviewers = Object.keys(c.raterVotes ?? {})
        if (!filters.reviewerIds.some((id) => reviewers.includes(id))) return false
      }
      if (filters.genders.length > 0 && (!c.gender || !filters.genders.includes(c.gender))) return false
      if (
        filters.experienceLevels.length > 0 &&
        (!c.experienceLevel || !filters.experienceLevels.includes(c.experienceLevel))
      )
        return false
      if (filters.nationalities.length > 0 && (!c.nationality || !filters.nationalities.includes(c.nationality)))
        return false
      if (filters.reviewStatus === 'reviewed' && c.good === 0 && c.maybe === 0 && c.no === 0) return false
      if (filters.reviewStatus === 'not_reviewed' && c.status !== 'new') return false
      if (filters.sceneStarsMin != null && Math.round(candidateAverageRating(c)) < filters.sceneStarsMin) return false
      if (filters.isNewCandidateFilter && !isNewCandidate(c.id)) return false
      if (filters.statusFilter === 'remaining') {
        if (!['shortlisted', 'callback', 'offer', 'cast'].includes(c.status)) return false
      } else if (filters.statusFilter === 'finalized') {
        if (!['offer', 'cast'].includes(c.status)) return false
      } else if (filters.statusFilter === 'eliminated') {
        if (c.status !== 'no-go') return false
      } else if (filters.statusFilter) {
        if (c.status !== filters.statusFilter) return false
      }
      if (filters.majoritySignal) {
        const total = c.good + c.maybe + c.no
        if (total === 0) return false
        if (filters.majoritySignal === 'no' && !(c.no > c.good && c.no >= c.maybe)) return false
        if (filters.majoritySignal === 'maybe' && !(c.maybe > c.good && c.maybe > c.no)) return false
        if (filters.majoritySignal === 'good' && !(c.good >= c.maybe && c.good >= c.no)) return false
      }
      if (filters.languages.length > 0 && !(c.languages ?? []).some((l) => filters.languages.includes(l)))
        return false
      if (q) {
        const haystack = [c.name, c.city, c.nationality, rolesById[c.roleId]?.name, ...(c.languages ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [allCandidates, filters, rolesById])

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<CandidateStatus | null>(null)

  const initialView = (searchParams.get('view') as ViewMode | null) ?? 'list'
  const [view, setView] = useState<ViewMode>(initialView)
  const [columnFocus, setColumnFocus] = useState<CandidateStatus | null>(null)

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [saveSearchOpen, setSaveSearchOpen] = useState(false)
  const [watchQueue, setWatchQueue] = useState<Candidate[] | null>(null)

  // Feature 1: AI Priority sort
  const [aiSort, setAiSort] = useState(false)

  // Top Talent filter
  const [topTalentActive, setTopTalentActive] = useState(false)
  const [topTalentPct, setTopTalentPct] = useState(30)
  const [topTalentOpen, setTopTalentOpen] = useState(false)

  // List column sort (score / status) — default: score desc
  const [listSort, setListSort] = useState<{ col: 'score' | 'status'; dir: 'asc' | 'desc' } | null>({ col: 'score', dir: 'desc' })

  const toggleListSort = (col: 'score' | 'status') => {
    setListSort((cur) => {
      if (cur?.col !== col) return { col, dir: 'desc' }
      if (cur.dir === 'desc') return { col, dir: 'asc' }
      return null
    })
  }

  // Feature 3: Compare mode
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())

  const STATUS_WEIGHT: Record<CandidateStatus, number> = {
    cast: 6, offer: 5, callback: 4, shortlisted: 3, new: 2, 'no-go': 1,
  }

  const sortedCandidates = useMemo(() => {
    let base = filteredCandidates

    // Top Talent filter — keep only candidates in top N% by composite score
    if (topTalentActive) {
      const total = base.length
      if (total > 0) {
        const threshold = Math.ceil(total * (topTalentPct / 100))
        const ranked = [...base].sort((a, b) => compositeScore(b) - compositeScore(a))
        const topIds = new Set(ranked.slice(0, threshold).map((c) => c.id))
        base = base.filter((c) => topIds.has(c.id))
      }
    }

    if (aiSort) {
      base = [...base].sort((a, b) => {
        const wDiff = (STATUS_WEIGHT[b.status] ?? 0) - (STATUS_WEIGHT[a.status] ?? 0)
        if (wDiff !== 0) return wDiff
        return compositeScore(b) - compositeScore(a)
      })
    }
    if (listSort) {
      base = [...base].sort((a, b) => {
        const mul = listSort.dir === 'desc' ? -1 : 1
        if (listSort.col === 'score') return mul * (compositeScore(a) - compositeScore(b))
        return mul * ((STATUS_WEIGHT[a.status] ?? 0) - (STATUS_WEIGHT[b.status] ?? 0))
      })
    }
    return base
  }, [filteredCandidates, aiSort, listSort, topTalentActive, topTalentPct])

  const toggleCompareSelect = (id: string) => {
    setCompareIds((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Open modal when exactly 2 are selected in compare mode
  const compareSelectedCandidates = useMemo(
    () => sortedCandidates.filter((c) => compareIds.has(c.id)),
    [sortedCandidates, compareIds],
  )

  const handleDrop = (status: CandidateStatus) => {
    setOverColumn(null)
    if (!draggedId) return
    const result = moveCandidate(draggedId, status)
    if (!result.ok) toast(result.reason ?? "Couldn't move candidate")
    setDraggedId(null)
  }

  const toggleSelectMode = () => {
    setSelectMode((v) => !v)
    setSelectedIds(new Set())
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const selectMany = (ids: string[]) => {
    setSelectedIds((cur) => {
      const next = new Set(cur)
      ids.forEach((id) => next.add(id))
      return next
    })
  }

  const selectedCandidates = filteredCandidates.filter((c) => selectedIds.has(c.id))

  const bulkMoveTo = (status: CandidateStatus) => {
    let failures = 0
    selectedIds.forEach((id) => {
      const r = moveCandidate(id, status)
      if (!r.ok) failures += 1
    })
    const moved = selectedIds.size - failures
    toast(
      failures > 0
        ? `${moved} moved to ${BOARD_COLUMN_LABELS[status]} · ${failures} couldn't move`
        : `${moved} candidate${moved === 1 ? '' : 's'} moved to ${BOARD_COLUMN_LABELS[status]}`,
    )
    setStatusModalOpen(false)
    clearSelection()
  }

  // ── header counters (project-wide, unfiltered) ──
  const shortlistRank = BOARD_COLUMNS.indexOf('shortlisted')
  const shortlistCount = allCandidates.filter((c) => BOARD_COLUMNS.indexOf(c.status) >= shortlistRank).length
  const bookedCount = allCandidates.filter((c) => c.status === 'cast').length

  const activeCount = activeFilterCount(filters)

  const handleProjectChange = (newId: string) => {
    setFilters(EMPTY_FILTERS)
    setColumnFocus(null)
    setSelectedIds(new Set())
    setSelectMode(false)
    setView('list')
    navigate(`/studio/selection?p=${newId}`)
  }

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Project picker */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-label text-muted">Project</span>
        <div className="relative">
          <select
            value={project.id}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="h-9 appearance-none rounded-btn border border-line bg-card pl-3 pr-8 text-sm font-semibold text-ink outline-none focus:border-ink/30"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/studio/dashboard?p=${project.id}`)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-ink/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="tech-label">Selection console</span>
            <h1 className="text-xl font-bold tracking-tight text-ink">{project.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Reset */}
          <div className="relative group flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={() => {
                resetCandidatesForDemo(allRoleIds)
                setFilters(EMPTY_FILTERS)
                setTopTalentActive(false)
                toast('Demo reset')
              }}
            >
              Reset
            </Button>
            <span className="cursor-default text-[10px] text-muted/60 hover:text-muted">
              <Info className="h-3 w-3" />
            </span>
            <div className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 hidden w-56 rounded-card border border-line bg-card p-2.5 text-[11px] leading-relaxed text-muted shadow-card group-hover:block">
              Remet tous les candidats à l'état initial&nbsp;: <strong>150 To Review</strong> et <strong>50 Reviewed</strong>. Tous les filtres sont effacés.
            </div>
          </div>
          <span className="h-5 w-px bg-line" />
          {/* S1 / S2 / S3 */}
          {([1, 2, 3] as const).map((s) => {
            const tips: Record<number, string> = {
              1: 'Les 200 candidats ont tous été reviewés — aucune fiche en To Review.',
              2: '120 éliminés (No go), 40 shortlistés et 40 en Callback.',
              3: '180 éliminés, 15 en Offer et 5 en Cast.',
            }
            return (
              <div key={s} className="relative group flex items-center gap-0.5">
                <button
                  onClick={() => {
                    applyScenarioPreset(s, allRoleIds)
                    setFilters(EMPTY_FILTERS)
                    setTopTalentActive(false)
                    toast(`S${s} appliqué`)
                  }}
                  className="flex h-7 items-center rounded-btn border border-line bg-paper px-2.5 text-[11px] font-bold text-muted hover:border-ink/30 hover:text-ink"
                >
                  S{s}
                </button>
                <span className="cursor-default text-[10px] text-muted/60 hover:text-muted">
                  <Info className="h-3 w-3" />
                </span>
                <div className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 hidden w-52 rounded-card border border-line bg-card p-2.5 text-[11px] leading-relaxed text-muted shadow-card group-hover:block">
                  {tips[s]}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Project summary */}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {project.poster ? (
            <img
              src={asset(project.poster)}
              alt={project.title}
              className="h-24 w-24 shrink-0 rounded-btn object-cover ring-1 ring-line"
            />
          ) : (
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-btn bg-paper text-3xl ring-1 ring-line">
              🎬
            </span>
          )}
          <div className="flex-1">
            <span className="tech-label">
              {project.type} · {project.company} · {project.genre}
            </span>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-ink">{project.title}</h2>
            <p className="mt-1 text-sm italic leading-relaxed text-muted">"{project.synopsis ?? LOGLINE}"</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
          <StatCell value={project.kpis?.roles.total ?? roles.length} label={project.format === 'non_scripted' ? 'Contestant slots' : 'Roles'} />
          <StatCell value={project.kpis?.submissions.total ?? allCandidates.length} label="Submissions" />
          <StatCell value={project.kpis?.shortlist.total ?? shortlistCount} label="Shortlist" />
          <StatCell value={project.kpis?.booked ?? bookedCount} label="Booked" />
        </div>
      </Card>

      {/* Selection Assistant */}
      <SelectionAssistant
        onApplyFilters={(f, topTalent) => {
          setFilters({ ...EMPTY_FILTERS, ...f })
          setTopTalentActive(topTalent?.active ?? false)
          if (topTalent?.pct != null) setTopTalentPct(topTalent.pct)
        }}
      />

      {/* Multi-criteria search */}
      <FilterBar
        filters={filters}
        onFilters={setFilters}
        roles={roles}
        nationalityOptions={nationalityOptions}
        languageOptions={languageOptions}
        experienceOptions={experienceOptions}
        activeCount={activeCount}
        onSave={() => setSaveSearchOpen(true)}
        projectId={project.id}
        isNonScripted={project.format === 'non_scripted'}
      />

      {/* View toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-btn bg-paper p-1 ring-1 ring-line">
            <ViewTab active={view === 'list'} icon={<List className="h-3.5 w-3.5" />} label="List" onClick={() => { setView('list'); setColumnFocus(null) }} />
            <ViewTab active={view === 'kanban'} icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Talent Flow" onClick={() => setView('kanban')} />
            <ViewTab active={view === 'wall'} icon={<Grid2x2 className="h-3.5 w-3.5" />} label="Wall" onClick={() => { setView('wall'); setColumnFocus(null) }} />
          </div>
          {aiSort && (
            <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
              <Sparkles className="h-3 w-3" />
              Smart Sort
            </span>
          )}
          {topTalentActive && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <Wand2 className="h-3 w-3" />
              Top {topTalentPct}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Button
              variant={aiSort ? 'primary' : 'secondary'}
              size="sm"
              icon={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() => setAiSort((v) => !v)}
            >
              Smart Sort
            </Button>
            <SmartSortInfoTooltip />
          </span>
          <span className="relative flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              icon={<Wand2 className="h-3.5 w-3.5" />}
              className={cn(topTalentActive && 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}
              onClick={() => {
                if (!topTalentActive) { setTopTalentActive(true); setTopTalentOpen(true) }
                else setTopTalentOpen((v) => !v)
              }}
            >
              Top Talent
            </Button>
            {topTalentActive && (
              <button
                onClick={() => { setTopTalentActive(false); setTopTalentOpen(false) }}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-200 text-emerald-700 hover:bg-emerald-300"
                title="Remove filter"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
            <TopTalentInfoTooltip />
            {topTalentOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-card border border-line bg-card p-4 shadow-card-hover">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Show top candidates</span>
                  <button onClick={() => setTopTalentOpen(false)} className="text-muted hover:text-ink">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Threshold</span>
                    <span className="font-bold text-emerald-700">Top {topTalentPct}%</span>
                  </div>
                  <input
                    type="range" min={5} max={50} step={5}
                    value={topTalentPct}
                    onChange={(e) => setTopTalentPct(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>5%</span><span>25%</span><span>50%</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    Showing candidates ranked in the top {topTalentPct}% by composite score (current casting + historical performance).
                  </p>
                </div>
              </div>
            )}
          </span>
          {view !== 'wall' && (
            <Button
              variant={compareMode ? 'primary' : 'secondary'}
              size="sm"
              icon={<Columns2 className="h-3.5 w-3.5" />}
              onClick={() => {
                setCompareMode((v) => !v)
                setCompareIds(new Set())
              }}
            >
              Compare
            </Button>
          )}
          {view !== 'wall' && !compareMode && (
            <Button
              variant={selectMode ? 'primary' : 'secondary'}
              size="sm"
              icon={selectMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
              onClick={toggleSelectMode}
            >
              {selectMode ? 'Done selecting' : 'Select multiple'}
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted">
        {filteredCandidates.length} of {allCandidates.length} candidates ·{' '}
        {selectMode
          ? 'Click cards to select them, then change their status or message them in bulk.'
          : view === 'kanban'
            ? 'Drag a candidate card between columns to move them through the pipeline. New submissions must be reviewed before they can move.'
            : view === 'list'
              ? 'Double-click a row to watch the review.'
              : project.format === 'non_scripted'
                ? 'Move candidates to Cast across any team to fill the contestant slots on The Wall.'
                : 'Each role shows its current pick — Select to open the list and choose a candidate.'}
      </p>

      {columnFocus && view === 'list' && (
        <div className="flex items-center gap-2 -mt-2">
          <Tag tone="link" className="gap-1.5">
            Viewing: {BOARD_COLUMN_LABELS[columnFocus]}
            <button onClick={() => setColumnFocus(null)} className="text-link/70 hover:text-link">
              <X className="h-3 w-3" />
            </button>
          </Tag>
        </div>
      )}

      {/* Diversity alert bar */}
      <DiversityBar allCandidates={allCandidates} />

      {/* Compare modal — auto-opens when exactly 2 candidates selected */}
      {compareMode && compareSelectedCandidates.length === 2 && (
        <PairwiseModal
          candidateA={compareSelectedCandidates[0]}
          candidateB={compareSelectedCandidates[1]}
          onClose={() => { setCompareIds(new Set()); setCompareMode(false) }}
        />
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {BOARD_COLUMNS.map((col) => {
            const colCandidates = sortedCandidates.filter((c) => c.status === col)
            const isOver = overColumn === col
            const locked = LOCKED_COLUMNS.has(col)
            return (
              <div
                key={col}
                onDragOver={locked ? undefined : (e) => { e.preventDefault(); setOverColumn(col) }}
                onDragLeave={locked ? undefined : () => setOverColumn((c) => (c === col ? null : c))}
                onDrop={locked ? undefined : () => handleDrop(col)}
                className={cn(
                  'flex w-[230px] shrink-0 flex-col gap-2 rounded-card p-2 ring-1 transition-colors',
                  isOver ? 'bg-link/5 ring-link/30' : COLUMN_TONE[col] ?? 'bg-paper ring-line',
                )}
              >
                <div className="flex items-center justify-between px-1.5 py-1">
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-label text-muted">
                    {locked && <Lock className="h-3 w-3" />}
                    {BOARD_COLUMN_LABELS[col]}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="rounded-full bg-ink/10 px-1.5 py-0.5 text-[10px] font-bold text-ink">
                      {colCandidates.length}
                    </span>
                    {colCandidates.length > 0 && (
                      <>
                        {selectMode && (
                          <button
                            onClick={() => selectMany(colCandidates.map((c) => c.id))}
                            title={`Select all in ${BOARD_COLUMN_LABELS[col]}`}
                            className="flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-ink/10 hover:text-ink"
                          >
                            <CheckCheck className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => setWatchQueue(colCandidates)}
                          title={`Watch ${BOARD_COLUMN_LABELS[col]}`}
                          className="flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-ink/10 hover:text-ink"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => { setColumnFocus(col); setView('list') }}
                          title={`View ${BOARD_COLUMN_LABELS[col]} as a list`}
                          className="flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-ink/10 hover:text-ink"
                        >
                          <List className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {colCandidates.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      roleName={rolesById[c.roleId]?.name}
                      showRole={filters.roleIds.length !== 1}
                      dragging={draggedId === c.id}
                      draggable={!locked && !selectMode && !compareMode}
                      onDragStart={() => setDraggedId(c.id)}
                      onDragEnd={() => setDraggedId(null)}
                      onOpenReview={() => navigate(`/studio/review?p=${projectId}&role=${c.roleId}&candidate=${c.id}`)}
                      selectMode={selectMode}
                      selected={selectedIds.has(c.id)}
                      onToggleSelect={() => toggleSelected(c.id)}
                      compareMode={compareMode}
                      compareSelected={compareIds.has(c.id)}
                      onToggleCompare={() => toggleCompareSelect(c.id)}
                    />
                  ))}
                  {colCandidates.length === 0 && (
                    <div className="rounded-btn border border-dashed border-line py-8 text-center text-[11px] text-muted">
                      {locked ? 'No new submissions' : 'No candidates'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <ListView
          candidates={columnFocus ? sortedCandidates.filter((c) => c.status === columnFocus) : sortedCandidates}
          rolesById={rolesById}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelected}
          onSelectAll={selectMany}
          onOpenReview={(c) => navigate(`/studio/review?p=${projectId}&role=${c.roleId}&candidate=${c.id}`)}
          onWatchAll={(list) => setWatchQueue(list)}
          compareMode={compareMode}
          compareIds={compareIds}
          onToggleCompare={toggleCompareSelect}
          listSort={listSort}
          onToggleListSort={toggleListSort}
        />
      )}

      {/* Wall view */}
      {view === 'wall' && (
        <WallView
          roles={roles}
          allCandidates={allCandidates}
          onPlay={(c) => setWatchQueue([c])}
          isNonScripted={project.format === 'non_scripted'}
          contestantCount={project.kpis?.roles.total ?? roles.length}
        />
      )}

      {/* Bulk action bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center px-4 pb-5">
          <div className="flex items-center gap-3 rounded-card bg-ink px-4 py-3 text-white shadow-card-hover">
            <span className="text-sm font-semibold">
              {selectedIds.size} candidate{selectedIds.size === 1 ? '' : 's'} selected
            </span>
            <button onClick={clearSelection} className="text-xs font-medium text-white/70 hover:text-white">
              Deselect all
            </button>
            <span className="h-5 w-px bg-white/20" />
            <Button size="sm" variant="secondary" onClick={() => setStatusModalOpen(true)}>
              Change status
            </Button>
            <Button size="sm" icon={<Send className="h-3.5 w-3.5" />} onClick={() => setMessageModalOpen(true)}>
              Send a message
            </Button>
          </div>
        </div>
      )}

      {/* Change status modal */}
      <EditModal open={statusModalOpen} title="Change status" onClose={() => setStatusModalOpen(false)}>
        <p className="text-sm text-muted">
          Move {selectedIds.size} candidate{selectedIds.size === 1 ? '' : 's'} to:
        </p>
        <div className="flex flex-col gap-1.5">
          {BOARD_COLUMNS.filter((c) => c !== 'new').map((col) => (
            <button
              key={col}
              onClick={() => bulkMoveTo(col)}
              className="flex items-center justify-between rounded-btn border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-paper"
            >
              {BOARD_COLUMN_LABELS[col]}
            </button>
          ))}
        </div>
      </EditModal>

      {/* Send a message modal */}
      <SendMessageModal
        open={messageModalOpen}
        candidates={selectedCandidates}
        onRemove={toggleSelected}
        onClose={() => setMessageModalOpen(false)}
        onSend={(n) => {
          toast(`Message sent to ${n} candidate${n === 1 ? '' : 's'}`)
          setMessageModalOpen(false)
          clearSelection()
        }}
      />

      {/* Save search modal */}
      <SaveSearchModal
        open={saveSearchOpen}
        onClose={() => setSaveSearchOpen(false)}
        onSave={(name) => {
          saveSearch(project.id, name, filters)
          toast(`Search saved to your playlists as "${name}"`)
          setSaveSearchOpen(false)
        }}
      />

      {/* Watch modal */}
      {watchQueue && watchQueue.length > 0 && (
        <WatchModal candidates={watchQueue} rolesById={rolesById} onClose={() => setWatchQueue(null)} />
      )}
    </div>
  )
}

/* ── Selection Assistant ──────────────────────────────────────────────────── */

type StepId = 1 | 2 | 3

type AssistantPlaylist = {
  label: string
  filters: Partial<SavedSearchFilters>
  topTalent?: { active: boolean; pct?: number }
}

const ASSISTANT_STEPS: {
  id: StepId
  label: string
  description: string
  playlists: AssistantPlaylist[]
}[] = [
  {
    id: 1,
    label: 'Review',
    description: 'Rate every candidate — Good, Maybe, or No go. Goal: empty the "To Review" column entirely before moving on.',
    playlists: [
      { label: 'All "To Review"', filters: { reviewStatus: 'not_reviewed' } },
      { label: 'Top 30% not reviewed', filters: { reviewStatus: 'not_reviewed' }, topTalent: { active: true, pct: 30 } },
      { label: '⭐ New candidates', filters: { reviewStatus: 'not_reviewed', isNewCandidateFilter: true } },
    ],
  },
  {
    id: 2,
    label: 'Shortlist',
    description: 'Sharpen your Shortlisted & Callback columns. Re-evaluate Maybes and No gos — keep only the strongest profiles.',
    playlists: [
      { label: 'All reviewed', filters: { reviewStatus: 'reviewed' } },
      { label: 'All "No go"', filters: { majoritySignal: 'no' as Signal } },
      { label: 'All "Maybe"', filters: { majoritySignal: 'maybe' as Signal } },
      { label: 'Top reviewed (30%)', filters: { reviewStatus: 'reviewed' }, topTalent: { active: true, pct: 30 } },
      { label: '⭐ New candidates reviewed', filters: { reviewStatus: 'reviewed', isNewCandidateFilter: true } },
    ],
  },
  {
    id: 3,
    label: 'Finalize Casting',
    description: 'Move your final picks to Offer or Cast. Review eliminated profiles in the No go column.',
    playlists: [
      { label: 'All remaining', filters: { statusFilter: 'finalized' } },
      { label: 'Top 30% remaining', filters: { statusFilter: 'finalized' }, topTalent: { active: true, pct: 30 } },
      { label: 'All eliminated', filters: { statusFilter: 'eliminated' } },
    ],
  },
]

function SelectionAssistant({
  onApplyFilters,
}: {
  onApplyFilters: (f: Partial<SavedSearchFilters>, topTalent: { active: boolean; pct?: number } | null) => void
}) {
  const [activeStep, setActiveStep] = useState<StepId | null>(null)
  const step = ASSISTANT_STEPS.find((s) => s.id === activeStep)

  return (
    <div className="rounded-card border border-line bg-paper">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <Wand2 className="h-4 w-4 text-link shrink-0" />
        <span className="text-sm font-semibold text-ink">Selection Assistant</span>
        <div className="flex items-center gap-1">
          {ASSISTANT_STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStep((cur) => cur === s.id ? null : s.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-btn px-3 py-1.5 text-xs font-semibold transition-colors',
                activeStep === s.id
                  ? 'bg-link text-white'
                  : 'bg-card border border-line text-muted hover:text-ink hover:border-ink/30',
              )}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[9px] font-bold">
                {s.id}
              </span>
              {s.label}
            </button>
          ))}
        </div>
        {step && (
          <p className="ml-1 text-xs text-muted italic">{step.description}</p>
        )}
      </div>
      {step && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
          {step.playlists.map((p) => (
            <button
              key={p.label}
              onClick={() => onApplyFilters(p.filters, p.topTalent ?? null)}
              className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-muted hover:border-link/40 hover:bg-link/5 hover:text-link transition-colors"
            >
              <Play className="h-3 w-3" />
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Filter bar ───────────────────────────────────────────────────────────── */

function FilterBar({
  filters,
  onFilters,
  roles,
  nationalityOptions,
  languageOptions,
  experienceOptions,
  activeCount,
  onSave,
  projectId,
  isNonScripted,
}: {
  filters: SavedSearchFilters
  onFilters: (f: SavedSearchFilters) => void
  roles: Role[]
  nationalityOptions: string[]
  languageOptions: string[]
  experienceOptions: string[]
  activeCount: number
  onSave: () => void
  projectId: string
  isNonScripted?: boolean
}) {
  const toast = useToast()
  const savedSearches = useSavedSearches(projectId)
  const [playlistsOpen, setPlaylistsOpen] = useState(false)

  const toggleIn = (key: keyof SavedSearchFilters, value: string) => {
    const list = filters[key] as string[]
    onFilters({
      ...filters,
      [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    })
  }

  const clearAll = () => onFilters(EMPTY_FILTERS)

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown label={isNonScripted ? 'Casting Team' : 'Role / Candidate'} count={filters.roleIds.length}>
          <CheckList
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            selected={filters.roleIds}
            onToggle={(v) => toggleIn('roleIds', v)}
            onSelectAll={() => onFilters({ ...filters, roleIds: roles.map((r) => r.id) })}
            onClearAll={() => onFilters({ ...filters, roleIds: [] })}
          />
        </FilterDropdown>

        <FilterDropdown label="Rating" count={filters.signals.length}>
          <CheckList
            options={SIGNAL_OPTIONS.map((o) => ({ value: o.value, label: o.label, dot: o.dot }))}
            selected={filters.signals}
            onToggle={(v) => toggleIn('signals', v)}
          />
        </FilterDropdown>

        <FilterDropdown label="Review status" count={filters.reviewStatus != null ? 1 : 0}>
          <div className="flex flex-col gap-0.5 p-1">
            {([
              { value: null,           label: 'All candidates' },
              { value: 'reviewed',     label: 'Reviewed — has a note' },
              { value: 'not_reviewed', label: 'Not reviewed — new' },
            ] as const).map(({ value, label }) => (
              <button
                key={String(value)}
                onClick={() => onFilters({ ...filters, reviewStatus: value })}
                className={cn(
                  'flex items-center gap-2 rounded-btn px-3 py-2 text-left text-sm transition-colors hover:bg-ink/5',
                  filters.reviewStatus === value ? 'font-semibold text-ink' : 'text-muted',
                )}
              >
                <span className={cn(
                  'h-2 w-2 rounded-full border',
                  filters.reviewStatus === value ? 'border-ink bg-ink' : 'border-muted bg-transparent',
                )} />
                {label}
              </button>
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label="Scene score" count={filters.sceneStarsMin != null ? 1 : 0}>
          <div className="flex flex-col gap-2 p-2">
            <p className="text-xs text-muted">Minimum scene analysis rating</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => onFilters({ ...filters, sceneStarsMin: filters.sceneStarsMin === n ? null : n })}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-btn border text-sm font-bold transition-all',
                    filters.sceneStarsMin != null && n <= filters.sceneStarsMin
                      ? 'border-gold bg-gold/20 text-[#8A6D00]'
                      : 'border-line bg-paper text-muted hover:border-gold/60',
                  )}
                >
                  {n}★
                </button>
              ))}
            </div>
            {filters.sceneStarsMin != null && (
              <p className="text-[11px] text-muted">{filters.sceneStarsMin}+ stars minimum</p>
            )}
          </div>
        </FilterDropdown>

        <FilterDropdown label="Score" count={filters.scoreMin != null || filters.scoreMax != null ? 1 : 0}>
          <div className="flex flex-col gap-2 p-2">
            <p className="text-xs text-muted">Weighted Let It Cast score (0–100)</p>
            <div className="flex items-center gap-2">
              <TextInput
                type="number"
                placeholder="Min"
                value={filters.scoreMin ?? ''}
                onChange={(e) => onFilters({ ...filters, scoreMin: e.target.value === '' ? null : Number(e.target.value) })}
                className="w-20"
              />
              <span className="text-muted">–</span>
              <TextInput
                type="number"
                placeholder="Max"
                value={filters.scoreMax ?? ''}
                onChange={(e) => onFilters({ ...filters, scoreMax: e.target.value === '' ? null : Number(e.target.value) })}
                className="w-20"
              />
            </div>
          </div>
        </FilterDropdown>

        <FilterDropdown label="Reviewed by" count={filters.reviewerIds.length}>
          <CheckList
            options={team.map((m) => ({ value: m.id, label: `${m.name} · ${m.role}` }))}
            selected={filters.reviewerIds}
            onToggle={(v) => toggleIn('reviewerIds', v)}
            onSelectAll={() => onFilters({ ...filters, reviewerIds: team.map((m) => m.id) })}
            onClearAll={() => onFilters({ ...filters, reviewerIds: [] })}
          />
        </FilterDropdown>

        <FilterDropdown label="Talent criteria" count={filters.genders.length + filters.experienceLevels.length + filters.nationalities.length + filters.languages.length}>
          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto p-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-label text-muted">Gender</p>
              <CheckList
                options={[{ value: 'F', label: 'Female' }, { value: 'M', label: 'Male' }]}
                selected={filters.genders}
                onToggle={(v) => toggleIn('genders', v)}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-label text-muted">Experience</p>
              <CheckList
                options={experienceOptions.map((v) => ({ value: v, label: v }))}
                selected={filters.experienceLevels}
                onToggle={(v) => toggleIn('experienceLevels', v)}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-label text-muted">Nationality</p>
              <CheckList
                options={nationalityOptions.map((v) => ({ value: v, label: v }))}
                selected={filters.nationalities}
                onToggle={(v) => toggleIn('nationalities', v)}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-label text-muted">Languages</p>
              <CheckList
                options={languageOptions.map((v) => ({ value: v, label: v }))}
                selected={filters.languages}
                onToggle={(v) => toggleIn('languages', v)}
              />
            </div>
          </div>
        </FilterDropdown>

        {/* Search */}
        <div className="relative ml-auto min-w-[200px] flex-1 sm:flex-none sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={filters.query}
            onChange={(e) => onFilters({ ...filters, query: e.target.value })}
            placeholder="Search talent, role, criteria…"
            className="h-9 w-full rounded-btn border border-line bg-paper pl-9 pr-3 text-sm text-ink outline-none placeholder:text-muted/60 focus:border-ink/30 focus:bg-card"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-2.5">
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs font-medium text-link hover:underline">
              Clear all filters ({activeCount})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" icon={<Bookmark className="h-3.5 w-3.5" />} onClick={onSave} disabled={activeCount === 0}>
            Save search
          </Button>

          <div className="relative">
            <Button size="sm" variant="secondary" iconRight={<ChevronDown className="h-3.5 w-3.5" />} onClick={() => setPlaylistsOpen((v) => !v)}>
              Playlists{savedSearches.length > 0 ? ` (${savedSearches.length})` : ''}
            </Button>
            {playlistsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPlaylistsOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-card border border-line bg-card p-1.5 shadow-card-hover">
                  {savedSearches.length === 0 ? (
                    <p className="px-2.5 py-3 text-center text-sm text-muted">No saved searches yet.</p>
                  ) : (
                    savedSearches.map((s) => (
                      <div key={s.id} className="flex items-center gap-1 rounded-btn px-2 py-1.5 hover:bg-paper">
                        <button
                          onClick={() => {
                            onFilters(s.filters)
                            setPlaylistsOpen(false)
                            toast(`Loaded playlist "${s.name}"`)
                          }}
                          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-ink"
                        >
                          {s.name}
                        </button>
                        <button
                          onClick={() => deleteSearch(s.id)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted hover:bg-signal-no/10 hover:text-signal-no"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function FilterDropdown({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
          count > 0 ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-ink hover:bg-ink/5',
        )}
      >
        {label}
        {count > 0 && <span className="rounded-full bg-white/20 px-1.5 text-[10px]">{count}</span>}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-2 w-64 rounded-card border border-line bg-card p-1.5 shadow-card-hover">
            {children}
          </div>
        </>
      )}
    </div>
  )
}

function CheckList({
  options,
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
}: {
  options: { value: string; label: string; dot?: string }[]
  selected: string[]
  onToggle: (value: string) => void
  onSelectAll?: () => void
  onClearAll?: () => void
}) {
  const allSelected = options.length > 0 && options.every((o) => selected.includes(o.value))
  return (
    <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
      {(onSelectAll || onClearAll) && options.length > 0 && (
        <button
          onClick={allSelected ? onClearAll : onSelectAll}
          className="flex items-center gap-1.5 border-b border-line px-2.5 py-1.5 text-xs font-semibold text-link hover:bg-paper"
        >
          <CheckCheck className="h-3 w-3" />
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      )}
      {options.length === 0 && <p className="px-2.5 py-2 text-sm text-muted">No options.</p>}
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-center gap-2 rounded-btn px-2.5 py-1.5 text-sm text-ink hover:bg-paper"
        >
          <input
            type="checkbox"
            checked={selected.includes(o.value)}
            onChange={() => onToggle(o.value)}
            className="h-3.5 w-3.5 accent-link"
          />
          {o.dot && <span className={cn('h-2 w-2 rounded-full', o.dot)} />}
          {o.label}
        </label>
      ))}
    </div>
  )
}

/* ── Save search modal ────────────────────────────────────────────────────── */

function SaveSearchModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (name: string) => void
}) {
  const [name, setName] = useState('')
  return (
    <EditModal
      open={open}
      title="Save this search"
      onClose={onClose}
      onSave={() => name.trim() && onSave(name.trim())}
      saveLabel="Save to playlists"
    >
      <Field label="Playlist name">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Female leads, 80+ score"
          autoFocus
        />
      </Field>
    </EditModal>
  )
}

/* ── Send a message modal ─────────────────────────────────────────────────── */

function SendMessageModal({
  open,
  candidates,
  onRemove,
  onClose,
  onSend,
}: {
  open: boolean
  candidates: Candidate[]
  onRemove: (id: string) => void
  onClose: () => void
  onSend: (count: number) => void
}) {
  const [subject, setSubject] = useState('[firstname], candidature bien reçue pour [job_name]')
  const [body, setBody] = useState(
    'Bonjour [firstname],\n\nNous avons bien reçu votre candidature pour le poste de "[job_name]", nous l\'étudions avec attention et revenons vers vous dans les plus brefs délais.\n\nÀ très bientôt,\nL\'équipe [company_name]',
  )

  return (
    <EditModal
      open={open}
      title="Send a message"
      onClose={onClose}
      onSave={() => onSend(candidates.length)}
      saveLabel="Send"
    >
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-label text-muted">
          {candidates.length} candidate{candidates.length === 1 ? '' : 's'} concerned
        </p>
        <div className="flex flex-wrap gap-1.5">
          {candidates.map((c) => (
            <Tag key={c.id} className="gap-1.5">
              {c.name}
              <button onClick={() => onRemove(c.id)} className="text-muted/60 hover:text-signal-no">
                <X className="h-3 w-3" />
              </button>
            </Tag>
          ))}
          {candidates.length === 0 && <span className="text-sm text-muted">No candidates selected.</span>}
        </div>
      </div>

      <Field label="Subject">
        <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="Message">
        <TextArea rows={7} value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-label text-muted">Variables</p>
        <div className="flex flex-wrap gap-1.5">
          {['company_name', 'firstname', 'lastname', 'job_name', 'recruiter_name'].map((v) => (
            <Tag key={v} tone="neutral" className="font-mono text-[11px]">
              [{v}]
            </Tag>
          ))}
        </div>
      </div>
    </EditModal>
  )
}

/* ── View toolbar ─────────────────────────────────────────────────────────── */

function ViewTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-btn px-3 py-1.5 text-xs font-semibold transition-colors',
        active ? 'bg-ink text-white' : 'text-muted hover:text-ink',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

/* ── Composite score helpers ─────────────────────────────────────────────── */

/** Deterministic mock historical score from candidate ID (30–80). */
function historicalScore(candidate: { id: string }): number {
  const explicit = videoPerformanceScore(candidate.id)
  if (explicit != null) return explicit
  let h = 0
  for (const ch of candidate.id) h = (h * 31 + ch.charCodeAt(0)) & 0xffff
  return 30 + (h % 51)
}

/**
 * Composite performance score: current casting weighted 3×, historical 1×.
 * Formula: (currentScore × 3 + historicalScore × 1) / 4
 */
function compositeScore(candidate: Parameters<typeof candidateScore>[0] & { id: string }): number {
  return Math.round((candidateScore(candidate) * 3 + historicalScore(candidate)) / 4)
}

/* ── List view helpers ────────────────────────────────────────────────────── */

function ListInfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="flex h-4 w-4 items-center justify-center text-muted/50 hover:text-muted"
        aria-label="More info"
      >
        <Info className="h-3 w-3" />
      </button>
      {visible && (
        <span className="absolute left-1/2 top-full z-50 mt-1.5 w-60 -translate-x-1/2 rounded-btn bg-ink px-3 py-2 text-[11px] leading-relaxed text-white shadow-lg">
          <span className="absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 border-x-4 border-b-4 border-x-transparent border-b-ink" />
          {text}
        </span>
      )}
    </span>
  )
}

function TopTalentInfoTooltip() {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="flex h-5 w-5 items-center justify-center text-muted/50 hover:text-muted"
        aria-label="Top Talent info"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {visible && (
        <span className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-btn bg-ink px-3 py-2 text-[11px] leading-relaxed text-white shadow-lg">
          <span className="absolute bottom-full right-2 h-0 w-0 border-x-4 border-b-4 border-x-transparent border-b-ink" />
          Filters profiles by composite score: current casting performance (×3 weight) combined with historical performance across all past castings (×1 weight). Use the slider to set the top % threshold.
        </span>
      )}
    </span>
  )
}

function SmartSortInfoTooltip() {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="flex h-5 w-5 items-center justify-center text-muted/50 hover:text-muted"
        aria-label="Smart Sort info"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {visible && (
        <span className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-btn bg-ink px-3 py-2 text-[11px] leading-relaxed text-white shadow-lg">
          <span className="absolute bottom-full right-2 h-0 w-0 border-x-4 border-b-4 border-x-transparent border-b-ink" />
          Sorts candidates by pipeline stage first (Cast → Callback → New → No go), then by Performance Score within each stage. Activate to surface the most promising profiles instantly.
        </span>
      )}
    </span>
  )
}

function SortButton({
  col,
  listSort,
  onToggle,
}: {
  col: 'score' | 'status'
  listSort: { col: 'score' | 'status'; dir: 'asc' | 'desc' } | null
  onToggle?: (col: 'score' | 'status') => void
}) {
  const active = listSort?.col === col
  const dir = active ? listSort!.dir : null
  return (
    <button
      onClick={() => onToggle?.(col)}
      title={active ? (dir === 'desc' ? 'Sorted high → low (click for low → high)' : 'Sorted low → high (click to reset)') : 'Sort by this column'}
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded transition-colors',
        active ? 'text-link' : 'text-muted/50 hover:text-muted',
      )}
    >
      {active && dir === 'desc' ? (
        <span className="text-[10px] font-bold leading-none">↓</span>
      ) : active && dir === 'asc' ? (
        <span className="text-[10px] font-bold leading-none">↑</span>
      ) : (
        <ArrowUpDown className="h-3 w-3" />
      )}
    </button>
  )
}

/* ── List view ────────────────────────────────────────────────────────────── */

function ListView({
  candidates,
  rolesById,
  selectMode,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onOpenReview,
  onWatchAll,
  compareMode = false,
  compareIds = new Set<string>(),
  onToggleCompare,
  listSort,
  onToggleListSort,
}: {
  candidates: Candidate[]
  rolesById: Record<string, Role>
  selectMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onOpenReview: (c: Candidate) => void
  onWatchAll: (list: Candidate[]) => void
  compareMode?: boolean
  compareIds?: Set<string>
  onToggleCompare?: (id: string) => void
  listSort?: { col: 'score' | 'status'; dir: 'asc' | 'desc' } | null
  onToggleListSort?: (col: 'score' | 'status') => void
}) {
  const navigate = useNavigate()
  if (candidates.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line py-16 text-center text-sm text-muted">
        No candidates match these filters.
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-2.5">
        {selectMode ? (
          <button
            onClick={() => onSelectAll(candidates.map((c) => c.id))}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-link"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Select all ({candidates.length})
          </button>
        ) : (
          <span />
        )}
        <Button size="sm" variant="secondary" icon={<Play className="h-3.5 w-3.5" />} onClick={() => onWatchAll(candidates)}>
          Watch
        </Button>
      </div>

      {/* Column headers */}
      <div className={cn(LIST_GRID, 'border-b border-line bg-paper px-4 py-2.5')}>
        <span />
        <span className="col-span-2 text-[11px] font-bold uppercase tracking-wide text-muted">Talent</span>
        <span className="text-center text-[11px] font-bold uppercase tracking-wide text-muted">Watch</span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Team evaluation</span>
        <span />
        <span className="flex items-center justify-center gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Performance Score</span>
          <ListInfoTooltip text="Composite score: current casting votes (Good ×2, Maybe ×1, No go −1) weighted ×3, combined with historical performance across all past castings weighted ×1. Divided by 4 for the final score." />
          <SortButton col="score" listSort={listSort ?? null} onToggle={onToggleListSort} />
        </span>
        <span className="flex items-center justify-end gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Status</span>
          <SortButton col="status" listSort={listSort ?? null} onToggle={onToggleListSort} />
        </span>
      </div>

      {candidates.map((c, i) => {
        const score = candidateScore(c)
        const reviewed = c.good + c.maybe + c.no > 0
        const scoreColor = score >= 75 ? 'text-signal-good' : score >= 50 ? 'text-[#8A6D00]' : 'text-signal-no'
        const teamRatings = deriveTeamRatings(c)
        const selected = selectedIds.has(c.id)
        const compareSelected = compareIds.has(c.id)
        // Historical score for unreviewed candidates
        const histScore = historicalScore(c)
        // Comment bubble count = number of team members who rated
        const commentCount = teamRatings.length
        // Majority vote label
        const totalVotes = c.good + c.maybe + c.no
        const majorityLabel = totalVotes > 0
          ? c.no > c.good && c.no >= c.maybe ? 'No go'
          : c.maybe > c.good && c.maybe > c.no ? 'Maybe'
          : null
          : null
        return (
          <div
            key={c.id}
            onClick={compareMode ? () => onToggleCompare?.(c.id) : selectMode ? () => onToggleSelect(c.id) : undefined}
            onDoubleClick={selectMode || compareMode ? undefined : () => onOpenReview(c)}
            title={compareMode ? 'Click to select for comparison' : selectMode ? 'Click to select' : 'Double-click to watch the review'}
            className={cn(
              LIST_GRID,
              'px-4 py-3.5',
              i > 0 && 'border-t border-line',
              selectMode || compareMode ? 'cursor-pointer' : 'cursor-default',
              compareSelected ? 'bg-purple-50 ring-2 ring-inset ring-purple-500' : selected ? 'bg-link/5' : 'hover:bg-paper',
            )}
          >
            {/* checkbox */}
            <span>
              {compareMode ? (
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                    compareSelected ? 'border-purple-500 bg-purple-500 text-white' : 'border-line text-transparent',
                  )}
                >
                  <Check className="h-3 w-3" />
                </span>
              ) : selectMode && (
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                    selected ? 'border-link bg-link text-white' : 'border-line text-transparent',
                  )}
                >
                  <CheckSquare className="h-3 w-3" />
                </span>
              )}
            </span>

            {/* photo */}
            <Avatar src={c.avatar} name={c.name} size="md" />

            {/* role + name */}
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-wide text-muted">
                {rolesById[c.roleId]?.name ?? '—'}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/studio/talent/${c.id}`) }}
                className="block max-w-full truncate text-left text-sm font-semibold text-link hover:underline"
              >
                {c.name}
              </button>
              <p className="truncate text-[11px] text-muted">{c.age} y/o · {c.city}</p>
            </div>

            {/* watch — navigates to full review */}
            <button
              onClick={(e) => { e.stopPropagation(); onOpenReview(c) }}
              title="Review"
              className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full bg-[#E62117] text-white shadow-sm transition-colors hover:bg-signal-good"
            >
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </button>

            {/* team ratings — small squares with initials */}
            <div className="flex flex-wrap items-center gap-1">
              {teamRatings.length === 0 && <span className="text-xs text-muted">No reviews yet</span>}
              {teamRatings.map((r, idx) => (
                <span
                  key={`${r.initials}-${idx}`}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-white',
                    r.signal === 'good' && 'bg-signal-good',
                    r.signal === 'maybe' && 'bg-signal-maybe',
                    r.signal === 'no' && 'bg-signal-no',
                  )}
                  title="Collective review"
                >
                  {r.initials}
                </span>
              ))}
            </div>

            {/* comment bubble */}
            <div className="flex items-center justify-center">
              {commentCount > 0 && (
                <span className="flex h-6 min-w-[24px] items-center justify-center gap-0.5 rounded-full bg-link/10 px-1.5 text-[11px] font-bold text-link">
                  💬 {commentCount}
                </span>
              )}
            </div>

            {/* score */}
            <div className="flex flex-col items-center gap-0.5 text-center">
              {reviewed ? (
                <>
                  <span className={cn('text-base font-bold', scoreColor)}>{score}</span>
                  {majorityLabel === 'No go' && (
                    <span className="rounded-full bg-signal-no/15 px-2 py-0.5 text-[9px] font-bold text-signal-no">No go</span>
                  )}
                  {majorityLabel === 'Maybe' && (
                    <span className="rounded-full bg-signal-maybe/15 px-2 py-0.5 text-[9px] font-bold text-[#8A6D00]">Maybe</span>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-base font-bold text-muted/50">{histScore}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted">Historical</span>
                </div>
              )}
            </div>

            {/* status — editable */}
            <div className="text-right" onClick={(e) => e.stopPropagation()}>
              <StatusEditor candidate={c} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Status editor (list view) ───────────────────────────────────────────── */

function StatusEditor({ candidate }: { candidate: Candidate }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const tone = candidate.status === 'cast' || candidate.status === 'offer' ? 'good' : candidate.status === 'new' ? 'neutral' : 'link'

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1">
        <Tag tone={tone}>{BOARD_COLUMN_LABELS[candidate.status]}</Tag>
        <ChevronDown className="h-3 w-3 text-muted" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-card border border-line bg-card p-1.5 text-left shadow-card-hover">
            {BOARD_COLUMNS.filter((col) => col !== 'new').map((col) => (
              <button
                key={col}
                onClick={() => {
                  const r = moveCandidate(candidate.id, col)
                  if (!r.ok) toast(r.reason ?? "Couldn't move candidate")
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-btn px-2.5 py-1.5 text-sm hover:bg-paper',
                  candidate.status === col ? 'font-semibold text-ink' : 'text-muted',
                )}
              >
                {BOARD_COLUMN_LABELS[col]}
                {candidate.status === col && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Wall view ────────────────────────────────────────────────────────────── */

function WallView({
  roles,
  allCandidates,
  onPlay,
  isNonScripted = false,
  contestantCount = 0,
}: {
  roles: Role[]
  allCandidates: Candidate[]
  onPlay: (candidate: Candidate) => void
  isNonScripted?: boolean
  contestantCount?: number
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [focusRoleId, setFocusRoleId] = useState<string | null>(null)
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const roleRefs = useRef<Record<string, HTMLElement | null>>({})

  const openPicker = (roleId: string) => {
    setFocusRoleId(roleId)
    setPickerOpen(true)
    setSearchQuery('')
    setTimeout(() => {
      searchRef.current?.focus()
      roleRefs.current[roleId]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }, 80)
  }

  const openSlotPicker = (slotIndex: number) => {
    setPickerSlot(slotIndex)
    setPickerOpen(true)
    setSearchQuery('')
    setTimeout(() => searchRef.current?.focus(), 80)
  }

  const closePicker = () => {
    setPickerOpen(false)
    setFocusRoleId(null)
    setPickerSlot(null)
    setSearchQuery('')
  }

  const removeFromWall = (candidateId: string) => {
    moveCandidate(candidateId, 'shortlisted')
  }

  // ── Non-scripted wall: N contestant slots filled from the shared pool ──────
  if (isNonScripted) {
    const slotCount = contestantCount || roles.length
    const castPool = allCandidates
      .filter((c) => c.status === 'cast' || c.status === 'offer')
      .sort((a, b) => candidateScore(b) - candidateScore(a))
    const slots: (Candidate | null)[] = Array.from({ length: slotCount }, (_, i) => castPool[i] ?? null)

    // Candidates eligible for the picker: shortlisted and above, not already cast/offer
    const pickerCandidates = allCandidates
      .filter((c) => {
        if (c.status === 'new' || c.status === 'no-go' || c.status === 'cast' || c.status === 'offer') return false
        if (searchQuery) return c.name.toLowerCase().includes(searchQuery.toLowerCase())
        return true
      })
      .sort((a, b) => candidateScore(b) - candidateScore(a))

    return (
      <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {slots.map((person, i) => (
            <Card key={i} flush className="flex flex-col overflow-hidden">
              {person ? (
                <>
                  <div className="group relative aspect-square overflow-hidden bg-paper">
                    {person.avatar ? (
                      <img src={asset(person.avatar)} alt={person.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Avatar name={person.name} size="xl" />
                      </div>
                    )}
                    <button
                      onClick={() => onPlay(person)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg">
                        <Play className="ml-0.5 h-4 w-4" />
                      </span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromWall(person.id) }}
                      className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-signal-no/80"
                      title="Remove from wall"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <p className="text-xs font-bold uppercase tracking-label text-muted">Contestant {i + 1}</p>
                    <p className="truncate text-sm font-semibold text-ink">{person.name}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold',
                        person.status === 'cast' ? 'bg-signal-good-bg text-signal-good' : 'bg-gold/15 text-[#8A6D00]',
                      )}>
                        {person.status === 'cast' ? 'Cast' : 'Offer'}
                      </span>
                      <span className="text-xs font-bold text-match">{candidateScore(person)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-32 items-center justify-center bg-paper">
                    <UserRound className="h-10 w-10 text-line" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="text-xs font-bold uppercase tracking-label text-muted">Contestant {i + 1}</p>
                    <p className="text-xs text-muted">Slot open</p>
                    <Button size="sm" variant="secondary" className="mt-auto" onClick={() => openSlotPicker(i)}>
                      Select
                    </Button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>

        {/* ── Non-scripted picker: full pool, no role grouping ── */}
        {pickerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-card">
            <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <button onClick={closePicker} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink">
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-base font-bold text-ink">Select a contestant</h2>
                {pickerSlot !== null && (
                  <span className="rounded-full bg-link/10 px-2.5 py-0.5 text-xs font-semibold text-link">
                    Contestant {pickerSlot + 1}
                  </span>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name…"
                  className="h-9 w-60 rounded-full border border-line bg-paper pl-9 pr-4 text-sm outline-none focus:border-ink/30"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {pickerCandidates.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                  {pickerCandidates.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { moveCandidate(c.id, 'cast'); closePicker() }}
                      className="group relative overflow-hidden rounded-card border border-transparent transition-all hover:border-link/40 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-link/40"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-paper">
                        {c.avatar ? (
                          <img src={asset(c.avatar)} alt={c.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-paper">
                            <UserRound className="h-8 w-8 text-line" />
                          </div>
                        )}
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {candidateScore(c)}
                        </span>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-8">
                          <p className="truncate text-left text-[11px] font-bold leading-tight text-white">{c.name}</p>
                          <p className="truncate text-left text-[10px] leading-tight text-white/60">{roles.find((r) => r.id === c.roleId)?.name ?? ''}</p>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-link/20 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg">
                            <Check className="h-5 w-5 text-link" />
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                  <UserRound className="h-12 w-12 text-line" />
                  <p className="text-sm font-semibold text-muted">
                    {searchQuery ? 'No candidates match your search' : 'No shortlisted candidates available — review submissions first'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  // ── Scripted wall: one card per role ──────────────────────────────────────
  return (
    <>
      {/* ── Wall grid ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {roles.map((role) => {
          const candidates = allCandidates.filter((c) => c.roleId === role.id)
          const chosen = candidates.filter((c) => c.status === 'cast' || c.status === 'offer')
          const shortlistRank = BOARD_COLUMNS.indexOf('shortlisted')
          const shortlisted = candidates.filter((c) => BOARD_COLUMNS.indexOf(c.status) >= shortlistRank).length

          return (
            <Card key={role.id} flush className="flex flex-col overflow-hidden">
              {chosen.length > 0 ? (
                <>
                  <div className={cn('grid', chosen.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                    {chosen.map((c) => (
                      <div key={c.id} className="group relative aspect-square overflow-hidden bg-paper">
                        {c.avatar ? (
                          <img src={asset(c.avatar)} alt={c.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Avatar name={c.name} size="xl" />
                          </div>
                        )}
                        {/* Play overlay */}
                        <button
                          onClick={() => onPlay(c)}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg">
                            <Play className="ml-0.5 h-4 w-4" />
                          </span>
                        </button>
                        {/* Trash button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromWall(c.id) }}
                          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-signal-no/80"
                          title="Remove from wall"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <p className="text-xs font-bold uppercase tracking-label text-muted">{role.name}</p>
                    {chosen.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                            c.status === 'cast' ? 'bg-signal-good-bg text-signal-good' : 'bg-gold/15 text-[#8A6D00]',
                          )}
                        >
                          {c.status === 'cast' ? 'Cast' : 'Offer'}
                        </span>
                      </div>
                    ))}
                    <button
                      onClick={() => openPicker(role.id)}
                      className="mt-1 text-left text-xs font-medium text-link hover:underline"
                    >
                      + Add another
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-32 items-center justify-center bg-paper">
                    <UserRound className="h-10 w-10 text-line" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="font-bold text-ink">{role.name}</p>
                    <p className="text-xs text-muted">{candidates.length} submissions · {shortlisted} shortlisted</p>
                    <Button size="sm" variant="secondary" className="mt-auto" onClick={() => openPicker(role.id)}>
                      Select
                    </Button>
                  </div>
                </>
              )}
            </Card>
          )
        })}
      </div>

      {/* ── Full-screen candidate picker ── */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-card">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={closePicker}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold text-ink">Select a candidate</h2>
              {focusRoleId && (
                <span className="rounded-full bg-link/10 px-2.5 py-0.5 text-xs font-semibold text-link">
                  {roles.find((r) => r.id === focusRoleId)?.name}
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name…"
                className="h-9 w-60 rounded-full border border-line bg-paper pl-9 pr-4 text-sm outline-none focus:border-ink/30"
              />
            </div>
          </div>

          {/* Scrollable body — grouped by role */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {roles.map((role) => {
              const roleCandidates = allCandidates.filter((c) => {
                if (c.roleId !== role.id) return false
                if (c.status === 'new') return false
                if (searchQuery) return c.name.toLowerCase().includes(searchQuery.toLowerCase())
                return true
              })
              if (roleCandidates.length === 0) return null

              return (
                <div
                  key={role.id}
                  ref={(el) => { roleRefs.current[role.id] = el }}
                  className="mb-8"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <h3 className="font-bold text-ink">{role.name}</h3>
                    <span className="text-sm text-muted">{roleCandidates.length} candidate{roleCandidates.length !== 1 ? 's' : ''}</span>
                    {role.id === focusRoleId && (
                      <span className="rounded-full bg-link/10 px-2 py-0.5 text-[11px] font-semibold text-link">
                        Selected role
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                    {roleCandidates.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { moveCandidate(c.id, 'offer'); closePicker() }}
                        className="group relative overflow-hidden rounded-card border border-transparent transition-all hover:border-link/40 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-link/40"
                      >
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-paper">
                          {c.avatar ? (
                            <img
                              src={asset(c.avatar)}
                              alt={c.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-paper">
                              <UserRound className="h-8 w-8 text-line" />
                            </div>
                          )}
                          {/* Score badge */}
                          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {candidateScore(c)}
                          </span>
                          {/* Gradient + name overlay */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-8">
                            <p className="truncate text-left text-[11px] font-bold leading-tight text-white">{c.name}</p>
                            <p className="truncate text-left text-[10px] leading-tight text-white/60">{role.name}</p>
                          </div>
                          {/* Hover check overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-link/20 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg">
                              <Check className="h-5 w-5 text-link" />
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            {/* Empty state when search has no results */}
            {roles.every((role) =>
              allCandidates.filter((c) => c.roleId === role.id && c.status !== 'new' && (!searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0
            ) && (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <UserRound className="h-12 w-12 text-line" />
                <p className="text-sm font-semibold text-muted">No candidates match your search</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/* ── Candidate card ───────────────────────────────────────────────────────── */

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 whitespace-nowrap rounded-btn bg-paper px-2 py-3 ring-1 ring-line">
      <span className="text-2xl font-bold tracking-tight text-ink">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</span>
    </div>
  )
}

function CandidateCard({
  candidate,
  roleName,
  showRole,
  dragging,
  draggable,
  onDragStart,
  onDragEnd,
  onOpenReview,
  selectMode,
  selected,
  onToggleSelect,
  compareMode = false,
  compareSelected = false,
  onToggleCompare,
}: {
  candidate: Candidate
  roleName?: string
  showRole: boolean
  dragging: boolean
  draggable: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onOpenReview: () => void
  selectMode: boolean
  selected: boolean
  onToggleSelect: () => void
  compareMode?: boolean
  compareSelected?: boolean
  onToggleCompare?: () => void
}) {
  const navigate = useNavigate()
  const score = candidateScore(candidate)
  const reviewed = candidate.good + candidate.maybe + candidate.no > 0
  const scoreColor = score >= 75 ? 'text-signal-good' : score >= 50 ? 'text-[#8A6D00]' : 'text-signal-no'
  const teamRatings = deriveTeamRatings(candidate)
  const visibleRatings = teamRatings.slice(0, 3)
  const overflow = teamRatings.length - visibleRatings.length
  const histScore = historicalScore(candidate)
  const totalVotes = candidate.good + candidate.maybe + candidate.no
  const majorityLabel = totalVotes > 0
    ? candidate.no > candidate.good && candidate.no >= candidate.maybe ? 'No go'
    : candidate.maybe > candidate.good && candidate.maybe > candidate.no ? 'Maybe'
    : null
    : null
  const isNew = isNewCandidate(candidate.id)

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={compareMode ? onToggleCompare : selectMode ? onToggleSelect : undefined}
      onDoubleClick={selectMode || compareMode ? undefined : onOpenReview}
      title={compareMode ? 'Click to select for comparison' : selectMode ? 'Click to select' : 'Double-click to watch the review'}
      className={cn(
        'relative flex flex-col gap-2 rounded-card border bg-card p-3 shadow-card transition-opacity',
        draggable ? 'cursor-grab active:cursor-grabbing' : (selectMode || compareMode) ? 'cursor-pointer' : 'cursor-default',
        dragging && 'opacity-40',
        compareSelected ? 'border-purple-500 ring-2 ring-purple-500' : selected ? 'border-link ring-2 ring-link/30' : 'border-line',
      )}
    >
      {compareMode && (
        <span
          className={cn(
            'absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-card',
            compareSelected ? 'border-purple-500 bg-purple-500 text-white' : 'border-line text-transparent',
          )}
        >
          <Check className="h-3 w-3" />
        </span>
      )}
      {!compareMode && selectMode && (
        <span
          className={cn(
            'absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-card',
            selected ? 'border-link bg-link text-white' : 'border-line text-transparent',
          )}
        >
          <CheckSquare className="h-3 w-3" />
        </span>
      )}

      <div className="flex items-center gap-2">
        <div className="relative">
          <Avatar src={candidate.avatar} name={candidate.name} size="sm" />
          {isNew && (
            <span className="absolute -right-1 -top-1 text-[10px] leading-none" title="New candidate">⭐</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/studio/talent/${candidate.id}`) }}
            className="block max-w-full truncate text-left text-sm font-semibold text-link hover:underline"
          >
            {candidate.name}
          </button>
          <p className="truncate text-[11px] text-muted">
            {candidate.age} y/o{showRole && roleName ? ` · ${roleName}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-2">
        <span className="flex items-center gap-1 text-[11px] text-muted">
          <MapPin className="h-3 w-3" />
          {candidate.city}
        </span>
        {reviewed ? (
          <div className="flex items-center gap-1">
            <span className={cn('text-sm font-bold', scoreColor)}>{score}</span>
            {majorityLabel === 'No go' && (
              <span className="rounded-full bg-signal-no/15 px-1.5 py-0.5 text-[9px] font-bold text-signal-no">No go</span>
            )}
            {majorityLabel === 'Maybe' && (
              <span className="rounded-full bg-signal-maybe/15 px-1.5 py-0.5 text-[9px] font-bold text-[#8A6D00]">Maybe</span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-muted/50">{histScore}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-muted">Hist.</span>
          </div>
        )}
      </div>

      {visibleRatings.length > 0 && (
        <div className="absolute -bottom-2 -right-1.5 flex items-center">
          {visibleRatings.map((r, i) => (
            <span
              key={`${r.initials}-${i}`}
              style={{ marginLeft: i === 0 ? 0 : -6, zIndex: i }}
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border-2 border-card text-[8px] font-bold text-white',
                r.signal === 'good' && 'bg-signal-good',
                r.signal === 'maybe' && 'bg-signal-maybe',
                r.signal === 'no' && 'bg-signal-no',
              )}
              title="Collective review"
            >
              {r.initials}
            </span>
          ))}
          {overflow > 0 && (
            <span
              style={{ marginLeft: -6 }}
              className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-ink text-[8px] font-bold text-white"
            >
              +{overflow}
            </span>
          )}
        </div>
      )}

      {/* Quick-action buttons — shown in Reviewed (no-go) and pipeline columns */}
      {candidate.status === 'no-go' && !selectMode && !compareMode && (
        <div className="flex gap-1.5 border-t border-line pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); moveCandidate(candidate.id, 'shortlisted') }}
            className="flex flex-1 items-center justify-center gap-1 rounded-btn border border-line bg-paper py-1 text-[10px] font-semibold text-muted hover:border-signal-good/50 hover:bg-signal-good/10 hover:text-signal-good transition-colors"
          >
            <UserCheck className="h-3 w-3" />
            Shortlist
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); moveCandidate(candidate.id, 'callback') }}
            className="flex flex-1 items-center justify-center gap-1 rounded-btn border border-line bg-paper py-1 text-[10px] font-semibold text-muted hover:border-link/50 hover:bg-link/10 hover:text-link transition-colors"
          >
            <PhoneCall className="h-3 w-3" />
            Callback
          </button>
        </div>
      )}
      {candidate.status === 'shortlisted' && !selectMode && !compareMode && (
        <div className="flex gap-1.5 border-t border-line pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); moveCandidate(candidate.id, 'offer') }}
            className="flex flex-1 items-center justify-center gap-1 rounded-btn border border-line bg-paper py-1 text-[10px] font-semibold text-muted hover:border-gold/50 hover:bg-gold/10 hover:text-gold transition-colors"
          >
            <Star className="h-3 w-3" />
            Offer
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); moveCandidate(candidate.id, 'callback') }}
            className="flex flex-1 items-center justify-center gap-1 rounded-btn border border-line bg-paper py-1 text-[10px] font-semibold text-muted hover:border-link/50 hover:bg-link/10 hover:text-link transition-colors"
          >
            <PhoneCall className="h-3 w-3" />
            Callback
          </button>
        </div>
      )}
      {candidate.status === 'callback' && !selectMode && !compareMode && (
        <div className="flex gap-1.5 border-t border-line pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); moveCandidate(candidate.id, 'offer') }}
            className="flex flex-1 items-center justify-center gap-1 rounded-btn border border-line bg-paper py-1 text-[10px] font-semibold text-muted hover:border-gold/50 hover:bg-gold/10 hover:text-gold transition-colors"
          >
            <Star className="h-3 w-3" />
            Offer
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Diversity bar ────────────────────────────────────────────────────────── */

function DiversityBar({ allCandidates }: { allCandidates: Candidate[] }) {
  const shortlisted = useMemo(
    () => allCandidates.filter((c) => ['shortlisted', 'callback', 'cast', 'offer'].includes(c.status)),
    [allCandidates],
  )

  if (shortlisted.length < 3) return null

  const ages = shortlisted.map((c) => c.age).filter((a): a is number => typeof a === 'number')
  const ageMin = ages.length > 0 ? Math.min(...ages) : null
  const ageMax = ages.length > 0 ? Math.max(...ages) : null
  const ageRange = ageMin != null && ageMax != null ? ageMax - ageMin : null

  // Top 2 cities
  const cityCounts: Record<string, number> = {}
  shortlisted.forEach((c) => { if (c.city) cityCounts[c.city] = (cityCounts[c.city] ?? 0) + 1 })
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([city]) => city)

  // Gender split
  const males = shortlisted.filter((c) => c.gender === 'M').length
  const females = shortlisted.filter((c) => c.gender === 'F').length
  const genderKnown = males + females
  const genderSplit = genderKnown > 0 ? `${males}M / ${females}F` : '—'

  // Warning conditions
  const topCityCount = topCities[0] ? (cityCounts[topCities[0]] ?? 0) : 0
  const lowDiversity =
    (shortlisted.length > 0 && topCityCount / shortlisted.length >= 0.8) ||
    (ageRange != null && ageRange < 10)

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-btn border border-line bg-paper px-3 py-2 text-xs text-muted">
      <span className="flex items-center gap-1 font-semibold text-ink">
        <Gauge className="h-3.5 w-3.5 text-muted" />
        Shortlist diversity
      </span>
      <span className="h-3 w-px bg-line" />
      {ageMin != null && ageMax != null ? (
        <span>Age: <strong className="text-ink">{ageMin}–{ageMax}</strong></span>
      ) : (
        <span>Age: <strong className="text-ink">—</strong></span>
      )}
      <span className="h-3 w-px bg-line" />
      <span>Top cities: <strong className="text-ink">{topCities.length > 0 ? topCities.join(', ') : '—'}</strong></span>
      <span className="h-3 w-px bg-line" />
      <span>Gender: <strong className="text-ink">{genderSplit}</strong></span>
      {lowDiversity && (
        <>
          <span className="h-3 w-px bg-line" />
          <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">
            Low diversity · explore new profiles
          </span>
        </>
      )}
    </div>
  )
}

/* ── Pairwise comparison modal ────────────────────────────────────────────── */

function pairwiseHistoricalScore(c: Candidate): number {
  const seed = c.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)
  return 40 + (seed * 13) % 45
}

function pairwiseLicScore(c: Candidate): number {
  const ratingScore = candidateScore(c)
  const pastScore = pairwiseHistoricalScore(c)
  return Math.round(ratingScore * 0.5 + pastScore * 0.5)
}

const PAIRWISE_HISTORY = [
  { show: 'MAFS AU',         result: 'Cast',        pts: 100 },
  { show: "I'm a Celebrity", result: 'Cast',        pts: 100 },
  { show: 'Survivor AU',     result: 'Callback',    pts: 75  },
  { show: 'The Bachelor AU', result: 'Callback',    pts: 75  },
  { show: 'Big Brother AU',  result: 'Shortlisted', pts: 50  },
]

function CandidateScoreCard({
  candidate,
  label,
  onMove,
}: {
  candidate: Candidate
  label: 'A' | 'B'
  onMove: (status: CandidateStatus) => void
}) {
  const ratingScore = candidateScore(candidate)
  const pastScore = pairwiseHistoricalScore(candidate)
  const licScore = pairwiseLicScore(candidate)
  const myVote = useMyVote(candidate.id)

  return (
    <div className="flex flex-col gap-3 rounded-btn border border-line p-4">
      {/* Identity */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {candidate.avatar ? (
            <img src={asset(candidate.avatar)} alt={candidate.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-purple-400" />
          ) : (
            <Avatar name={candidate.name} size="lg" />
          )}
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
            {label}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">{candidate.name}</p>
          <p className="text-xs text-muted">{candidate.age} y/o · {candidate.city}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-sm font-bold text-gold">⚡ {licScore}</span>
            <span className="text-xs text-muted">LIC score</span>
          </div>
        </div>
      </div>

      {/* Status */}
      <Tag tone={candidate.status === 'cast' || candidate.status === 'offer' ? 'good' : candidate.status === 'new' ? 'neutral' : 'link'}>
        {BOARD_COLUMN_LABELS[candidate.status]}
      </Tag>

      {/* Compact video */}
      <div className="overflow-hidden rounded-lg bg-black" style={{ aspectRatio: '16/9' }}>
        {candidate.video ? (
          <video src={asset(candidate.video)} controls playsInline preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-8 w-8 text-white/30" />
          </div>
        )}
      </div>

      {/* Performance breakdown */}
      <div className="flex flex-col gap-2">

        {/* Family 1 — Current casting */}
        <div className="rounded-btn bg-paper p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-label text-link">① Current Casting</p>
            <span className="text-xs font-bold text-link">{ratingScore}/100</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[10px] text-muted">Team rating</span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div className="absolute inset-y-0 left-0 rounded-full bg-signal-good" style={{ width: `${ratingScore}%` }} />
            </div>
            <span className="w-6 text-right text-[10px] font-semibold text-ink">{ratingScore}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="w-20 shrink-0 text-[10px] text-muted">Scene analysis</span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div className="absolute inset-y-0 left-0 rounded-full bg-line/50" style={{ width: '0%' }} />
            </div>
            <span className="w-6 text-right text-[10px] text-muted">—</span>
          </div>
          <p className="mt-1.5 text-[10px] italic text-muted">Scene analysis not yet rated</p>
        </div>

        {/* Family 2 — Historical */}
        <div className="rounded-btn bg-paper p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-label text-[#8A6D00]">② Historical Performance</p>
            <span className="text-xs font-bold text-[#8A6D00]">{pastScore}/100</span>
          </div>
          {PAIRWISE_HISTORY.slice(0, 3).map((e) => (
            <div key={e.show} className="mt-1 flex items-center gap-2">
              <span className="w-20 shrink-0 truncate text-[10px] text-muted">{e.show}</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className={cn('absolute inset-y-0 left-0 rounded-full', e.pts >= 75 ? 'bg-signal-good' : e.pts >= 50 ? 'bg-signal-maybe' : 'bg-signal-no/40')}
                  style={{ width: `${e.pts}%` }}
                />
              </div>
              <span className="w-6 text-right text-[10px] font-semibold text-muted">{e.pts}</span>
            </div>
          ))}
          <p className="mt-1.5 text-[10px] text-muted">+{PAIRWISE_HISTORY.length - 3} more · avg {pastScore}</p>
        </div>

        {/* Combined */}
        <div className="flex items-center justify-between rounded-btn bg-ink px-3 py-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-label text-white/60">LIC Score</p>
            <p className="font-mono text-[10px] text-white/40">({ratingScore}×50%) + ({pastScore}×50%)</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gold">{licScore}</span>
            <span className="text-[10px] text-white/40">/100</span>
          </div>
        </div>
      </div>

      {/* Rating buttons (green / orange / red) with current score reminder */}
      <div className="border-t border-line pt-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-label text-muted">Ma note · Score actuel : {ratingScore}/100</p>
        <div className="flex gap-2">
          <button
            onClick={() => rateCandidate(candidate.id, 'good')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-btn border py-2 text-xs font-semibold transition-colors',
              myVote === 'good'
                ? 'border-signal-good bg-signal-good text-white'
                : 'border-signal-good/30 text-signal-good hover:bg-signal-good/10',
            )}
          >
            <Check className="h-3.5 w-3.5" />
            {candidate.good}
          </button>
          <button
            onClick={() => rateCandidate(candidate.id, 'maybe')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-btn border py-2 text-xs font-semibold transition-colors',
              myVote === 'maybe'
                ? 'border-signal-maybe bg-signal-maybe text-white'
                : 'border-signal-maybe/40 text-[#8A6D00] hover:bg-signal-maybe/10',
            )}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            {candidate.maybe}
          </button>
          <button
            onClick={() => rateCandidate(candidate.id, 'no')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-btn border py-2 text-xs font-semibold transition-colors',
              myVote === 'no'
                ? 'border-signal-no bg-signal-no text-white'
                : 'border-signal-no/30 text-signal-no hover:bg-signal-no/10',
            )}
          >
            <X className="h-3.5 w-3.5" />
            {candidate.no}
          </button>
        </div>
      </div>

      {/* Pipeline action buttons */}
      {candidate.status === 'no-go' && (
        <div className="flex gap-2">
          <button
            onClick={() => onMove('shortlisted')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line bg-paper py-2 text-xs font-semibold text-muted hover:border-purple-400/50 hover:bg-purple-50 hover:text-purple-600 transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            Shortlist
          </button>
          <button
            onClick={() => onMove('callback')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line bg-paper py-2 text-xs font-semibold text-muted hover:border-link/50 hover:bg-link/10 hover:text-link transition-colors"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            Callback
          </button>
        </div>
      )}
      {candidate.status === 'shortlisted' && (
        <div className="flex gap-2">
          <button
            onClick={() => onMove('callback')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line bg-paper py-2 text-xs font-semibold text-muted hover:border-link/50 hover:bg-link/10 hover:text-link transition-colors"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            Callback
          </button>
          <button
            onClick={() => onMove('offer')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line bg-paper py-2 text-xs font-semibold text-muted hover:border-gold/50 hover:bg-gold/10 hover:text-gold transition-colors"
          >
            <Star className="h-3.5 w-3.5" />
            Offer
          </button>
        </div>
      )}
      {candidate.status === 'callback' && (
        <button
          onClick={() => onMove('offer')}
          className="flex w-full items-center justify-center gap-1.5 rounded-btn border border-line bg-paper py-2 text-xs font-semibold text-muted hover:border-gold/50 hover:bg-gold/10 hover:text-gold transition-colors"
        >
          <Star className="h-3.5 w-3.5" />
          Offer
        </button>
      )}
      {candidate.status === 'offer' && (
        <button
          onClick={() => onMove('cast')}
          className="flex w-full items-center justify-center gap-1.5 rounded-btn border border-signal-good/40 bg-signal-good/10 py-2 text-xs font-semibold text-signal-good hover:bg-signal-good hover:text-white transition-colors"
        >
          <UserCheck className="h-3.5 w-3.5" />
          Cast
        </button>
      )}
    </div>
  )
}

function PairwiseModal({
  candidateA,
  candidateB,
  onClose,
}: {
  candidateA: Candidate
  candidateB: Candidate
  onClose: () => void
}) {
  const toast = useToast()

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/70 p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-5xl flex-col gap-4 rounded-card bg-card p-6 shadow-card-hover"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-ink">
            <Columns2 className="h-4 w-4 text-purple-500" />
            Compare candidates
          </span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Side by side */}
        <div className="grid grid-cols-2 gap-5">
          <CandidateScoreCard
            candidate={candidateA}
            label="A"
            onMove={(status) => { moveCandidate(candidateA.id, status); toast(`${candidateA.name.split(' ')[0]} → ${BOARD_COLUMN_LABELS[status]}`) }}
          />
          <CandidateScoreCard
            candidate={candidateB}
            label="B"
            onMove={(status) => { moveCandidate(candidateB.id, status); toast(`${candidateB.name.split(' ')[0]} → ${BOARD_COLUMN_LABELS[status]}`) }}
          />
        </div>

        {/* Footer — Close */}
        <div className="flex items-center justify-center border-t border-line pt-3">
          <Button variant="primary" onClick={onClose} icon={<X className="h-3.5 w-3.5" />}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Watch modal ──────────────────────────────────────────────────────────── */

const WATCH_RATING_OPTIONS = [
  { key: 'no' as const, label: 'No go', icon: X, base: 'border-signal-no/30 text-signal-no hover:bg-signal-no/5', active: 'border-signal-no bg-signal-no text-white' },
  { key: 'maybe' as const, label: 'Maybe', icon: HelpCircle, base: 'border-signal-maybe/40 text-[#8A6D00] hover:bg-signal-maybe/5', active: 'border-signal-maybe bg-signal-maybe text-white' },
  { key: 'good' as const, label: 'Good match', icon: Check, base: 'border-signal-good/30 text-signal-good hover:bg-signal-good/5', active: 'border-signal-good bg-signal-good text-white' },
]

const MINI_SCENE_AXES = [
  'Emotional truth',
  'Character ownership',
  'Physical presence',
  'Listening & reaction',
  'Text command',
]

function WatchModal({
  candidates,
  rolesById,
  onClose,
}: {
  candidates: Candidate[]
  rolesById: Record<string, Role>
  onClose: () => void
}) {
  const toast = useToast()
  const [idx, setIdx] = useState(0)
  const [sceneToggles, setSceneToggles] = useState<Record<string, boolean | null>>({})
  const candidate = candidates[Math.min(idx, candidates.length - 1)]
  const lastVote = useMyVote(candidate.id)

  const go = (dir: 1 | -1) => {
    setIdx((i) => (i + dir + candidates.length) % candidates.length)
    setSceneToggles({})
  }

  const toggleScene = (axis: string, value: boolean) => {
    setSceneToggles((cur) => ({ ...cur, [axis]: cur[axis] === value ? null : value }))
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/70 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-2xl flex-col gap-3 rounded-card bg-card p-4 shadow-card-hover"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">
              {candidate.name} <span className="font-normal text-muted">— {rolesById[candidate.roleId]?.name}</span>
            </p>
            <p className="font-mono text-xs text-muted">{idx + 1} / {candidates.length}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Performance score above the video */}
        {(() => {
          const score = candidateScore(candidate)
          const reviewed = candidate.good + candidate.maybe + candidate.no > 0
          const histScore = historicalScore(candidate)
          const scoreColor = score >= 75 ? 'text-signal-good' : score >= 50 ? 'text-[#8A6D00]' : 'text-signal-no'
          return (
            <div className="flex items-center gap-3 rounded-btn border border-line bg-paper px-3 py-2">
              <div className="flex flex-col">
                <span className={cn('text-lg font-bold', reviewed ? scoreColor : 'text-muted/50')}>
                  {reviewed ? score : histScore}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wide text-muted">
                  {reviewed ? 'Casting score' : 'Hist. score'}
                </span>
              </div>
              <span className="h-6 w-px bg-line" />
              <span className="text-xs text-muted">{BOARD_COLUMN_LABELS[candidate.status]}</span>
            </div>
          )
        })()}

        <Player key={candidate.id} src={asset(candidate.video)} />

        {/* Your Rating */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-label text-muted">Your Rating</p>
          <div className="flex justify-center gap-2">
            {WATCH_RATING_OPTIONS.map((o) => {
              const Icon = o.icon
              const isActive = lastVote === o.key
              return (
                <button
                  key={o.key}
                  onClick={() => { rateCandidate(candidate.id, o.key); toast(`Vote added: ${o.label}`) }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-btn border-2 px-3 py-2 text-xs font-semibold transition-all',
                    isActive ? o.active : o.base,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pipeline action buttons */}
        {candidate.status === 'no-go' && (
          <div className="flex gap-2">
            <button
              onClick={() => { moveCandidate(candidate.id, 'shortlisted'); toast('Moved to Shortlisted') }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line bg-paper py-2 text-xs font-semibold text-muted hover:border-signal-good/50 hover:bg-signal-good/10 hover:text-signal-good transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Shortlist
            </button>
            <button
              onClick={() => { moveCandidate(candidate.id, 'callback'); toast('Moved to Callback') }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line bg-paper py-2 text-xs font-semibold text-muted hover:border-link/50 hover:bg-link/10 hover:text-link transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              Callback
            </button>
          </div>
        )}
        {candidate.status === 'shortlisted' && (
          <div className="flex gap-2">
            <button
              onClick={() => { moveCandidate(candidate.id, 'offer'); toast('Moved to Offer') }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line bg-paper py-2 text-xs font-semibold text-muted hover:border-gold/50 hover:bg-gold/10 hover:text-gold transition-colors"
            >
              <Star className="h-3.5 w-3.5" />
              Offer
            </button>
            <button
              onClick={() => { moveCandidate(candidate.id, 'callback'); toast('Moved to Callback') }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line bg-paper py-2 text-xs font-semibold text-muted hover:border-link/50 hover:bg-link/10 hover:text-link transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              Callback
            </button>
          </div>
        )}
        {candidate.status === 'callback' && (
          <button
            onClick={() => { moveCandidate(candidate.id, 'offer'); toast('Moved to Offer') }}
            className="flex w-full items-center justify-center gap-1.5 rounded-btn border border-line bg-paper py-2 text-xs font-semibold text-muted hover:border-gold/50 hover:bg-gold/10 hover:text-gold transition-colors"
          >
            <Star className="h-3.5 w-3.5" />
            Offer
          </button>
        )}
        {candidate.status === 'offer' && (
          <button
            onClick={() => { moveCandidate(candidate.id, 'cast'); toast(`${candidate.name.split(' ')[0]} → Cast`) ; onClose() }}
            className="flex w-full items-center justify-center gap-1.5 rounded-btn border border-signal-good/40 bg-signal-good/10 py-2 text-xs font-semibold text-signal-good hover:bg-signal-good hover:text-white transition-colors"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Cast
          </button>
        )}

        {/* Scene Analysis */}
        <div className="flex flex-col gap-2 rounded-btn border border-line bg-paper p-3">
          <p className="text-[11px] font-bold uppercase tracking-label text-muted">Scene Analysis</p>
          <div className="grid grid-cols-1 gap-1.5">
            {MINI_SCENE_AXES.map((axis) => {
              const val = sceneToggles[axis] ?? null
              return (
                <div key={axis} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-ink">{axis}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleScene(axis, true)}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded border text-xs font-bold transition-colors',
                        val === true
                          ? 'border-signal-good bg-signal-good text-white'
                          : 'border-line text-muted hover:border-signal-good/60 hover:text-signal-good',
                      )}
                    >
                      +
                    </button>
                    <button
                      onClick={() => toggleScene(axis, false)}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded border text-xs font-bold transition-colors',
                        val === false
                          ? 'border-signal-no bg-signal-no text-white'
                          : 'border-line text-muted hover:border-signal-no/60 hover:text-signal-no',
                      )}
                    >
                      −
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => go(-1)}
            disabled={candidates.length < 2}
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-line text-muted hover:text-ink disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted">← → to navigate</span>
          <button
            onClick={() => go(1)}
            disabled={candidates.length < 2}
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-line text-muted hover:text-ink disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
