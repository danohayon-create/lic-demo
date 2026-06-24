import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, MapPin, Clock, Check, ChevronRight } from 'lucide-react'
import { Card, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { AppHeader } from './AppHeader'
import { cn } from '@/lib/cn'
import { mayaProfile, discoverCastings, projectsById, type DiscoverCasting } from '@/data'

const filters = ['New', 'Near me', 'Film', 'TV']

export function Discover() {
  const [filter, setFilter] = useState('New')
  const toast = useToast()

  return (
    <div className="flex flex-col gap-4">
      <AppHeader showSearch />

      <h1 className="text-xl font-bold leading-snug tracking-tight text-ink">
        Hey {mayaProfile.name.split(' ')[0]} —{' '}
        <span className="text-muted">4 new roles match your profile.</span>
      </h1>

      {/* filter pills */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
        {filters.map((f) => {
          const active = filter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                active ? 'border-ink bg-ink text-white' : 'border-line bg-card text-muted',
              )}
            >
              {f === 'New' && <Zap className="h-3 w-3" />}
              {f}
            </button>
          )
        })}
      </div>

      <FeaturedCard />

      {/* casting calls */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="tech-label">Casting calls</span>
          <button onClick={() => toast('All casting calls — bientôt disponible')} className="text-xs font-medium text-link">
            See all
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {discoverCastings.map((c) => (
            <CastingRow key={c.id} casting={c} />
          ))}
        </div>
      </section>
    </div>
  )
}

function FeaturedCard() {
  const navigate = useNavigate()
  const project = projectsById['evermore']
  const [confirming, setConfirming] = useState(false)

  const snapApply = () => {
    setConfirming(true)
    setTimeout(() => navigate('/app/casting/evermore'), 1100)
  }

  return (
    <div className="relative overflow-hidden rounded-card">
      <img src={project.poster} alt={project.title} className="h-56 w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <Tag className="bg-black/50 text-white" icon={<Clock className="h-3 w-3" />}>
          Closed in 1d 09h
        </Tag>
        <Tag tone="gold" className="font-bold">
          MATCH SCORE 92
        </Tag>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4">
        <div>
          <span className="text-label font-semibold uppercase tracking-label text-white/70">
            {project.type} · {project.company}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">{project.title}</h2>
        </div>
        <button
          onClick={snapApply}
          className="flex items-center justify-center gap-2 rounded-btn bg-cream px-4 py-3 text-sm font-bold text-ink shadow-sm transition-transform active:scale-[0.98]"
        >
          <Zap className="h-4 w-4" />
          Snap apply
        </button>
      </div>

      {confirming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/85 backdrop-blur-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream text-ink">
            <Check className="h-7 w-7" />
          </span>
          <p className="text-sm font-semibold text-white">Snap apply sent</p>
          <p className="text-xs text-white/70">Opening the brief…</p>
        </div>
      )}
    </div>
  )
}

function CastingRow({ casting: c }: { casting: DiscoverCasting }) {
  const navigate = useNavigate()
  const open = () => c.hasDetail && navigate(`/app/casting/${c.id}`)
  return (
    <Card
      interactive={c.hasDetail}
      className="flex items-center gap-3"
      onClick={open}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-paper font-bold text-ink ring-1 ring-line">
        {c.title[0]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold text-ink">{c.title}</span>
          <span className="truncate text-xs text-muted">— {c.roleName}</span>
        </div>
        <div className="truncate text-xs text-muted">
          {c.kind}
          {c.company ? ` · ${c.company}` : ''}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {c.location}
          </span>
          {c.deadline && (
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {c.deadline}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Tag tone="good" className="font-semibold">
          {c.match} match
        </Tag>
        {c.hasDetail && <ChevronRight className="h-4 w-4 text-muted" />}
      </div>
    </Card>
  )
}
