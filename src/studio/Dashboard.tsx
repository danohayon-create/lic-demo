import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Plus, Share2, SlidersHorizontal, ArrowUpDown, ArrowRight, X, Link2, Check, Sparkles, LayoutGrid } from 'lucide-react'
import { Card, Avatar, Button, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { Skeleton, useBriefLoading } from '@/components/Skeleton'
import { colors } from '@/styles/tokens'
import { cn } from '@/lib/cn'
import {
  projects,
  projectsById,
  rolesByProject,
  team,
  teamByInitials,
  submissionsOverTimeByProject,
  activityByProject,
  type Role,
  type ProjectKPIs,
  type ActivityItem,
} from '@/data'
import { useProjectCasting, ROLE_CASTING_DEFAULTS } from '@/data/castingState'
import { asset } from '@/lib/asset'
import {
  useRoleCandidates,
  useRoleStatus,
  setRoleStatus,
  shortlistedCountForRole,
  PIPELINE_STATUSES,
  type RolePipelineStatus,
} from '@/data/selection'

const PIPELINE_BG_CLASS: Record<RolePipelineStatus, string> = {
  New: 'bg-paper text-muted',
  Viewed: 'bg-paper text-muted',
  Reviewed: 'bg-paper text-muted',
  Shortlisted: 'bg-link/10 text-link',
  Callback: 'bg-signal-maybe/10 text-[#8A6D00]',
  Offer: 'bg-gold/15 text-[#8A6D00]',
  Cast: 'bg-signal-good-bg text-signal-good',
}

type Tab = 'all' | 'lead' | 'supporting' | 'booked'

export function Dashboard() {
  const toast = useToast()
  const navigate = useNavigate()
  const loading = useBriefLoading()
  const [searchParams] = useSearchParams()
  const [shareOpen, setShareOpen] = useState(false)
  const projectId = searchParams.get('p') || 'evermore'
  const project = projectsById[projectId] ?? projectsById['evermore']
  const roles = rolesByProject(project.id)
  const kpis = project.kpis
  const [tab, setTab] = useState<Tab>('all')

  const visibleRoles =
    tab === 'all'
      ? roles
      : tab === 'lead'
        ? roles.filter((r) => r.type === 'Lead')
        : tab === 'supporting'
          ? roles.filter((r) => r.type === 'Supporting')
          : []

  const tabs: { key: Tab; label: string; count: number }[] = kpis
    ? [
        { key: 'all', label: 'All roles', count: kpis.roles.total },
        { key: 'lead', label: 'Lead', count: kpis.roles.lead },
        { key: 'supporting', label: 'Supporting', count: kpis.roles.supporting },
        { key: 'booked', label: 'Booked', count: kpis.booked },
      ]
    : []

  const submissions = submissionsOverTimeByProject[project.id]
  const activityItems = activityByProject[project.id] ?? []

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Sidebar activeId={project.id} onNewCasting={() => navigate('/studio/new-casting')} />
      {shareOpen && <ShareModal project={project} onClose={() => setShareOpen(false)} />}

      <div className="flex flex-col gap-5">
        <ProjectHeader project={project} onShare={() => setShareOpen(true)} />

        {!kpis ? (
          <Card className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-3xl">🎬</span>
            <p className="text-sm font-semibold text-ink">No data yet for this project</p>
            <p className="text-xs text-muted">
              Create your first casting to start collecting submissions.
            </p>
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/studio/new-casting')}
              className="mt-2"
            >
              New casting
            </Button>
          </Card>
        ) : (
          <>
            {loading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </Card>
                ))}
              </div>
            ) : (
              <KpiRow kpis={kpis} />
            )}

            <Card flush className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
                <div className="flex flex-wrap gap-1">
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={cn(
                        'rounded-btn px-3 py-1.5 text-sm font-medium transition-colors',
                        tab === t.key
                          ? 'bg-ink text-white'
                          : 'text-muted hover:bg-ink/5 hover:text-ink',
                      )}
                    >
                      {t.label} ({t.count})
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<SlidersHorizontal className="h-4 w-4" />}
                    onClick={() => toast('Filters — bientôt disponible')}
                  >
                    Filter
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ArrowUpDown className="h-4 w-4" />}
                    onClick={() => toast('Sorted by submissions')}
                  >
                    Sort
                  </Button>
                </div>
              </div>

              <RolesTable roles={visibleRoles} projectId={project.id} />
            </Card>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              {submissions && <SubmissionsChart data={submissions} />}
              <ActivityFeed items={activityItems} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Left sidebar ─────────────────────────────────────────────────────────── */

const RANK_DOT  = ['bg-signal-no', 'bg-link', 'bg-signal-maybe', 'bg-signal-good']
const RANK_TEXT = ['text-signal-no', 'text-link', 'text-signal-maybe', 'text-signal-good']

function Sidebar({ activeId, onNewCasting }: { activeId: string; onNewCasting: () => void }) {
  const navigate = useNavigate()
  // Sort by today's submissions descending — top 4 get rank colors, rest neutral
  const ranked = [...projects].sort((a, b) => (b.kpis?.submissions.today ?? 0) - (a.kpis?.submissions.today ?? 0))

  return (
    <aside className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <span className="tech-label">Active Castings</span>
        <ul className="flex flex-col gap-1">
          {ranked.map((p, rank) => {
            const active = p.id === activeId
            const today = p.kpis?.submissions.today ?? 0
            return (
              <li key={p.id}>
                <button
                  onClick={() => navigate(`/studio/dashboard?p=${p.id}`)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-btn px-2 py-2 text-left transition-colors',
                    active ? 'bg-paper ring-1 ring-line' : 'hover:bg-ink/5',
                  )}
                >
                  {p.poster && (
                    <img
                      src={asset(p.poster)}
                      alt={p.title}
                      className="h-8 w-8 shrink-0 rounded object-cover ring-1 ring-line"
                    />
                  )}
                  <span className={cn('h-2 w-2 shrink-0 rounded-sm', rank < 4 ? RANK_DOT[rank] : 'bg-line')} />
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm font-bold', active ? 'text-ink' : 'text-ink/80')}>
                      {p.title}
                    </p>
                    <p className="truncate text-[11px] text-muted">{p.type} · {p.company}</p>
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
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          className="mt-1"
          onClick={onNewCasting}
        >
          New project
        </Button>
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

/* ── Project header ───────────────────────────────────────────────────────── */

function ProjectHeader({
  project,
  onShare,
}: {
  project: import('@/data').Project
  onShare: () => void
}) {
  const navigate = useNavigate()
  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {project.poster ? (
        <img
          src={asset(project.poster)}
          alt={project.title}
          className="h-20 w-20 shrink-0 rounded-btn object-cover ring-1 ring-line"
        />
      ) : (
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-btn bg-paper text-3xl ring-1 ring-line">
          🎬
        </span>
      )}
      <div className="min-w-0 flex-1">
        <span className="tech-label">
          {project.type} · {project.company}
          {project.genre ? ` · ${project.genre}` : ''}
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{project.title}</h1>
        {(project.castingCloses || project.shooting || project.location) && (
          <p className="mt-0.5 text-sm text-muted">
            {project.castingCloses && `Casting closes ${project.castingCloses}`}
            {project.shooting && ` · Shooting ${project.shooting}`}
            {project.location && ` · ${project.location}`}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" icon={<Share2 className="h-4 w-4" />} onClick={onShare}>
          Share
        </Button>
        <button
          onClick={() => navigate(`/studio/selection?p=${project.id}`)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-btn border border-gold/40 bg-gold/15 px-4 text-sm font-semibold text-[#8A6D00] transition-all hover:bg-gold/25 active:scale-[0.98]"
        >
          <LayoutGrid className="h-4 w-4" />
          Audition Console
        </button>
        <Button
          icon={<Sparkles className="h-4 w-4" />}
          onClick={() => navigate(`/studio/casting-recap?p=${project.id}`)}
        >
          Let It Cast
        </Button>
      </div>
    </Card>
  )
}

/* ── KPI row ──────────────────────────────────────────────────────────────── */

function KpiRow({ kpis: k }: { kpis: ProjectKPIs }) {
  const cards = [
    { label: 'Roles', value: k.roles.total, sub: `${k.roles.lead} lead · ${k.roles.supporting} supporting` },
    { label: 'Submissions', value: k.submissions.total, sub: `+${k.submissions.today} today`, accent: true },
    { label: 'Shortlist', value: k.shortlist.total, sub: `${k.shortlist.readyForCallback} ready for callback` },
    { label: 'Callbacks', value: k.callbacks.total, sub: `next: ${k.callbacks.next}` },
    { label: 'Booked', value: k.booked, sub: 'lead booked' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label} className="flex flex-col gap-1">
          <span className="tech-label">{c.label}</span>
          <span className="text-3xl font-bold tracking-tight text-ink">{c.value}</span>
          <span className={cn('text-xs', c.accent ? 'font-semibold text-match' : 'text-muted')}>
            {c.sub}
          </span>
        </Card>
      ))}
    </div>
  )
}

/* ── Roles table ──────────────────────────────────────────────────────────── */

function RolesTable({ roles, projectId }: { roles: Role[]; projectId: string }) {
  if (roles.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-sm text-muted">
        The booked role isn't shown in this sample view.
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {['Role', 'Type', 'Submissions', 'Shortlist', 'Status', 'Casting', 'Deadline'].map((h) => (
              <th
                key={h}
                className={cn(
                  'px-5 py-2.5 text-label font-semibold uppercase tracking-label text-muted',
                  h === 'Shortlist' && 'text-center',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <RoleRow key={r.id} role={r} projectId={projectId} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RoleRow({ role: r, projectId }: { role: Role; projectId: string }) {
  const navigate = useNavigate()
  const isLesOmbres = projectId === 'les-ombres-de-midi'

  const projectCasting = useProjectCasting(projectId)
  const castingDefault = ROLE_CASTING_DEFAULTS[r.id]
  const castingStatus = projectCasting[r.id]?.status ?? castingDefault?.status ?? 'ready'
  const isNotOpened = castingStatus === 'not-opened'

  const candidates = useRoleCandidates(r.id)
  const pipelineStatus = useRoleStatus(r.id)

  const submissionsCount = isNotOpened ? 0 : isLesOmbres ? candidates.length : r.submissions
  const shortlistCount = isNotOpened ? 0 : isLesOmbres ? shortlistedCountForRole(r.id) : r.shortlist
  const deadline = isNotOpened ? '' : r.deadline

  return (
    <tr className="border-b border-line last:border-0 hover:bg-paper/50">
      <td className="px-5 py-3 font-semibold text-ink">{r.name}</td>
      <td className="px-5 py-3 text-muted">{r.type}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="min-w-[3.5rem] font-semibold text-ink">{submissionsCount}</span>
          <Button
            variant="secondary"
            size="sm"
            iconRight={<ArrowRight className="h-4 w-4" />}
            disabled={isNotOpened}
            className={cn(isNotOpened && 'opacity-40 cursor-not-allowed')}
            onClick={() => navigate(`/studio/review?p=${projectId}&role=${r.id}`)}
          >
            Review
          </Button>
        </div>
      </td>
      <td className="px-5 py-3 text-center">
        <span className="font-semibold text-ink">{shortlistCount}</span>
      </td>
      <td className="px-5 py-3">
        <select
          value={pipelineStatus}
          onChange={(e) => setRoleStatus(r.id, e.target.value as RolePipelineStatus)}
          className={cn(
            'rounded-btn border border-line px-2 py-1 text-xs font-semibold focus:outline-none',
            PIPELINE_BG_CLASS[pipelineStatus],
          )}
        >
          {PIPELINE_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
      <td className="px-5 py-3">
        <span className={cn(
          'flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
          isNotOpened ? 'bg-red-50 text-signal-no' : 'bg-signal-good-bg text-signal-good',
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', isNotOpened ? 'bg-signal-no' : 'bg-signal-good')} />
          {isNotOpened ? 'Not opened' : 'Ongoing Casting'}
        </span>
      </td>
      <td className="px-5 py-3 font-mono text-xs text-muted">{deadline}</td>
    </tr>
  )
}

/* ── Submissions chart ────────────────────────────────────────────────────── */

function SubmissionsChart({ data }: { data: { day: string; submissions: number }[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="tech-label">Submissions over time</span>
        <span className="text-xs text-muted">Last 14 days</span>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="subsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.link} stopOpacity={0.28} />
                <stop offset="100%" stopColor={colors.link} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={colors.line} vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: colors.muted }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: `1px solid ${colors.line}`,
                fontSize: 12,
                boxShadow: '0 6px 20px rgba(21,20,15,0.08)',
              }}
            />
            <Area
              type="monotone"
              dataKey="submissions"
              stroke={colors.link}
              strokeWidth={2.5}
              fill="url(#subsFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

/* ── Activity feed ────────────────────────────────────────────────────────── */

/* ── Share modal ──────────────────────────────────────────────────────────── */

const SOCIAL = [
  { name: 'Instagram',  bg: 'from-pink-500 to-purple-600',  fg: 'text-white',  initial: 'IG' },
  { name: 'LinkedIn',   bg: 'bg-[#0A66C2]',                  fg: 'text-white',  initial: 'in' },
  { name: 'X / Twitter', bg: 'bg-black',                     fg: 'text-white',  initial: 'X'  },
  { name: 'WhatsApp',   bg: 'bg-[#25D366]',                  fg: 'text-white',  initial: 'WA' },
  { name: 'Facebook',   bg: 'bg-[#1877F2]',                  fg: 'text-white',  initial: 'f'  },
  { name: 'TikTok',     bg: 'bg-black',                      fg: 'text-white',  initial: 'TT' },
]

function ShareModal({ project, onClose }: { project: import('@/data').Project; onClose: () => void }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const publicLink = `https://app.letitcast.com/casting/${project.id}`

  const copy = () => {
    navigator.clipboard.writeText(publicLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Link copied to clipboard')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-card bg-card shadow-card-hover sm:rounded-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <span className="tech-label">Share project</span>
            <h3 className="mt-0.5 font-bold text-ink">{project.title}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-col gap-5 px-5 py-5">
          {/* Public link */}
          <div className="flex flex-col gap-2">
            <span className="tech-label">Public Let It Cast link</span>
            <div className="flex items-center gap-2 rounded-btn border border-line bg-paper px-3 py-2">
              <Link2 className="h-4 w-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted">{publicLink}</span>
              <button
                onClick={copy}
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-btn px-2.5 py-1 text-xs font-semibold transition-colors',
                  copied ? 'bg-match text-white' : 'bg-ink text-white hover:bg-ink/90',
                )}
              >
                {copied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social icons */}
          <div className="flex flex-col gap-2">
            <span className="tech-label">Share on social</span>
            <div className="flex flex-wrap gap-2">
              {SOCIAL.map(s => (
                <button
                  key={s.name}
                  onClick={() => toast(`Opening ${s.name}…`)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-btn px-3 py-2.5 transition-opacity hover:opacity-80',
                    s.bg.startsWith('from-') ? `bg-gradient-to-br ${s.bg}` : s.bg,
                  )}
                >
                  <span className={cn('text-sm font-bold', s.fg)}>{s.initial}</span>
                  <span className={cn('text-[10px] font-medium', s.fg, 'opacity-80')}>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Publish to feed */}
          <div className="flex flex-col gap-2 rounded-card border-2 border-ink bg-ink p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              <span className="text-sm font-bold text-white">Publish on Let It Cast feed</span>
            </div>
            <p className="text-xs leading-relaxed text-white/60">
              Visible to all registered talent on the platform. They can discover the project, follow casting updates, and apply directly.
            </p>
            <Button
              onClick={() => { toast('Published to Let It Cast feed!'); onClose() }}
              className="bg-gold text-ink hover:bg-gold/90 mt-1"
            >
              Publish to feed
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const tone = (signal?: string) =>
    signal === 'good' ? 'good' : signal === 'maybe' ? 'maybe' : signal === 'no' ? 'no' : 'neutral'
  return (
    <Card className="flex flex-col gap-3">
      <span className="tech-label">Activity</span>
      <ul className="flex flex-col gap-4">
        {items.map((a) => (
          <li key={a.id} className="flex items-start gap-2.5">
            <Avatar src={teamByInitials[a.actorInitials]?.avatar} name={a.actorName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-ink">
                <span className="font-semibold">{a.actorName}</span> {a.action}{' '}
                <span className="font-semibold">{a.target}</span>
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Tag tone={tone(a.signal) as 'good' | 'maybe' | 'no' | 'neutral'}>{a.tag}</Tag>
                <span className="text-xs text-muted">{a.time}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
