import type { TeamMember } from './types'

/** Production-side team (A24). Peter Known is the studio user. */
export const team: TeamMember[] = [
  { id: 'peter-known', name: 'Peter Known', role: 'Casting director', initials: 'PK', company: 'A24' },
  { id: 'eden-tov', name: 'Eden Tov', role: 'Producer', initials: 'ET', company: 'A24' },
  { id: 'julie-cohen', name: 'Julie Cohen', role: 'Assistant', initials: 'JC', company: 'A24' },
  { id: 'lara-khan', name: 'Lara Khan', role: 'Director', initials: 'LK', company: 'A24' },
]

/** The current studio user. */
export const studioUser = team[0]

export const teamById = Object.fromEntries(team.map((m) => [m.id, m]))
export const teamByInitials = Object.fromEntries(team.map((m) => [m.initials, m]))
