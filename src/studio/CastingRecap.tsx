import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Globe, Users, Building2, Sparkles, LayoutGrid } from 'lucide-react'
import { Card, Button, Tag } from '@/components/ui'
import { projectsById, rolesByProject } from '@/data'
import { useProjectCasting, ROLE_CASTING_DEFAULTS, type AuditionFormat, type RoleCastingStatus } from '@/data/castingState'
import { cn } from '@/lib/cn'
import { Stepper, WORKFLOW_STEPS_SCRIPTED } from './NewCasting'
import { asset } from '@/lib/asset'

const FORMAT_META: Record<AuditionFormat, { label: string; icon: React.ReactNode; desc: string; color: string }> = {
  'open-call': {
    label: 'Open Call',
    icon: <Globe className="h-3.5 w-3.5" />,
    desc: 'Visible to all matching talent',
    color: 'bg-link/10 text-link border-link/20',
  },
  'invited': {
    label: 'Invited',
    icon: <Users className="h-3.5 w-3.5" />,
    desc: 'By invitation only',
    color: 'bg-signal-maybe/10 text-[#8A6D00] border-signal-maybe/30',
  },
  'in-house': {
    label: 'In House',
    icon: <Building2 className="h-3.5 w-3.5" />,
    desc: 'Internal — agency required',
    color: 'bg-paper text-muted border-line',
  },
}

const STATUS_META: Record<RoleCastingStatus, { label: string; bg: string; text: string; dot: string }> = {
  'not-opened': { label: 'Not opened',      bg: 'bg-red-50',         text: 'text-signal-no',   dot: 'bg-signal-no' },
  'ready':      { label: 'Let it Cast',     bg: 'bg-signal-good-bg', text: 'text-signal-good',  dot: 'bg-signal-good' },
  'ongoing':    { label: 'Ongoing Casting', bg: 'bg-gold/15',        text: 'text-[#8A6D00]',    dot: 'bg-gold' },
}

const LOGLINE = "A detective obsessed with cold cases discovers that the prime suspect she's hunted for two decades could be her own mother."

export function CastingRecap() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('p') || 'les-ombres-de-midi'
  const project = projectsById[projectId] ?? projectsById['les-ombres-de-midi']
  const roles = rolesByProject(project.id)
  const projectCasting = useProjectCasting(project.id)

  const stateFor = (roleId: string) => {
    const meta = ROLE_CASTING_DEFAULTS[roleId] ?? { hasBrief: false, gender: '—', age: '—', format: 'open-call' as AuditionFormat, status: 'ready' as RoleCastingStatus }
    const casting = projectCasting[roleId]
    return {
      hasBrief: meta.hasBrief,
      gender: meta.gender,
      age: meta.age,
      format: casting?.format ?? meta.format,
      status: casting?.status ?? meta.status,
    }
  }

  const allResolved = roles.every((role) => stateFor(role.id).status !== 'ready')

  const handleMatchingProfile = (roleId: string, format: AuditionFormat) => {
    if (format === 'in-house') {
      navigate(`/studio/agency-select?p=${project.id}&role=${roleId}`)
    } else {
      navigate(`/studio/casting-search?p=${project.id}&role=${roleId}`)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-ink/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="tech-label">Let It Cast</span>
          <h1 className="text-xl font-bold tracking-tight text-ink">Casting recap</h1>
        </div>
      </div>

      {/* Stepper */}
      <Stepper current={6} labels={WORKFLOW_STEPS_SCRIPTED} />

      {/* Project card */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          {project.poster ? (
            <img
              src={asset(project.poster)}
              alt={project.title}
              className="h-20 w-20 shrink-0 rounded-btn object-cover ring-1 ring-line"
            />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-btn bg-paper text-3xl ring-1 ring-line">🎬</span>
          )}
          <div className="min-w-0 flex-1">
            <span className="tech-label">{project.type} · {project.company} · {project.genre}</span>
            <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-ink">{project.title}</h2>
            <p className="mt-0.5 text-sm text-muted">{project.location} · {project.shooting}</p>
          </div>
        </div>
        <p className="rounded-btn bg-paper px-4 py-3 text-sm italic leading-relaxed text-ink ring-1 ring-line">
          "{LOGLINE}"
        </p>

        {/* Director brief preview */}
        <div className="flex flex-col gap-1.5">
          <span className="tech-label">Director's brief</span>
          <div className="overflow-hidden rounded-btn bg-black ring-1 ring-line" style={{ aspectRatio: '16 / 9' }}>
            <video
              src={asset("/brief-project.mp4")}
              controls
              preload="metadata"
              className="h-full w-full"
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      </Card>

      {/* Roles */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="tech-label">{roles.length} roles</span>
          <span className="text-xs text-muted">Click "Matching Profile" to find talent for a role</span>
        </div>

        {roles.map((role, i) => {
          const { hasBrief, gender, age, format, status } = stateFor(role.id)
          const formatMeta = FORMAT_META[format]
          const statusMeta = STATUS_META[status]
          const isNotOpened = status === 'not-opened'
          const isOngoing = status === 'ongoing'

          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className="flex flex-col gap-3">
                {/* Role info row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex-1 font-semibold text-ink">{role.name}</span>
                  <Tag tone={role.type === 'Lead' ? 'gold' : 'neutral'}>{role.type}</Tag>
                  {/* Casting status */}
                  <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold', statusMeta.bg, statusMeta.text)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dot)} />
                    {statusMeta.label}
                  </span>
                  {/* Format badge */}
                  <span className={cn('flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold', formatMeta.color)}>
                    {formatMeta.icon}
                    {formatMeta.label}
                  </span>
                </div>

                {/* Role criteria */}
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] text-muted ring-1 ring-line">{gender} · {age}</span>
                  <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] text-muted ring-1 ring-line">{role.deadline ? `Deadline ${role.deadline}` : 'Nov 15'}</span>
                  <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] text-muted ring-1 ring-line">French · English</span>
                  {format === 'in-house' && (
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[10px] font-semibold text-ink ring-1 ring-ink/10">
                      Agency required
                    </span>
                  )}
                  {hasBrief && (
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[10px] font-semibold text-ink ring-1 ring-ink/10">
                      Brief recorded
                    </span>
                  )}
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <div className="text-xs text-muted">
                    {isNotOpened ? (
                      <span className="font-medium text-signal-no">Not opened — talent can't be matched yet</span>
                    ) : isOngoing ? (
                      <span className="font-medium text-ink">Casting call sent — talent are being matched</span>
                    ) : (
                      <>
                        {formatMeta.desc}
                        {format === 'in-house' && <span className="ml-1 font-medium text-ink">— select agency first</span>}
                      </>
                    )}
                  </div>
                  <Button
                    disabled={isNotOpened}
                    variant={isOngoing ? 'secondary' : 'primary'}
                    icon={<Sparkles className="h-4 w-4" />}
                    onClick={() => handleMatchingProfile(role.id, format)}
                    className={cn(isNotOpened && 'opacity-40 cursor-not-allowed')}
                  >
                    {isOngoing ? 'View search' : 'Matching Profile'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Dashboard CTA once every role has been processed */}
      {allResolved && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="flex items-center justify-between gap-3 bg-ink text-white">
            <div>
              <p className="text-sm font-semibold">All castings launched</p>
              <p className="mt-0.5 text-xs text-white/60">Every role has been opened or sent to talent. Head back to the project dashboard to track submissions.</p>
            </div>
            <Button
              icon={<LayoutGrid className="h-4 w-4" />}
              onClick={() => navigate(`/studio/dashboard?p=${project.id}`)}
              className="shrink-0 bg-gold text-ink hover:bg-gold/90"
            >
              Dashboard
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
