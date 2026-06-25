import type { ReelClip, Talent, TalentProfile } from './types'

/** Talent search / discovery list. Maya is included (her id is shared with the profile). */
export const talents: Talent[] = [
  {
    id: 'maya-reyes',
    name: 'Maya Reyes',
    profession: 'Actress',
    availability: 'Available',
    city: 'Los Angeles',
    country: 'US',
    agency: 'Vertice Talent',
    skills: ['Vulnerability', 'Drama'],
    match: 92,
    auditions: 28,
    callbacks: 7,
    verified: true,
    avatar: '/avatars/maya-reyes.png',
  },
  {
    id: 'ines-karim',
    name: 'Inès Karim',
    availability: 'Available',
    city: 'Paris',
    country: 'FR',
    agency: 'Vertice Talent',
    skills: ['Drama', 'Multilingual'],
    match: 87,
    auditions: 19,
    callbacks: 4,
    avatar: '/avatars/ines-karim.jpg',
  },
  {
    id: 'sofia-bello',
    name: 'Sofia Bello',
    profession: 'Comedian',
    availability: 'On project',
    city: 'Paris',
    country: 'FR',
    agency: 'Wildcard',
    skills: ['Comedy', 'Voice'],
    match: 84,
    auditions: 31,
    callbacks: 9,
    avatar: '/avatars/sofia-bello.jpg',
  },
  {
    id: 'lea-martin',
    name: 'Léa Martin',
    availability: 'Available',
    city: 'Marseille',
    country: 'FR',
    agency: 'Bureau A.',
    skills: ['Theatre', 'Singing'],
    match: 79,
    auditions: 16,
    callbacks: 3,
    avatar: '/avatars/lea-martin.jpg',
  },
  {
    id: 'hannah-levy',
    name: 'Hannah Levy',
    availability: 'Available',
    city: 'New York',
    country: 'US',
    agency: 'Open Stage',
    skills: ['Drama', 'Comedy'],
    match: 76,
    auditions: 24,
    callbacks: 6,
    avatar: '/avatars/hannah-levy.jpg',
  },
  {
    id: 'eva-sokolov',
    name: 'Eva Sokolov',
    availability: 'On project',
    city: 'Berlin',
    country: 'DE',
    agency: 'Atlas Agency',
    skills: ['Drama', 'Action'],
    match: 73,
    auditions: 11,
    callbacks: 2,
    avatar: '/avatars/eva-sokolov.jpg',
  },
  {
    id: 'margot-chen',
    name: 'Margot Chen',
    availability: 'Available',
    city: 'Toronto',
    country: 'CA',
    agency: 'Open Stage',
    skills: ['Comedy', 'Improv'],
    match: 71,
    auditions: 18,
    callbacks: 3,
    avatar: '/avatars/margot-chen.jpg',
  },
]

/** The logged-in talent — full persistent performance profile. */
export const mayaProfile: TalentProfile = {
  ...talents[0],
  skills: ['Vulnerability', 'Drama', 'Stage combat', 'Singing'],
  union: 'SAG-AFTRA',
  height: '170 cm',
  email: 'maya@vertice.co',
  bookings: 3,
  performanceProfile: [
    { label: 'Vulnerability', value: 92, color: 'gold' },
    { label: 'Comedic timing', value: 74, color: 'blue' },
    { label: 'Physical range', value: 61, color: 'red' },
    { label: 'Vocal command', value: 83, color: 'green' },
  ],
  metrics: {
    profileViews: 312,
    auditionMatches: 14,
    performanceScore: 83,
  },

  // ── LinkedIn-style desktop profile (/talent) ──
  headline: 'Actress · Drama & vulnerability · SAG-AFTRA · Los Angeles',
  bio:
    'Actress with 7 years on screen and stage, known for emotionally raw lead and supporting work in drama. ' +
    'Trained at the Lee Strasberg Theatre Institute. Based in Los Angeles, open to travel for the right role.',
  coverImage: '/posters/p2.png',
  languages: ['English', 'Spanish'],
  training: [
    { id: 'tr-1', school: 'Lee Strasberg Theatre Institute', program: 'Method acting, 2-year conservatory', years: '2016–2018' },
    { id: 'tr-2', school: 'Stella Adler Studio', program: 'Scene study intensive', years: '2019' },
  ],
  representation: {
    agency: 'Vertice Talent',
    agent: 'Naomi Cross',
    email: 'naomi@verticetalent.co',
    phone: '+1 310 555 0148',
  },
  credits: [
    { id: 'cr-1', title: 'Evermore', role: 'Fanny Brice (callback)', type: 'TV series', year: '2026', company: 'A24', director: 'Eden Tov', location: 'Los Angeles', website: 'https://a24films.com/films/evermore' },
    { id: 'cr-2', title: 'La Nuit Vive', role: 'Camille', type: 'Indie film', year: '2024', director: 'Marc Soler', location: 'Marseille', website: 'https://lanuitvive.fr' },
    { id: 'cr-3', title: 'Echo Park', role: 'Supporting', type: 'Music video', year: '2023', company: 'WMG', location: 'Remote' },
    { id: 'cr-4', title: 'Glass House', role: 'Iris (lead)', type: 'Theatre', year: '2021', company: 'The Wild Project', location: 'New York' },
    { id: 'cr-5', title: 'Nestlé — "Morning"', role: 'Lead', type: 'Commercial', year: '2020', location: 'Los Angeles' },
  ],
  appearance: {
    gender: 'Female',
    ethnicities: ['White / European Descent'],
    playingAgeMin: 24,
    playingAgeMax: 34,
  },
  skillLevels: {
    Vulnerability: 3,
    Drama: 3,
    'Stage combat': 2,
    Singing: 1,
  },
  media: [
    { id: 'md-1', kind: 'photo', src: '/posters/p1.png', caption: 'Headshot — natural light' },
    { id: 'md-2', kind: 'photo', src: '/posters/p3.png', caption: 'Theatre — Glass House' },
    { id: 'md-3', kind: 'video', src: '/media/audition.mp4', caption: 'Drama reel — Evermore audition' },
    { id: 'md-4', kind: 'photo', src: '/posters/p4.png', caption: 'On set — La Nuit Vive' },
    { id: 'md-5', kind: 'video', src: '/media/selftape.mp4', caption: 'Comedy self-tape' },
    { id: 'md-6', kind: 'photo', src: '/posters/p5.png', caption: 'Headshot — studio' },
  ],
  posts: [
    {
      id: 'mp-1',
      time: '3d',
      text: 'Callback for Evermore booked. Three weeks of self-tapes, AI feedback on framing, and a lot of coffee — feels good to see it pay off.',
      image: '/posters/p2.png',
      likes: 84,
      comments: 16,
    },
    {
      id: 'mp-2',
      time: '2w',
      text: 'Wrapped La Nuit Vive last month. Camille was the hardest character I’ve played — grateful to Marc for trusting me with her.',
      image: '/posters/p4.png',
      likes: 142,
      comments: 23,
    },
  ],
}

/** Maya's reel clips (talent profile · /app/profile). */
export const mayaReel: ReelClip[] = [
  { genre: 'DRAMA', video: '/media/audition.mp4' },
  { genre: 'COMEDY', video: '/media/selftape.mp4' },
  { genre: 'ACTION', video: '/media/audition.mp4' },
]

/** Groups shown on Maya's home left-column profile card. */
export const mayaGroups: string[] = [
  'SAG-AFTRA NY',
  'Indie horror cast',
  'On-camera actors LA',
  'Theatre folks',
]

/** "Saved" counters on Maya's home left-column. */
export const mayaSaved: { label: string; count: number }[] = [
  { label: 'castings saved', count: 3 },
  { label: 'courses bookmarked', count: 5 },
  { label: 'people followed', count: 12 },
]

export const talentsById = Object.fromEntries(talents.map((t) => [t.id, t]))
