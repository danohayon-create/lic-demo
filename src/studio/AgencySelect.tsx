import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Building2, Check, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, Button, Tag } from '@/components/ui'
import { projectsById, rolesByProject } from '@/data'
import { cn } from '@/lib/cn'

const FAKE_AGENCIES = [
  { id: 'babel',      name: 'Babel Casting',                city: 'Paris',     speciality: 'Film & Télévision',      talents: 234 },
  { id: 'artistique', name: 'Agence Artistique de Paris',   city: 'Paris',     speciality: 'Cinéma & Publicité',     talents: 189 },
  { id: 'cmg',        name: 'CMG Artists',                  city: 'Lyon',      speciality: 'Théâtre & Cinéma',       talents: 142 },
  { id: 'tmg',        name: 'Talent Management Group',       city: 'Paris',     speciality: 'Film & Streaming',       talents: 317 },
  { id: 'ateliers',   name: 'Les Ateliers du Comédien',     city: 'Marseille', speciality: 'Cinéma indépendant',     talents: 98  },
  { id: 'francaise',  name: "L'Agence Française",           city: 'Bordeaux',  speciality: 'Film & Documentaire',    talents: 77  },
]

export function AgencySelect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('p') || 'les-ombres-de-midi'
  const roleId    = searchParams.get('role') || ''

  const project = projectsById[projectId] ?? projectsById['les-ombres-de-midi']
  const roles    = rolesByProject(project.id)
  const role     = roles.find(r => r.id === roleId) ?? roles[0]

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const proceed = () => {
    const agencyParam = encodeURIComponent([...selected].join(','))
    navigate(`/studio/casting-search?p=${project.id}&role=${roleId}&agency=${agencyParam}`)
  }

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
        <div>
          <span className="tech-label">In House · {project.title}</span>
          <h1 className="text-xl font-bold tracking-tight text-ink">Select casting agency</h1>
        </div>
      </div>

      {/* Context card */}
      <Card className="flex items-center gap-4 bg-ink text-white">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-btn bg-white/10 text-2xl">
          <Building2 className="h-6 w-6 text-gold" />
        </span>
        <div>
          <p className="text-sm font-semibold">
            Role: <span className="text-gold">{role?.name}</span>
          </p>
          <p className="mt-0.5 text-xs text-white/60">
            In House casting — select one or more agencies whose talent roster will be invited to audition.
          </p>
        </div>
      </Card>

      {/* Agency list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="tech-label">Casting agencies</span>
          {selected.size > 0 && (
            <span className="text-xs font-medium text-link">{selected.size} selected</span>
          )}
        </div>

        {FAKE_AGENCIES.map((agency, i) => {
          const isSelected = selected.has(agency.id)
          return (
            <motion.button
              key={agency.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toggle(agency.id)}
              className={cn(
                'flex items-center gap-4 rounded-card border-2 p-4 text-left transition-all',
                isSelected
                  ? 'border-ink bg-card shadow-card'
                  : 'border-line bg-paper hover:border-ink/30',
              )}
            >
              {/* Check circle */}
              <span className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all',
                isSelected ? 'bg-match text-white' : 'bg-line',
              )}>
                {isSelected && <Check className="h-4 w-4" />}
              </span>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{agency.name}</span>
                  <Tag tone="neutral">{agency.city}</Tag>
                </div>
                <p className="mt-0.5 text-xs text-muted">{agency.speciality}</p>
              </div>

              {/* Talent count */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-ink">{agency.talents}</p>
                <p className="text-xs text-muted">talents</p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm font-medium text-muted hover:text-ink">
          ← Back
        </button>
        <Button
          disabled={selected.size === 0}
          icon={<ArrowRight className="h-4 w-4" />}
          onClick={proceed}
          className={cn(selected.size === 0 && 'opacity-40 cursor-not-allowed')}
        >
          Search talent from {selected.size > 0 ? `${selected.size} agenc${selected.size > 1 ? 'ies' : 'y'}` : 'selected agencies'}
        </Button>
      </div>
    </div>
  )
}
