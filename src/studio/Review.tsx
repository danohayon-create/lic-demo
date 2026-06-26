import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Play,
  Pause,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCw,
  UserRound,
  Pin,
  Star,
  X,
  Check,
  HelpCircle,
  Plus,
  Send,
  Pencil,
} from 'lucide-react'
import { Card, Button, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import {
  talents,
  mayaProfile,
  rolesById,
  sceneAnalyses,
  auditionVideo,
  auditionDuration,
  auditionTranscript,
  type Signal,
} from '@/data'
import { RoleReview } from './RoleReview'

const role = rolesById['fanny-brice']
const analysis = sceneAnalyses[0]

/** "MM:SS" → seconds. */
const toSeconds = (tc: string) => {
  const [m, s] = tc.split(':').map(Number)
  return m * 60 + s
}
const fmt = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function Review() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('p')
  const roleId = searchParams.get('role')

  if (projectId === 'les-ombres-de-midi' && roleId) {
    return <RoleReview projectId={projectId} roleId={roleId} />
  }
  return <LegacyReview />
}

function LegacyReview() {
  const navigate = useNavigate()
  const toast = useToast()
  const [idx, setIdx] = useState(0) // active talent (0 = Maya)
  const talent = talents[idx]
  const isMaya = talent.id === mayaProfile.id

  const go = (dir: 1 | -1) => setIdx((i) => (i + dir + talents.length) % talents.length)

  return (
    <div className="flex flex-col gap-4">
      {/* breadcrumb + nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-muted">
          <button onClick={() => navigate('/studio/dashboard')} className="hover:text-ink">
            Evermore
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink">{role.name}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-ink">{talent.name}</span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toast('390 submissions in this role')}
            className="flex items-center gap-1.5 rounded-btn border border-line bg-card px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper"
          >
            390 auditions
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </button>
          <button
            onClick={() => toast('Refreshed')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('/studio/search')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
          >
            <UserRound className="h-4 w-4" />
          </button>
          <div className="ml-1 flex rounded-btn border border-line">
            <button onClick={() => go(-1)} className="p-2 text-muted hover:text-ink" aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => go(1)} className="border-l border-line p-2 text-muted hover:text-ink" aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* talent banner */}
      <Card className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-link">{talent.name}</span>{' '}
            <span className="text-muted">as</span> <span className="text-signal-no">{role.name}</span>
            <Tag tone="gold" className="ml-3 align-middle font-semibold" icon={<span>⚡</span>}>
              {talent.match} match
            </Tag>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isMaya && <>Height {mayaProfile.height} · </>}
            Agency {talent.agency}
            {isMaya ? (
              <>
                {' '}· Contact <span className="text-link">{mayaProfile.email}</span>
              </>
            ) : (
              <> · {talent.city}</>
            )}{' '}
            · <span className="text-link">CV</span> · <span className="text-link">Reel</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<Pin className="h-4 w-4" />}
            onClick={() => toast(`Added ${talent.name} to shortlist`)}
          >
            Shortlist
          </Button>
          <Button onClick={() => toast(`Callback invite sent to ${talent.name}`)}>
            Invite to callback
          </Button>
        </div>
      </Card>

      {/* player + decision */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <Player />
          <Transcript />
        </div>
        <DecisionPanel />
      </div>
    </div>
  )
}

/* ── Custom video player ──────────────────────────────────────────────────── */

const SPEEDS = [1, 1.25, 1.5, 0.75]

export function Player({ src }: { src?: string } = {}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(toSeconds(auditionDuration))
  const [speedIdx, setSpeedIdx] = useState(0)

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    v.currentTime = ratio * duration
  }

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length
    setSpeedIdx(next)
    if (videoRef.current) videoRef.current.playbackRate = SPEEDS[next]
  }

  const progress = duration ? (time / duration) * 100 : 0

  return (
    <Card flush className="overflow-hidden">
      <div className="group relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          src={src ?? auditionVideo}
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          onClick={toggle}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || toSeconds(auditionDuration))}
          onEnded={() => setPlaying(false)}
        />

        {/* center play */}
        {!playing && (
          <button
            onClick={toggle}
            className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg transition-transform hover:scale-105"
          >
            <Play className="ml-1 h-7 w-7" />
          </button>
        )}

        {/* controls */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div
            onClick={seek}
            className="h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/25"
          >
            <div className="h-full rounded-full bg-[#F59E42]" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-3 text-white">
            <button onClick={toggle} className="hover:opacity-80">
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <span className="font-mono text-xs">
              {fmt(time)} / {fmt(duration)}
            </span>
            <button
              onClick={cycleSpeed}
              className="ml-auto rounded border border-white/30 px-1.5 py-0.5 font-mono text-xs hover:bg-white/10"
            >
              {SPEEDS[speedIdx].toFixed(2)}×
            </button>
            <button onClick={() => videoRef.current?.requestFullscreen?.()} className="hover:opacity-80">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function Transcript() {
  const lines = useMemo(
    () => auditionTranscript.map((l) => ({ ...l, sec: toSeconds(l.timecode) })),
    [],
  )
  return (
    <Card className="flex flex-col gap-2">
      <span className="tech-label">Synced sides</span>
      <ul className="flex flex-col gap-1.5">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-3 rounded-btn px-2 py-1.5 hover:bg-paper">
            <span className="shrink-0 font-mono text-xs text-muted">{l.timecode}</span>
            <span className="text-sm text-ink">
              {l.character && <span className="font-semibold text-signal-no">{l.character}: </span>}
              {l.text}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* ── Decision panel ───────────────────────────────────────────────────────── */

const ratingOptions: {
  key: Signal
  label: string
  icon: typeof X
  base: string
  selected: string
}[] = [
  {
    key: 'no',
    label: 'No go',
    icon: X,
    base: 'border-signal-no/30 text-signal-no hover:bg-signal-no/5',
    selected: 'border-2 border-signal-no bg-signal-no/10 text-signal-no',
  },
  {
    key: 'maybe',
    label: 'Maybe',
    icon: HelpCircle,
    base: 'border-signal-maybe/40 text-[#8A6D00] hover:bg-signal-maybe/5',
    selected: 'border-2 border-signal-maybe bg-signal-maybe/10 text-[#8A6D00]',
  },
  {
    key: 'good',
    label: 'Good match',
    icon: Check,
    base: 'border-signal-good/30 text-signal-good hover:bg-signal-good/5',
    selected: 'border-2 border-signal-good bg-signal-good-bg text-signal-good',
  },
]

function DecisionPanel() {
  const toast = useToast()
  const [rating, setRating] = useState<Signal>(analysis.decision)
  const [stars, setStars] = useState(Math.round(analysis.averageRating))
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  const [editingMetrics, setEditingMetrics] = useState(false)
  const [metrics, setMetrics] = useState(analysis.metrics.map((m) => ({ ...m })))

  const ratingLabel: Record<Signal, string> = {
    no: 'No go',
    maybe: 'Maybe',
    good: 'Good match',
  }

  return (
    <div className="flex flex-col gap-4">
      {/* your rating */}
      <Card className="flex flex-col gap-3">
        <span className="tech-label">Your rating</span>
        <div className="flex flex-col gap-2">
          {ratingOptions.map((o) => {
            const Icon = o.icon
            const isSel = rating === o.key
            return (
              <button
                key={o.key}
                onClick={() => {
                  setRating(o.key)
                  toast(`Rating saved: ${ratingLabel[o.key]}`)
                }}
                className={cn(
                  'flex items-center justify-between rounded-btn border bg-card px-4 py-2.5 text-sm font-semibold transition-all',
                  isSel ? o.selected : o.base,
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {o.label}
                </span>
                {isSel && <Check className="h-4 w-4" />}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-line pt-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}>
                <Star
                  className={cn(
                    'h-5 w-5',
                    n <= stars ? 'fill-gold text-gold' : 'text-line',
                  )}
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-semibold text-ink">{stars.toFixed(1)}/5</span>
        </div>
      </Card>

      {/* other ratings */}
      <Card className="flex flex-col gap-3">
        <span className="tech-label">Other ratings</span>
        <div className="flex items-center gap-2">
          {analysis.teamRatings.map((t) => (
            <span
              key={t.initials}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white',
                t.signal === 'good' && 'bg-signal-good',
                t.signal === 'maybe' && 'bg-signal-maybe',
                t.signal === 'no' && 'bg-signal-no',
              )}
            >
              {t.initials}
            </span>
          ))}
          <button
            onClick={() => toast('Invite teammates to rate')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-line text-muted hover:text-ink"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-xs text-muted">{analysis.ratedSummary}</span>
      </Card>

      {/* Scene analysis */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="tech-label">Scene Analysis</span>
            <p className="text-xs text-muted">
              {editingMetrics ? 'Adjust the scores below' : 'AI-proposed · you can override'}
            </p>
          </div>
          <button
            onClick={() => setEditingMetrics((v) => !v)}
            title={editingMetrics ? 'Done editing' : 'Edit scores'}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink/30 hover:text-ink"
          >
            {editingMetrics ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>
        </div>
        <ul className="flex flex-col gap-3">
          {metrics.map((m, i) => (
            <li key={m.label} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-ink">{m.label}</span>
                <span className="font-semibold text-ink">{m.value}</span>
              </div>
              {editingMetrics ? (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={m.value}
                  onChange={(e) => {
                    const next = [...metrics]
                    next[i] = { ...next[i], value: Number(e.target.value) }
                    setMetrics(next)
                  }}
                  className="h-1.5 w-full cursor-pointer accent-ink"
                />
              ) : (
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <span className="block h-full rounded-full bg-ink/70 transition-all duration-300" style={{ width: `${m.value}%` }} />
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {/* direct feedback */}
      <Card className="flex flex-col gap-3">
        <div>
          <span className="tech-label">Direct feedback to actor</span>
          <p className="text-xs text-muted">Sent privately to the actor</p>
        </div>
        {sent ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-signal-good">
            <Check className="h-4 w-4" /> Feedback sent.
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write a note…"
              className="h-10 flex-1 rounded-btn border border-line bg-paper px-3 text-sm text-ink focus:border-ink/20 focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
            <button
              onClick={() => {
                if (!note.trim()) return
                setSent(true)
                toast('Feedback sent to actor')
              }}
              className="flex h-10 w-10 items-center justify-center rounded-btn bg-ink text-white hover:bg-ink/90 disabled:opacity-40"
              disabled={!note.trim()}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
