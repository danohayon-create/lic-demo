import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Send,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Check,
  Play,
  Plus,
  Clock,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, Avatar, Button, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import { projects, projectsById, team, teamByInitials } from '@/data'
import { asset } from '@/lib/asset'

// ── Demo content — a narrative "session" snapshot, independent of the live
//    per-project KPIs shown on each project's own Dashboard ───────────────────

type WidgetKey = 'auditions' | 'tasks' | 'collaboration' | 'notifications'

type AuditionBreakdownItem = { label: string; projectId: string; delta: number }
type TaskItem = { label: string; due: string; urgent: boolean }
type FeedbackItem = {
  initials: string
  name: string
  action: string
  tag: string
  tone: 'link' | 'no' | 'good' | 'gold' | 'neutral'
  project: string
  time: string
  dot: string
}
type NotificationItem = { icon: LucideIcon; text: string; time: string }

type Scenario = {
  id: string
  sessionLabel: string
  lastSeen: string
  message: string
  primary: WidgetKey
  auditions: { total: number; trendPct: number; trendUp: boolean; breakdown: AuditionBreakdownItem[] }
  tasks: { items: TaskItem[] }
  collaboration: {
    actionsCount: number
    stats: { shortlisted: number; rejected: number; tapesRated: number }
    items: FeedbackItem[]
  }
  notifications: { items: NotificationItem[] }
}

// Rank 0 → red (most), 1 → blue, 2 → yellow, 3 → green
const RANK_DOT  = ['bg-signal-no', 'bg-link', 'bg-signal-maybe', 'bg-signal-good']
const RANK_TEXT = ['text-signal-no', 'text-link', 'text-signal-maybe', 'text-signal-good']

const SCENARIOS: Scenario[] = [
  {
    id: 'monday-surge',
    sessionLabel: 'Monday surge',
    lastSeen: 'Friday · 3 days ago',
    message: "Since Friday: 243 new tapes across 4 castings and 18 team actions. Most urgent — review 84 Survivor tapes before Friday and send 6 callbacks today.",
    primary: 'auditions',
    auditions: {
      total: 243, trendPct: 38, trendUp: true,
      breakdown: [
        { label: 'Survivor S12',  projectId: 'survivor-australia',    delta: 142 },
        { label: 'MasterChef',    projectId: 'masterchef-australia',  delta: 61 },
        { label: 'Big Brother',   projectId: 'big-brother-australia', delta: 28 },
        { label: 'Evermore',      projectId: 'evermore',              delta: 12 },
      ],
    },
    tasks: {
      items: [
        { label: 'Review 84 auditions for Survivor', due: 'Fri',      urgent: true },
        { label: 'Send 6 callback requests',          due: 'Today',    urgent: true },
        { label: 'Approve shortlist for MasterChef',  due: 'Tomorrow', urgent: false },
        { label: 'Validate Big Brother finalist list', due: 'Mon',     urgent: false },
      ],
    },
    collaboration: {
      actionsCount: 18,
      stats: { shortlisted: 21, rejected: 8, tapesRated: 6 },
      items: [
        { initials: 'SL', name: 'Sarah', action: 'shortlisted 12 candidates', tag: 'Shortlist', tone: 'link',    project: 'Survivor S12',  time: '1h', dot: 'bg-link' },
        { initials: 'MR', name: 'Mike',  action: 'rejected 8 auditions',      tag: 'No go',    tone: 'no',     project: 'MasterChef',    time: '3h', dot: 'bg-signal-no' },
        { initials: 'ET', name: 'Eden',  action: 'shortlisted 9 candidates',  tag: 'Shortlist', tone: 'link',    project: 'Big Brother',   time: '4h', dot: 'bg-link' },
        { initials: 'JC', name: 'Julie', action: 'rated 6 tapes Good match',  tag: 'Good match', tone: 'good',  project: 'Evermore',      time: '5h', dot: 'bg-signal-good' },
      ],
    },
    notifications: {
      items: [
        { icon: Clock, text: 'Survivor casting deadline moved to Friday', time: '2h' },
        { icon: Plus,  text: 'Lara Khan joined Big Brother',              time: '6h' },
        { icon: Plus,  text: 'New project created — Echo Park',            time: '1d' },
      ],
    },
  },
  {
    id: 'decision-day',
    sessionLabel: 'Decision day',
    lastSeen: 'Yesterday · 6:00 PM',
    message: "Big decisions are stacking up: 41 team actions overnight and 38 new shortlists. You need to lock the MasterChef finalists and pick the Survivor lead today.",
    primary: 'collaboration',
    auditions: {
      total: 12, trendPct: 24, trendUp: false,
      breakdown: [
        { label: 'MasterChef',   projectId: 'masterchef-australia',  delta: 5 },
        { label: 'Survivor S12', projectId: 'survivor-australia',    delta: 4 },
        { label: 'Big Brother',  projectId: 'big-brother-australia', delta: 2 },
        { label: 'Evermore',     projectId: 'evermore',              delta: 1 },
      ],
    },
    tasks: {
      items: [
        { label: 'Approve MasterChef finalist shortlist',    due: 'Today',    urgent: true },
        { label: 'Decide Survivor lead — 3 finalists',       due: 'Today',    urgent: true },
        { label: 'Confirm callback schedule with team',      due: 'Tomorrow', urgent: false },
        { label: 'Validate Big Brother house cast',          due: 'Wed',      urgent: false },
      ],
    },
    collaboration: {
      actionsCount: 41,
      stats: { shortlisted: 38, rejected: 19, tapesRated: 96 },
      items: [
        { initials: 'LK', name: 'Lara',  action: 'shortlisted 9 finalists',        tag: 'Shortlist',  tone: 'link',    project: 'MasterChef',   time: '20m', dot: 'bg-link' },
        { initials: 'MR', name: 'Mike',  action: 'moved 6 candidates to callback', tag: 'Callback',   tone: 'gold',   project: 'Survivor S12', time: '48m', dot: 'bg-gold' },
        { initials: 'SL', name: 'Sarah', action: 'rejected 11 auditions',          tag: 'No go',      tone: 'no',     project: 'Big Brother',  time: '1h',  dot: 'bg-signal-no' },
        { initials: 'ET', name: 'Eden',  action: 'left feedback on 7 finalists',   tag: 'Note',       tone: 'neutral', project: 'MasterChef',  time: '2h',  dot: 'bg-line' },
        { initials: 'JC', name: 'Julie', action: 'rated 22 tapes Good match',      tag: 'Good match', tone: 'good',   project: 'Survivor S12', time: '3h',  dot: 'bg-signal-good' },
      ],
    },
    notifications: {
      items: [
        { icon: Check, text: 'Theo Vance accepted callback request', time: '15m' },
        { icon: Check, text: 'Maya Reyes accepted callback request', time: '1h' },
      ],
    },
  },
  {
    id: 'deadline-crunch',
    sessionLabel: 'Deadline crunch',
    lastSeen: 'Today · 2 hours ago',
    message: "Deadline mode: Big Brother casting closes in 6 hours and the studio wants final cast by EOD. 4 tasks are urgent and a MasterChef callback runs at 3 PM.",
    primary: 'tasks',
    auditions: {
      total: 34, trendPct: 12, trendUp: true,
      breakdown: [
        { label: 'Big Brother',  projectId: 'big-brother-australia', delta: 15 },
        { label: 'Survivor S12', projectId: 'survivor-australia',    delta: 10 },
        { label: 'MasterChef',   projectId: 'masterchef-australia',  delta: 7 },
        { label: 'Evermore',     projectId: 'evermore',              delta: 2 },
      ],
    },
    tasks: {
      items: [
        { label: 'Lock Big Brother house cast',       due: 'In 6h',    urgent: true },
        { label: 'Submit Survivor finalists to studio', due: 'Today',  urgent: true },
        { label: 'Run MasterChef callback session',   due: '3 PM',     urgent: true },
        { label: 'Confirm 8 callback attendances',    due: 'Today',    urgent: true },
        { label: 'Approve travel for 4 finalists',    due: 'Tomorrow', urgent: false },
        { label: 'Send rejection feedback batch',     due: 'Tomorrow', urgent: false },
        { label: 'Update casting brief — Evermore',   due: 'Thu',      urgent: false },
      ],
    },
    collaboration: {
      actionsCount: 9,
      stats: { shortlisted: 4, rejected: 0, tapesRated: 0 },
      items: [
        { initials: 'LK', name: 'Lara', action: 'shortlisted 4 candidates',       tag: 'Shortlist', tone: 'link',    project: 'Big Brother', time: '38m', dot: 'bg-link' },
        { initials: 'ET', name: 'Eden', action: 'flagged 2 scheduling conflicts', tag: 'Note',      tone: 'neutral', project: 'MasterChef',  time: '1h',  dot: 'bg-line' },
      ],
    },
    notifications: {
      items: [
        { icon: Clock, text: 'Big Brother casting closes in 6 hours',   time: 'now' },
        { icon: Clock, text: 'MasterChef callback room booked 3 PM',    time: '1h' },
        { icon: Clock, text: 'Survivor deadline moved up to today',     time: '2h' },
        { icon: Clock, text: 'Studio requested final cast by EOD',      time: '3h' },
      ],
    },
  },
]

const QUICK_ACTIONS = [
  'Summarize my projects',
  'Show urgent tasks',
  'Show strongest candidates',
  'Show latest team activity',
  "Prepare today's review session",
]

const STRONGEST_TAPES = [
  { name: 'Maya Reyes',  meta: 'Fanny Brice · Evermore',        score: 94, avatar: '/avatars/maya-reyes.png' },
  { name: 'Theo Vance',  meta: 'Castaway · Survivor',            score: 89, avatar: '/avatars/theo-vance.jpg' },
  { name: 'Sofia Bello', meta: 'Home cook · MasterChef',         score: 86, avatar: '/avatars/sofia-bello.jpg' },
  { name: 'Noor Haddad', meta: 'Houseguest · Big Brother',       score: 82, avatar: '/avatars/noor-haddad.jpg' },
]

type AssistantResponse = { text: string; items: { dot: string; label: string; value: string }[] }

function buildResponse(prompt: string, scenario: Scenario): AssistantResponse | null {
  if (prompt === "Prepare today's review session") {
    const top2 = [...scenario.auditions.breakdown].sort((a, b) => b.delta - a.delta).slice(0, 2).map((b) => b.label)
    return {
      text: `I queued ${scenario.auditions.total} tapes for review, sorted by match and deadline. ${top2.join(' and ')} come first.`,
      items: scenario.auditions.breakdown.map((b, i) => ({ dot: RANK_DOT[i] ?? 'bg-line', label: b.label, value: `${b.delta} to watch` })),
    }
  }
  if (prompt === 'Show latest team activity') {
    const { stats, items, actionsCount } = scenario.collaboration
    return {
      text: `${items.length} teammates logged ${actionsCount} actions — ${stats.shortlisted} shortlisted, ${stats.rejected} rejected.`,
      items: items.map((f) => ({ dot: f.dot, label: `${f.name} ${f.action}`, value: f.time })),
    }
  }
  if (prompt === 'Show urgent tasks') {
    const urgent = scenario.tasks.items.filter((t) => t.urgent)
    return {
      text: `${urgent.length} urgent task${urgent.length === 1 ? '' : 's'} need attention before their deadlines.`,
      items: urgent.map((t) => ({ dot: 'bg-signal-no', label: t.label, value: t.due })),
    }
  }
  if (prompt === 'Show strongest candidates') {
    return {
      text: "Here are today's top-rated tapes by match score.",
      items: STRONGEST_TAPES.map((t) => ({ dot: 'bg-gold', label: `${t.name} — ${t.meta}`, value: `${t.score}` })),
    }
  }
  if (prompt === 'Summarize my projects') {
    const total = projects.reduce((sum, p) => sum + p.submissions, 0)
    const top = [...projects].sort((a, b) => b.submissions - a.submissions).slice(0, 4)
    return {
      text: `${projects.length} active castings, ${total.toLocaleString()}+ combined applicants. ${top[0].title} and ${top[1].title} are driving the most volume.`,
      items: top.map((p, i) => ({ dot: RANK_DOT[i] ?? 'bg-line', label: p.title, value: `${p.submissions.toLocaleString()} total` })),
    }
  }
  return null
}

export function CommandCenter() {
  const navigate = useNavigate()
  const toast = useToast()
  const [message, setMessage] = useState('')
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [response, setResponse] = useState<AssistantResponse | null>(null)
  const scenario = SCENARIOS[scenarioIdx]

  const simulateNextSession = () => {
    setScenarioIdx((i) => (i + 1) % SCENARIOS.length)
    setResponse(null)
    toast('Simulating next session…')
  }

  const askAssistant = (prompt: string) => {
    setMessage('')
    const built = buildResponse(prompt, scenario)
    if (built) {
      setResponse(built)
    } else {
      setResponse(null)
      toast(`Cast Assistant — "${prompt}" (demo response coming soon)`)
    }
  }

  const otherWidgets: WidgetKey[] = (['auditions', 'tasks', 'collaboration', 'notifications'] as WidgetKey[])
    .filter((w) => w !== scenario.primary)

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <CommandSidebar scenario={scenario} />

      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Good afternoon, {team[0].name.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Here's the state of your castings. Last seen {scenario.lastSeen}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="tech-label">Session · {scenario.sessionLabel}</span>
            <Button variant="secondary" size="sm" onClick={simulateNextSession}>
              Simulate next session
            </Button>
          </div>
        </div>

        <CastAssistantCard
          scenario={scenario}
          message={message}
          onMessageChange={setMessage}
          onAsk={askAssistant}
          response={response}
          onDismissResponse={() => setResponse(null)}
        />

        <div className="flex items-baseline justify-between">
          <span className="tech-label">Operational dashboard</span>
          <span className="text-xs text-muted">Widgets scale to what matters right now</span>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-5">
            {scenario.primary === 'auditions' && (
              <>
                <AuditionsWidget data={scenario.auditions} variant="primary" />
                <StrongestTapesCard onStartReviewing={() => navigate('/studio/review')} />
              </>
            )}
            {scenario.primary === 'tasks'         && <TasksWidget items={scenario.tasks.items} variant="primary" />}
            {scenario.primary === 'collaboration' && <CollaborationWidget data={scenario.collaboration} variant="primary" />}
            {scenario.primary === 'notifications' && <NotificationsWidget items={scenario.notifications.items} variant="primary" />}
          </div>
          <div className="flex flex-col gap-5">
            {otherWidgets.map((w) => {
              if (w === 'auditions')     return <AuditionsWidget key={w} data={scenario.auditions} variant="compact" />
              if (w === 'tasks')         return <TasksWidget key={w} items={scenario.tasks.items} variant="compact" />
              if (w === 'collaboration') return <CollaborationWidget key={w} data={scenario.collaboration} variant="compact" />
              return <NotificationsWidget key={w} items={scenario.notifications.items} variant="compact" />
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */

function CommandSidebar({ scenario: _scenario }: { scenario: Scenario }) {
  const navigate = useNavigate()
  // Use the full projects list sorted by today's submissions (same as Dashboard sidebar)
  const ranked = [...projects].sort(
    (a, b) => (b.kpis?.submissions.today ?? 0) - (a.kpis?.submissions.today ?? 0)
  )

  return (
    <aside className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <span className="tech-label">Active Castings</span>
        <ul className="flex flex-col gap-1 max-h-[420px] overflow-y-auto pr-1">
          {ranked.map((project, rank) => {
            const today = project.kpis?.submissions.today ?? 0
            return (
              <li key={project.id}>
                <button
                  onClick={() => navigate(`/studio/dashboard?p=${project.id}`)}
                  className="flex w-full items-center gap-2.5 rounded-btn px-2 py-2 text-left hover:bg-ink/5"
                >
                  {project.poster && (
                    <img
                      src={asset(project.poster)}
                      alt={project.title}
                      className="h-9 w-9 shrink-0 rounded object-cover ring-1 ring-line"
                    />
                  )}
                  <span className={cn('h-2 w-2 shrink-0 rounded-sm', rank < 4 ? RANK_DOT[rank] : 'bg-line')} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{project.title}</p>
                    <p className="truncate text-[11px] text-muted">
                      {project.type} · {project.company}
                    </p>
                  </div>
                  {today > 0 && (
                    <span className={cn('shrink-0 font-mono text-xs font-bold', rank < 4 ? RANK_TEXT[rank] : 'text-muted')}>
                      +{today}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
        <button
          onClick={() => navigate('/studio/new-casting')}
          className="flex items-center justify-center gap-1.5 rounded-btn border border-dashed border-line py-2 text-xs font-semibold text-muted hover:border-ink/30 hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          New casting
        </button>
      </Card>

      <Card className="flex flex-col gap-3">
        <span className="tech-label">Team</span>
        <ul className="flex flex-col gap-3">
          {team.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5">
              <Avatar src={m.avatar} name={m.name} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{m.name}</div>
                <div className="truncate text-xs text-muted">{m.role}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </aside>
  )
}

/* ── Cast Assistant ───────────────────────────────────────────────────────── */

function CastAssistantCard({
  scenario,
  message,
  onMessageChange,
  onAsk,
  response,
  onDismissResponse,
}: {
  scenario: Scenario
  message: string
  onMessageChange: (v: string) => void
  onAsk: (text: string) => void
  response: AssistantResponse | null
  onDismissResponse: () => void
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink">Cast Assistant</span>
            <span className="flex items-center gap-1 rounded-full bg-signal-good-bg px-2 py-0.5 text-[10px] font-bold text-signal-good">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-good" />
              Live
            </span>
          </div>
          <p className="text-xs text-muted">Caught you up on everything since {scenario.lastSeen}</p>
        </div>
      </div>

      <p className="rounded-btn bg-paper px-4 py-3 text-sm leading-relaxed text-ink ring-1 ring-line">
        <Sparkles className="mr-1.5 inline-block h-3.5 w-3.5 text-link" />
        {scenario.message}
      </p>

      <div className="flex items-center gap-2">
        <input
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && message.trim()) onAsk(message) }}
          placeholder="What can I do for you today?"
          className="h-11 flex-1 rounded-btn border border-line bg-paper px-4 text-sm text-ink focus:border-ink/20 focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <button
          disabled={!message.trim()}
          onClick={() => onAsk(message)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-ink text-white disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onAsk(q)}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink/30 hover:bg-paper"
          >
            {q}
          </button>
        ))}
      </div>

      {response && (
        <div className="flex flex-col gap-3 rounded-btn border border-line bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-bold text-ink">Cast Assistant</span>
            </div>
            <button onClick={onDismissResponse} className="text-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm leading-relaxed text-ink">{response.text}</p>
          <ul className="flex flex-col gap-2">
            {response.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-ink">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', item.dot)} />
                  {item.label}
                </span>
                <span className="shrink-0 font-mono text-xs text-muted">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

/* ── New auditions ────────────────────────────────────────────────────────── */

function AuditionsWidget({
  data,
  variant,
}: {
  data: Scenario['auditions']
  variant: 'primary' | 'compact'
}) {
  const navigate = useNavigate()
  // Sort descending for consistent rank → color mapping
  const ranked = [...data.breakdown].sort((a, b) => b.delta - a.delta)
  const maxDelta = Math.max(...ranked.map((b) => b.delta), 1)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="tech-label">Since you left</span>
        {data.trendUp ? (
          <TrendingUp className="h-4 w-4 text-signal-good" />
        ) : (
          <TrendingDown className="h-4 w-4 text-signal-no" />
        )}
      </div>
      <div>
        <h2 className="text-lg font-bold text-ink">New auditions</h2>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={cn('font-bold tracking-tight text-ink', variant === 'primary' ? 'text-5xl' : 'text-3xl')}>
            {data.total}
          </span>
          <span className="text-sm text-muted">new submissions</span>
        </div>
        <p className={cn('mt-1 text-xs font-semibold', data.trendUp ? 'text-signal-good' : 'text-signal-no')}>
          {data.trendUp ? '↑' : '↓'} {data.trendPct}% vs yesterday
        </p>
      </div>

      {variant === 'primary' && (
        <div className="flex flex-col gap-2.5">
          {ranked.map((b, i) => (
            <div key={b.projectId} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => navigate(`/studio/dashboard?p=${b.projectId}`)}
                  className={cn('font-semibold hover:underline', RANK_TEXT[i])}
                >
                  {b.label}
                </button>
                <span className={cn('font-mono font-bold', RANK_TEXT[i])}>+{b.delta}</span>
              </div>
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                <span
                  className={cn('block h-full rounded-full', RANK_DOT[i])}
                  style={{ width: `${(b.delta / maxDelta) * 100}%` }}
                />
              </span>
            </div>
          ))}
        </div>
      )}

      {variant === 'compact' && (
        <Button variant="secondary" size="sm" icon={<Play className="h-4 w-4" />}>
          Start reviewing
        </Button>
      )}
    </Card>
  )
}

/* ── Strongest new tapes ──────────────────────────────────────────────────── */

function StrongestTapesCard({ onStartReviewing }: { onStartReviewing: () => void }) {
  return (
    <Card className="flex flex-col gap-4">
      <span className="tech-label">Strongest new tapes</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STRONGEST_TAPES.map((t) => (
          <div key={t.name} className="flex flex-col gap-2">
            <div className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-btn bg-paper ring-1 ring-line">
              <Avatar src={t.avatar} name={t.name} size="xl" />
              <span className="absolute inset-0 flex items-center justify-center transition-colors group-hover:bg-ink/20">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="ml-0.5 h-4 w-4" />
                </span>
              </span>
              <Tag tone="gold" className="absolute right-1.5 top-1.5 font-bold">{t.score}</Tag>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
              <p className="truncate text-xs text-muted">{t.meta}</p>
            </div>
          </div>
        ))}
      </div>
      <Button variant="secondary" icon={<Play className="h-4 w-4" />} onClick={onStartReviewing} className="self-start">
        Start reviewing
      </Button>
    </Card>
  )
}

/* ── Tasks ─────────────────────────────────────────────────────────────────── */

function TasksWidget({ items, variant }: { items: TaskItem[]; variant: 'primary' | 'compact' }) {
  const toast = useToast()
  const [done, setDone] = useState<Set<number>>(new Set())
  const visible = variant === 'primary' ? items : items.slice(0, 4)
  const urgentCount = items.filter((t, i) => t.urgent && !done.has(i)).length

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="tech-label">Next best actions</span>
        {urgentCount > 0 && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-signal-no">
            {urgentCount} urgent
          </span>
        )}
      </div>
      <h2 className="text-lg font-bold text-ink">Tasks to do</h2>
      <ul className="flex flex-col gap-2">
        {visible.map((t, i) => {
          const isDone = done.has(i)
          return (
            <li key={i} className="flex items-center gap-2.5">
              <button
                onClick={() => setDone((p) => {
                  const next = new Set(p)
                  if (next.has(i)) next.delete(i)
                  else next.add(i)
                  return next
                })}
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                  isDone ? 'border-match bg-match' : t.urgent ? 'border-signal-no' : 'border-signal-maybe',
                )}
              >
                {isDone && <Check className="h-2.5 w-2.5 text-white" />}
              </button>
              <span className={cn('flex-1 text-sm', isDone ? 'text-muted line-through' : 'text-ink')}>
                {t.label}
              </span>
              <span className="shrink-0 text-xs font-medium text-muted">{t.due}</span>
            </li>
          )
        })}
      </ul>
      <Button
        icon={<CheckSquare className="h-4 w-4" />}
        onClick={() => toast(variant === 'primary' ? "Starting today's review session…" : 'Planning your day…')}
      >
        {variant === 'primary' ? "Start today's review session" : 'Plan my day'}
      </Button>
    </Card>
  )
}

/* ── Collaboration ────────────────────────────────────────────────────────── */

function CollaborationWidget({
  data,
  variant,
}: {
  data: Scenario['collaboration']
  variant: 'primary' | 'compact'
}) {
  const navigate = useNavigate()
  const visible = variant === 'primary' ? data.items : data.items.slice(0, 2)
  const remaining = data.items.length - visible.length

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="tech-label">Collaboration</span>
        <span className="text-xs font-medium text-muted">{data.actionsCount} actions</span>
      </div>
      <h2 className="text-base font-bold text-ink">Team feedback</h2>

      {variant === 'primary' && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Shortlisted', value: data.stats.shortlisted },
            { label: 'Rejected',    value: data.stats.rejected },
            { label: 'Tapes rated', value: data.stats.tapesRated },
          ].map((s) => (
            <div key={s.label} className="rounded-btn bg-paper px-3 py-2 ring-1 ring-line">
              <p className="text-xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((f, i) => {
          const member = teamByInitials[f.initials]
          return (
            <li key={i} className="flex items-start gap-2.5">
              <Avatar src={member?.avatar} name={f.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink"><span className="font-semibold">{f.name}</span> {f.action}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Tag tone={f.tone}>{f.tag}</Tag>
                  <span className="text-xs text-muted">{f.project} · {f.time}</span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <button onClick={() => navigate('/studio/dashboard')} className="self-start text-xs font-medium text-link hover:underline">
        {remaining > 0 ? `${remaining} more · view team activity →` : 'View team activity →'}
      </button>
    </Card>
  )
}

/* ── Notifications ────────────────────────────────────────────────────────── */

function NotificationsWidget({ items, variant }: { items: NotificationItem[]; variant: 'primary' | 'compact' }) {
  const visible = variant === 'primary' ? items : items.slice(0, 3)
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="tech-label">Events</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal-no text-[10px] font-bold text-white">
          {items.length}
        </span>
      </div>
      <h2 className="text-base font-bold text-ink">Notifications</h2>
      <ul className="flex flex-col gap-3">
        {visible.map((n, i) => {
          const Icon = n.icon
          return (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper text-muted ring-1 ring-line">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{n.text}</p>
                <p className="text-xs text-muted">{n.time}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
