import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, UserRound } from 'lucide-react'
import { Card, Avatar, Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { projectsById, rolesByProject, type Role } from '@/data'
import { useRoleCandidates, useCandidatesForRoles, candidateScore, shortlistedCountForRole, type Candidate } from '@/data/selection'
import { asset } from '@/lib/asset'

export function Wall() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('p') || 'les-ombres-de-midi'
  const project = projectsById[projectId] ?? projectsById['les-ombres-de-midi']
  const roles = rolesByProject(project.id)
  const isNonScripted = project.format === 'non_scripted'

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-ink/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {project.poster ? (
            <img src={asset(project.poster)} alt={project.title} className="h-10 w-10 shrink-0 rounded-btn object-cover ring-1 ring-line" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-paper text-lg ring-1 ring-line">🎬</span>
          )}
          <div>
            <span className="tech-label">The Wall</span>
            <h1 className="text-xl font-bold tracking-tight text-ink">{project.title}</h1>
          </div>
        </div>
      </div>

      {isNonScripted ? (
        <NonScriptedWall roles={roles} projectId={project.id} contestantCount={project.kpis?.roles.total ?? roles.length} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {roles.map((role) => (
            <RoleWallCard key={role.id} role={role} projectId={project.id} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Non-scripted wall: shows N numbered contestant slots filled by cast candidates
 *  from across ALL casting teams — one person per slot, in order of score. */
function NonScriptedWall({ roles, projectId, contestantCount }: { roles: Role[]; projectId: string; contestantCount: number }) {
  const navigate = useNavigate()
  const allRoleIds = roles.map((r) => r.id)
  const allCandidates = useCandidatesForRoles(allRoleIds)

  const castCandidates = allCandidates
    .filter((c) => c.status === 'cast')
    .sort((a, b) => candidateScore(b) - candidateScore(a))

  const offerCandidates = allCandidates
    .filter((c) => c.status === 'offer')
    .sort((a, b) => candidateScore(b) - candidateScore(a))

  const slots: (Candidate | null)[] = Array.from({ length: contestantCount }, (_, i) => castCandidates[i] ?? null)
  const pendingOffers = offerCandidates.slice(0, Math.max(0, contestantCount - castCandidates.length))

  return (
    <div className="flex flex-col gap-4">
      {castCandidates.length > 0 && (
        <p className="text-sm text-muted">
          {Math.min(castCandidates.length, contestantCount)} of {contestantCount} contestant{contestantCount !== 1 ? 's' : ''} confirmed
          {pendingOffers.length > 0 ? ` · ${pendingOffers.length} offer${pendingOffers.length !== 1 ? 's' : ''} pending` : ''}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {slots.map((candidate, i) => {
          const slotNumber = i + 1
          const offer = !candidate ? pendingOffers[i - castCandidates.length] ?? null : null
          const person = candidate ?? offer
          return (
            <Card key={slotNumber} flush className="flex flex-col overflow-hidden">
              <div className="flex h-32 items-center justify-center bg-paper">
                {person ? (
                  <Avatar src={person.avatar} name={person.name} size="xl" />
                ) : (
                  <UserRound className="h-10 w-10 text-line" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-xs font-bold uppercase tracking-label text-muted">Contestant {slotNumber}</p>
                {person ? (
                  <>
                    <p className="font-bold text-ink">{person.name}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-bold',
                        person.status === 'cast' ? 'bg-signal-good-bg text-signal-good' : 'bg-gold/15 text-[#8A6D00]',
                      )}>
                        {person.status === 'cast' ? 'Cast' : 'Offer'}
                      </span>
                      <span className="text-sm font-bold text-match">{candidateScore(person)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted">Slot open</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-auto"
                      onClick={() => navigate(`/studio/selection?p=${projectId}&view=kanban`)}
                    >
                      Select
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function RoleWallCard({ role, projectId }: { role: Role; projectId: string }) {
  const navigate = useNavigate()
  const isLesOmbres = projectId === 'les-ombres-de-midi'
  const candidates = useRoleCandidates(role.id)
  const chosen = candidates.find((c) => c.status === 'cast') ?? candidates.find((c) => c.status === 'offer')

  const auditions = isLesOmbres ? candidates.length : role.submissions
  const shortlisted = isLesOmbres ? shortlistedCountForRole(role.id) : role.shortlist

  return (
    <Card flush className="flex flex-col overflow-hidden">
      <div className="flex h-32 items-center justify-center bg-paper">
        {chosen ? (
          <Avatar src={chosen.avatar} name={chosen.name} size="xl" />
        ) : (
          <UserRound className="h-10 w-10 text-line" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-bold text-ink">{role.name}</p>
        {chosen ? (
          <>
            <p className="text-sm text-ink">{chosen.name}</p>
            <div className="mt-auto flex items-center justify-between">
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-bold',
                chosen.status === 'cast' ? 'bg-signal-good-bg text-signal-good' : 'bg-gold/15 text-[#8A6D00]',
              )}>
                {chosen.status === 'cast' ? 'Cast' : 'Offer'}
              </span>
              <span className="text-sm font-bold text-match">{candidateScore(chosen)}</span>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-muted">{auditions} applicants, {shortlisted} shortlisted</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-auto"
              onClick={() => navigate(`/studio/selection?p=${projectId}&role=${role.id}`)}
            >
              Select
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
