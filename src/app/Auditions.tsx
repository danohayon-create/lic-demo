import { useNavigate } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { Zap, ChevronRight, TrendingUp } from 'lucide-react'
import { Card, Tag } from '@/components/ui'
import { AppHeader } from './AppHeader'
import { cn } from '@/lib/cn'
import { colors } from '@/styles/tokens'
import { auditions, auditionInsights, playsSparkline, type Audition, type AuditionStatus } from '@/data'

const statusTone: Record<AuditionStatus, 'neutral' | 'good' | 'link' | 'no'> = {
  'Under review': 'neutral',
  Shortlisted: 'good',
  'Just sent': 'link',
  'To self-tape': 'no',
}

export function Auditions() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader />

      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Auditions</h1>
        <p className="text-sm text-muted">{auditionInsights.subtitle}</p>
      </div>

      {/* stats card */}
      <Card className="flex items-center gap-4">
        <div className="flex-1">
          <span className="tech-label">Last 14 days</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink">
              {auditionInsights.playsDelta}
            </span>
            <span className="flex items-center gap-0.5 text-sm font-semibold text-match">
              <TrendingUp className="h-3.5 w-3.5" />
              {auditionInsights.playsPercent}
            </span>
          </div>
        </div>
        <div className="h-12 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={playsSparkline}>
              <Line
                type="monotone"
                dataKey="plays"
                stroke={colors.match}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* list */}
      <div className="flex flex-col gap-2.5">
        {auditions.map((a) => (
          <AuditionRow key={a.id} audition={a} />
        ))}
      </div>

      {/* smart nudge */}
      <SmartNudge />
    </div>
  )
}

function AuditionRow({ audition: a }: { audition: Audition }) {
  const tone = statusTone[a.status]
  return (
    <Card className="flex items-center gap-3">
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
          tone === 'good' && 'bg-signal-good text-white',
          tone === 'no' && 'bg-signal-no text-white',
          tone === 'link' && 'bg-link/10 text-link',
          tone === 'neutral' && 'bg-paper text-ink ring-1 ring-line',
        )}
      >
        {a.projectTitle[0]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-semibold text-ink">{a.projectTitle}</span>
          <span className="truncate text-xs text-muted">— {a.roleName}</span>
        </div>
        <div className="truncate text-xs text-muted">{a.info}</div>
      </div>
      <Tag tone={tone} className="shrink-0">
        {a.status}
      </Tag>
    </Card>
  )
}

function SmartNudge() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/app')}
      className="flex items-center gap-3 rounded-card border border-[#DDD3F7] bg-[#F1ECFB] p-4 text-left transition-colors hover:bg-[#EBE4F8]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7C5CD6] text-white">
        <Zap className="h-5 w-5" />
      </span>
      <p className="flex-1 text-sm font-medium text-[#3F2E73]">{auditionInsights.smartNudge}</p>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#7C5CD6]" />
    </button>
  )
}
