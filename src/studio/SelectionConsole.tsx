import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bookmark,
  Check,
  CheckCheck,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Gauge,
  Grid2x2,
  HelpCircle,
  LayoutGrid,
  List,
  Lock,
  MapPin,
  Play,
  Search,
  Send,
  Sparkles,
  Square,
  Trash2,
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
  candidateScore,
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
    (f.reviewStatus != null ? 1 : 0)
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

  // Feature 3: Compare mode
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())

  const STATUS_WEIGHT: Record<CandidateStatus, number> = {
    cast: 6, offer: 5, callback: 4, shortlisted: 3, new: 2, 'no-go': 1,
  }

  const sortedCandidates = useMemo(() => {
    if (!aiSort) return filteredCandidates
    return [...filteredCandidates].sort((a, b) => {
      const wDiff = (STATUS_WEIGHT[b.status] ?? 0) - (STATUS_WEIGHT[a.status] ?? 0)
      if (wDiff !== 0) return wDiff
      return candidateScore(b) - candidateScore(a)
    })
  }, [filteredCandidates, aiSort])

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
              AI Priority
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={aiSort ? 'primary' : 'secondary'}
            size="sm"
            icon={<Sparkles className="h-3.5 w-3.5" />}
            onClick={() => setAiSort((v) => !v)}
          >
            AI Priority
          </Button>
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
          onWatch={(c) => setWatchQueue([c])}
          onWatchAll={(list) => setWatchQueue(list)}
          compareMode={compareMode}
          compareIds={compareIds}
          onToggleCompare={toggleCompareSelect}
        />
      )}

      {/* Wall view */}
      {view === 'wall' && (
        <WallView
          roles={roles}
          allCandidates={allCandidates}
          onPlay={(c) => setWatchQueue([c])}
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
        <FilterDropdown label="Role / Candidate" count={filters.roleIds.length}>
          <CheckList
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            selected={filters.roleIds}
            onToggle={(v) => toggleIn('roleIds', v)}
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
}: {
  options: { value: string; label: string; dot?: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
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

/* ── List view ────────────────────────────────────────────────────────────── */

function ListView({
  candidates,
  rolesById,
  selectMode,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onOpenReview,
  onWatch,
  onWatchAll,
  compareMode = false,
  compareIds = new Set<string>(),
  onToggleCompare,
}: {
  candidates: Candidate[]
  rolesById: Record<string, Role>
  selectMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onOpenReview: (c: Candidate) => void
  onWatch: (c: Candidate) => void
  onWatchAll: (list: Candidate[]) => void
  compareMode?: boolean
  compareIds?: Set<string>
  onToggleCompare?: (id: string) => void
}) {
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
        <span className="text-center text-[11px] font-bold uppercase tracking-wide text-muted">Performance Score</span>
        <span className="text-right text-[11px] font-bold uppercase tracking-wide text-muted">Status</span>
      </div>

      {candidates.map((c, i) => {
        const score = candidateScore(c)
        const reviewed = c.good + c.maybe + c.no > 0
        const scoreColor = score >= 75 ? 'text-signal-good' : score >= 50 ? 'text-[#8A6D00]' : 'text-signal-no'
        const teamRatings = deriveTeamRatings(c)
        const selected = selectedIds.has(c.id)
        const compareSelected = compareIds.has(c.id)
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
              <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
              <p className="truncate text-[11px] text-muted">{c.age} y/o · {c.city}</p>
            </div>

            {/* watch */}
            <button
              onClick={(e) => { e.stopPropagation(); onWatch(c) }}
              title="Watch"
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

            {/* spacer */}
            <span />

            {/* score */}
            <div className="text-center">
              {reviewed ? (
                <span className={cn('text-base font-bold', scoreColor)}>{score}</span>
              ) : (
                <span className="text-[11px] font-semibold text-muted">—</span>
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
}: {
  roles: Role[]
  allCandidates: Candidate[]
  onPlay: (candidate: Candidate) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [focusRoleId, setFocusRoleId] = useState<string | null>(null)
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

  const closePicker = () => {
    setPickerOpen(false)
    setFocusRoleId(null)
    setSearchQuery('')
  }

  const removeFromWall = (candidateId: string) => {
    moveCandidate(candidateId, 'shortlisted')
  }

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
  const score = candidateScore(candidate)
  const reviewed = candidate.good + candidate.maybe + candidate.no > 0
  const scoreColor = score >= 75 ? 'text-signal-good' : score >= 50 ? 'text-[#8A6D00]' : 'text-signal-no'
  const teamRatings = deriveTeamRatings(candidate)
  const visibleRatings = teamRatings.slice(0, 3)
  const overflow = teamRatings.length - visibleRatings.length

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
        <Avatar src={candidate.avatar} name={candidate.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{candidate.name}</p>
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
          <span className={cn('text-sm font-bold', scoreColor)}>{score}</span>
        ) : (
          <span className="text-[11px] font-semibold text-muted">Not reviewed</span>
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

const SCENE_LABELS = ['Authenticity', 'Charisma', 'Originality', 'Watchability', 'Camera presence']
const SCENE_VALUES_A = [88, 82, 74, 91, 68]
const SCENE_VALUES_B = [76, 90, 85, 70, 63]

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/70 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-3xl flex-col gap-4 rounded-card bg-card p-6 shadow-card-hover"
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
        <div className="grid grid-cols-2 gap-4">
          {[
            { candidate: candidateA, values: SCENE_VALUES_A, label: 'A' },
            { candidate: candidateB, values: SCENE_VALUES_B, label: 'B' },
          ].map(({ candidate, values, label }) => (
            <div key={candidate.id} className="flex flex-col gap-3 rounded-btn border border-line p-4">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {candidate.avatar ? (
                    <img src={asset(candidate.avatar)} alt={candidate.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-purple-400" />
                  ) : (
                    <Avatar name={candidate.name} size="xl" />
                  )}
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                    {label}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{candidate.name}</p>
                  <p className="text-xs text-muted">{candidate.age} y/o · {candidate.city}</p>
                  <p className="text-sm font-bold text-link">{candidateScore(candidate)}</p>
                </div>
              </div>
              <div>
                <Tag tone={candidate.status === 'cast' || candidate.status === 'offer' ? 'good' : candidate.status === 'new' ? 'neutral' : 'link'}>
                  {BOARD_COLUMN_LABELS[candidate.status]}
                </Tag>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-label text-muted">Scene analysis</p>
                {SCENE_LABELS.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-28 truncate text-[11px] text-muted">{label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-purple-400 transition-all"
                        style={{ width: `${values[i]}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-[11px] font-semibold text-ink">{values[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-center gap-3 border-t border-line pt-3">
          <Button
            variant="secondary"
            onClick={() => { toast('Preference saved'); onClose() }}
          >
            Select A
          </Button>
          <Button
            variant="secondary"
            onClick={() => { toast('Preference saved'); onClose() }}
          >
            Select B
          </Button>
          <Button variant="primary" onClick={onClose} icon={<X className="h-3.5 w-3.5" />}>
            Close
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
  const [lastVote, setLastVote] = useState<Signal | null>(null)
  const candidate = candidates[Math.min(idx, candidates.length - 1)]

  const go = (dir: 1 | -1) => {
    setIdx((i) => (i + dir + candidates.length) % candidates.length)
    setLastVote(null)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/70 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-2xl flex-col gap-3 rounded-card bg-card p-4 shadow-card-hover"
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

        <Player key={candidate.id} src={asset(candidate.video)} />

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => go(-1)}
            disabled={candidates.length < 2}
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-line text-muted hover:text-ink disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex flex-1 justify-center gap-2">
            {WATCH_RATING_OPTIONS.map((o) => {
              const Icon = o.icon
              const isActive = lastVote === o.key
              return (
                <button
                  key={o.key}
                  onClick={() => {
                    rateCandidate(candidate.id, o.key)
                    setLastVote(o.key)
                    toast(`Vote added: ${o.label}`)
                  }}
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
