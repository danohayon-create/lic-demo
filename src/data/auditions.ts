import type { Audition, SparkPoint } from './types'

/** Maya's auditions (talent side). */
export const auditions: Audition[] = [
  {
    id: 'aud-evermore',
    talentId: 'maya-reyes',
    projectId: 'evermore',
    projectTitle: 'Evermore',
    roleName: 'Fanny Brice',
    info: 'Sent 3d ago',
    status: 'Under review',
  },
  {
    id: 'aud-rive-droite',
    talentId: 'maya-reyes',
    projectId: 'rive-droite',
    projectTitle: 'Rive Droite',
    roleName: 'Léa',
    info: 'Shortlisted yesterday',
    status: 'Shortlisted',
  },
  {
    id: 'aud-echo-park',
    talentId: 'maya-reyes',
    projectId: 'echo-park',
    projectTitle: 'Echo Park',
    roleName: 'The Drifter',
    info: 'Sent 1h ago',
    status: 'Just sent',
  },
  {
    id: 'aud-la-nuit-vive',
    talentId: 'maya-reyes',
    projectId: 'la-nuit-vive',
    projectTitle: 'La Nuit Vive',
    roleName: 'Marco',
    info: 'Self-tape due in 2d',
    status: 'To self-tape',
  },
]

/** Aggregate insights shown on the talent auditions screen. */
export const auditionInsights = {
  activeCount: 4,
  needsAttention: 1,
  subtitle: '4 active · 1 needs your attention',
  playsTrend: 'Last 14 days +12 plays (+38%)',
  playsDelta: '+12 plays',
  playsPercent: '+38%',
  smartNudge: '3 new roles match your performance profile. Tap to see.',
}

/** "Last 14 days" plays sparkline. */
export const playsSparkline: SparkPoint[] = [
  { i: 1, plays: 3 },
  { i: 2, plays: 5 },
  { i: 3, plays: 4 },
  { i: 4, plays: 7 },
  { i: 5, plays: 6 },
  { i: 6, plays: 9 },
  { i: 7, plays: 8 },
  { i: 8, plays: 11 },
  { i: 9, plays: 10 },
  { i: 10, plays: 13 },
  { i: 11, plays: 12 },
  { i: 12, plays: 15 },
  { i: 13, plays: 14 },
  { i: 14, plays: 18 },
]

export const auditionsById = Object.fromEntries(auditions.map((a) => [a.id, a]))
