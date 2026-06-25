import { useRef, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Calendar, Clock, DollarSign,
  Play, Zap, ChevronDown, ChevronUp, FileText, Sparkles,
  Bookmark, Share2, CheckCircle2, Users, Video,
} from 'lucide-react'
import { Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import { projectsById, rolesByProject, sidesById, roleBriefVideo, discoverCastingsById } from '@/data'
import type { Role, Sides } from '@/data/types'
import { asset } from '@/lib/asset'

export function TalentCastingDetail() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const project = projectsById[projectId]
  if (!project) return <Navigate to="/talent" replace />

  const roles = rolesByProject(projectId)
  const casting = discoverCastingsById[projectId]
  const isClosed = casting?.status === 'closed'

  return (
    <div className="flex flex-col gap-0">
      {/* back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-card border border-line bg-card">
        {project.poster && (
          <div className="h-40 w-full overflow-hidden bg-ink/10">
            <img src={asset(project.poster)} alt="" className="h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 h-40 bg-gradient-to-b from-transparent to-card" />
          </div>
        )}

        <div className="flex flex-col gap-4 p-6 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="tech-label">
                  {project.type} · {project.company}
                  {project.genre ? ` · ${project.genre}` : ''}
                </span>
                {isClosed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-signal-no/10 px-2 py-0.5 text-[11px] font-bold text-signal-no">
                    Closed
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{project.title}</h1>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => toast('Casting saved')}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-muted hover:text-ink"
              >
                <Bookmark className="h-4 w-4" />
              </button>
              <button
                onClick={() => toast('Link copied')}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-muted hover:text-ink"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* key info chips */}
          <div className="flex flex-wrap gap-3">
            {project.location && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {project.location}
              </span>
            )}
            {project.shooting && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Shooting {project.shooting}
              </span>
            )}
            {project.castingCloses && !isClosed && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-signal-no">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                Casting closes {project.castingCloses}
              </span>
            )}
            {roles.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                <Users className="h-3.5 w-3.5 shrink-0" />
                {roles.length} role{roles.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-5">

          {/* Synopsis */}
          {project.synopsis && (
            <Section title="Synopsis">
              <p className="text-sm leading-relaxed text-ink">{project.synopsis}</p>
            </Section>
          )}

          {/* Director's brief */}
          <Section
            title="Director's brief"
            badge={<Tag tone="gold" icon={<Sparkles className="h-3 w-3" />}>Exclusive</Tag>}
          >
            <BriefPlayer poster={project.poster} />
            {project.directorBrief && (
              <blockquote className="mt-3 border-l-2 border-gold pl-4 text-sm italic leading-relaxed text-ink">
                "{project.directorBrief}"
              </blockquote>
            )}
          </Section>

          {/* Roles */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-bold tracking-tight text-ink">
              {isClosed ? 'Roles' : 'Available roles'}
              <span className="ml-2 text-sm font-normal text-muted">({roles.length})</span>
            </h2>
            {roles.length === 0 && (
              <p className="text-sm text-muted">No roles available for this project right now.</p>
            )}
            {roles.map((role) => {
              const sides = role.sidesId ? sidesById[role.sidesId] : undefined
              return (
                <RoleCard
                  key={role.id}
                  role={role}
                  sides={sides}
                  isCastingClosed={isClosed}
                  onSubmit={() => navigate(`/app/selftape/${projectId}`)}
                />
              )
            })}
          </div>

          {/* Past self-tape — only for closed castings */}
          {isClosed && (
            <Section title="Your submission">
              <PastSelfTape projectTitle={project.title} />
            </Section>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex flex-col gap-4">
          {/* Quick info */}
          <div className="rounded-card border border-line bg-card p-5">
            <h3 className="mb-3 text-sm font-bold text-ink">Project details</h3>
            <dl className="flex flex-col gap-2.5">
              <InfoRow label="Production co." value={project.company} />
              <InfoRow label="Type" value={project.type} />
              {project.genre && <InfoRow label="Genre" value={project.genre} />}
              {project.location && <InfoRow label="Shooting location" value={project.location} icon={<MapPin className="h-3.5 w-3.5" />} />}
              {project.shooting && <InfoRow label="Shooting dates" value={project.shooting} icon={<Calendar className="h-3.5 w-3.5" />} />}
              {project.castingCloses && <InfoRow label="Casting closes" value={project.castingCloses} icon={<Clock className="h-3.5 w-3.5" />} />}
            </dl>
          </div>

          {/* CTA */}
          {isClosed ? (
            <div className="rounded-card border border-line bg-card p-5">
              <p className="mb-1 text-sm font-semibold text-ink">This casting is closed</p>
              <p className="mb-3 text-xs text-muted">
                Submissions are no longer accepted. Review your past self-tape below.
              </p>
              <button
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-btn bg-ink/20 py-2.5 text-sm font-bold text-ink/40"
              >
                <Zap className="h-4 w-4" />
                Submit my self-tape
              </button>
              <button
                disabled
                className="mt-2 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-btn border border-line bg-paper/50 py-2.5 text-sm font-semibold text-muted/50"
              >
                <Bookmark className="h-4 w-4" />
                Save this casting
              </button>
            </div>
          ) : (
            <div className="rounded-card border border-line bg-card p-5">
              <p className="mb-3 text-sm text-muted">
                {roles.filter((r) => r.status !== 'Callbacks').length} role(s) still open for applications.
              </p>
              <button
                onClick={() => {
                  const first = roles.find((r) => r.status !== 'Callbacks')
                  if (first) navigate(`/app/selftape/${projectId}`)
                  else toast("No more open roles right now")
                }}
                className="flex w-full items-center justify-center gap-2 rounded-btn bg-ink py-2.5 text-sm font-bold text-paper transition-opacity hover:opacity-90"
              >
                <Zap className="h-4 w-4" />
                Submit my self-tape
              </button>
              <button
                onClick={() => toast('Casting saved to your favourites')}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-btn border border-line bg-paper py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
              >
                <Bookmark className="h-4 w-4" />
                Save this casting
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title,
  badge,
  children,
}: {
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-card border border-line bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight text-ink">{title}</h2>
        {badge}
      </div>
      {children}
    </div>
  )
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink flex items-center gap-1">
        {icon}
        {value}
      </span>
    </div>
  )
}

function BriefPlayer({ poster }: { poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  return (
    <div className="relative aspect-video overflow-hidden rounded-btn border border-line bg-black">
      <video
        ref={ref}
        src={asset(roleBriefVideo)}
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
          className="absolute inset-0 flex items-center justify-center bg-black/25"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg">
            <Play className="ml-1 h-6 w-6" />
          </span>
        </button>
      )}
      <span className="absolute left-3 top-3 rounded bg-black/55 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-white">
        DIRECTOR'S BRIEF
      </span>
    </div>
  )
}

function PastSelfTape({ projectTitle }: { projectTitle: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const toast = useToast()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-signal-good" />
          Submitted · Feb 14, 2025
        </span>
        <span className="rounded-full bg-signal-good/10 px-2 py-0.5 text-[11px] font-semibold text-signal-good">
          Under review
        </span>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-btn border border-line bg-black">
        <video
          ref={ref}
          src={asset('/media/selftape.mp4')}
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
            className="absolute inset-0 flex items-center justify-center bg-black/25"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg">
              <Play className="ml-1 h-6 w-6" />
            </span>
          </button>
        )}
        <span className="absolute left-3 top-3 rounded bg-black/55 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-white">
          MY SELF-TAPE · {projectTitle.toUpperCase()}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => toast('Downloading your self-tape…')}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line bg-paper px-3 py-2 text-sm font-medium text-muted hover:text-ink"
        >
          <Video className="h-4 w-4" />
          Download
        </button>
        <button
          onClick={() => toast('Share link copied')}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-btn border border-line bg-paper px-3 py-2 text-sm font-medium text-muted hover:text-ink"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </div>
  )
}

function RoleCard({
  role,
  sides,
  isCastingClosed,
  onSubmit,
}: {
  role: Role
  sides?: Sides
  isCastingClosed?: boolean
  onSubmit: () => void
}) {
  const toast = useToast()
  const [sidesOpen, setSidesOpen] = useState(false)
  const [applied, setApplied] = useState(false)
  const isClosed = isCastingClosed || role.status === 'Callbacks'

  return (
    <div className={cn(
      'rounded-card border bg-card transition-shadow hover:shadow-card-hover',
      isClosed ? 'border-line opacity-70' : 'border-line',
    )}>
      {/* role header */}
      <div className="flex items-start justify-between gap-4 p-5 pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-ink">{role.name}</h3>
            <Tag tone={role.type === 'Lead' ? 'gold' : 'cream'}>{role.type}</Tag>
            {isClosed && <Tag tone="neutral">Full</Tag>}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            {role.pay && (
              <span className="inline-flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {role.pay}
              </span>
            )}
            {role.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {role.location}
              </span>
            )}
            {role.deadline && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Deadline: {role.deadline}
                {role.deadlineCountdown && (
                  <span className="font-semibold text-signal-no">({role.deadlineCountdown})</span>
                )}
              </span>
            )}
            {role.auditionFlow && (
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                {role.auditionFlow}
              </span>
            )}
          </div>

          {/* selected talent chip — only on closed castings */}
          {isClosed && role.selectedTalent && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-signal-good/30 bg-signal-good/8 px-2.5 py-1">
              <img
                src={asset(role.selectedTalent.avatar)}
                alt={role.selectedTalent.name}
                className="h-5 w-5 rounded-full object-cover ring-1 ring-signal-good/30"
              />
              <span className="text-xs font-semibold text-signal-good">{role.selectedTalent.name}</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-signal-good" />
            </div>
          )}
        </div>
      </div>

      {/* casting notes */}
      {role.castingNotes && (
        <div className="mx-5 mb-3 rounded-btn bg-paper p-3.5">
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Casting brief</span>
          </div>
          <p className="text-sm leading-relaxed text-ink">{role.castingNotes}</p>
        </div>
      )}

      {/* sides toggle */}
      {sides && (
        <div className="mx-5 mb-3">
          <button
            onClick={() => setSidesOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-btn border border-line bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted" />
              Script / Sides
              <span className="font-normal text-muted">({sides.pages} pages)</span>
            </span>
            {sidesOpen ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
          </button>

          {sidesOpen && (
            <div className="mt-2 rounded-btn border border-line bg-paper p-4 font-mono text-xs leading-relaxed text-ink">
              {sides.lines.map((l, i) => (
                <p key={i} className={cn('mb-1.5', l.kind === 'heading' && 'mt-3 font-bold text-muted first:mt-0')}>
                  {l.character
                    ? <><span className="font-bold text-signal-no">{l.character}</span>: {l.text}</>
                    : l.text
                  }
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* actions */}
      <div className="flex items-center gap-2 border-t border-line p-4 pt-3">
        {isClosed ? (
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <CheckCircle2 className="h-4 w-4 text-signal-good" />
            {isCastingClosed ? 'Submission sent' : 'Role filled'}
          </span>
        ) : applied ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-signal-good">
            <CheckCircle2 className="h-4 w-4" />
            Application sent
          </span>
        ) : (
          <button
            onClick={() => { setApplied(true); onSubmit() }}
            className="inline-flex items-center gap-2 rounded-btn bg-ink px-4 py-2 text-sm font-bold text-paper transition-opacity hover:opacity-90"
          >
            <Zap className="h-4 w-4" />
            Submit my self-tape
          </button>
        )}
        {!isClosed && (
          <button
            onClick={() => toast('Role saved')}
            className="inline-flex items-center gap-1.5 rounded-btn border border-line bg-paper px-3 py-2 text-sm font-medium text-muted hover:text-ink"
          >
            <Bookmark className="h-4 w-4" />
            Save
          </button>
        )}
      </div>
    </div>
  )
}
