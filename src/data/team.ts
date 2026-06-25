import type { TeamMember } from './types'

/** Production-side team (A24). Peter Known is the studio user. */
export const team: TeamMember[] = [
  { id: 'peter-known', name: 'Peter Known', role: 'Casting director', initials: 'PK', company: 'A24', avatar: '/avatars/peter-known.jpg' },
  { id: 'eden-tov', name: 'Eden Tov', role: 'Producer', initials: 'ET', company: 'A24', avatar: '/avatars/eden-tov.jpg' },
  { id: 'julie-cohen', name: 'Julie Cohen', role: 'Assistant', initials: 'JC', company: 'A24', avatar: '/avatars/julie-cohen.jpg' },
  { id: 'lara-khan', name: 'Lara Khan', role: 'Director', initials: 'LK', company: 'A24', avatar: '/avatars/lara-khan.jpg' },
  { id: 'sarah-liu', name: 'Sarah Liu', role: 'Casting associate', initials: 'SL', company: 'Banijay Australia', avatar: '/avatars/sarah-liu.jpg' },
  { id: 'mike-ross', name: 'Mike Ross', role: 'Assistant', initials: 'MR', company: 'Banijay Australia' },
]

/** The current studio user. */
export const studioUser = team[0]

export const teamById = Object.fromEntries(team.map((m) => [m.id, m]))
export const teamByInitials = Object.fromEntries(team.map((m) => [m.initials, m]))
