import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Upload,
  Video,
  Mic,
  Users,
  Zap,
  Globe,
  Lock,
  Building2,
  Sparkles,
  X,
  Play,
  Pencil,
  Plus,
  Search,
  DollarSign,
} from 'lucide-react'
import { Card, Button, Tag } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import { setProjectCasting } from '@/data/castingState'

// ── Fake extracted data ───────────────────────────────────────────────────────

const extractedProject = {
  title: 'Les Ombres de Midi',
  type: 'Film',
  genre: 'Psychological thriller',
  company: 'Studio 13 Productions',
  director: 'Marie Fontaine',
  location: 'Marseille, France',
  shooting: 'Jan–Mar 2027',
  logline:
    "A detective obsessed with cold cases discovers that the prime suspect she's hunted for two decades could be her own mother.",
}

const extractedRoles = [
  {
    id: 'r1',
    name: 'Inspectrice Chloé Marchand',
    type: 'Lead' as const,
    gender: 'F',
    age: '35–45',
    description:
      "Cold, methodical, and driven by a trauma she has never processed. Her rigour is both her greatest asset and the wall that keeps everyone at arm's length.",
  },
  {
    id: 'r2',
    name: 'Agnès Marchand',
    type: 'Supporting' as const,
    gender: 'F',
    age: '60–70',
    description:
      "Chloé's mother. Outwardly warm, meticulous, and loving — a retired schoolteacher who bakes on Sundays. Something underneath does not add up.",
  },
  {
    id: 'r3',
    name: 'Capitaine Rémy Jourdain',
    type: 'Supporting' as const,
    gender: 'M',
    age: '40–50',
    description:
      "Chloé's partner. Pragmatic and grounded, he watches her spiral with a mix of loyalty and growing unease. The moral centre of the film.",
  },
  {
    id: 'r4',
    name: 'La Témoin',
    type: 'Supporting' as const,
    gender: 'F',
    age: '25–35',
    description:
      'A woman who saw something twenty years ago and has spent every day since trying to forget it. She holds the key — and knows it.',
  },
]

const ANALYSIS_STEPS = [
  'Reading document structure…',
  'Identifying characters…',
  'Building role profiles…',
  'Generating project summary…',
]

/** The 6-step casting workflow, shown by the `Stepper` on every screen of the flow. */
export const WORKFLOW_STEPS = ['Document', 'Analyse', 'Rôles', 'Briefs vidéo', 'Format', 'Publish']

// Maps wizard mock role ids (r1…r4) to the real data-layer role ids used by
// CastingRecap / CastingSearch, in extraction order.
const ROLE_ID_MAP: Record<string, string> = {
  r1: 'chloe-marchand',
  r2: 'agnes-marchand-film',
  r3: 'remy-jourdain',
  r4: 'la-temoin-film',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type AuditionFormat = 'open-call' | 'invited' | 'in-house'
type CastingStatus = 'let-it-cast' | 'not-opened'

type ExtractedRole = (typeof extractedRoles)[number] & {
  languages?: string[]
  heightRange?: string
  ethnicity?: string
  experienceLevel?: string
  skills?: string[]
  nudity?: string
}

type CompensationData = {
  isPaid: boolean
  knowBudget: 'yes' | 'depends' | 'not-sure'
  rateType: string
  currency: string
  amount: string
  isRange: boolean
  hours: string
}

// ── Main component ────────────────────────────────────────────────────────────

export function NewCasting() {
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(1)

  // Shared state across steps
  const [briefRecorded, setBriefRecorded] = useState(false)
  const [roleBriefs, setRoleBriefs] = useState<Record<string, boolean>>({})
  const [roleDocs, setRoleDocs] = useState<Record<string, boolean>>({})
  const [castingStatus, setCastingStatus] = useState<Record<string, CastingStatus>>({})
  const [globalFormat, setGlobalFormat] = useState<AuditionFormat>('open-call')
  const [roleFormats, setRoleFormats] = useState<Record<string, AuditionFormat>>({})

  const goBack = () => {
    if (step === 1) navigate(-1)
    else if (step === 3) setStep(1) // skip step 2 (auto-advanced)
    else setStep((s) => s - 1)
  }

  const publish = () => {
    const projectId = 'les-ombres-de-midi'
    const roleState: Record<string, { format: AuditionFormat; status: 'not-opened' | 'ready' }> = {}
    extractedRoles.forEach((role) => {
      const realId = ROLE_ID_MAP[role.id]
      if (!realId) return
      const cs = castingStatus[role.id] ?? 'let-it-cast'
      roleState[realId] = {
        format: roleFormats[role.id] ?? globalFormat,
        status: cs === 'not-opened' ? 'not-opened' : 'ready',
      }
    })
    setProjectCasting(projectId, roleState)
    toast('Casting publié ! Les talents vont recevoir le brief.')
    navigate(`/studio/casting-recap?p=${projectId}`)
  }

  const headingFor = (s: number) => {
    if (s <= 2) return 'Import your project document'
    if (s === 3) return 'Review extracted data'
    if (s === 4) return 'Add video briefs'
    return 'Review & choose format'
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Chrome */}
      <div className="flex items-center gap-4">
        <button
          onClick={goBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-ink/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <span className="tech-label">New casting</span>
          <h1 className="text-xl font-bold tracking-tight text-ink">{headingFor(step)}</h1>
        </div>
      </div>

      {/* Stepper */}
      <Stepper current={step} labels={WORKFLOW_STEPS} />

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={document.visibilityState === 'visible' ? { opacity: 0, x: 18 } : false}
          animate={{ opacity: 1, x: 0 }}
          exit={document.visibilityState === 'visible' ? { opacity: 0, x: -18 } : undefined}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {step === 1 && <StepUpload onDone={() => setStep(2)} onBack={goBack} />}
          {step === 2 && <StepAnalyzing onDone={() => setStep(3)} />}
          {step === 3 && <StepReview onNext={() => setStep(4)} onBack={goBack} />}
          {step === 4 && (
            <StepBriefs
              briefRecorded={briefRecorded}
              onBriefRecorded={() => setBriefRecorded(true)}
              roleBriefs={roleBriefs}
              onRoleBrief={(id) => setRoleBriefs((p) => ({ ...p, [id]: true }))}
              roleDocs={roleDocs}
              onRoleDoc={(id) => setRoleDocs((p) => ({ ...p, [id]: true }))}
              castingStatus={castingStatus}
              onCastingStatus={(id, s) => setCastingStatus((p) => ({ ...p, [id]: s }))}
              onNext={() => setStep(5)}
              onBack={goBack}
            />
          )}
          {step === 5 && (
            <StepFormat
              globalFormat={globalFormat}
              onGlobalFormat={setGlobalFormat}
              roleFormats={roleFormats}
              onRoleFormat={(id, f) => setRoleFormats((p) => ({ ...p, [id]: f }))}
              roleBriefs={roleBriefs}
              roleDocs={roleDocs}
              castingStatus={castingStatus}
              onPublish={publish}
              onBack={goBack}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Stepper ───────────────────────────────────────────────────────────────────

export function Stepper({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0">
      {labels.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  done ? 'bg-match text-white' : active ? 'bg-ink text-white' : 'bg-line text-muted',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : n}
              </span>
              <span
                className={cn(
                  'hidden text-[10px] font-semibold uppercase tracking-wide sm:block',
                  active ? 'text-ink' : 'text-muted',
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className={cn('mx-1 mb-4 h-px flex-1 transition-colors', done ? 'bg-match' : 'bg-line')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1 — Upload ───────────────────────────────────────────────────────────

function StepUpload({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [file, setFile] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const simulateFile = () =>
    setFile('character_breakdown_ombres_de_midi.pdf · 8.2 MB')

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-ink">
            Upload a script, a character breakdown, or a role description. Let It Cast will extract
            the project structure and all roles automatically.
          </p>
          <p className="text-xs text-muted">
            Supported formats: PDF, Final Draft (.fdx), Fountain, Word (.docx)
          </p>
        </div>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); simulateFile() }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-3 rounded-card border-2 border-dashed px-8 py-12 transition-colors',
              dragging ? 'border-link bg-link/5' : 'border-line bg-paper hover:border-ink/30',
            )}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-card ring-1 ring-line">
              <Upload className="h-6 w-6 text-muted" />
            </span>
            <div className="text-center">
              <p className="text-sm font-semibold text-ink">Drop your document here</p>
              <p className="text-xs text-muted">or click to browse files — max 50 MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.fdx,.fountain,.docx"
              className="hidden"
              onChange={() => simulateFile()}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-btn bg-paper px-4 py-3 ring-1 ring-line">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-link/10 text-link">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{file}</p>
              <p className="text-xs text-match">Ready to analyse</p>
            </div>
            <button onClick={() => setFile(null)} className="text-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs text-muted">or</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <button
          onClick={simulateFile}
          className="text-center text-sm font-medium text-link hover:underline"
        >
          Use our sample script to explore the feature →
        </button>
      </Card>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm font-medium text-muted hover:text-ink">
          ← Back to dashboard
        </button>
        <Button disabled={!file} icon={<Sparkles className="h-4 w-4" />} onClick={onDone}>
          Analyse with LIC AI
        </Button>
      </div>
    </div>
  )
}

// ── Step 2 — Analyzing ────────────────────────────────────────────────────────

function StepAnalyzing({ onDone }: { onDone: () => void }) {
  const [doneSteps, setDoneSteps] = useState<number[]>([])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    ANALYSIS_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setDoneSteps((prev) => [...prev, i]), 400 + i * 500))
    })
    timers.push(setTimeout(onDone, 400 + ANALYSIS_STEPS.length * 500 + 300))
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  return (
    <Card className="flex flex-col items-center gap-8 py-16">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#ECEAE4" strokeWidth="5" />
          <motion.circle
            cx="40" cy="40" r="34"
            fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - doneSteps.length / ANALYSIS_STEPS.length) }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </svg>
        <Sparkles className="h-8 w-8 text-link" />
      </div>

      <div className="flex flex-col items-start gap-3">
        {ANALYSIS_STEPS.map((label, i) => {
          const done = doneSteps.includes(i)
          const active = doneSteps.length === i
          return (
            <div key={label} className="flex items-center gap-3">
              <span className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all',
                done ? 'bg-match text-white' : active ? 'ring-2 ring-link' : 'bg-line',
              )}>
                {done && <Check className="h-3 w-3" />}
                {active && (
                  <motion.span
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="h-2 w-2 rounded-full bg-link"
                  />
                )}
              </span>
              <span className={cn('text-sm', done ? 'text-ink' : active ? 'font-medium text-ink' : 'text-muted')}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Step 3 — Review extracted data ────────────────────────────────────────────

function StepReview({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const toast = useToast()
  const [roles, setRoles] = useState<ExtractedRole[]>(
    extractedRoles.map((r) => ({
      ...r,
      languages: ['French', 'English'],
      heightRange: '155–190 cm',
      ethnicity: 'Any',
      experienceLevel: 'Mid-career',
      skills: [],
      nudity: 'No',
    })),
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [compensatingId, setCompensatingId] = useState<string | null>(null)
  const [compensationByRole, setCompensationByRole] = useState<Record<string, CompensationData>>({})

  const removeRole = (id: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== id))
    toast('Role removed')
  }

  const saveRole = (updated: ExtractedRole) => {
    setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    setEditingId(null)
    toast('Role updated')
  }

  const saveCompensation = (id: string, data: CompensationData, applyAll: boolean) => {
    if (applyAll) {
      const all: Record<string, CompensationData> = {}
      roles.forEach((r) => { all[r.id] = data })
      setCompensationByRole(all)
      toast('Compensation applied to all roles')
    } else {
      setCompensationByRole((p) => ({ ...p, [id]: data }))
      toast('Compensation saved')
    }
    setCompensatingId(null)
  }

  const editingRole      = roles.find((r) => r.id === editingId) ?? null
  const compensatingRole = roles.find((r) => r.id === compensatingId) ?? null

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Tag tone="gold" icon={<Sparkles className="h-3 w-3" />}>AI extracted</Tag>
          <span className="tech-label">Project detected</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-2xl font-bold tracking-tight text-ink">{extractedProject.title}</h2>
          <span className="tech-label">
            {extractedProject.type} · {extractedProject.genre} · {extractedProject.company}
          </span>
          <p className="mt-0.5 text-xs text-muted">
            Dir. {extractedProject.director} · {extractedProject.location} · {extractedProject.shooting}
          </p>
        </div>
        <p className="rounded-btn bg-paper p-3 text-sm italic leading-relaxed text-ink ring-1 ring-line">
          "{extractedProject.logline}"
        </p>
        <button
          onClick={() => setEditProjectOpen(true)}
          className="self-start flex items-center gap-1.5 rounded-btn bg-paper px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line hover:bg-ink/5"
        >
          <Pencil className="h-3 w-3" />
          Edit project details
        </button>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="tech-label">{roles.length} roles extracted</span>
          <button
            onClick={() => toast('Adding a role — bientôt disponible')}
            className="text-xs font-medium text-link hover:underline"
          >
            + Add role
          </button>
        </div>

        {roles.map((role, i) => {
          const comp = compensationByRole[role.id]
          return (
            <motion.div key={role.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{role.name}</span>
                    <Tag tone={role.type === 'Lead' ? 'gold' : 'neutral'}>{role.type}</Tag>
                    <span className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] text-muted ring-1 ring-line">
                      {role.gender} · {role.age}
                    </span>
                    {comp && (
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                        comp.isPaid
                          ? 'bg-signal-good-bg text-signal-good'
                          : 'bg-red-50 text-signal-no',
                      )}>
                        {comp.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setEditingId(role.id)}
                      className="flex items-center gap-1 rounded-btn bg-paper px-2.5 py-1 text-xs font-semibold text-ink ring-1 ring-line hover:bg-ink/5"
                    >
                      <Pencil className="h-3 w-3" />
                      Modify
                    </button>
                    <button
                      onClick={() => setCompensatingId(role.id)}
                      className="flex items-center gap-1 rounded-btn bg-paper px-2.5 py-1 text-xs font-semibold text-ink ring-1 ring-line hover:bg-ink/5"
                    >
                      <DollarSign className="h-3 w-3" />
                      Compensation
                    </button>
                    <button onClick={() => removeRole(role.id)} className="text-muted hover:text-ink">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted">{role.description}</p>
                <div className="flex flex-wrap gap-1">
                  {role.languages?.map((l) => (
                    <span key={l} className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] text-muted ring-1 ring-line">{l}</span>
                  ))}
                  {role.heightRange && (
                    <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] text-muted ring-1 ring-line">{role.heightRange}</span>
                  )}
                  {role.experienceLevel && (
                    <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] text-muted ring-1 ring-line">{role.experienceLevel}</span>
                  )}
                  {role.skills?.map((s) => (
                    <span key={s} className="rounded-full bg-link/10 px-2 py-0.5 font-mono text-[10px] text-link ring-1 ring-link/20">{s}</span>
                  ))}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm font-medium text-muted hover:text-ink">← Back</button>
        <Button icon={<ArrowRight className="h-4 w-4" />} onClick={onNext}>
          Looks good — add briefs
        </Button>
      </div>

      <AnimatePresence>
        {editProjectOpen && <EditProjectModal onClose={() => setEditProjectOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {editingRole && (
          <RoleEditModal role={editingRole} onClose={() => setEditingId(null)} onSave={saveRole} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {compensatingRole && (
          <CompensationModal
            roleName={compensatingRole.name}
            data={compensationByRole[compensatingRole.id]}
            onClose={() => setCompensatingId(null)}
            onSave={(data, applyAll) => saveCompensation(compensatingRole.id, data, applyAll)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Step 4 — Video briefs ─────────────────────────────────────────────────────

function StepBriefs({
  briefRecorded,
  onBriefRecorded,
  roleBriefs,
  onRoleBrief,
  roleDocs,
  onRoleDoc,
  castingStatus,
  onCastingStatus,
  onNext,
  onBack,
}: {
  briefRecorded: boolean
  onBriefRecorded: () => void
  roleBriefs: Record<string, boolean>
  onRoleBrief: (id: string) => void
  roleDocs: Record<string, boolean>
  onRoleDoc: (id: string) => void
  castingStatus: Record<string, CastingStatus>
  onCastingStatus: (id: string, s: CastingStatus) => void
  onNext: () => void
  onBack: () => void
}) {
  const toast = useToast()

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        A video brief gives talent the director's voice and vision before they self-tape.
        It dramatically improves the quality of submissions.
      </p>

      {/* Project brief */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="tech-label">Project brief</span>
            <p className="mt-0.5 text-xs text-muted">The director introduces the project and its creative vision.</p>
          </div>
          <Tag tone={briefRecorded ? 'good' : 'neutral'}>{briefRecorded ? 'Recorded' : 'Optional'}</Tag>
        </div>

        {briefRecorded ? (
          <div className="flex items-center gap-3 rounded-btn bg-paper px-4 py-3 ring-1 ring-line">
            <span className="flex h-10 w-10 items-center justify-center rounded-btn bg-ink/5">
              <Play className="ml-0.5 h-4 w-4 text-ink" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Les Ombres de Midi — Director brief</p>
              <p className="font-mono text-xs text-muted">02:38</p>
            </div>
            <button onClick={() => toast('Re-recording — bientôt disponible')} className="text-xs font-medium text-link">
              Re-record
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Mic className="h-4 w-4" />} onClick={onBriefRecorded} className="flex-1">
              Record a brief
            </Button>
            <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={onBriefRecorded} className="flex-1">
              Upload video
            </Button>
          </div>
        )}
      </Card>

      {/* Per-role briefs */}
      <div className="flex flex-col gap-2">
        <span className="tech-label">Role briefs</span>
        {extractedRoles.map((role) => {
          const cs = castingStatus[role.id] ?? 'let-it-cast'
          const isNotOpened = cs === 'not-opened'
          const hasBrief = !!roleBriefs[role.id]
          const hasDoc = !!roleDocs[role.id]

          return (
            <Card key={role.id} className="flex flex-col gap-3">
              {/* Top row: icon + name + casting toggle */}
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper ring-1 ring-line">
                  <Video className="h-4 w-4 text-muted" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{role.name}</p>
                  <p className="text-xs text-muted">{role.type} · {role.gender} · {role.age}</p>
                </div>

                {/* Casting toggle */}
                <button
                  onClick={() => onCastingStatus(role.id, cs === 'let-it-cast' ? 'not-opened' : 'let-it-cast')}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all',
                    cs === 'let-it-cast'
                      ? 'border-signal-good/40 bg-signal-good-bg text-signal-good hover:border-signal-good/60'
                      : 'border-signal-no/40 bg-red-50 text-signal-no hover:border-signal-no/60',
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', cs === 'let-it-cast' ? 'bg-signal-good' : 'bg-signal-no')} />
                  {cs === 'let-it-cast' ? 'Let it Cast' : 'Not opened'}
                </button>
              </div>

              {/* Bottom row: doc + brief buttons (disabled when not-opened) */}
              <div className={cn('flex items-center justify-end gap-2 transition-opacity', isNotOpened && 'opacity-40')}>
                {hasDoc ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-match">
                    <Check className="h-3.5 w-3.5" /> Document added
                  </span>
                ) : isNotOpened ? (
                  <button
                    disabled
                    className="flex cursor-not-allowed items-center gap-1 rounded-btn bg-paper px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Add Script / Document
                  </button>
                ) : (
                  <label className="flex cursor-pointer items-center gap-1 rounded-btn bg-paper px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line hover:bg-ink/5">
                    <FileText className="h-3.5 w-3.5" />
                    Add Script / Document
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.fdx,.fountain,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) onRoleDoc(role.id)
                      }}
                    />
                  </label>
                )}

                {hasBrief ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-match">
                    <Check className="h-3.5 w-3.5" /> Brief recorded
                  </span>
                ) : (
                  <button
                    disabled={isNotOpened}
                    onClick={() => !isNotOpened && onRoleBrief(role.id)}
                    className={cn(
                      'flex items-center gap-1 rounded-btn bg-paper px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line',
                      isNotOpened ? 'cursor-not-allowed' : 'hover:bg-ink/5',
                    )}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    Add brief
                  </button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm font-medium text-muted hover:text-ink">← Back</button>
        <div className="flex items-center gap-3">
          <button onClick={onNext} className="text-sm font-medium text-muted hover:text-ink">Skip for now →</button>
          <Button icon={<ArrowRight className="h-4 w-4" />} onClick={onNext}>
            Briefs ready — next
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Step 5 — Review & format ──────────────────────────────────────────────────

const FORMAT_OPTIONS: {
  id: AuditionFormat
  label: string
  icon: React.ReactNode
  desc: string
  detail: string
}[] = [
  {
    id: 'open-call',
    label: 'Open Call',
    icon: <Globe className="h-5 w-5" />,
    desc: 'Visible to all matching talent',
    detail: "Your casting is published to the full LIC talent pool. Any talent whose profile matches your role criteria can view the brief and submit a self-tape.",
  },
  {
    id: 'invited',
    label: 'Invited',
    icon: <Users className="h-5 w-5" />,
    desc: 'By invitation only',
    detail: "You hand-pick which talent receive the brief and the self-tape link. Perfect for targeted calls where you already have names in mind.",
  },
  {
    id: 'in-house',
    label: 'In House',
    icon: <Building2 className="h-5 w-5" />,
    desc: 'Internal auditions only',
    detail: "Not visible on the platform. Share a private link directly with talent. Ideal for confidential projects or agency-only submissions.",
  },
]

const FORMAT_LABELS: Record<AuditionFormat, string> = {
  'open-call': 'Open Call',
  'invited': 'Invited',
  'in-house': 'In House',
}

function StepFormat({
  globalFormat,
  onGlobalFormat,
  roleFormats,
  onRoleFormat,
  roleBriefs,
  roleDocs,
  castingStatus,
  onPublish,
  onBack,
}: {
  globalFormat: AuditionFormat
  onGlobalFormat: (f: AuditionFormat) => void
  roleFormats: Record<string, AuditionFormat>
  onRoleFormat: (id: string, f: AuditionFormat) => void
  roleBriefs: Record<string, boolean>
  roleDocs: Record<string, boolean>
  castingStatus: Record<string, CastingStatus>
  onPublish: () => void
  onBack: () => void
}) {
  const toast = useToast()
  const [perRoleOpen, setPerRoleOpen] = useState(false)

  return (
    <div className="flex flex-col gap-5">

      {/* ── Summary ────────────────────────────────────────────────────── */}
      <Card className="flex flex-col gap-4">
        <span className="tech-label">Casting summary</span>

        {/* Project header */}
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-paper text-xl ring-1 ring-line">🎬</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ink">{extractedProject.title}</p>
            <p className="text-xs text-muted">
              {extractedProject.type} · {extractedProject.genre} · {extractedProject.location}
            </p>
          </div>
        </div>

        {/* Director's brief video player */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="tech-label">Director's brief</span>
            <span className="font-mono text-[10px] text-muted">Les Ombres de Midi — Marie Fontaine</span>
          </div>
          <div
            className="overflow-hidden rounded-btn bg-black ring-1 ring-line"
            style={{ aspectRatio: '16 / 9' }}
          >
            <video
              src="/brief-project.mp4"
              controls
              preload="metadata"
              className="h-full w-full"
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-line" />

        {/* Roles summary */}
        <div className="flex flex-col gap-2">
          <span className="tech-label">{extractedRoles.length} roles</span>
          {extractedRoles.map((role) => {
            const cs = castingStatus[role.id] ?? 'let-it-cast'
            const hasBrief = !!roleBriefs[role.id]
            const hasDoc = !!roleDocs[role.id]
            return (
              <div
                key={role.id}
                className="flex flex-wrap items-center gap-2 rounded-btn border border-line px-3 py-2"
              >
                <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{role.name}</span>
                <Tag tone={role.type === 'Lead' ? 'gold' : 'neutral'}>{role.type}</Tag>

                {/* Casting status */}
                <span className={cn(
                  'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold',
                  cs === 'let-it-cast'
                    ? 'bg-signal-good-bg text-signal-good'
                    : 'bg-red-50 text-signal-no',
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', cs === 'let-it-cast' ? 'bg-signal-good' : 'bg-signal-no')} />
                  {cs === 'let-it-cast' ? 'Let it Cast' : 'Not opened'}
                </span>

                {/* Document */}
                {hasDoc ? (
                  <span className="flex items-center gap-1 rounded-btn bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink ring-1 ring-line">
                    <FileText className="h-3 w-3" /> Doc
                  </span>
                ) : (
                  <span className="text-[11px] text-muted">No doc</span>
                )}

                {/* Brief */}
                {hasBrief ? (
                  <button
                    onClick={() => toast('Lecture du brief — bientôt disponible')}
                    className="flex items-center gap-1 rounded-btn bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink ring-1 ring-line hover:bg-ink/5"
                  >
                    <Play className="h-3 w-3" /> Brief
                  </button>
                ) : (
                  <span className="text-[11px] text-muted">No brief</span>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Global audition format ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="tech-label">Global audition format</span>
          <span className="text-xs text-muted">Applies to all roles unless overridden</span>
        </div>

        {FORMAT_OPTIONS.map((opt) => {
          const active = globalFormat === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => onGlobalFormat(opt.id)}
              className={cn(
                'flex items-start gap-4 rounded-card border-2 p-4 text-left transition-all',
                active ? 'border-ink bg-card shadow-card' : 'border-line bg-paper hover:border-ink/30',
              )}
            >
              <span className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-btn transition-colors',
                active ? 'bg-ink text-white' : 'bg-line text-muted',
              )}>
                {opt.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{opt.label}</span>
                  {active && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-match text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-medium text-ink">{opt.desc}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{opt.detail}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Per-role format override ────────────────────────────────────── */}
      <div className="flex flex-col gap-2 rounded-card border border-line overflow-hidden">
        <button
          onClick={() => setPerRoleOpen((v) => !v)}
          className="flex items-center justify-between px-4 py-3 text-left hover:bg-paper/60"
        >
          <span className="text-sm font-semibold text-ink">Customize format per role</span>
          <div className="flex items-center gap-2 text-muted">
            <span className="text-xs">Override the global format for individual roles</span>
            {perRoleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        <AnimatePresence>
          {perRoleOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-line"
            >
              <div className="flex flex-col divide-y divide-line">
                {extractedRoles.map((role) => {
                  const current = roleFormats[role.id] ?? globalFormat
                  const isOverridden = !!roleFormats[role.id] && roleFormats[role.id] !== globalFormat
                  const cs = castingStatus[role.id] ?? 'let-it-cast'
                  const isNotOpened = cs === 'not-opened'
                  return (
                    <div key={role.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate text-sm font-semibold', isNotOpened ? 'text-muted' : 'text-ink')}>
                          {role.name}
                        </p>
                        {isOverridden && !isNotOpened && (
                          <p className="text-xs text-link">Override: {FORMAT_LABELS[current]}</p>
                        )}
                      </div>
                      {isNotOpened ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-signal-no">
                          <span className="h-1.5 w-1.5 rounded-full bg-signal-no" />
                          Not opened
                        </span>
                      ) : (
                        <div className="flex gap-1">
                          {(['open-call', 'invited', 'in-house'] as AuditionFormat[]).map((f) => (
                            <button
                              key={f}
                              onClick={() => onRoleFormat(role.id, f)}
                              className={cn(
                                'rounded-btn px-2.5 py-1 text-xs font-semibold transition-colors',
                                current === f
                                  ? 'bg-ink text-white'
                                  : 'bg-paper text-muted ring-1 ring-line hover:bg-ink/5',
                              )}
                            >
                              {FORMAT_LABELS[f]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Summary banner ─────────────────────────────────────────────── */}
      <Card className="flex items-start gap-3 bg-ink text-white">
        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">
            Ready to publish <span className="text-gold">{extractedProject.title}</span>
          </p>
          <p className="text-xs text-white/60">
            {extractedRoles.length} roles · {FORMAT_LABELS[globalFormat]} · {extractedProject.location} · {extractedProject.shooting}
          </p>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm font-medium text-muted hover:text-ink">← Back</button>
        <Button
          icon={<Lock className="h-4 w-4" />}
          onClick={onPublish}
          className="bg-match hover:bg-match/90"
        >
          Publish casting
        </Button>
      </div>
    </div>
  )
}

// ── Role edit modal ───────────────────────────────────────────────────────────

// ── Edit project modal ────────────────────────────────────────────────────────

function EditProjectModal({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  const [projectType, setProjectType] = useState('Film')
  const [subType, setSubType]         = useState('Psychological thriller')
  const [genres, setGenres]           = useState<string[]>(['Drama', 'Thriller'])
  const [hireFrom, setHireFrom]       = useState<'Local' | 'Nationwide' | 'Worldwide'>('Local')
  const [locationSearch, setLocationSearch] = useState('')
  const [locations, setLocations]     = useState<string[]>(['Paris', 'Marseille'])
  const anim = typeof document === 'undefined' || document.visibilityState === 'visible'

  const currentCat = PROJECT_TYPE_CATS.find((c) => c.label === projectType)

  const toggleGenre = (g: string) =>
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < 3 ? [...prev, g] : prev,
    )

  const toggleLocation = (city: string) =>
    setLocations((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]))

  const filtered = WORLD_CITIES.filter((c) =>
    c.toLowerCase().includes(locationSearch.toLowerCase()),
  )

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      initial={anim ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={anim ? { opacity: 0, y: 40 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-t-card bg-card shadow-card-hover sm:rounded-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <span className="tech-label">Edit project details</span>
            <h3 className="mt-0.5 font-bold text-ink">{extractedProject.title}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-6">

            {/* Project type */}
            <Field label="Project type *">
              <div className="overflow-hidden rounded-btn border border-line">
                {PROJECT_TYPE_CATS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setProjectType(cat.label); if (!cat.sub.length) setSubType('') }}
                    className={cn(
                      'flex w-full items-center justify-between border-b border-line px-4 py-2.5 text-sm last:border-0 hover:bg-paper',
                      projectType === cat.label ? 'bg-paper font-semibold text-ink' : 'text-ink',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-5 text-base">{cat.icon}</span>
                      {cat.label}
                    </span>
                    {cat.sub.length > 0 && <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-muted" />}
                  </button>
                ))}
              </div>
              {currentCat && currentCat.sub.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentCat.sub.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubType(s)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                        subType === s ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:border-ink/40',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </Field>

            {/* Genre */}
            <Field label="Genre (up to 3)">
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                      genres.includes(g) ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:border-ink/40',
                      !genres.includes(g) && genres.length >= 3 ? 'cursor-not-allowed opacity-40' : '',
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            {/* Where to hire */}
            <Field label="Where do you want to hire talent from? *">
              <div className="flex gap-2">
                {(['Local', 'Nationwide', 'Worldwide'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setHireFrom(opt)}
                    className={cn(
                      'flex-1 rounded-btn border py-2 text-sm font-semibold transition-colors',
                      hireFrom === opt ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:border-ink/40',
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Field>

            {/* Locations */}
            <Field label="Locations *">
              {locations.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {locations.map((city) => (
                    <span key={city} className="flex items-center gap-1 rounded-full bg-ink py-1 pl-3 pr-1.5 text-xs font-medium text-white">
                      {city}
                      <button
                        onClick={() => toggleLocation(city)}
                        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/20"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  placeholder="Search cities…"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="h-9 w-full rounded-btn border border-line bg-paper pl-9 pr-3 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div className="max-h-48 overflow-y-auto rounded-btn border border-line">
                {filtered.map((city) => {
                  const selected = locations.includes(city)
                  return (
                    <button
                      key={city}
                      onClick={() => toggleLocation(city)}
                      className={cn(
                        'flex w-full items-center gap-2 border-b border-line px-3 py-2 text-sm last:border-0 hover:bg-paper',
                        selected ? 'bg-paper font-semibold text-ink' : 'text-muted',
                      )}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {selected && <Check className="h-3.5 w-3.5 text-match" />}
                      </span>
                      {city}
                    </button>
                  )
                })}
              </div>
            </Field>

          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <button onClick={onClose} className="text-sm font-medium text-muted hover:text-ink">Cancel</button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { toast('Details saved'); onClose() }}>
              Save Details
            </Button>
            <Button onClick={() => { toast('Saved — continue to roles'); onClose() }}>
              Save &amp; Continue to Roles →
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Compensation modal ─────────────────────────────────────────────────────────

function CompensationModal({
  roleName,
  data,
  onClose,
  onSave,
}: {
  roleName: string
  data?: CompensationData
  onClose: () => void
  onSave: (data: CompensationData, applyAll: boolean) => void
}) {
  const anim = typeof document === 'undefined' || document.visibilityState === 'visible'
  const [form, setForm] = useState<CompensationData>(
    data ?? {
      isPaid: true,
      knowBudget: 'yes',
      rateType: 'Flat Rate',
      currency: 'U.S. Dollar (USD)',
      amount: '500',
      isRange: false,
      hours: '10',
    },
  )

  const currencySymbol = form.currency.startsWith('Euro') ? '€' : form.currency.startsWith('British') ? '£' : '$'
  const rateLabel = form.rateType === 'Flat Rate' ? 'flat rate' : form.rateType.toLowerCase()
  const summaryRate = form.amount ? `${currencySymbol}${form.amount} ${rateLabel}` : '—'
  const summaryTotal = form.amount && form.hours
    ? `${currencySymbol}${form.amount} for an estimated ${form.hours} hour${form.hours !== '1' ? 's' : ''} of work`
    : ''

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      initial={anim ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={anim ? { opacity: 0, y: 40 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-card bg-card shadow-card-hover sm:rounded-card"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <span className="tech-label">Configure compensation for:</span>
            <h3 className="mt-0.5 font-bold text-ink">{roleName}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-5">

            {/* Is paid */}
            <Field label="Is this role paid?">
              <div className="flex gap-6">
                {['Yes', 'No'].map((opt) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="radio"
                      checked={(form.isPaid && opt === 'Yes') || (!form.isPaid && opt === 'No')}
                      onChange={() => setForm((p) => ({ ...p, isPaid: opt === 'Yes' }))}
                      className="accent-link h-4 w-4"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>

            {form.isPaid && (
              <>
                {/* Know budget */}
                <Field label="Do you know your budget for paying talent?">
                  <div className="flex flex-col gap-2">
                    {([['yes', 'Yes'], ['depends', 'Depends on project outcome'], ['not-sure', 'Not Sure']] as const).map(([val, label]) => (
                      <label key={val} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                        <input
                          type="radio"
                          checked={form.knowBudget === val}
                          onChange={() => setForm((p) => ({ ...p, knowBudget: val }))}
                          className="accent-link h-4 w-4"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </Field>

                {form.knowBudget === 'yes' && (
                  <>
                    {/* Rate type + currency */}
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Rate Type">
                        <select
                          value={form.rateType}
                          onChange={(e) => setForm((p) => ({ ...p, rateType: e.target.value }))}
                          className="rounded-btn border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                        >
                          {RATE_TYPES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </Field>
                      <Field label="Currency">
                        <select
                          value={form.currency}
                          onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                          className="rounded-btn border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                        >
                          {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </Field>
                    </div>

                    {/* Amount + range */}
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Amount">
                        <div className="flex items-center gap-1 rounded-btn border border-line bg-paper px-3 py-2">
                          <span className="text-sm text-muted">{currencySymbol}</span>
                          <input
                            type="number"
                            value={form.amount}
                            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                            placeholder="0"
                            className="w-full bg-transparent text-sm text-ink focus:outline-none"
                          />
                        </div>
                      </Field>
                      <Field label="Pay Range">
                        <label className="flex cursor-pointer items-center gap-2 pt-2 text-sm text-muted">
                          <input
                            type="checkbox"
                            checked={form.isRange}
                            onChange={(e) => setForm((p) => ({ ...p, isRange: e.target.checked }))}
                            className="accent-link h-4 w-4"
                          />
                          Pay rate will be a range
                        </label>
                      </Field>
                    </div>

                    {/* Expected hours */}
                    <Field label="Expected hours">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={form.hours}
                          onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value }))}
                          placeholder="0"
                          className="w-24 rounded-btn border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                        />
                        <span className="text-sm text-muted">Hours</span>
                      </div>
                    </Field>

                    {/* Summary */}
                    <div className="rounded-btn bg-paper p-3 text-xs ring-1 ring-line">
                      <p className="text-muted">
                        <span className="font-semibold text-ink">Rate: </span>{summaryRate}
                      </p>
                      {summaryTotal && (
                        <p className="mt-0.5 text-muted">
                          <span className="font-semibold text-ink">Total Pay: </span>{summaryTotal}
                        </p>
                      )}
                      <p className="mt-1 italic text-muted/70">
                        This is automatically calculated by the fields above: rate type, amount, and expected time.
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <button onClick={onClose} className="text-sm font-medium text-muted hover:text-ink">Cancel</button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onSave(form, true)}>
              Save &amp; Apply to All Roles
            </Button>
            <Button icon={<Check className="h-4 w-4" />} onClick={() => onSave(form, false)}>
              Save Compensation
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Role edit constants ────────────────────────────────────────────────────────

const LANGUAGES = ['French', 'English', 'Spanish', 'Italian', 'German', 'Arabic', 'Mandarin']
const ETHNICITIES = ['Any', 'White / Caucasian', 'Black / African', 'Hispanic / Latino', 'Asian', 'MENA', 'Mixed / Multiracial']
const EXPERIENCE_LEVELS = ['Emerging', 'Mid-career', 'Established', 'Star']
const GENDERS = ['Any', 'F', 'M', 'Non-binary']
const TYPES = ['Lead', 'Supporting'] as const

const ROLE_SKILLS = ['Acting', 'Singing', 'Dancing', 'Stunts', 'Martial Arts', 'Horseback Riding', 'Dialects', 'Sign Language', 'Improv', 'Stand-up Comedy', 'Motion Capture', 'Voice Acting', 'Stage Combat', 'Swimming', 'Gymnastics', 'Sword Fighting']
const NUDITY_OPTIONS = ['No', 'Implied', 'Partial', 'Full']

const PROJECT_TYPE_CATS = [
  { id: 'theater',  label: 'Theater',                         icon: '🎭', sub: [] },
  { id: 'film',     label: 'Film',                            icon: '🎬', sub: ['Feature Film', 'Short Film', 'Documentary'] },
  { id: 'tv',       label: 'TV / Series',                     icon: '📺', sub: ['Scripted Show', 'Reality TV', 'Documentary Series', 'Vertical Series'] },
  { id: 'branded',  label: 'Branded Content / Commercial',    icon: '©️',  sub: ['Commercial', 'Branded Series', 'Campaign'] },
  { id: 'ugc',      label: 'User Generated Content (UGC)',    icon: '👤', sub: [] },
  { id: 'digital',  label: 'Other Digital Media',             icon: '📱', sub: ['Music Video', 'Podcast', 'Web Series'] },
  { id: 'more',     label: 'More Projects',                   icon: '···', sub: ['Student Film', 'Video Game', 'Voiceover', 'Immersive / XR'] },
]
const GENRES = ['Action', 'Animation', 'Comedy', 'Crime', 'Dark Comedy', 'Drama', 'Family / Kids', 'Fantasy', 'Horror', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Western', 'Documentary']
const WORLD_CITIES = [
  'Amsterdam', 'Atlanta', 'Barcelona', 'Beijing', 'Berlin', 'Buenos Aires',
  'Chicago', 'Dubai', 'Dublin', 'Hong Kong', 'Istanbul', 'Lagos',
  'Las Vegas', 'Lima', 'London', 'Los Angeles', 'Madrid', 'Melbourne',
  'Mexico City', 'Miami', 'Milan', 'Montreal', 'Mumbai', 'New York',
  'Paris', 'Prague', 'Rome', 'San Francisco', 'São Paulo', 'Seoul',
  'Shanghai', 'Singapore', 'Stockholm', 'Sydney', 'Tokyo', 'Toronto',
  'Vienna', 'Warsaw', 'Zurich',
]
const RATE_TYPES = ['Flat Rate', 'Hourly', 'Daily', 'Weekly', 'Deferred']
const CURRENCIES = ['U.S. Dollar (USD)', 'Euro (EUR)', 'British Pound (GBP)', 'Australian Dollar (AUD)', 'Canadian Dollar (CAD)']

function SkillsField({
  form,
  setForm,
}: {
  form: ExtractedRole
  setForm: React.Dispatch<React.SetStateAction<ExtractedRole>>
}) {
  const [open, setOpen] = useState(false)
  const skills = form.skills ?? []
  const remaining = ROLE_SKILLS.filter((s) => !skills.includes(s))

  const add = (s: string) => {
    setForm((p) => ({ ...p, skills: [...(p.skills ?? []), s] }))
    setOpen(false)
  }
  const remove = (s: string) => setForm((p) => ({ ...p, skills: (p.skills ?? []).filter((x) => x !== s) }))

  return (
    <Field label="Skills">
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span key={s} className="flex items-center gap-1 rounded-full bg-link/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-link ring-1 ring-link/20">
            {s}
            <button onClick={() => remove(s)} className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-link/20">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded-full border border-dashed border-link/40 px-3 py-1 text-xs font-semibold text-link hover:border-link hover:bg-link/5"
          >
            <Plus className="h-3 w-3" />
            Add skill
          </button>
          {open && remaining.length > 0 && (
            <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-48 overflow-y-auto rounded-btn border border-line bg-card shadow-card-hover">
              {remaining.map((s) => (
                <button
                  key={s}
                  onClick={() => add(s)}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-paper"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Field>
  )
}

function RoleEditModal({
  role,
  onClose,
  onSave,
}: {
  role: ExtractedRole
  onClose: () => void
  onSave: (r: ExtractedRole) => void
}) {
  const [form, setForm] = useState<ExtractedRole>({ ...role })

  const toggleLanguage = (lang: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages?.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...(prev.languages ?? []), lang],
    }))
  }

  const anim = typeof document === 'undefined' || document.visibilityState === 'visible'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      initial={anim ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    >
      <motion.div
        initial={anim ? { opacity: 0, y: 40 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-t-card bg-card shadow-card-hover sm:rounded-card"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <span className="tech-label">Modify role</span>
            <h3 className="mt-0.5 font-bold text-ink">{role.name}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-5">
            <Field label="Role name">
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-btn border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </Field>

            <Field label="Type">
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((p) => ({ ...p, type: t }))}
                    className={cn(
                      'flex-1 rounded-btn border py-2 text-sm font-semibold transition-colors',
                      form.type === t ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:border-ink/40',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Gender">
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setForm((p) => ({ ...p, gender: g }))}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                      form.gender === g ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:border-ink/40',
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Age range">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={form.age.split('–')[0] ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, age: `${e.target.value}–${p.age.split('–')[1] ?? ''}` }))}
                  placeholder="Min"
                  className="w-20 rounded-btn border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
                <span className="text-muted">–</span>
                <input
                  type="number"
                  value={form.age.split('–')[1] ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, age: `${p.age.split('–')[0] ?? ''}–${e.target.value}` }))}
                  placeholder="Max"
                  className="w-20 rounded-btn border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
                <span className="text-xs text-muted">years old</span>
              </div>
            </Field>

            <Field label="Languages">
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => {
                  const active = form.languages?.includes(l)
                  return (
                    <button
                      key={l}
                      onClick={() => toggleLanguage(l)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                        active ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:border-ink/40',
                      )}
                    >
                      {l}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Height range">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={form.heightRange?.split('–')[0]?.replace(/\D/g, '') ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, heightRange: `${e.target.value}–${p.heightRange?.split('–')[1] ?? '190 cm'}` }))
                  }
                  placeholder="Min"
                  className="w-20 rounded-btn border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
                <span className="text-muted">–</span>
                <input
                  type="number"
                  value={form.heightRange?.split('–')[1]?.replace(/\D/g, '') ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, heightRange: `${p.heightRange?.split('–')[0]?.replace(/\D/g, '') ?? '155'}–${e.target.value} cm` }))
                  }
                  placeholder="Max"
                  className="w-20 rounded-btn border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
                <span className="text-xs text-muted">cm</span>
              </div>
            </Field>

            <Field label="Ethnicity">
              <div className="flex flex-wrap gap-2">
                {ETHNICITIES.map((eth) => (
                  <button
                    key={eth}
                    onClick={() => setForm((p) => ({ ...p, ethnicity: eth }))}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                      form.ethnicity === eth ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:border-ink/40',
                    )}
                  >
                    {eth}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Experience level">
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setForm((p) => ({ ...p, experienceLevel: lvl }))}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                      form.experienceLevel === lvl ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:border-ink/40',
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Character description">
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className="w-full resize-none rounded-btn border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </Field>

            {/* Skills */}
            <SkillsField form={form} setForm={setForm} />

            {/* Nudity */}
            <Field label="Does this role require nudity?">
              <div className="flex flex-wrap gap-2">
                {NUDITY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setForm((p) => ({ ...p, nudity: opt }))}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                      form.nudity === opt ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-muted hover:border-ink/40',
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <button onClick={onClose} className="text-sm font-medium text-muted hover:text-ink">Cancel</button>
          <Button icon={<Check className="h-4 w-4" />} onClick={() => onSave(form)}>Save role</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="tech-label">{label}</span>
      {children}
    </div>
  )
}
