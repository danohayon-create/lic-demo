import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, Video, Zap } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { discoverCastings, mayaProfile, type DiscoverCasting } from '@/data'
import { asset } from '@/lib/asset'

const filters = ['Tous', 'En cours', 'Terminés', 'Film', 'TV']

export function CastingCalls() {
  const [filter, setFilter] = useState('Tous')

  const ongoing = discoverCastings.filter((c) => c.status !== 'closed')
  const closed = discoverCastings.filter((c) => c.status === 'closed')

  const filtered = discoverCastings.filter((c) => {
    if (filter === 'En cours') return c.status !== 'closed'
    if (filter === 'Terminés') return c.status === 'closed'
    if (filter === 'Film') return c.kind.toLowerCase().includes('film')
    if (filter === 'TV') return c.kind.toLowerCase().includes('tv') || c.kind.toLowerCase().includes('series')
    return true
  })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Casting calls</h1>
        <p className="text-sm text-muted">
          Hey {mayaProfile.name.split(' ')[0]} — {ongoing.length} castings en cours · {closed.length} terminés.
        </p>
      </div>

      <div className="flex gap-2">
        {filters.map((f) => {
          const active = filter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                active ? 'border-ink bg-ink text-white' : 'border-line bg-card text-muted hover:text-ink',
              )}
            >
              {f === 'En cours' && <Zap className="h-3 w-3" />}
              {f}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CastingCard key={c.id} casting={c} />
        ))}
      </div>
    </div>
  )
}

function CastingCard({ casting: c }: { casting: DiscoverCasting }) {
  const navigate = useNavigate()
  const isClosed = c.status === 'closed'

  return (
    <Card className={cn('flex flex-col gap-0 overflow-hidden p-0', isClosed && 'opacity-80')}>
      {/* poster */}
      <div className="relative h-32 w-full overflow-hidden bg-ink/10">
        {c.poster ? (
          <img src={asset(c.poster)} alt={c.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-ink/30">
            {c.title[0]}
          </div>
        )}
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* status badge */}
        <span
          className={cn(
            'absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide text-white',
            isClosed ? 'bg-signal-bad/80' : 'bg-signal-good/80',
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', isClosed ? 'bg-white' : 'bg-white')} />
          {isClosed ? 'Closed' : 'Ongoing'}
        </span>

        {/* match badge */}
        <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold text-white">
          {c.match}% match
        </span>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="font-semibold text-ink">{c.title}</p>
          <p className="text-sm text-muted">{c.roleName}</p>
          <p className="mt-0.5 text-xs text-muted">
            {c.kind}{c.company ? ` · ${c.company}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {c.location}
          </span>
          {c.deadline && !isClosed && (
            <span className="inline-flex items-center gap-1 font-semibold text-signal-no">
              <Clock className="h-3.5 w-3.5" />
              {c.deadline}
            </span>
          )}
          {isClosed && c.year && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {c.year}
            </span>
          )}
        </div>

        <div className="mt-auto flex gap-2">
          {!isClosed && (
            <Button
              size="sm"
              variant="premium"
              icon={<Video className="h-3.5 w-3.5" />}
              className="flex-1"
              onClick={() => navigate(`/app/selftape/${c.id}`)}
            >
              Self-tape
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            className={isClosed ? 'flex-1' : ''}
            onClick={() => navigate(`/talent/casting/${c.id}`)}
          >
            Brief
          </Button>
        </div>
      </div>
    </Card>
  )
}
