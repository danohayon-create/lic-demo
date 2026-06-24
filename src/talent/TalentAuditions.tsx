import { useNavigate } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { Check, TrendingUp, Video } from 'lucide-react'
import { Card, Tag, Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { colors } from '@/styles/tokens'
import { auditions, auditionInsights, playsSparkline, type Audition, type AuditionStatus } from '@/data'

const steps: AuditionStatus[] = ['To self-tape', 'Just sent', 'Under review', 'Shortlisted']
const stepLabel: Record<AuditionStatus, string> = {
  'Just sent': 'Submitted',
  'To self-tape': 'Self-tape',
  'Under review': 'Under review',
  Shortlisted: 'Shortlisted',
}

const statusTone: Record<AuditionStatus, 'neutral' | 'good' | 'link' | 'no'> = {
  'Under review': 'neutral',
  Shortlisted: 'good',
  'Just sent': 'link',
  'To self-tape': 'no',
}

/** Talent desktop — progress of every audition Maya has applied to. */
export function TalentAuditions() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Auditions</h1>
        <p className="text-sm text-muted">{auditionInsights.subtitle}</p>
      </div>

      <Card className="flex items-center gap-4">
        <div className="flex-1">
          <span className="tech-label">Last 14 days</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink">{auditionInsights.playsDelta}</span>
            <span className="flex items-center gap-0.5 text-sm font-semibold text-match">
              <TrendingUp className="h-3.5 w-3.5" />
              {auditionInsights.playsPercent}
            </span>
          </div>
        </div>
        <div className="h-12 w-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={playsSparkline}>
              <Line type="monotone" dataKey="plays" stroke={colors.match} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {auditions.map((a) => (
          <AuditionCard key={a.id} audition={a} />
        ))}
      </div>
    </div>
  )
}

function AuditionCard({ audition: a }: { audition: Audition }) {
  const navigate = useNavigate()
  const tone = statusTone[a.status]
  const currentIndex = steps.indexOf(a.status)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink">
            {a.projectTitle} <span className="text-muted">— {a.roleName}</span>
          </p>
          <p className="text-xs text-muted">{a.info}</p>
        </div>
        <Tag tone={tone} className="shrink-0">
          {a.status}
        </Tag>
      </div>

      {/* progress stepper */}
      <div className="flex items-center">
        {steps.map((s, i) => {
          const done = i < currentIndex || a.status === 'Shortlisted'
          const active = i === currentIndex
          return (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                    done || active ? 'bg-ink text-white' : 'bg-paper text-muted ring-1 ring-line',
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="whitespace-nowrap text-[10px] font-medium text-muted">{stepLabel[s]}</span>
              </div>
              {i < steps.length - 1 && (
                <span className={cn('mx-1 h-[2px] flex-1', done ? 'bg-ink' : 'bg-line')} />
              )}
            </div>
          )
        })}
      </div>

      {a.status === 'To self-tape' && (
        <Button
          size="sm"
          variant="premium"
          icon={<Video className="h-3.5 w-3.5" />}
          className="self-start"
          onClick={() => navigate(`/app/selftape/${a.projectId}`)}
        >
          Record self-tape
        </Button>
      )}
    </Card>
  )
}
