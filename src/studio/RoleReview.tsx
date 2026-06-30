import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, X, Check, HelpCircle, Pin, PhoneCall,
  LayoutGrid, Plus, Send, Star, Sparkles, History, TrendingUp, Info,
} from 'lucide-react'
import { Card, Avatar, Button, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import { projectsById, rolesByProject } from '@/data'
import {
  useRoleCandidates,
  moveCandidate,
  rateCandidate,
  candidateScore,
  deriveTeamRatings,
  type Candidate,
} from '@/data/selection'
import { Player, Transcript } from './Review'
import { asset } from '@/lib/asset'

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

const SCENE_AXES = [
  'Authenticity', 'Charisma', 'Originality', 'Watchability', 'Camera presence',
]

/** Deterministic historical performance score (0-100) from past castings, seeded by candidate id. */
function historicalScore(c: Candidate): number {
  const seed = c.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)
  return 40 + (seed * 13) % 45
}

/** Compute LIC score from two families: current casting (50%) + historical (50%). */
function computeLicScore(
  candidate: Candidate,
  positiveAxes: number,
  ratedAxes: number,
): { ratingScore: number; sceneScore: number; currentScore: number; pastScore: number; licScore: number; sceneRated: boolean } {
  const ratingScore = candidateScore(candidate)
  const sceneRated = ratedAxes > 0
  const sceneScore = sceneRated ? Math.round((positiveAxes / SCENE_AXES.length) * 100) : 0
  const currentScore = sceneRated
    ? Math.round(ratingScore * 0.6 + sceneScore * 0.4)
    : ratingScore
  const pastScore = historicalScore(candidate)
  const licScore = Math.round(currentScore * 0.5 + pastScore * 0.5)
  return { ratingScore, sceneScore, currentScore, pastScore, licScore, sceneRated }
}

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

  // Scene toggles lifted here so the banner and modal can access them
  const [sceneToggles, setSceneToggles] = useState<Record<string, boolean | null>>(
    () => Object.fromEntries(SCENE_AXES.map((a) => [a, null]))
  )
  const [showScoreModal, setShowScoreModal] = useState(false)

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

  const positiveAxes = Object.values(sceneToggles).filter((v) => v === true).length
  const ratedAxes = Object.values(sceneToggles).filter((v) => v !== null).length
  const scores = computeLicScore(candidate, positiveAxes, ratedAxes)
  const reviewed = candidate.good + candidate.maybe + candidate.no > 0

  return (
    <div className="flex flex-col gap-4">
      {/* breadcrumb + nav */}
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
            <h1 className="text-2xl font-bold tracking-tight flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-link">{candidate.name}</span>{' '}
              <span className="text-muted">as</span>{' '}
              <span className="text-signal-no">{role.name}</span>
              <span className="flex items-center gap-1.5">
                <Tag tone="gold" className="font-semibold" icon={<span>⚡</span>}>
                  {scores.licScore} LIC score
                </Tag>
                <button
                  onClick={() => setShowScoreModal(true)}
                  className="flex h-6 items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 text-[11px] font-semibold text-[#8A6D00] hover:bg-gold/20 transition-colors"
                >
                  How? <Info className="h-3 w-3" />
                </button>
              </span>
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

      {/* Score breakdown modal */}
      {showScoreModal && (
        <ScoreBreakdownModal
          candidate={candidate}
          scores={scores}
          sceneToggles={sceneToggles}
          onClose={() => setShowScoreModal(false)}
        />
      )}

      {/* Let it Cast Intelligence — full width, above player */}
      <LICIntelligenceCard candidate={candidate} totalCandidates={candidates.length} licScore={scores.licScore} />

      {/* player + decision */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* left column */}
        <div className="flex flex-col gap-4">
          <Player key={candidate.id} src={asset(candidate.video)} />
          <Transcript />
          <CastingHistoryCard />
        </div>
        {/* right column */}
        <RoleDecisionPanel
          key={candidate.id}
          candidate={candidate}
          reviewed={reviewed}
          sceneToggles={sceneToggles}
          setSceneToggles={setSceneToggles}
        />
      </div>
    </div>
  )
}

/* ── Score breakdown modal ──────────────────────────────────────────────────── */

function ScoreBreakdownModal({
  candidate,
  scores,
  sceneToggles,
  onClose,
}: {
  candidate: Candidate
  scores: ReturnType<typeof computeLicScore>
  sceneToggles: Record<string, boolean | null>
  onClose: () => void
}) {
  const { ratingScore, sceneScore, currentScore, pastScore, licScore, sceneRated } = scores
  const positiveAxes = Object.values(sceneToggles).filter((v) => v === true).length

  const historyEntries = [
    { show: 'MAFS AU',         result: 'Cast',        pts: 100 },
    { show: "I'm a Celebrity", result: 'Cast',        pts: 100 },
    { show: 'Survivor AU',     result: 'Callback',    pts: 75  },
    { show: 'The Bachelor AU', result: 'Callback',    pts: 75  },
    { show: 'Big Brother AU',  result: 'Shortlisted', pts: 50  },
    { show: 'MasterChef AU',   result: 'Shortlisted', pts: 50  },
    { show: 'The Block',       result: 'No go',       pts:  0  },
    { show: 'Love Island AU',  result: 'No go',       pts:  0  },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-card shadow-2xl ring-1 ring-line"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <p className="text-sm font-bold text-ink">Performance Score Breakdown</p>
              <p className="text-xs text-muted">{candidate.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">

          {/* Formula intro */}
          <p className="text-xs text-muted leading-relaxed">
            The LIC score is a composite of two equally weighted families: the <strong className="text-ink">current casting evaluation</strong> and the candidate's <strong className="text-ink">historical performance</strong> across past productions.
          </p>

          {/* Family 1 — Current Casting */}
          <div className="rounded-xl border border-line bg-paper p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-label text-link">① Current Casting</p>
                <p className="text-[11px] text-muted">Weight: 50% of LIC score</p>
              </div>
              <span className="rounded-btn bg-link/10 px-2.5 py-1 text-sm font-bold text-link">{currentScore}/100</span>
            </div>

            {/* Rating sub-row */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-28 shrink-0 text-[11px] text-muted">Team rating <span className="text-[10px]">×60%</span></span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-line">
                <div className="absolute inset-y-0 left-0 rounded-full bg-signal-good transition-all" style={{ width: `${ratingScore}%` }} />
              </div>
              <span className="w-8 text-right text-xs font-semibold text-ink">{ratingScore}</span>
            </div>

            {/* Scene analysis sub-row */}
            <div className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-[11px] text-muted">Scene analysis <span className="text-[10px]">×40%</span></span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className={cn('absolute inset-y-0 left-0 rounded-full transition-all', sceneRated ? 'bg-gold' : 'bg-line/50')}
                  style={{ width: sceneRated ? `${sceneScore}%` : '0%' }}
                />
              </div>
              <span className="w-8 text-right text-xs font-semibold text-ink">
                {sceneRated ? sceneScore : <span className="text-muted">—</span>}
              </span>
            </div>

            {!sceneRated && (
              <p className="mt-2 text-[11px] text-muted italic">
                Complete Scene Analysis axes to include this factor.
              </p>
            )}
            {sceneRated && (
              <p className="mt-2 text-[11px] text-muted">
                {positiveAxes}/{SCENE_AXES.length} axes rated positive
              </p>
            )}

            {/* Formula */}
            <div className="mt-3 rounded-btn bg-link/5 px-3 py-1.5 text-[11px] font-mono text-link">
              {sceneRated
                ? `(${ratingScore} × 60%) + (${sceneScore} × 40%) = ${currentScore}`
                : `${ratingScore} × 100% = ${currentScore} (scene not yet rated)`}
            </div>
          </div>

          {/* Family 2 — Historical Performance */}
          <div className="rounded-xl border border-line bg-paper p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-label text-[#8A6D00]">② Historical Performance</p>
                <p className="text-[11px] text-muted">Weight: 50% of LIC score</p>
              </div>
              <span className="rounded-btn bg-gold/15 px-2.5 py-1 text-sm font-bold text-[#8A6D00]">{pastScore}/100</span>
            </div>

            {/* Mini history */}
            <div className="mb-3 flex flex-col gap-1">
              {historyEntries.slice(0, 4).map((e) => (
                <div key={e.show} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 truncate text-[11px] text-ink">{e.show}</span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <div
                      className={cn('absolute inset-y-0 left-0 rounded-full', e.pts >= 75 ? 'bg-signal-good' : e.pts >= 50 ? 'bg-signal-maybe' : 'bg-signal-no/40')}
                      style={{ width: `${e.pts}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[11px] font-semibold text-muted">{e.pts}</span>
                </div>
              ))}
              <p className="text-[11px] text-muted mt-0.5">+{historyEntries.length - 4} more productions · weighted average</p>
            </div>

            <div className="rounded-btn bg-gold/5 px-3 py-1.5 text-[11px] font-mono text-[#8A6D00]">
              Historical average = {pastScore}
            </div>
          </div>

          {/* Combined */}
          <div className="flex items-center justify-between rounded-xl bg-ink px-5 py-3.5">
            <div>
              <p className="text-xs font-bold uppercase tracking-label text-white/60">LIC Score (combined)</p>
              <p className="text-[11px] font-mono text-white/50 mt-0.5">
                ({currentScore} × 50%) + ({pastScore} × 50%)
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-3xl font-bold text-gold">{licScore}</span>
              <span className="text-sm text-white/50">/100</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── Info tooltip ───────────────────────────────────────────────────────────── */

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="flex h-4 w-4 items-center justify-center rounded-full text-muted/60 hover:text-muted"
        aria-label="More info"
      >
        <Info className="h-3 w-3" />
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 w-56 -translate-x-1/2 rounded-btn bg-ink px-3 py-2 text-[11px] leading-relaxed text-white shadow-lg">
          {text}
          <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-ink" />
        </span>
      )}
    </span>
  )
}

/* ── Let it Cast Intelligence (full-width) ─────────────────────────────────── */

function LICIntelligenceCard({ totalCandidates, licScore }: { candidate?: Candidate; totalCandidates: number; licScore: number }) {
  const rank = Math.max(1, Math.round((100 - licScore) / 100 * totalCandidates * 0.8))
  const topPct = Math.round((rank / totalCandidates) * 100)

  const whyTags = licScore >= 75
    ? ['High watchability', 'Strong charisma', 'Rare profile']
    : licScore >= 50
    ? ['Potential match', 'Needs more review', 'Mid-range profile']
    : ['Low score', 'Needs more data']

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0 text-link" />
        <span className="tech-label text-link">Let it Cast Intelligence</span>
      </div>
      <p className="text-xs text-muted leading-relaxed">
        Ranking combines team ratings, AI scene analysis, and historical casting patterns.
        Each candidate is benchmarked against all {totalCandidates} submissions for this role.
        The model improves continuously as your team rates more auditions.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-btn bg-link/5 px-3 py-2.5">
          <TrendingUp className="h-5 w-5 shrink-0 text-link" />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted">Predicted ranking</p>
              <InfoTooltip text="Estimated position among all submissions for this role. Combines team ratings, AI scene analysis scores, and historical casting performance across past seasons. Updated in real time as your team votes." />
            </div>
            <p className="text-sm font-bold text-ink">
              Top {topPct}% · #{rank} of {totalCandidates}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-label text-muted">Why surfaced</p>
          <div className="flex flex-wrap gap-1.5">
            {whyTags.map((tag) => (
              <span key={tag} className="rounded-full bg-link/8 px-2.5 py-1 text-xs font-medium text-link">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-label text-muted">Similar Talent</p>
            <InfoTooltip text="Candidates from past seasons whose scene analysis scores and demographic profile closely match this candidate. A strong similarity to past successful profiles is a positive signal." />
          </div>
          <div className="flex flex-col gap-1">
            {[
              { name: 'Emma K.', note: 'S3 finalist · Booked lead' },
              { name: 'Sarah M.', note: 'S2 · Callback · High engagement' },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-line text-[10px] font-bold text-muted">
                  {p.name[0]}
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-ink">{p.name}</span>
                  <span className="ml-1 text-[11px] text-muted">· {p.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ── Casting history (left column) ─────────────────────────────────────────── */

function CastingHistoryCard() {
  const entries = [
    { show: 'MAFS AU',         season: 'S8',  role: 'Participant',   result: 'Cast',        color: 'text-signal-good bg-signal-good-bg' },
    { show: "I'm a Celebrity", season: 'S4',  role: 'Celebrity',     result: 'Cast',        color: 'text-signal-good bg-signal-good-bg' },
    { show: 'Survivor AU',     season: 'S12', role: 'Contestant',    result: 'Callback',    color: 'text-[#8A6D00] bg-signal-maybe/10' },
    { show: 'The Bachelor AU', season: 'S10', role: 'Contestant',    result: 'Callback',    color: 'text-[#8A6D00] bg-signal-maybe/10' },
    { show: 'Big Brother AU',  season: 'S14', role: 'Housemate',     result: 'Shortlisted', color: 'text-[#8A6D00] bg-signal-maybe/10' },
    { show: 'MasterChef AU',   season: 'S15', role: 'Home Cook',     result: 'Shortlisted', color: 'text-[#8A6D00] bg-signal-maybe/10' },
    { show: 'The Block',       season: 'S19', role: 'Contestant',    result: 'No go',       color: 'text-signal-no bg-signal-no/8' },
    { show: 'Love Island AU',  season: 'S2',  role: 'Islander',      result: 'No go',       color: 'text-signal-no bg-signal-no/8' },
  ]
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <History className="h-3.5 w-3.5 text-muted" />
        <span className="tech-label">Casting history</span>
        <span className="ml-auto text-[11px] text-muted">{entries.length} productions</span>
      </div>
      <ul className="flex max-h-52 flex-col gap-1.5 overflow-y-auto pr-1">
        {entries.map((entry) => (
          <li key={entry.show + entry.season} className="flex items-center justify-between gap-2 rounded-btn bg-paper px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-ink">{entry.show} <span className="text-muted">· {entry.season}</span></p>
              <p className="truncate text-[11px] text-muted">{entry.role}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${entry.color}`}>
              {entry.result}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* ── Direct feedback inline ─────────────────────────────────────────────────── */

function DirectFeedbackInline() {
  const toast = useToast()
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  if (sent) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-signal-good">
        <Check className="h-4 w-4" /> Feedback sent.
      </p>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write a note…"
        className="h-10 flex-1 rounded-btn border border-line bg-paper px-3 text-sm text-ink focus:border-ink/20 focus:outline-none focus:ring-2 focus:ring-ink/10"
      />
      <button
        onClick={() => { if (!note.trim()) return; setSent(true); toast('Feedback sent to talent') }}
        className="flex h-10 w-10 items-center justify-center rounded-btn bg-ink text-white hover:bg-ink/90 disabled:opacity-40"
        disabled={!note.trim()}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ── Right column: Your Rating · Scene Analysis · Other Ratings · Feedback ───── */

function RoleDecisionPanel({
  candidate,
  reviewed,
  sceneToggles,
  setSceneToggles,
}: {
  candidate: Candidate
  reviewed: boolean
  sceneToggles: Record<string, boolean | null>
  setSceneToggles: React.Dispatch<React.SetStateAction<Record<string, boolean | null>>>
}) {
  const toast = useToast()
  const { id: candidateId, good, maybe, no } = candidate
  const tally: Record<'good' | 'maybe' | 'no', number> = { good, maybe, no }
  const [lastVote, setLastVote] = useState<'good' | 'maybe' | 'no' | null>(null)

  const teamRatings = deriveTeamRatings(candidate)

  const toggleAxis = (axis: string) => {
    setSceneToggles((prev) => {
      const current = prev[axis]
      const next = current === null ? true : current === true ? false : null
      return { ...prev, [axis]: next }
    })
  }

  const positiveCount = Object.values(sceneToggles).filter((v) => v === true).length
  const ratedCount = Object.values(sceneToggles).filter((v) => v !== null).length
  const sceneStars = ratedCount === 0 ? 0 : Math.round((positiveCount / SCENE_AXES.length) * 5)

  return (
    <div className="flex flex-col gap-4">

      {/* ① Your rating */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="tech-label">Your rating</span>
          <Tag tone={reviewed ? 'good' : 'neutral'}>{reviewed ? 'Reviewed' : 'Not reviewed'}</Tag>
        </div>
        <div className="flex flex-col gap-2">
          {ratingOptions.map((o) => {
            const Icon = o.icon
            const isActive = lastVote === o.key
            return (
              <button
                key={o.key}
                onClick={() => { rateCandidate(candidateId, o.key); setLastVote(o.key); toast(`Vote added: ${o.label}`) }}
                className={cn(
                  'flex items-center justify-between rounded-btn border-2 bg-card px-4 py-2.5 text-sm font-semibold transition-all',
                  isActive ? o.active : o.base,
                )}
              >
                <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{o.label}</span>
                <span className={cn('font-mono text-xs', isActive ? 'text-white/80' : 'text-muted')}>{tally[o.key]}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ② Scene Analysis */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <span className="tech-label">Scene Analysis</span>
          <InfoTooltip text="For each axis below, optionally indicate whether the talent demonstrates this quality. Click once to mark Yes (green), again for No (red), again to clear. Stars update automatically and feed into the LIC score." />
        </div>
        <ul className="flex flex-col gap-2">
          {SCENE_AXES.map((axis) => {
            const val = sceneToggles[axis]
            return (
              <li key={axis} className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">{axis}</span>
                <button
                  onClick={() => toggleAxis(axis)}
                  className={cn(
                    'flex h-7 min-w-[52px] items-center justify-center rounded-full border text-xs font-bold transition-all',
                    val === true
                      ? 'border-signal-good bg-signal-good-bg text-signal-good'
                      : val === false
                      ? 'border-signal-no/40 bg-signal-no/8 text-signal-no'
                      : 'border-line bg-paper text-muted hover:border-ink/30',
                  )}
                >
                  {val === true ? 'Yes' : val === false ? 'No' : '—'}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Auto stars */}
        <div className="flex items-center justify-between border-t border-line pt-3">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={cn('h-4 w-4', n <= sceneStars ? 'fill-gold text-gold' : 'text-line')} />
              ))}
            </div>
            <span className="text-xs font-semibold text-ink">
              {ratedCount === 0 ? '—' : `${sceneStars}/5`}
            </span>
          </div>
          <span className="text-[11px] text-muted">
            {ratedCount === 0 ? 'Rate axes to generate a scene score' : `${positiveCount}/${SCENE_AXES.length} axes positive`}
          </span>
        </div>
      </Card>

      {/* ③ Other ratings */}
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

      {/* ④ Direct feedback */}
      <Card className="flex flex-col gap-3">
        <div>
          <span className="tech-label">Direct feedback to talent</span>
          <p className="text-xs text-muted">Send private feedback to the talent</p>
        </div>
        <DirectFeedbackInline />
      </Card>

    </div>
  )
}

/* ── Breadcrumb ─────────────────────────────────────────────────────────────── */

function Breadcrumb({
  projectTitle, roleName, candidateName, navigate,
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
