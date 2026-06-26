import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search as SearchIcon,
  Sparkles,
  X,
  Plus,
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  Pin,
  RotateCw,
  Bookmark,
  Download,
  ArrowRight,
  ArrowLeft,
  Globe,
  Users,
  Building2,
  Zap,
} from 'lucide-react'
import { Card, Avatar, Button, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { Skeleton, useBriefLoading } from '@/components/Skeleton'
import { cn } from '@/lib/cn'
import { talents, projectsById, rolesByProject, type Talent, type SearchFilter } from '@/data'
import { asset } from '@/lib/asset'
import {
  useProjectCasting,
  setRoleCastingStatus,
  ROLE_CASTING_DEFAULTS,
  type AuditionFormat,
} from '@/data/castingState'

// ── Filter option vocabularies ──────────────────────────────────────────────────

const GENDERS = ['Female', 'Male', 'Non-binary']
const LANGUAGES = ['French', 'English', 'Spanish', 'Italian', 'German', 'Arabic', 'Mandarin']
const ROLE_TYPES = ['Lead', 'Supporting']
const EXPERIENCE_LEVELS = ['Emerging', 'Mid-career', 'Established', 'Star']
const AVAILABILITY_OPTIONS = ['Available', 'On project']
const ALL_SKILLS = Array.from(new Set(talents.flatMap((t) => t.skills))).sort()
const CITIES = [
  'Amsterdam', 'Atlanta', 'Barcelona', 'Berlin', 'Chicago', 'Dubai', 'Dublin', 'Hong Kong',
  'Istanbul', 'Las Vegas', 'Lima', 'London', 'Los Angeles', 'Madrid', 'Marseille', 'Melbourne',
  'Mexico City', 'Miami', 'Milan', 'Montreal', 'Mumbai', 'New York', 'Paris', 'Prague', 'Rome',
  'San Francisco', 'São Paulo', 'Seoul', 'Shanghai', 'Singapore', 'Stockholm', 'Sydney', 'Tokyo',
  'Toronto', 'Vienna', 'Warsaw', 'Zurich',
]

const GENDER_CODE: Record<string, string> = { F: 'Female', M: 'Male' }

// ── Dynamic result-count narrowing (demo only — talents list itself is fixed) ──

const BASE_TALENT_POOL = 1847
const MIN_RESULTS = 9

const FILTER_WEIGHTS: Record<string, number> = {
  Gender: 0.55,
  'Age range': 0.5,
  Language: 0.65,
  'Role type': 0.7,
  Location: 0.45,
  Skills: 0.6,
  'Experience level': 0.55,
  Availability: 0.6,
  'Casting agency': 0.35,
}

function computeResultCount(filters: SearchFilter[]) {
  let count = BASE_TALENT_POOL
  for (const f of filters) {
    const weight = FILTER_WEIGHTS[f.label] ?? 0.75
    const valueCount = Math.max(1, f.values.length)
    count *= Math.pow(weight, valueCount)
  }
  return Math.max(MIN_RESULTS, Math.round(count))
}

const FORMAT_ICON: Record<AuditionFormat, React.ReactNode> = {
  'open-call': <Globe className="h-3.5 w-3.5" />,
  'invited':   <Users className="h-3.5 w-3.5" />,
  'in-house':  <Building2 className="h-3.5 w-3.5" />,
}
const FORMAT_LABEL: Record<AuditionFormat, string> = {
  'open-call': 'Open Call',
  'invited':   'Invited',
  'in-house':  'In House',
}

const LOGLINE = "A detective obsessed with cold cases discovers that the prime suspect she's hunted for two decades could be her own mother."

const defaultChecked = new Set(['maya-reyes', 'ines-karim'])

// ── Fake agencies passed via URL ──────────────────────────────────────────────

const AGENCY_NAMES: Record<string, string> = {
  babel:      'Babel Casting',
  artistique: 'Agence Artistique de Paris',
  cmg:        'CMG Artists',
  tmg:        'Talent Management Group',
  ateliers:   'Les Ateliers du Comédien',
  francaise:  "L'Agence Française",
}

export function CastingSearch() {
  const navigate = useNavigate()
  const toast = useToast()
  const loading = useBriefLoading()

  const [searchParams] = useSearchParams()
  const projectId      = searchParams.get('p') || 'les-ombres-de-midi'
  const roleId         = searchParams.get('role') || ''
  const agencyParam    = searchParams.get('agency') || ''
  const allContestants = searchParams.get('allContestants') === 'true'
  const returnToNs     = searchParams.get('returnToNs') === 'true'
  const slotsCount     = parseInt(searchParams.get('slots') ?? '0') || 10

  const project  = projectsById[projectId] ?? projectsById['les-ombres-de-midi']
  const allRoles = rolesByProject(project.id)
  const role     = allRoles.find(r => r.id === roleId) ?? allRoles[0]

  const projectCasting = useProjectCasting(project.id)
  const roleDefaults = ROLE_CASTING_DEFAULTS[roleId] ?? { format: 'open-call' as AuditionFormat, status: 'ready' as const, gender: '—', age: '—', hasBrief: false }
  const format = projectCasting[roleId]?.format ?? roleDefaults.format

  const agencies = agencyParam
    ? agencyParam.split(',').map(id => AGENCY_NAMES[id] ?? id).filter(Boolean)
    : []

  const buildInitialFilters = (): SearchFilter[] => {
    const roleFilters: SearchFilter[] = [
      { label: 'Gender', values: [GENDER_CODE[roleDefaults.gender] ?? roleDefaults.gender] },
      { label: 'Age range', values: [roleDefaults.age] },
      { label: 'Language', values: ['French', 'English'] },
      { label: 'Role type', values: role?.type ? [role.type] : [] },
    ]
    if (agencies.length) {
      roleFilters.push({ label: 'Casting agency', values: agencies })
    }
    return roleFilters.filter(f => f.values.length > 0)
  }

  const [filters, setFilters] = useState<SearchFilter[]>(buildInitialFilters)
  const [checked, setChecked]  = useState<Set<string>>(new Set(defaultChecked))
  const [view, setView]         = useState<'list' | 'grid'>('list')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const resultCount = useMemo(() => computeResultCount(filters), [filters])

  const setFilterValues = (label: string, values: string[]) => {
    setFilters(prev => {
      if (values.length === 0) return prev.filter(f => f.label !== label)
      const exists = prev.some(f => f.label === label)
      return exists
        ? prev.map(f => f.label === label ? { ...f, values } : f)
        : [...prev, { label, values }]
    })
  }

  const toggleFilterValue = (label: string, value: string, multi: boolean) => {
    const current = filters.find(f => f.label === label)?.values ?? []
    if (current.includes(value)) {
      setFilterValues(label, current.filter(v => v !== value))
    } else {
      setFilterValues(label, multi ? [...current, value] : [value])
    }
  }

  const removeValue = (label: string, value: string) =>
    setFilters(prev =>
      prev
        .map(f => f.label === label ? { ...f, values: f.values.filter(v => v !== value) } : f)
        .filter(f => f.values.length > 0),
    )

  const reset = () => {
    toast('Filters reset')
    setFilters(buildInitialFilters())
  }

  const toggleCheck = (id: string) => {
    const name = talents.find(t => t.id === id)?.name ?? 'Talent'
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); toast(`Removed ${name} from shortlist`) }
      else              { next.add(id);    toast(`Added ${name} to shortlist`) }
      return next
    })
  }

  const handleConfirmCast = () => {
    if (allContestants) {
      setConfirmOpen(false)
      toast(`Matching Profile applied to all ${slotsCount} contestants — ${resultCount.toLocaleString()} talents matched`)
      navigate('/studio/new-casting', {
        state: { step: 6, format: 'non_scripted', allApplied: true },
      })
    } else if (returnToNs) {
      setConfirmOpen(false)
      toast(`Matching Profile updated — ${resultCount.toLocaleString()} talents matched`)
      navigate('/studio/new-casting', {
        state: { step: 6, format: 'non_scripted', allApplied: true },
      })
    } else {
      setRoleCastingStatus(project.id, roleId, 'ongoing')
      setConfirmOpen(false)
      toast(`Let It Cast — sent to ${resultCount.toLocaleString()} talents`)
      navigate(`/studio/casting-recap?p=${project.id}`)
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Project + role cartouche ─────────────────────────────────────── */}
      <Card className="flex flex-col gap-3 border-2 border-ink">
        {/* Back */}
        <button
          onClick={() => { if (allContestants || returnToNs) navigate('/studio/new-casting'); else navigate(-1) }}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {allContestants || returnToNs ? 'Back to casting' : 'Back to casting recap'}
        </button>

        <div className="flex items-center gap-3">
          {project.poster ? (
            <img
              src={asset(project.poster)}
              alt={project.title}
              className="h-16 w-16 shrink-0 rounded-btn object-cover ring-1 ring-line"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-btn bg-paper text-2xl ring-1 ring-line">🎬</span>
          )}
          <div className="min-w-0 flex-1">
            <span className="tech-label">{project.type} · {project.company}</span>
            <h2 className="font-bold text-ink">{project.title}</h2>
            <p className="text-xs text-muted">{project.location} · {project.shooting}</p>
          </div>
        </div>

        <p className="text-xs italic leading-relaxed text-muted">"{LOGLINE}"</p>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-xs font-semibold text-muted">Searching for:</span>
          {allContestants ? (
            <>
              <span className="font-semibold text-ink">All {slotsCount} contestants</span>
              <Tag tone="good" icon={<Sparkles className="h-3 w-3" />}>Global profile</Tag>
            </>
          ) : (
            <>
              <span className="font-semibold text-ink">{role?.name}</span>
              <Tag tone={role?.type === 'Lead' ? 'gold' : 'neutral'}>{role?.type}</Tag>
              <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] text-muted ring-1 ring-line">
                {roleDefaults.gender} · {roleDefaults.age}
              </span>
            </>
          )}
          <span className={cn(
            'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
            format === 'open-call' ? 'border-link/20 bg-link/10 text-link'
            : format === 'invited' ? 'border-signal-maybe/30 bg-signal-maybe/10 text-[#8A6D00]'
            : 'border-line bg-paper text-muted',
          )}>
            {FORMAT_ICON[format]}
            {FORMAT_LABEL[format]}
          </span>
          {agencies.length > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-ink/20 bg-ink/5 px-2.5 py-1 text-[11px] font-semibold text-ink">
              <Building2 className="h-3 w-3" />
              {agencies.join(', ')}
            </span>
          )}
        </div>
      </Card>

      {/* ── Search layout ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <FilterSidebar
          filters={filters}
          onRemove={removeValue}
          onReset={reset}
          onToggleValue={toggleFilterValue}
          onSetValues={setFilterValues}
        />

        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <Card className="flex flex-col gap-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                defaultValue={`${role?.name ?? ''} ${project.title}`}
                className="h-11 w-full rounded-btn border border-line bg-paper pl-9 pr-28 text-sm text-ink focus:border-ink/20 focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Tag tone="gold" icon={<Sparkles className="h-3 w-3" />}>AI parsed</Tag>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" icon={<Bookmark className="h-4 w-4" />} onClick={() => toast('Search saved')}>
                Save search
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" icon={<Download className="h-4 w-4" />} onClick={() => toast(`Exported ${checked.size} talents`)}>
                  Export shortlist
                </Button>
                <Button
                  size="sm"
                  icon={<Zap className="h-4 w-4" />}
                  onClick={() => setConfirmOpen(true)}
                  className="bg-gold text-ink hover:bg-gold/90"
                >
                  Let It Cast
                </Button>
              </div>
            </div>
          </Card>

          {/* Results header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{resultCount.toLocaleString()} talents</span>
              {' '}match <span className="font-semibold text-ink">{role?.name}</span> · sorted by AI performance fit
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="premium"
                size="sm"
                icon={<Sparkles className="h-4 w-4 text-gold" />}
                onClick={() => toast('Re-ranked by AI performance fit')}
              >
                AI rerank
              </Button>
              <div className="flex rounded-btn border border-line p-0.5">
                <button onClick={() => setView('list')} className={cn('rounded-[9px] p-1.5', view === 'list' ? 'bg-ink text-white' : 'text-muted')}>
                  <List className="h-4 w-4" />
                </button>
                <button onClick={() => setView('grid')} className={cn('rounded-[9px] p-1.5', view === 'grid' ? 'bg-ink text-white' : 'text-muted')}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="flex items-center gap-3">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </Card>
              ))}
            </div>
          ) : view === 'list' ? (
            <div className="flex flex-col gap-3">
              {talents.map(t => (
                <TalentRow key={t.id} talent={t} checked={checked.has(t.id)} onToggle={() => toggleCheck(t.id)} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {talents.map(t => (
                <TalentCardGrid key={t.id} talent={t} checked={checked.has(t.id)} onToggle={() => toggleCheck(t.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {confirmOpen && (
          <LetItCastConfirmModal
            roleName={allContestants ? '' : (role?.name ?? '')}
            slotsCount={allContestants ? slotsCount : 0}
            count={resultCount}
            onClose={() => setConfirmOpen(false)}
            onConfirm={handleConfirmCast}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Let It Cast confirm modal ───────────────────────────────────────────────── */

function LetItCastConfirmModal({
  roleName,
  slotsCount = 0,
  count,
  onClose,
  onConfirm,
}: {
  roleName: string
  slotsCount?: number
  count: number
  onClose: () => void
  onConfirm: () => void
}) {
  const anim = typeof document === 'undefined' || document.visibilityState === 'visible'
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      initial={anim ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={anim ? { opacity: 0, y: 40 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-t-card bg-card shadow-card-hover sm:rounded-card"
      >
        <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15">
            <Zap className="h-6 w-6 text-gold" />
          </span>
          <p className="text-sm leading-relaxed text-ink">
            {roleName ? (
              <>You are about to send the role <span className="font-bold">"{roleName}"</span> to{' '}</>
            ) : (
              <>You are about to apply this Matching Profile to all <span className="font-bold">{slotsCount} contestants</span> and send it to{' '}</>
            )}
            <span className="font-bold">{count.toLocaleString()}</span> talents. Confirm?
          </p>
        </div>
        <div className="flex items-center gap-2 border-t border-line px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-btn border border-line bg-paper py-2 text-sm font-semibold text-ink hover:bg-ink/5"
          >
            Cancel
          </button>
          <Button onClick={onConfirm} className="flex-1 bg-gold text-ink hover:bg-gold/90">
            Confirm
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Filter sidebar ──────────────────────────────────────────────────────────── */

function FilterSidebar({ filters, onRemove, onReset, onToggleValue, onSetValues }: {
  filters: SearchFilter[]
  onRemove: (label: string, value: string) => void
  onReset: () => void
  onToggleValue: (label: string, value: string, multi: boolean) => void
  onSetValues: (label: string, values: string[]) => void
}) {
  const toast = useToast()
  const valuesFor = (label: string) => filters.find(f => f.label === label)?.values ?? []

  return (
    <aside className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 bg-ink text-white">
        <span className="text-label font-semibold uppercase tracking-label text-white/60">AI match</span>
        <p className="text-sm leading-snug text-white/85">
          Find talents fitting your scene's emotional profile
        </p>
        <button
          onClick={() => toast('Scene added — matching by emotional profile')}
          className="inline-flex items-center justify-center gap-2 rounded-btn bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
        >
          <Plus className="h-4 w-4" />
          Add scene
        </button>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="tech-label">Active filters</span>
          <button onClick={onReset} className="text-xs font-medium text-link hover:underline">Reset</button>
        </div>

        {filters.length === 0 && (
          <p className="text-xs text-muted">No filters applied — showing the full talent pool.</p>
        )}

        {filters.map(f => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">{f.label}</span>
            <div className="flex flex-wrap gap-1.5">
              {f.values.map(v => (
                <button
                  key={v}
                  onClick={() => onRemove(f.label, v)}
                  className="group inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-signal-no/40 hover:bg-signal-no/5"
                >
                  {v}
                  <X className="h-3 w-3 text-muted group-hover:text-signal-no" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Refine filters */}
        <div className="flex flex-col divide-y divide-line border-t border-line pt-1">
          <ChipFilterRow label="Gender" options={GENDERS} values={valuesFor('Gender')} onToggle={(v) => onToggleValue('Gender', v, false)} />
          <AgeRangeRow value={valuesFor('Age range')[0] ?? ''} onChange={(v) => onSetValues('Age range', v ? [v] : [])} />
          <ChipFilterRow label="Language" options={LANGUAGES} values={valuesFor('Language')} onToggle={(v) => onToggleValue('Language', v, true)} />
          <ChipFilterRow label="Role type" options={ROLE_TYPES} values={valuesFor('Role type')} onToggle={(v) => onToggleValue('Role type', v, false)} />
          <LocationRow values={valuesFor('Location')} onToggle={(v) => onToggleValue('Location', v, true)} />
          <ChipFilterRow label="Skills" options={ALL_SKILLS} values={valuesFor('Skills')} onToggle={(v) => onToggleValue('Skills', v, true)} />
          <ChipFilterRow label="Experience level" options={EXPERIENCE_LEVELS} values={valuesFor('Experience level')} onToggle={(v) => onToggleValue('Experience level', v, false)} />
          <ChipFilterRow label="Availability" options={AVAILABILITY_OPTIONS} values={valuesFor('Availability')} onToggle={(v) => onToggleValue('Availability', v, false)} />
        </div>
      </Card>
    </aside>
  )
}

function FilterDisclosure({ label, badgeCount, children }: { label: string; badgeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between py-2.5 text-sm font-medium text-ink"
      >
        <span className="flex items-center gap-2">
          {label}
          {badgeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
              {badgeCount}
            </span>
          )}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

function ChipFilterRow({ label, options, values, onToggle }: {
  label: string
  options: string[]
  values: string[]
  onToggle: (value: string) => void
}) {
  return (
    <FilterDisclosure label={label} badgeCount={values.length}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = values.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                active ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:border-ink/40',
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </FilterDisclosure>
  )
}

function AgeRangeRow({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [min, max] = value ? value.split('–') : ['', '']
  return (
    <FilterDisclosure label="Age range" badgeCount={value ? 1 : 0}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={min}
          onChange={(e) => onChange(`${e.target.value}–${max}`)}
          placeholder="Min"
          className="w-16 rounded-btn border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
        />
        <span className="text-muted">–</span>
        <input
          type="number"
          value={max}
          onChange={(e) => onChange(`${min}–${e.target.value}`)}
          placeholder="Max"
          className="w-16 rounded-btn border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>
    </FilterDisclosure>
  )
}

function LocationRow({ values, onToggle }: { values: string[]; onToggle: (city: string) => void }) {
  const [search, setSearch] = useState('')
  const filteredCities = CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
  return (
    <FilterDisclosure label="Location" badgeCount={values.length}>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search cities…"
        className="mb-2 w-full rounded-btn border border-line bg-paper px-3 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
      />
      <div className="max-h-36 overflow-y-auto rounded-btn border border-line">
        {filteredCities.map((city) => {
          const active = values.includes(city)
          return (
            <button
              key={city}
              onClick={() => onToggle(city)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs',
                active ? 'bg-paper font-semibold text-ink' : 'text-muted hover:bg-paper',
              )}
            >
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                {active && <Check className="h-3 w-3 text-match" />}
              </span>
              {city}
            </button>
          )
        })}
      </div>
    </FilterDisclosure>
  )
}

/* ── Talent rows ─────────────────────────────────────────────────────────────── */

function AvailabilityTag({ talent }: { talent: Talent }) {
  return talent.availability === 'Available'
    ? <Tag tone="good">Available</Tag>
    : <Tag tone="maybe">On project</Tag>
}

function MetricBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-label font-semibold uppercase tracking-label text-muted">{label}</div>
      <div className="text-base font-bold text-ink">{value}</div>
    </div>
  )
}

function TalentRow({ talent, checked, onToggle }: { talent: Talent; checked: boolean; onToggle: () => void }) {
  const navigate = useNavigate()
  const toast    = useToast()
  return (
    <Card className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1 h-4 w-4 shrink-0 accent-ink" />
        <Avatar src={talent.avatar} name={talent.name} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{talent.name}</span>
            <AvailabilityTag talent={talent} />
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {talent.city}, {talent.country} · <span className="font-medium text-ink">{talent.agency}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {talent.skills.map(s => <Tag key={s}>{s}</Tag>)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 lg:gap-7">
        <div className="w-28">
          <div className="text-label font-semibold uppercase tracking-label text-muted">Match</div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-match">{talent.match}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <span className="block h-full rounded-full bg-match" style={{ width: `${talent.match}%` }} />
            </span>
          </div>
        </div>
        <MetricBlock label="Auditions" value={talent.auditions} />
        <MetricBlock label="Callbacks" value={talent.callbacks} />
        <div className="flex items-center gap-1">
          <button onClick={() => toast(`Pinned ${talent.name}`)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink">
            <Pin className="h-4 w-4" />
          </button>
          <button onClick={() => toast('Refreshed match score')} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink">
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
        <Button variant="secondary" size="sm" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => navigate('/studio/review')}>
          View reel
        </Button>
      </div>
    </Card>
  )
}

function TalentCardGrid({ talent, checked, onToggle }: { talent: Talent; checked: boolean; onToggle: () => void }) {
  const navigate = useNavigate()
  return (
    <Card interactive className="flex flex-col gap-3" onClick={() => navigate('/studio/review')}>
      <div className="flex items-start justify-between">
        <Avatar src={talent.avatar} name={talent.name} size="lg" />
        <input type="checkbox" checked={checked} onClick={e => e.stopPropagation()} onChange={onToggle} className="h-4 w-4 accent-ink" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{talent.name}</span>
        </div>
        <p className="text-sm text-muted">{talent.city}, {talent.country}</p>
        <p className="text-xs text-muted">{talent.agency}</p>
      </div>
      <AvailabilityTag talent={talent} />
      <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
        <span className="text-sm">
          <span className="font-bold text-match">{talent.match}</span>
          <span className="text-muted"> match</span>
        </span>
        <span className="text-xs text-muted">{talent.auditions} aud · {talent.callbacks} cb</span>
      </div>
    </Card>
  )
}
