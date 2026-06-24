import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, Video, Zap } from 'lucide-react'
import { Card, Tag, Button } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import { discoverCastings, mayaProfile, type DiscoverCasting } from '@/data'

const filters = ['New', 'Near me', 'Film', 'TV']

/** Talent desktop — casting calls targeted at Maya, with a direct path to self-tape. */
export function CastingCalls() {
  const [filter, setFilter] = useState('New')

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Casting calls</h1>
        <p className="text-sm text-muted">
          Hey {mayaProfile.name.split(' ')[0]} — {discoverCastings.length} roles currently match your profile.
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
              {f === 'New' && <Zap className="h-3 w-3" />}
              {f}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {discoverCastings.map((c) => (
          <CastingCard key={c.id} casting={c} />
        ))}
      </div>
    </div>
  )
}

function CastingCard({ casting: c }: { casting: DiscoverCasting }) {
  const navigate = useNavigate()
  const toast = useToast()

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-paper font-bold text-ink ring-1 ring-line">
          {c.title[0]}
        </span>
        <Tag tone="good" className="font-semibold">
          {c.match} match
        </Tag>
      </div>

      <div>
        <p className="font-semibold text-ink">{c.title}</p>
        <p className="text-sm text-muted">{c.roleName}</p>
        <p className="mt-1 text-xs text-muted">
          {c.kind}
          {c.company ? ` · ${c.company}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {c.location}
        </span>
        {c.deadline && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {c.deadline}
          </span>
        )}
      </div>

      <div className="mt-1 flex gap-2">
        <Button
          size="sm"
          variant="premium"
          icon={<Video className="h-3.5 w-3.5" />}
          className="flex-1"
          onClick={() => navigate(`/app/selftape/${c.id}`)}
        >
          Self-tape
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => (c.hasDetail ? navigate(`/app/casting/${c.id}`) : toast('Brief — coming soon'))}
        >
          Brief
        </Button>
      </div>
    </Card>
  )
}
