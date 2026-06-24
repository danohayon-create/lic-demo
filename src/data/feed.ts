import type { FeedPost, FeedSidebar } from './types'

/** Social-feed posts (studio/home surface). */
export const feedPosts: FeedPost[] = [
  {
    id: 'post-a24',
    author: { name: 'A24 Casting', meta: 'Casting', verified: true },
    badge: 'Sponsored · Casting call',
    time: '2h',
    kind: 'casting',
    text: 'Now casting · Evermore (TV series). Looking for lead actress Fanny Brice — 24–32, sharp, electric. Self-tape audition opens today, closes Sep 14.',
    hashtags: ['casting', 'TVseries', 'SAGAFTRA'],
    image: '/posters/p1.png',
    likes: 214,
    comments: 38,
    shares: 52,
  },
  {
    id: 'post-theo',
    author: { name: 'Theo Vance', meta: 'Singer' },
    badge: 'Posted a self-tape',
    time: '4h',
    kind: 'selftape',
    hasSelfTape: true,
    text: 'Just dropped my self-tape for the lead role in Echo Park (WMG music video). Wanted to play him quieter than the brief — let me know what you think.',
    video: '/media/selftape.mp4',
    likes: 96,
    comments: 12,
    shares: 7,
  },
  {
    id: 'post-variety',
    author: { name: 'Variety', meta: 'Media', verified: true },
    badge: 'Industry news',
    time: '6h',
    kind: 'news',
    text: 'Streaming demand pushes scripted series orders to a record high — casting volume up sharply across indie and studio productions.',
    likes: 410,
    comments: 27,
    shares: 63,
  },
  {
    id: 'post-csa',
    author: { name: 'Casting Society of America', meta: 'Page' },
    badge: 'Training',
    time: '1d',
    kind: 'training',
    text: 'New workshop · Learn to pitch your self-tape. 30 minutes with a top casting director. How to open strong, sustain emotional truth, and own the silence between lines.',
    banner: 'WORKSHOP · 30 MIN',
    likes: 178,
    comments: 9,
    shares: 21,
  },
  {
    id: 'post-eden',
    author: { name: 'Eden Tov', meta: 'Producer at A24' },
    time: '1d',
    kind: 'update',
    text: 'Three weeks into Evermore casting and the talent coming through Let It Cast has been extraordinary. The shortlist writes itself.',
    likes: 132,
    comments: 18,
    shares: 4,
  },
]

/** Right-rail content for the feed. */
export const feedSidebar: FeedSidebar = {
  topCastings: [
    { title: 'Evermore', role: 'Fanny Brice', location: 'Los Angeles', match: 92 },
    { title: 'Rive Droite', role: 'Léa', location: 'Paris', match: 87 },
    { title: 'Echo Park', role: 'The Drifter', location: 'Remote', match: 78 },
  ],
  peopleToFollow: [
    { name: 'Sofia Bello', role: 'Comedian · Paris' },
    { name: 'Olu Adebayo', role: 'Actor · Lagos' },
    { name: 'Hannah Levy', role: 'Casting director · NY' },
  ],
  industryPulse: [
    '+200% titles produced last 5y',
    '20M auditions/year worldwide',
    '70% submissions never reviewed',
  ],
}

export const feedById = Object.fromEntries(feedPosts.map((f) => [f.id, f]))
