import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Share2, MoreHorizontal, Play, Zap, Sparkles, CheckCircle2, Camera, BookOpen } from 'lucide-react'
import { Card, Tag } from '@/components/ui'
import { PHONE_OVERLAY_ID } from '@/components/PhoneFrame'
import { useToast } from '@/components/Toast'
import { asset } from '@/lib/asset'
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
  const [tipsOpen, setTipsOpen] = useState(false)

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
        <div className="flex items-center gap-2">
          <span className="tech-label">
            {casting.kind} · {casting.company}
          </span>
          {casting.status === 'closed' && (
            <Tag tone="no" className="font-bold">Closed</Tag>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{casting.title}</h1>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm text-muted">
            Role: <span className="font-medium text-ink">{casting.roleName}</span>
          </p>
          {casting.status !== 'closed' && (
            <Tag tone="cream">{role?.auditionFlow ?? 'Open Call'}</Tag>
          )}
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

      {casting.status === 'closed' ? (
        <SubmissionCard role={casting.roleName} year={casting.year} />
      ) : (
        <div className="sticky bottom-0 -mx-4 mt-auto bg-gradient-to-t from-paper via-paper to-transparent px-4 pb-4 pt-3">
          <button
            onClick={() => setTipsOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-btn bg-cream py-3.5 text-sm font-bold text-ink shadow-sm transition-transform active:scale-[0.99]"
          >
            <Zap className="h-4 w-4" />
            Self Tape your audition
          </button>
        </div>
      )}

      {/* Self-tape interstitial */}
      {tipsOpen && (
        <SelfTapeInterstitial
          onTips={() => navigate(`/app/tips?next=/app/selftape/${id}`)}
          onRecord={() => navigate(`/app/selftape/${id}`)}
          onClose={() => setTipsOpen(false)}
        />
      )}
    </div>
  )
}

function SubmissionCard({ role, year }: { role: string; year?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="tech-label">Your submission</span>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-signal-good">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Submitted{year ? ` · ${year}` : ''}
        </div>
      </div>
      <p className="text-sm text-muted">
        Role: <span className="font-medium text-ink">{role}</span>
      </p>
      <div className="relative aspect-video overflow-hidden rounded-btn bg-black">
        <video
          ref={ref}
          src={asset("/media/audition.mp4")}
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
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg">
              <Play className="ml-0.5 h-5 w-5" />
            </span>
          </button>
        )}
        <span className="absolute left-3 top-3 rounded bg-black/55 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-white">
          SELF-TAPE
        </span>
      </div>
    </Card>
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

/* ── Self-tape interstitial bottom sheet ────────────────────────────────────── */

function SelfTapeInterstitial({
  onTips,
  onRecord,
  onClose,
}: {
  onTips: () => void
  onRecord: () => void
  onClose: () => void
}) {
  const target = document.getElementById(PHONE_OVERLAY_ID)
  if (!target) return null

  return createPortal(
    <div className="pointer-events-auto absolute inset-0 flex flex-col justify-end" onClick={onClose}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />

      {/* sheet */}
      <div
        className="relative flex flex-col gap-4 rounded-t-2xl bg-card px-5 pb-10 pt-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="mx-auto h-1 w-10 rounded-full bg-line" />

        <div className="text-center">
          <h3 className="text-base font-bold text-ink">Prêt à tourner ?</h3>
          <p className="mt-1 text-sm text-muted">
            Découvrez nos 10 conseils pour un self-tape réussi, ou lancez-vous directement.
          </p>
        </div>

        <button
          onClick={onTips}
          className="flex items-center gap-4 rounded-card border border-line bg-paper p-4 text-left transition-colors hover:bg-ink/5 active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-ink">Voir les conseils</p>
            <p className="text-xs text-muted">10 tips pour un self-tape pro</p>
          </div>
        </button>

        <button
          onClick={onRecord}
          className="flex items-center gap-4 rounded-card bg-cream p-4 text-left transition-colors hover:brightness-95 active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/10 text-ink">
            <Camera className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-ink">Enregistrer maintenant</p>
            <p className="text-xs text-muted/70">Je connais déjà les tips</p>
          </div>
        </button>
      </div>
    </div>,
    target,
  )
}

function BriefPlayer({ poster }: { poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <div className="relative aspect-video overflow-hidden rounded-card border border-line bg-black">
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
