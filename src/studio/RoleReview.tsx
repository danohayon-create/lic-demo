import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, Check, HelpCircle, Pin, PhoneCall, LayoutGrid, Plus, Send, Star } from 'lucide-react'
import { Card, Avatar, Button, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import { projectsById, rolesByProject } from '@/data'
import {
  useRoleCandidates,
  moveCandidate,
  rateCandidate,
  candidateScore,
  candidateAverageRating,
  deriveTeamRatings,
  deriveAiMetrics,
  type Candidate,
} from '@/data/selection'
import { Player, Transcript } from './Review'

const ratingOptions = [
  { key: 'no' as const,    label: 'No go',      icon: X,
    base: 'border-signal-no/30 text-signal-no hover:bg-signal-no/5',
    active: 'border-signal-no bg-signal-no text-white' },
  { key: 'maybe' as const, label: 'Maybe',      icon: HelpCircle,
    base: 'border-signal-maybe/40 text-[#8A6D00] hover:bg-signal-maybe/5',
    active: 'border-signal-maybe bg-signal-maybe text-white' },
  { key: 'good' as const,  label: 'Good match', icon: Check,
    base: 'border-signal-good/30 text-signal-good hover:bg-signal-good/5',
    active: 'border-signal-good bg-signal-good text-white' },
]

export function RoleReview({ projectId, roleId }: { projectId: string; roleId: string }) {
  const navigate = useNavigate()
  const toast = useToast()
  const project = projectsById[projectId]
  const roles = rolesByProject(projectId)
  const role = roles.find((r) => r.id === roleId) ?? roles[0]

  const candidates = useRoleCandidates(role.id)
  const [searchParams] = useSearchParams()
  const focusCandidateId = searchParams.get('candidate')
  const [idx, setIdx] = useState(() => {
    const i = candidates.findIndex((c) => c.id === focusCandidateId)
    return i >= 0 ? i : 0
  })
  const candidate = candidates[Math.min(idx, Math.max(candidates.length - 1, 0))]

  const go = (dir: 1 | -1) => setIdx((i) => (i + dir + candidates.length) % candidates.length)

  if (!candidate) {
    return (
      <div className="flex flex-col gap-4">
        <Breadcrumb projectTitle={project.title} roleName={role.name} candidateName="" navigate={navigate} />
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-3xl">🎬</span>
          <p className="text-sm font-semibold text-ink">No submissions yet for this role</p>
          <p className="text-xs text-muted">Candidates will appear here once the casting call is open.</p>
        </Card>
      </div>
    )
  }

  const score = candidateScore(candidate)
  const reviewed = candidate.good + candidate.maybe + candidate.no > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumb projectTitle={project.title} roleName={role.name} candidateName={candidate.name} navigate={navigate} />

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/studio/selection?p=${projectId}&role=${role.id}`)}
            className="flex items-center gap-1.5 rounded-btn border border-line bg-card px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Selection console
          </button>
          <Tag tone="neutral" className="font-mono font-semibold">
            {idx + 1} / {candidates.length}
          </Tag>
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

      {/* Candidate banner */}
      <Card className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={candidate.avatar} name={candidate.name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-link">{candidate.name}</span>{' '}
              <span className="text-muted">as</span> <span className="text-signal-no">{role.name}</span>
              <Tag tone="gold" className="ml-3 align-middle font-semibold" icon={<span>⚡</span>}>
                {score} LIC score
              </Tag>
            </h1>
            <p className="mt-1 text-sm text-muted">
              {candidate.age} y/o · {candidate.city} · {candidates.length} candidates for this role
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<Pin className="h-4 w-4" />}
            onClick={() => {
              const r = moveCandidate(candidate.id, 'shortlisted')
              toast(r.ok ? `${candidate.name} shortlisted` : r.reason ?? 'Could not shortlist')
            }}
          >
            Shortlist
          </Button>
          <Button
            icon={<PhoneCall className="h-4 w-4" />}
            onClick={() => {
              const r = moveCandidate(candidate.id, 'callback')
              toast(r.ok ? `Callback invite sent to ${candidate.name}` : r.reason ?? 'Could not invite')
            }}
          >
            Invite to callback
          </Button>
        </div>
      </Card>

      {/* player + decision */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <Player key={candidate.id} src={candidate.video} />
          <Transcript />
        </div>
        <RoleDecisionPanel key={candidate.id} candidate={candidate} reviewed={reviewed} />
      </div>
    </div>
  )
}

function Breadcrumb({
  projectTitle,
  roleName,
  candidateName,
  navigate,
}: {
  projectTitle: string
  roleName: string
  candidateName: string
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted">
      <button onClick={() => navigate('/studio/dashboard?p=les-ombres-de-midi')} className="hover:text-ink">
        {projectTitle}
      </button>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="text-ink">{roleName}</span>
      {candidateName && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-ink">{candidateName}</span>
        </>
      )}
    </nav>
  )
}

function RoleDecisionPanel({ candidate, reviewed }: { candidate: Candidate; reviewed: boolean }) {
  const toast = useToast()
  const { id: candidateId, good, maybe, no } = candidate
  const tally: Record<'good' | 'maybe' | 'no', number> = { good, maybe, no }
  const [lastVote, setLastVote] = useState<'good' | 'maybe' | 'no' | null>(null)
  const [stars, setStars] = useState(Math.round(candidateAverageRating(candidate)))
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  const teamRatings = deriveTeamRatings(candidate)
  const aiMetrics = deriveAiMetrics(candidate)

  return (
    <div className="flex flex-col gap-4">
      {/* your rating */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="tech-label">Rate this take</span>
          <Tag tone={reviewed ? 'good' : 'neutral'}>{reviewed ? 'Reviewed' : 'Not reviewed'}</Tag>
        </div>
        <div className="flex flex-col gap-2">
          {ratingOptions.map((o) => {
            const Icon = o.icon
            const isActive = lastVote === o.key
            return (
              <button
                key={o.key}
                onClick={() => {
                  rateCandidate(candidateId, o.key)
                  setLastVote(o.key)
                  toast(`Vote added: ${o.label}`)
                }}
                className={cn(
                  'flex items-center justify-between rounded-btn border-2 bg-card px-4 py-2.5 text-sm font-semibold transition-all',
                  isActive ? o.active : o.base,
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {o.label}
                </span>
                <span className={cn('font-mono text-xs', isActive ? 'text-white/80' : 'text-muted')}>{tally[o.key]}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-line pt-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}>
                <Star className={cn('h-5 w-5', n <= stars ? 'fill-gold text-gold' : 'text-line')} />
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
          {teamRatings.map((t, i) => (
            <span
              key={`${t.initials}-${i}`}
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
        <span className="text-xs text-muted">
          {teamRatings.length > 0 ? `${teamRatings.length} of 5 teammates have rated` : 'No teammate has rated yet'}
        </span>
      </Card>

      {/* AI scene analysis */}
      <Card className="flex flex-col gap-3">
        <div>
          <span className="tech-label">AI scene analysis</span>
          <p className="text-xs text-muted">Auto-generated from the take</p>
        </div>
        <ul className="flex flex-col gap-3">
          {aiMetrics.map((m) => (
            <li key={m.label} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="text-ink">{m.label}</span>
                <span className="font-semibold text-ink">{m.value}</span>
              </div>
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-ink/70" style={{ width: `${m.value}%` }} />
              </span>
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
