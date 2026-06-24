import { useRef, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Share2, MoreHorizontal, Play, Zap, Sparkles } from 'lucide-react'
import { Card, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import {
  discoverCastingsById,
  projectsById,
  rolesByProject,
  sidesById,
  roleBriefVideo,
} from '@/data'

export function CastingDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const casting = discoverCastingsById[id]

  if (!casting) return <Navigate to="/app" replace />

  const project = projectsById[id]
  const role = rolesByProject(id)[0]
  const sides = role?.sidesId ? sidesById[role.sidesId] : undefined

  return (
    <div className="flex min-h-full flex-col gap-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-ink/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => toast('Casting link copied')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
          >
            <Share2 className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => toast('Saved to your castings')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <BriefPlayer poster={project?.poster} />

      <div>
        <span className="tech-label">
          {casting.kind} · {casting.company}
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{casting.title}</h1>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm text-muted">
            Role: <span className="font-medium text-ink">{casting.roleName}</span>
          </p>
          <Tag tone="cream">{role?.auditionFlow ?? 'Open Call'}</Tag>
        </div>
      </div>

      {/* info row */}
      <Card className="grid grid-cols-3 divide-x divide-line">
        <Info label="Deadline" value={role?.deadlineCountdown ?? casting.deadline ?? '—'} />
        <Info label="Pay" value={role?.pay ?? '—'} />
        <Info label="Location" value={casting.location} />
      </Card>

      {/* notes */}
      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="tech-label">Notes from the casting director</span>
          <Tag tone="gold" icon={<Sparkles className="h-3 w-3" />}>
            AI summary
          </Tag>
        </div>
        <p className="text-sm leading-relaxed text-ink">
          {role?.castingNotes ?? 'Full brief from the casting director coming soon.'}
        </p>
      </Card>

      {/* sides */}
      {sides && (
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="tech-label">Sides</span>
            <span className="font-mono text-xs text-muted">{sides.pages} pages</span>
          </div>
          <div className="rounded-btn bg-paper p-3 font-mono text-xs leading-relaxed text-ink ring-1 ring-line">
            {sides.lines.map((l, i) => (
              <p key={i} className={l.kind === 'heading' ? 'mb-1 font-semibold text-muted' : 'mb-1'}>
                {l.character ? <span className="text-signal-no">{l.character}: </span> : null}
                {l.text}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* fixed bottom CTA */}
      <div className="sticky bottom-0 -mx-4 mt-auto bg-gradient-to-t from-paper via-paper to-transparent px-4 pb-4 pt-3">
        <button
          onClick={() => navigate(`/app/selftape/${id}`)}
          className="flex w-full items-center justify-center gap-2 rounded-btn bg-cream py-3.5 text-sm font-bold text-ink shadow-sm transition-transform active:scale-[0.99]"
        >
          <Zap className="h-4 w-4" />
          Self Tape your audition
        </button>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-1 text-center">
      <span className="text-label font-semibold uppercase tracking-label text-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  )
}

function BriefPlayer({ poster }: { poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <div className="relative aspect-video overflow-hidden rounded-card border border-line bg-black">
      <video
        ref={ref}
        src={roleBriefVideo}
        poster={poster}
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        onClick={() => (playing ? ref.current?.pause() : ref.current?.play())}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && (
        <button
          onClick={() => ref.current?.play()}
          className="absolute inset-0 flex items-center justify-center bg-black/20"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg">
            <Play className="ml-1 h-6 w-6" />
          </span>
        </button>
      )}
      <span className="absolute left-3 top-3 rounded bg-black/55 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-white">
        ROLE BRIEF
      </span>
    </div>
  )
}
