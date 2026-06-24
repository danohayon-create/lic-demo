import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search as SearchIcon,
  Sparkles,
  X,
  Plus,
  ChevronDown,
  LayoutGrid,
  List,
  Pin,
  RotateCw,
  Bookmark,
  Download,
  ArrowRight,
} from 'lucide-react'
import { Card, Avatar, Button, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { Skeleton, useBriefLoading } from '@/components/Skeleton'
import { cn } from '@/lib/cn'
import { talents, searchState, type Talent, type SearchFilter } from '@/data'

const subNav = ['Search', 'My campaigns', 'Pipeline', 'Saved searches', 'Reports', 'Learning']
const collapsibleSections = ['Ethnicity', 'Special abilities', 'Availability window', 'Experience level', 'Has reel']
const defaultChecked = new Set(['maya-reyes', 'ines-karim'])

export function SearchScreen() {
  const toast = useToast()
  const loading = useBriefLoading()
  const [filters, setFilters] = useState<SearchFilter[]>(searchState.filters)
  const [checked, setChecked] = useState<Set<string>>(new Set(defaultChecked))
  const [view, setView] = useState<'list' | 'grid'>('list')

  const removeValue = (label: string, value: string) =>
    setFilters((prev) =>
      prev
        .map((f) => (f.label === label ? { ...f, values: f.values.filter((v) => v !== value) } : f))
        .filter((f) => f.values.length > 0),
    )

  const reset = () => {
    setFilters(searchState.filters)
    toast('Filters reset')
  }

  const toggleCheck = (id: string) => {
    const name = talents.find((t) => t.id === id)?.name ?? 'Talent'
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        toast(`Removed ${name} from shortlist`)
      } else {
        next.add(id)
        toast(`Added ${name} to shortlist`)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* sub-nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-2 font-semibold text-ink">Talent Recruiter</span>
          {subNav.map((s, i) => (
            <button
              key={s}
              onClick={() => i !== 0 && toast(`${s} — bientôt disponible`)}
              className={cn(
                'rounded-btn px-2.5 py-1.5 text-sm font-medium transition-colors',
                i === 0 ? 'bg-ink text-white' : 'text-muted hover:bg-ink/5 hover:text-ink',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={() => toast(`Exported ${checked.size} talents`)}
          >
            Export shortlist
          </Button>
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => toast('New campaign created')}>
            New campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <FilterSidebar filters={filters} onRemove={removeValue} onReset={reset} />

        <div className="flex flex-col gap-4">
          {/* search bar */}
          <Card className="flex flex-col gap-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                defaultValue={searchState.query}
                className="h-11 w-full rounded-btn border border-line bg-paper pl-9 pr-28 text-sm text-ink focus:border-ink/20 focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {searchState.aiParsed && (
                  <Tag tone="gold" icon={<Sparkles className="h-3 w-3" />}>
                    AI parsed
                  </Tag>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                icon={<Bookmark className="h-4 w-4" />}
                onClick={() => toast('Search saved')}
              >
                Save search
              </Button>
            </div>
          </Card>

          {/* results header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{searchState.resultSummary}</span>
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
                <button
                  onClick={() => setView('list')}
                  className={cn('rounded-[9px] p-1.5', view === 'list' ? 'bg-ink text-white' : 'text-muted')}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('grid')}
                  className={cn('rounded-[9px] p-1.5', view === 'grid' ? 'bg-ink text-white' : 'text-muted')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* results */}
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
              {talents.map((t) => (
                <TalentRow key={t.id} talent={t} checked={checked.has(t.id)} onToggle={() => toggleCheck(t.id)} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {talents.map((t) => (
                <TalentCardGrid key={t.id} talent={t} checked={checked.has(t.id)} onToggle={() => toggleCheck(t.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Filters ──────────────────────────────────────────────────────────────── */

function FilterSidebar({
  filters,
  onRemove,
  onReset,
}: {
  filters: SearchFilter[]
  onRemove: (label: string, value: string) => void
  onReset: () => void
}) {
  const toast = useToast()
  return (
    <aside className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 bg-ink text-white">
        <span className="text-label font-semibold uppercase tracking-label text-white/60">AI match</span>
        <p className="text-sm leading-snug text-white/85">
          Find talents fitting your scene’s emotional profile
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
          <span className="tech-label">Filters</span>
          <button onClick={onReset} className="text-xs font-medium text-link hover:underline">
            Reset
          </button>
        </div>

        {filters.map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">{f.label}</span>
            <div className="flex flex-wrap gap-1.5">
              {f.values.map((v) => (
                <button
                  key={v}
                  onClick={() => onRemove(f.label, v)}
                  className="group inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-signal-no/40 hover:bg-signal-no/5"
                >
                  {v}
                  <X className="h-3 w-3 text-muted group-hover:text-signal-no" />
                </button>
              ))}
              {f.extra ? (
                <span className="inline-flex items-center rounded-full bg-paper px-2 py-1 text-xs font-medium text-muted ring-1 ring-line">
                  +{f.extra}
                </span>
              ) : null}
            </div>
          </div>
        ))}

        <div className="flex flex-col divide-y divide-line border-t border-line pt-1">
          {collapsibleSections.map((s) => (
            <CollapsibleRow key={s} label={s} />
          ))}
        </div>
      </Card>
    </aside>
  )
}

function CollapsibleRow({ label }: { label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-2.5 text-sm font-medium text-ink"
      >
        {label}
        <ChevronDown className={cn('h-4 w-4 text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && <p className="pb-2.5 text-xs text-muted">No filter applied.</p>}
    </div>
  )
}

/* ── Talent rows ──────────────────────────────────────────────────────────── */

function AvailabilityTag({ talent }: { talent: Talent }) {
  return talent.availability === 'Available' ? (
    <Tag tone="good">Available</Tag>
  ) : (
    <Tag tone="maybe">On project</Tag>
  )
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
  const toast = useToast()
  return (
    <Card className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-1 h-4 w-4 shrink-0 accent-ink"
        />
        <Avatar name={talent.name} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{talent.name}</span>
            <AvailabilityTag talent={talent} />
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {talent.city}, {talent.country} · {talent.agency}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {talent.skills.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
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
          <button
            onClick={() => toast(`Pinned ${talent.name}`)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
          >
            <Pin className="h-4 w-4" />
          </button>
          <button
            onClick={() => toast('Refreshed match score')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
        <Button
          variant="secondary"
          size="sm"
          iconRight={<ArrowRight className="h-4 w-4" />}
          onClick={() => navigate('/studio/review')}
        >
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
        <Avatar name={talent.name} size="lg" />
        <input
          type="checkbox"
          checked={checked}
          onClick={(e) => e.stopPropagation()}
          onChange={onToggle}
          className="h-4 w-4 accent-ink"
        />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{talent.name}</span>
        </div>
        <p className="text-sm text-muted">
          {talent.city}, {talent.country}
        </p>
      </div>
      <AvailabilityTag talent={talent} />
      <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
        <span className="text-sm">
          <span className="font-bold text-match">{talent.match}</span>
          <span className="text-muted"> match</span>
        </span>
        <span className="text-xs text-muted">
          {talent.auditions} aud · {talent.callbacks} cb
        </span>
      </div>
    </Card>
  )
}
