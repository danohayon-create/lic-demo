import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckSquare, Lock, MapPin, Send, Square, X } from 'lucide-react'
import { Avatar, Button, Tag } from '@/components/ui'
import { EditModal, Field, TextArea, TextInput } from '@/components/EditModal'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import { projectsById, rolesByProject } from '@/data'
import {
  useRoleCandidates,
  moveCandidate,
  candidateScore,
  deriveTeamRatings,
  BOARD_COLUMNS,
  BOARD_COLUMN_LABELS,
  LOCKED_COLUMNS,
  type Candidate,
  type CandidateStatus,
} from '@/data/selection'

const SINGLE_OCCUPANT: CandidateStatus[] = ['offer', 'cast']

const COLUMN_TONE: Partial<Record<CandidateStatus, string>> = {
  new: 'bg-gray-200/70 ring-gray-400/30',
  'no-go': 'bg-red-50/60 ring-signal-no/15',
  offer: 'bg-green-50/70 ring-signal-good/20',
  cast: 'bg-yellow-50/70 ring-signal-maybe/25',
}

export function SelectionConsole() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('p') || 'les-ombres-de-midi'
  const roleId = searchParams.get('role') || ''

  const project = projectsById[projectId] ?? projectsById['les-ombres-de-midi']
  const roles = rolesByProject(project.id)
  const role = roles.find((r) => r.id === roleId) ?? roles[0]

  const candidates = useRoleCandidates(role.id)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<CandidateStatus | null>(null)

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [messageModalOpen, setMessageModalOpen] = useState(false)

  const handleDrop = (status: CandidateStatus) => {
    setOverColumn(null)
    if (!draggedId) return
    const result = moveCandidate(draggedId, status)
    if (!result.ok) toast(result.reason ?? "Couldn't move candidate")
    setDraggedId(null)
  }

  const toggleSelectMode = () => {
    setSelectMode((v) => !v)
    setSelectedIds(new Set())
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const selectedCandidates = candidates.filter((c) => selectedIds.has(c.id))

  const bulkMoveTo = (status: CandidateStatus) => {
    let failures = 0
    selectedIds.forEach((id) => {
      const r = moveCandidate(id, status)
      if (!r.ok) failures += 1
    })
    const moved = selectedIds.size - failures
    toast(
      failures > 0
        ? `${moved} moved to ${BOARD_COLUMN_LABELS[status]} · ${failures} couldn't move`
        : `${moved} candidate${moved === 1 ? '' : 's'} moved to ${BOARD_COLUMN_LABELS[status]}`,
    )
    setStatusModalOpen(false)
    clearSelection()
  }

  return (
    <div className="flex flex-col gap-5 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/studio/dashboard?p=${project.id}`)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-ink/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="tech-label">{project.title} · Selection console</span>
            <h1 className="text-xl font-bold tracking-tight text-ink">{role?.name}</h1>
          </div>
        </div>

        <Button
          variant={selectMode ? 'primary' : 'secondary'}
          size="sm"
          icon={selectMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          onClick={toggleSelectMode}
        >
          {selectMode ? 'Done selecting' : 'Select multiple'}
        </Button>
      </div>

      <p className="text-sm text-muted">
        {selectMode
          ? 'Click cards to select them, then change their status or message them in bulk.'
          : 'Drag a candidate card between columns to move them through the pipeline. New submissions must be reviewed before they can move. Offer and Cast each hold one profile.'}
      </p>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {BOARD_COLUMNS.map((col) => {
          const colCandidates = candidates.filter((c) => c.status === col)
          const capped = SINGLE_OCCUPANT.includes(col)
          const isOver = overColumn === col
          const locked = LOCKED_COLUMNS.has(col)
          return (
            <div
              key={col}
              onDragOver={locked ? undefined : (e) => { e.preventDefault(); setOverColumn(col) }}
              onDragLeave={locked ? undefined : () => setOverColumn((c) => (c === col ? null : c))}
              onDrop={locked ? undefined : () => handleDrop(col)}
              className={cn(
                'flex w-[230px] shrink-0 flex-col gap-2 rounded-card p-2 ring-1 transition-colors',
                isOver ? 'bg-link/5 ring-link/30' : COLUMN_TONE[col] ?? 'bg-paper ring-line',
              )}
            >
              <div className="flex items-center justify-between px-1.5 py-1">
                <span
                  className={cn(
                    'flex items-center gap-1 text-[11px] font-bold uppercase tracking-label',
                    col === 'no-go' ? 'text-signal-no' : 'text-muted',
                  )}
                >
                  {locked && <Lock className="h-3 w-3" />}
                  {BOARD_COLUMN_LABELS[col]}
                </span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    col === 'no-go' ? 'bg-signal-no/15 text-signal-no' : 'bg-ink/10 text-ink',
                  )}
                >
                  {colCandidates.length}{capped ? '/1' : ''}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {colCandidates.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    dragging={draggedId === c.id}
                    draggable={!locked && !selectMode}
                    onDragStart={() => setDraggedId(c.id)}
                    onDragEnd={() => setDraggedId(null)}
                    onOpenReview={() => navigate(`/studio/review?p=${projectId}&role=${role.id}&candidate=${c.id}`)}
                    selectMode={selectMode}
                    selected={selectedIds.has(c.id)}
                    onToggleSelect={() => toggleSelected(c.id)}
                  />
                ))}
                {colCandidates.length === 0 && (
                  <div className="rounded-btn border border-dashed border-line py-8 text-center text-[11px] text-muted">
                    {locked ? 'No new submissions' : 'Drop here'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bulk action bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center px-4 pb-5">
          <div className="flex items-center gap-3 rounded-card bg-ink px-4 py-3 text-white shadow-card-hover">
            <span className="text-sm font-semibold">
              {selectedIds.size} candidate{selectedIds.size === 1 ? '' : 's'} selected
            </span>
            <button onClick={clearSelection} className="text-xs font-medium text-white/70 hover:text-white">
              Deselect all
            </button>
            <span className="h-5 w-px bg-white/20" />
            <Button size="sm" variant="secondary" onClick={() => setStatusModalOpen(true)}>
              Change status
            </Button>
            <Button size="sm" icon={<Send className="h-3.5 w-3.5" />} onClick={() => setMessageModalOpen(true)}>
              Send a message
            </Button>
          </div>
        </div>
      )}

      {/* Change status modal */}
      <EditModal open={statusModalOpen} title="Change status" onClose={() => setStatusModalOpen(false)}>
        <p className="text-sm text-muted">
          Move {selectedIds.size} candidate{selectedIds.size === 1 ? '' : 's'} to:
        </p>
        <div className="flex flex-col gap-1.5">
          {BOARD_COLUMNS.filter((c) => c !== 'new').map((col) => (
            <button
              key={col}
              onClick={() => bulkMoveTo(col)}
              className="flex items-center justify-between rounded-btn border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-paper"
            >
              {BOARD_COLUMN_LABELS[col]}
              {SINGLE_OCCUPANT.includes(col) && <span className="text-xs text-muted">single occupant</span>}
            </button>
          ))}
        </div>
      </EditModal>

      {/* Send a message modal */}
      <SendMessageModal
        open={messageModalOpen}
        candidates={selectedCandidates}
        onRemove={toggleSelected}
        onClose={() => setMessageModalOpen(false)}
        onSend={(n) => {
          toast(`Message sent to ${n} candidate${n === 1 ? '' : 's'}`)
          setMessageModalOpen(false)
          clearSelection()
        }}
      />
    </div>
  )
}

function SendMessageModal({
  open,
  candidates,
  onRemove,
  onClose,
  onSend,
}: {
  open: boolean
  candidates: Candidate[]
  onRemove: (id: string) => void
  onClose: () => void
  onSend: (count: number) => void
}) {
  const [subject, setSubject] = useState('[firstname], candidature bien reçue pour [job_name]')
  const [body, setBody] = useState(
    'Bonjour [firstname],\n\nNous avons bien reçu votre candidature pour le poste de "[job_name]", nous l\'étudions avec attention et revenons vers vous dans les plus brefs délais.\n\nÀ très bientôt,\nL\'équipe [company_name]',
  )

  return (
    <EditModal
      open={open}
      title="Send a message"
      onClose={onClose}
      onSave={() => onSend(candidates.length)}
      saveLabel="Send"
    >
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-label text-muted">
          {candidates.length} candidate{candidates.length === 1 ? '' : 's'} concerned
        </p>
        <div className="flex flex-wrap gap-1.5">
          {candidates.map((c) => (
            <Tag key={c.id} className="gap-1.5">
              {c.name}
              <button onClick={() => onRemove(c.id)} className="text-muted/60 hover:text-signal-no">
                <X className="h-3 w-3" />
              </button>
            </Tag>
          ))}
          {candidates.length === 0 && <span className="text-sm text-muted">No candidates selected.</span>}
        </div>
      </div>

      <Field label="Subject">
        <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="Message">
        <TextArea rows={7} value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-label text-muted">Variables</p>
        <div className="flex flex-wrap gap-1.5">
          {['company_name', 'firstname', 'lastname', 'job_name', 'recruiter_name'].map((v) => (
            <Tag key={v} tone="neutral" className="font-mono text-[11px]">
              [{v}]
            </Tag>
          ))}
        </div>
      </div>
    </EditModal>
  )
}

function CandidateCard({
  candidate,
  dragging,
  draggable,
  onDragStart,
  onDragEnd,
  onOpenReview,
  selectMode,
  selected,
  onToggleSelect,
}: {
  candidate: Candidate
  dragging: boolean
  draggable: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onOpenReview: () => void
  selectMode: boolean
  selected: boolean
  onToggleSelect: () => void
}) {
  const score = candidateScore(candidate)
  const reviewed = candidate.good + candidate.maybe + candidate.no > 0
  const scoreColor = score >= 75 ? 'text-signal-good' : score >= 50 ? 'text-[#8A6D00]' : 'text-signal-no'
  const teamRatings = deriveTeamRatings(candidate)
  const visibleRatings = teamRatings.slice(0, 3)
  const overflow = teamRatings.length - visibleRatings.length

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={selectMode ? onToggleSelect : undefined}
      onDoubleClick={selectMode ? undefined : onOpenReview}
      title={selectMode ? 'Click to select' : 'Double-click to watch the review'}
      className={cn(
        'relative flex flex-col gap-2 rounded-card border bg-card p-3 shadow-card transition-opacity',
        draggable ? 'cursor-grab active:cursor-grabbing' : selectMode ? 'cursor-pointer' : 'cursor-default',
        dragging && 'opacity-40',
        selected ? 'border-link ring-2 ring-link/30' : 'border-line',
      )}
    >
      {selectMode && (
        <span
          className={cn(
            'absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-card',
            selected ? 'border-link bg-link text-white' : 'border-line text-transparent',
          )}
        >
          <CheckSquare className="h-3 w-3" />
        </span>
      )}

      <div className="flex items-center gap-2">
        <Avatar src={candidate.avatar} name={candidate.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{candidate.name}</p>
          <p className="text-[11px] text-muted">{candidate.age} y/o</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-2">
        <span className="flex items-center gap-1 text-[11px] text-muted">
          <MapPin className="h-3 w-3" />
          {candidate.city}
        </span>
        {reviewed ? (
          <span className={cn('text-sm font-bold', scoreColor)}>{score}</span>
        ) : (
          <span className="text-[11px] font-semibold text-muted">Not reviewed</span>
        )}
      </div>

      {visibleRatings.length > 0 && (
        <div className="absolute -bottom-2 -right-1.5 flex items-center">
          {visibleRatings.map((r, i) => (
            <span
              key={`${r.initials}-${i}`}
              style={{ marginLeft: i === 0 ? 0 : -6, zIndex: i }}
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border-2 border-card text-[8px] font-bold text-white',
                r.signal === 'good' && 'bg-signal-good',
                r.signal === 'maybe' && 'bg-signal-maybe',
                r.signal === 'no' && 'bg-signal-no',
              )}
              title="Collective review"
            >
              {r.initials}
            </span>
          ))}
          {overflow > 0 && (
            <span
              style={{ marginLeft: -6 }}
              className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-ink text-[8px] font-bold text-white"
            >
              +{overflow}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
