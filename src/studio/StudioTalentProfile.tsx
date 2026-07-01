import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Play, Zap, Film } from 'lucide-react'
import { Card, Avatar, Tag, Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { asset } from '@/lib/asset'
import { useCandidate, BOARD_COLUMN_LABELS, deriveAiMetrics, candidateScore, videoPerformanceScore } from '@/data/selection'
import { rolesById, projectsById } from '@/data/projects'
import { isNewCandidate } from '@/data/selection'

/** Historical performance score — uses explicit value for video candidates, else ID hash. */
function historicalScore(id: string): number {
  const explicit = videoPerformanceScore(id)
  if (explicit != null) return explicit
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) & 0xffff
  return 30 + (h % 51)
}

export function StudioTalentProfile() {
  const { candidateId } = useParams<{ candidateId: string }>()
  const navigate = useNavigate()
  const candidate = useCandidate(candidateId ?? '')

  if (!candidate) {
    return (
      <div className="flex flex-col gap-4 py-20 text-center text-muted">
        <p className="text-sm">Talent not found.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    )
  }

  const role = rolesById[candidate.roleId]
  const project = role ? projectsById[role.projectId] : undefined
  const histScore = historicalScore(candidate.id)
  const castingScore = candidateScore(candidate)
  const reviewed = candidate.good + candidate.maybe + candidate.no > 0
  const aiMetrics = deriveAiMetrics(candidate)
  const statusLabel = BOARD_COLUMN_LABELS[candidate.status]
  const isNew = isNewCandidate(candidate.id)

  return (
    <div className="flex flex-col gap-5 pb-16 lg:flex-row lg:items-start lg:gap-6">
      <div className="flex flex-1 flex-col gap-5">

        {/* back + identity card */}
        <Card flush className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-ink/80 to-ink/40" />
          <div className="relative px-5 pb-5 pt-12">
            <div className="absolute -top-10 left-5">
              <Avatar src={candidate.avatar} name={candidate.name} size="xl" ring className="border-4 border-card" />
            </div>
            <button
              onClick={() => navigate(-1)}
              className="absolute right-5 top-5 flex items-center gap-1.5 rounded-btn border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <h1 className="text-2xl font-bold tracking-tight text-ink">{candidate.name}</h1>
              {isNew && <span title="New applicant — first-time submission">⭐</span>}
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {candidate.age} y/o · {candidate.city}
              {candidate.nationality ? ` · ${candidate.nationality}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {candidate.experienceLevel && <Tag>{candidate.experienceLevel}</Tag>}
              {candidate.languages?.map((l) => <Tag key={l}>{l}</Tag>)}
              {isNew && <Tag tone="link">New applicant</Tag>}
            </div>
          </div>
        </Card>

        {/* stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCell value={histScore} label="Hist. score" />
          <StatCell value={reviewed ? castingScore : '—'} label="Casting score" />
          <StatCell value={statusLabel} label="Current status" small />
        </div>

        {/* persistent performance profile */}
        <Card flush className="overflow-hidden bg-ink p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/55">
                Persistent performance profile
              </span>
              <p className="mt-1 text-sm text-white/80">Based on historical casting data</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
              <Zap className="h-4 w-4" />
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {aiMetrics.map((m) => (
              <li key={m.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/85">{m.label}</span>
                  <span className="font-semibold">{m.value}</span>
                </div>
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <span
                    className="block h-full rounded-full bg-gold"
                    style={{ width: `${m.value}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* casting history */}
        {project && role && (
          <Card className="flex flex-col gap-3">
            <span className="tech-label inline-flex items-center gap-1.5">
              <Film className="h-4 w-4" />
              Casting history
            </span>
            <CastingHistoryRow
              projectTitle={project.title}
              roleName={role.name}
              roleType={role.type}
              status={statusLabel}
              video={candidate.video}
            />
          </Card>
        )}

        {/* self-tape */}
        {candidate.video && (
          <Card className="flex flex-col gap-3">
            <span className="tech-label">Self-tape</span>
            <SelfTapePlayer src={candidate.video} name={candidate.name} />
          </Card>
        )}
      </div>

      {/* sidebar */}
      <div className="flex w-full flex-col gap-4 lg:w-[280px] lg:shrink-0">
        <Card className="flex flex-col gap-2 text-sm">
          <span className="tech-label">Details</span>
          {candidate.age && <InfoRow label="Age" value={String(candidate.age)} />}
          {candidate.city && <InfoRow label="City" value={candidate.city} />}
          {candidate.nationality && <InfoRow label="Nationality" value={candidate.nationality} />}
          {candidate.gender && <InfoRow label="Gender" value={candidate.gender === 'M' ? 'Male' : candidate.gender === 'F' ? 'Female' : candidate.gender} />}
        </Card>

        {(candidate.languages?.length ?? 0) > 0 && (
          <Card className="flex flex-col gap-2">
            <span className="tech-label">Languages</span>
            <div className="flex flex-wrap gap-1.5">
              {candidate.languages?.map((l) => <Tag key={l}>{l}</Tag>)}
            </div>
          </Card>
        )}

        <Card className="flex flex-col gap-2">
          <span className="tech-label">Current casting</span>
          <div className="text-sm">
            <p className="font-semibold text-ink">{project?.title ?? '—'}</p>
            <p className="text-muted">{role?.name ?? '—'}</p>
            <div className="mt-2">
              <StatusBadge status={candidate.status} label={statusLabel} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ── Casting history row ─────────────────────────────────────────────────── */

function CastingHistoryRow({
  projectTitle,
  roleName,
  roleType,
  status,
  video,
}: {
  projectTitle: string
  roleName: string
  roleType?: string
  status: string
  video?: string
}) {
  const [playing, setPlaying] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)

  return (
    <div className="flex items-center justify-between gap-4 rounded-btn border border-line bg-paper px-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{projectTitle}</p>
        <p className="truncate text-xs text-muted">
          {roleType === 'Contestant' ? 'Contestant slot' : 'Role'}: {roleName}
        </p>
      </div>
      <span className="shrink-0 text-xs font-semibold text-muted">{status}</span>
      {video && (
        <button
          onClick={() => {
            if (ref.current) {
              if (playing) { ref.current.pause() } else { ref.current.play() }
            }
            setPlaying((v) => !v)
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal-no text-white shadow-sm hover:bg-signal-no/80 transition-colors"
          title="Watch casting tape"
        >
          <Play className="ml-0.5 h-3.5 w-3.5 fill-white" />
        </button>
      )}
      {video && (
        <video
          ref={ref}
          src={asset(video)}
          className="hidden"
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
        />
      )}
    </div>
  )
}

/* ── Self-tape player ────────────────────────────────────────────────────── */

function SelfTapePlayer({ src, name }: { src: string; name: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-btn bg-black" style={{ aspectRatio: '16/9' }}>
      <video
        ref={ref}
        src={asset(src)}
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <button
          onClick={() => ref.current?.play()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 hover:bg-black/40 transition-colors"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-signal-no text-white shadow-lg">
            <Play className="ml-0.5 h-6 w-6 fill-white" />
          </span>
          <span className="text-sm font-semibold text-white drop-shadow">{name}'s casting tape</span>
        </button>
      )}
      <button
        onClick={() => {
          if (ref.current) {
            ref.current.muted = !ref.current.muted
            setMuted(ref.current.muted)
          }
        }}
        className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
      >
        <span className="text-[10px] font-bold">{muted ? '🔇' : '🔊'}</span>
      </button>
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function StatCell({ value, label, small }: { value: number | string; label: string; small?: boolean }) {
  return (
    <Card className="flex flex-col items-center gap-0.5 py-3">
      <span className={cn('font-bold tracking-tight text-ink', small ? 'text-sm text-center' : 'text-2xl')}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</span>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  )
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone =
    status === 'cast' || status === 'offer' ? 'bg-signal-good/15 text-signal-good' :
    status === 'no-go' ? 'bg-signal-no/15 text-signal-no' :
    status === 'shortlisted' || status === 'callback' ? 'bg-link/15 text-link' :
    'bg-ink/10 text-muted'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', tone)}>
      {label}
    </span>
  )
}
