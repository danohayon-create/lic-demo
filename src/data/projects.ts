import type { ActivityItem, DiscoverCasting, Project, Role, SubmissionPoint } from './types'

export const projects: Project[] = [
  {
    id: 'evermore',
    title: 'Evermore',
    type: 'Series',
    company: 'A24',
    genre: 'Drama',
    submissions: 390,
    active: true,
    location: 'Los Angeles',
    castingCloses: 'Sep 14',
    shooting: 'Oct–Dec 2026',
    poster: '/posters/evermore.png',
    kpis: {
      roles: { total: 12, lead: 4, supporting: 8 },
      submissions: { total: 390, today: 47 },
      shortlist: { total: 28, readyForCallback: 7 },
      callbacks: { total: 4, next: 'Sep 18' },
      booked: 1,
    },
    roleIds: ['fanny-brice', 'jake-holloway', 'margaret', 'lieutenant-sam', 'young-fanny'],
  },
  {
    id: 'rive-droite',
    title: 'Rive Droite',
    type: 'Indie film',
    company: 'Pathé',
    genre: 'Thriller',
    location: 'Paris',
    castingCloses: 'Oct 08',
    shooting: 'Nov–Dec 2026',
    poster: '/posters/rive-droite.png',
    submissions: 142,
    kpis: {
      roles: { total: 8, lead: 2, supporting: 6 },
      submissions: { total: 142, today: 23 },
      shortlist: { total: 14, readyForCallback: 3 },
      callbacks: { total: 2, next: 'Oct 12' },
      booked: 0,
    },
    roleIds: ['lea', 'thomas', 'la-voisine', 'linspecteur'],
  },
  {
    id: 'echo-park',
    title: 'Echo Park',
    type: 'Music video',
    company: 'WMG',
    genre: 'Drama',
    location: 'Los Angeles',
    castingCloses: 'Jul 30',
    shooting: 'Aug 2026',
    poster: '/posters/echo-park.png',
    submissions: 88,
    kpis: {
      roles: { total: 4, lead: 1, supporting: 3 },
      submissions: { total: 88, today: 8 },
      shortlist: { total: 9, readyForCallback: 2 },
      callbacks: { total: 1, next: 'Aug 05' },
      booked: 0,
    },
    roleIds: ['the-drifter', 'the-ghost', 'the-stranger', 'the-witness'],
  },
  {
    id: 'les-ombres-de-midi',
    title: 'Les Ombres de Midi',
    type: 'Film',
    company: 'Studio 13 Productions',
    genre: 'Psychological thriller',
    location: 'Marseille, France',
    castingCloses: 'Nov 15',
    shooting: 'Jan–Mar 2027',
    poster: '/posters/les-ombres-de-midi.png',
    submissions: 12,
    kpis: {
      roles: { total: 4, lead: 1, supporting: 3 },
      submissions: { total: 12, today: 12 },
      shortlist: { total: 0, readyForCallback: 0 },
      callbacks: { total: 0, next: '—' },
      booked: 0,
    },
    roleIds: ['chloe-marchand', 'agnes-marchand-film', 'remy-jourdain', 'la-temoin-film'],
  },
  {
    id: 'la-nuit-vive',
    title: 'La Nuit Vive',
    type: 'Film',
    company: 'Indie',
    subtitle: 'Marco',
    poster: '/posters/la-nuit-vive.png',
    submissions: 64,
    roleIds: [],
  },
]

export const roles: Role[] = [
  // ── Evermore ──────────────────────────────────────────────────────────────
  {
    id: 'fanny-brice',
    projectId: 'evermore',
    name: 'Fanny Brice',
    type: 'Lead',
    submissions: 132,
    shortlist: 9,
    status: 'Reviewing',
    deadline: 'Sep 14',
    deadlineCountdown: '3d 04h',
    pay: '$1,200/day',
    location: 'Los Angeles',
    auditionFlow: 'Open Call',
    castingNotes:
      "Fanny is 27, sharp, electric, the kind of voice that hijacks a room. We're looking for someone who can play vulnerable and ruthless in the same breath. Read the bar scene as if you're about to lose everything — and you know it.",
    sidesId: 'sides-fanny-brice',
  },
  {
    id: 'jake-holloway',
    projectId: 'evermore',
    name: 'Jake Holloway',
    type: 'Lead',
    submissions: 98,
    shortlist: 6,
    status: 'Callbacks',
    deadline: 'Sep 16',
  },
  {
    id: 'margaret',
    projectId: 'evermore',
    name: 'Margaret',
    type: 'Supporting',
    submissions: 67,
    shortlist: 5,
    status: 'Reviewing',
    deadline: 'Sep 22',
  },
  {
    id: 'lieutenant-sam',
    projectId: 'evermore',
    name: 'Lieutenant Sam',
    type: 'Supporting',
    submissions: 54,
    shortlist: 4,
    status: 'Open',
    deadline: 'Oct 02',
  },
  {
    id: 'young-fanny',
    projectId: 'evermore',
    name: 'Young Fanny',
    type: 'Supporting',
    submissions: 39,
    shortlist: 4,
    status: 'Open',
    deadline: 'Oct 02',
  },

  // ── Rive Droite ───────────────────────────────────────────────────────────
  {
    id: 'lea',
    projectId: 'rive-droite',
    name: 'Léa',
    type: 'Lead',
    submissions: 73,
    shortlist: 6,
    status: 'Reviewing',
    deadline: 'Oct 08',
    deadlineCountdown: '5d 11h',
    pay: '€800/day',
    location: 'Paris',
    auditionFlow: 'Open Call',
    castingNotes:
      "Léa est une avocate de 32 ans, brillante et contrôlée, dont la façade lisse commence à se fissurer quand une affaire réveille un trauma d'enfance. On cherche quelqu'un qui sait exister dans le silence. Pas de surjeu — la retenue EST le jeu.",
  },
  {
    id: 'thomas',
    projectId: 'rive-droite',
    name: 'Thomas',
    type: 'Lead',
    submissions: 54,
    shortlist: 4,
    status: 'Reviewing',
    deadline: 'Oct 08',
    pay: '€800/day',
    location: 'Paris',
    auditionFlow: 'Invited',
  },
  {
    id: 'la-voisine',
    projectId: 'rive-droite',
    name: 'La Voisine',
    type: 'Supporting',
    submissions: 9,
    shortlist: 2,
    status: 'Open',
    deadline: 'Oct 22',
  },
  {
    id: 'linspecteur',
    projectId: 'rive-droite',
    name: "L'Inspecteur",
    type: 'Supporting',
    submissions: 6,
    shortlist: 1,
    status: 'Open',
    deadline: 'Oct 28',
  },

  // ── Les Ombres de Midi ────────────────────────────────────────────────────
  {
    id: 'chloe-marchand',
    projectId: 'les-ombres-de-midi',
    name: 'Inspectrice Chloé Marchand',
    type: 'Lead',
    submissions: 8,
    shortlist: 0,
    status: 'Reviewing',
    deadline: 'Nov 15',
    deadlineCountdown: '42d 0h',
    pay: '€950/day',
    location: 'Marseille',
    auditionFlow: 'Open Call',
    castingNotes:
      "Cold, methodical, and driven by a trauma she has never processed. Her rigour is both her greatest asset and the wall that keeps everyone at arm's length.",
  },
  {
    id: 'agnes-marchand-film',
    projectId: 'les-ombres-de-midi',
    name: 'Agnès Marchand',
    type: 'Supporting',
    submissions: 2,
    shortlist: 0,
    status: 'Open',
    deadline: 'Nov 22',
  },
  {
    id: 'remy-jourdain',
    projectId: 'les-ombres-de-midi',
    name: 'Capitaine Rémy Jourdain',
    type: 'Supporting',
    submissions: 2,
    shortlist: 0,
    status: 'Open',
    deadline: 'Nov 22',
  },
  {
    id: 'la-temoin-film',
    projectId: 'les-ombres-de-midi',
    name: 'La Témoin',
    type: 'Supporting',
    submissions: 0,
    shortlist: 0,
    status: 'Open',
    deadline: 'Nov 29',
  },

  // ── Echo Park ─────────────────────────────────────────────────────────────
  {
    id: 'the-drifter',
    projectId: 'echo-park',
    name: 'The Drifter',
    type: 'Lead',
    submissions: 56,
    shortlist: 5,
    status: 'Reviewing',
    deadline: 'Jul 30',
    deadlineCountdown: '8d 02h',
    pay: '$600/day',
    location: 'Los Angeles',
    auditionFlow: 'Open Call',
    castingNotes:
      "A lone figure passing through a city that no longer recognises them. We need a physical presence — someone whose body tells the story before they open their mouth. Movement background is a plus. Age 28–40, any gender.",
  },
  {
    id: 'the-ghost',
    projectId: 'echo-park',
    name: 'The Ghost',
    type: 'Supporting',
    submissions: 18,
    shortlist: 3,
    status: 'Callbacks',
    deadline: 'Aug 05',
  },
  {
    id: 'the-stranger',
    projectId: 'echo-park',
    name: 'The Stranger',
    type: 'Supporting',
    submissions: 14,
    shortlist: 1,
    status: 'Open',
    deadline: 'Aug 10',
  },
  {
    id: 'the-witness',
    projectId: 'echo-park',
    name: 'The Witness',
    type: 'Supporting',
    submissions: 0,
    shortlist: 0,
    status: 'Open',
    deadline: 'Aug 10',
  },
]

export const projectsById = Object.fromEntries(projects.map((p) => [p.id, p]))
export const rolesById = Object.fromEntries(roles.map((r) => [r.id, r]))

/** Roles belonging to a given project. */
export const rolesByProject = (projectId: string) => roles.filter((r) => r.projectId === projectId)

/** Role-brief video shown on the casting-detail screen (talent app). */
export const roleBriefVideo = '/media/selftape.mp4'

/** Casting calls shown on the talent discovery surface (/app). */
export const discoverCastings: DiscoverCasting[] = [
  {
    id: 'evermore',
    title: 'Evermore',
    roleName: 'Fanny Brice',
    kind: 'TV series',
    company: 'A24',
    location: 'Los Angeles',
    deadline: '3d 04h',
    match: 92,
    hasDetail: true,
  },
  {
    id: 'rive-droite',
    title: 'Rive Droite',
    roleName: 'Léa',
    kind: 'Indie film',
    company: 'Pathé',
    location: 'Paris',
    match: 87,
    hasDetail: true,
  },
  {
    id: 'echo-park',
    title: 'Echo Park',
    roleName: 'The Drifter',
    kind: 'Music video',
    company: 'WMG',
    location: 'Remote',
    match: 78,
    hasDetail: false,
  },
]

export const discoverCastingsById = Object.fromEntries(discoverCastings.map((c) => [c.id, c]))

// ── Per-project submission curves (last 14 days) ──────────────────────────────

const evermoreSubmissions: SubmissionPoint[] = [
  { day: 'D1', submissions: 6 },
  { day: 'D2', submissions: 11 },
  { day: 'D3', submissions: 9 },
  { day: 'D4', submissions: 17 },
  { day: 'D5', submissions: 14 },
  { day: 'D6', submissions: 22 },
  { day: 'D7', submissions: 19 },
  { day: 'D8', submissions: 28 },
  { day: 'D9', submissions: 24 },
  { day: 'D10', submissions: 33 },
  { day: 'D11', submissions: 31 },
  { day: 'D12', submissions: 38 },
  { day: 'D13', submissions: 41 },
  { day: 'D14', submissions: 47 },
]

/** @deprecated Use `submissionsOverTimeByProject['evermore']` */
export const submissionsOverTime = evermoreSubmissions

const riveDroiteSubmissions: SubmissionPoint[] = [
  { day: 'D1', submissions: 3 },
  { day: 'D2', submissions: 5 },
  { day: 'D3', submissions: 4 },
  { day: 'D4', submissions: 8 },
  { day: 'D5', submissions: 7 },
  { day: 'D6', submissions: 12 },
  { day: 'D7', submissions: 10 },
  { day: 'D8', submissions: 15 },
  { day: 'D9', submissions: 14 },
  { day: 'D10', submissions: 18 },
  { day: 'D11', submissions: 17 },
  { day: 'D12', submissions: 21 },
  { day: 'D13', submissions: 22 },
  { day: 'D14', submissions: 23 },
]

const echoParkSubmissions: SubmissionPoint[] = [
  { day: 'D1', submissions: 14 },
  { day: 'D2', submissions: 18 },
  { day: 'D3', submissions: 15 },
  { day: 'D4', submissions: 11 },
  { day: 'D5', submissions: 9 },
  { day: 'D6', submissions: 7 },
  { day: 'D7', submissions: 6 },
  { day: 'D8', submissions: 5 },
  { day: 'D9', submissions: 7 },
  { day: 'D10', submissions: 4 },
  { day: 'D11', submissions: 6 },
  { day: 'D12', submissions: 5 },
  { day: 'D13', submissions: 9 },
  { day: 'D14', submissions: 8 },
]

const lesOmbresDeMidiSubmissions: SubmissionPoint[] = [
  { day: 'D1', submissions: 0 },
  { day: 'D2', submissions: 0 },
  { day: 'D3', submissions: 0 },
  { day: 'D4', submissions: 0 },
  { day: 'D5', submissions: 0 },
  { day: 'D6', submissions: 0 },
  { day: 'D7', submissions: 0 },
  { day: 'D8', submissions: 0 },
  { day: 'D9', submissions: 0 },
  { day: 'D10', submissions: 0 },
  { day: 'D11', submissions: 0 },
  { day: 'D12', submissions: 0 },
  { day: 'D13', submissions: 1 },
  { day: 'D14', submissions: 12 },
]

export const submissionsOverTimeByProject: Record<string, SubmissionPoint[]> = {
  evermore: evermoreSubmissions,
  'rive-droite': riveDroiteSubmissions,
  'echo-park': echoParkSubmissions,
  'les-ombres-de-midi': lesOmbresDeMidiSubmissions,
}

// ── Per-project activity feeds ────────────────────────────────────────────────

const evermoreActivity: ActivityItem[] = [
  {
    id: 'act-1',
    actorInitials: 'ET',
    actorName: 'Eden Tov',
    action: 'rated',
    target: 'Maya Reyes',
    tag: 'Good match',
    signal: 'good',
    time: '2m ago',
  },
  {
    id: 'act-2',
    actorInitials: 'JC',
    actorName: 'Julie Cohen',
    action: 'shortlisted',
    target: 'Theo Vance',
    tag: 'Shortlist',
    time: '14m ago',
  },
  {
    id: 'act-3',
    actorInitials: 'LK',
    actorName: 'Lara Khan',
    action: 'left a note on',
    target: 'Sofia Bello',
    tag: 'Note',
    time: '1h ago',
  },
]

/** @deprecated Use `activityByProject['evermore']` */
export const activity = evermoreActivity

const riveDroiteActivity: ActivityItem[] = [
  {
    id: 'rd-act-1',
    actorInitials: 'LK',
    actorName: 'Lara Khan',
    action: 'rated',
    target: 'Camille Bonnet',
    tag: 'Good match',
    signal: 'good',
    time: '5m ago',
  },
  {
    id: 'rd-act-2',
    actorInitials: 'ET',
    actorName: 'Eden Tov',
    action: 'left a note on',
    target: 'Sébastien Noir',
    tag: 'Note',
    time: '32m ago',
  },
  {
    id: 'rd-act-3',
    actorInitials: 'JC',
    actorName: 'Julie Cohen',
    action: 'shortlisted',
    target: 'Marie Dupont',
    tag: 'Shortlist',
    time: '2h ago',
  },
]

const echoParkActivity: ActivityItem[] = [
  {
    id: 'ep-act-1',
    actorInitials: 'JC',
    actorName: 'Julie Cohen',
    action: 'rated',
    target: 'Alex Renaud',
    tag: 'Maybe',
    signal: 'maybe',
    time: '10m ago',
  },
  {
    id: 'ep-act-2',
    actorInitials: 'ET',
    actorName: 'Eden Tov',
    action: 'invited',
    target: 'Sam Torres',
    tag: 'Callback',
    time: '1h ago',
  },
  {
    id: 'ep-act-3',
    actorInitials: 'LK',
    actorName: 'Lara Khan',
    action: 'rated',
    target: 'Jordan Kim',
    tag: 'No go',
    signal: 'no',
    time: '3h ago',
  },
]

const lesOmbresDeMidiActivity: ActivityItem[] = [
  {
    id: 'lom-act-1',
    actorInitials: 'MF',
    actorName: 'Marie Fontaine',
    action: 'published',
    target: 'Les Ombres de Midi',
    tag: 'Published',
    time: 'just now',
  },
  {
    id: 'lom-act-2',
    actorInitials: 'PK',
    actorName: 'Peter Known',
    action: 'created casting for',
    target: 'Inspectrice Chloé Marchand',
    tag: 'Open Call',
    time: 'just now',
  },
]

export const activityByProject: Record<string, ActivityItem[]> = {
  evermore: evermoreActivity,
  'rive-droite': riveDroiteActivity,
  'echo-park': echoParkActivity,
  'les-ombres-de-midi': lesOmbresDeMidiActivity,
}
