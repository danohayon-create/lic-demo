import type { FeedPost, FeedSidebar } from './types'

/** Social-feed posts (studio/home surface). */
export const feedPosts: FeedPost[] = [
  // 1 ── LIC tips (top of feed)
  {
    id: 'post-lic-tips',
    author: { name: 'Let It Cast', meta: 'Official', verified: true, avatar: '/avatars/lic-logo-square.png' },
    badge: 'Tips for talent',
    time: 'Just now',
    kind: 'training',
    text: "Recording a self-tape this week? 🎬 We put together our top 10 tips — camera, light, sound, framing, and that all-important first impression — so you can submit with confidence instead of stress. Watch the full rundown, then go snap apply to your next role!",
    hashtags: ['selftape', 'SnapApply', 'actingtips'],
    video: '/snapapply/tip-video.mp4',
    likes: 587,
    comments: 64,
    shares: 141,
  },

  // 2 ── A24 casting call
  {
    id: 'post-a24',
    author: { name: 'A24 Casting', meta: 'Casting', verified: true },
    badge: 'Sponsored · Casting call',
    time: '2h',
    kind: 'casting',
    text: 'Now casting · Evermore (TV series). Looking for lead actress Fanny Brice — 24–32, sharp, electric. Self-tape audition opens today, closes Sep 14.',
    hashtags: ['casting', 'TVseries', 'SAGAFTRA'],
    image: '/posters/p1.png',
    castingUrl: '/talent/casting/evermore',
    likes: 214,
    comments: 38,
    shares: 52,
  },

  // 3 ── YouTube: Anabel Lopez success story
  {
    id: 'yt-anabel-lopez',
    author: { name: 'Let It Cast', meta: 'Official · YouTube', verified: true, avatar: '/avatars/lic-logo-square.png' },
    badge: 'Success story',
    time: '2h',
    platform: 'youtube',
    kind: 'training',
    text: "🎉 Anabel Lopez just booked a role through Let It Cast — watch her journey from submission to callback. This is exactly why we built this platform.",
    hashtags: ['LetItCast', 'SuccessStory', 'Casting'],
    youtubeId: '--PeUOsHuVo',
    youtubeTitle: "L'actrice Anabel Lopez décroche un rôle via Let It Cast",
    likes: 342,
    comments: 47,
    shares: 89,
  },

  // 4 ── Marco Delgado self-tape
  {
    id: 'post-marco',
    author: { name: 'Marco Delgado', meta: 'Actor', avatar: '/avatars/marco-delgado.jpg' },
    badge: 'Posted a self-tape',
    time: '4h',
    kind: 'selftape',
    hasSelfTape: true,
    text: 'Fresh take on the MasterChef contestant brief — leaned into the backstory rather than the technique. Happy with how the first look came out. Open to feedback!',
    video: '/casting-nonscripted/marco-delgado.mp4',
    likes: 104,
    comments: 15,
    shares: 9,
  },

  // 5 ── Variety industry news
  {
    id: 'post-variety',
    author: { name: 'Variety', meta: 'Media', verified: true, avatar: '/avatars/variety.svg' },
    badge: 'Industry news',
    time: '6h',
    kind: 'news',
    text: 'Streaming demand pushes scripted series orders to a record high — casting volume up sharply across indie and studio productions.',
    likes: 410,
    comments: 27,
    shares: 63,
  },

  // 6 ── YouTube: The Office casting tapes
  {
    id: 'yt-the-office',
    author: { name: 'Let It Cast', meta: 'Official · YouTube', verified: true, avatar: '/avatars/lic-logo-square.png' },
    badge: 'Audition Tape',
    time: '1d',
    platform: 'youtube',
    kind: 'training',
    text: "🎬 AUDITION TAPE: The original casting tapes for The Office (US). Watch the actors who almost didn't make it — and those who defined their careers in one room.",
    hashtags: ['AuditionTape', 'TheOffice', 'BehindTheCasting'],
    youtubeId: 'W-HnNbRHpqo',
    youtubeTitle: 'AUDITION TAPE: TV Series THE OFFICE - the original casting tapes!',
    likes: 1204,
    comments: 138,
    shares: 267,
  },

  // 7 ── Instagram: Snap Apply
  {
    id: 'ig-snap-apply',
    author: { name: 'Let It Cast 🇺🇸', meta: '@letitcast.en · Instagram', verified: true, avatar: '/avatars/lic-logo-square.png' },
    badge: 'From Instagram',
    time: '1d',
    platform: 'instagram',
    kind: 'training',
    text: "Your next role is one self-tape away. 🎬✨ Snap Apply lets you record & submit in under 2 minutes — no agency, no waiting, no gatekeeping. Just you and the casting team.",
    hashtags: ['SnapApply', 'LetItCast', 'ActingLife', 'CastingCall', 'SelfTape'],
    image: '/snapapply/tip1.png',
    likes: 891,
    comments: 73,
    shares: 156,
  },

  // 8 ── CSA workshop
  {
    id: 'post-csa',
    author: { name: 'Casting Society of America', meta: 'Page', avatar: '/avatars/csa.svg' },
    badge: 'Training',
    time: '1d',
    kind: 'training',
    text: 'New workshop · Learn to pitch your self-tape. 30 minutes with a top casting director. How to open strong, sustain emotional truth, and own the silence between lines.',
    banner: 'WORKSHOP · 30 MIN',
    likes: 178,
    comments: 9,
    shares: 21,
  },

  // 9 ── YouTube: Mark Hamill / Star Wars
  {
    id: 'yt-star-wars',
    author: { name: 'Let It Cast', meta: 'Official · YouTube', verified: true, avatar: '/avatars/lic-logo-square.png' },
    badge: 'Audition Tape',
    time: '2d',
    platform: 'youtube',
    kind: 'training',
    text: "⭐ AUDITION TAPE: Mark Hamill auditions for Star Wars. Before Luke Skywalker became an icon, there was this room, this camera, and a lot of uncertainty. Sound familiar?",
    hashtags: ['AuditionTape', 'StarWars', 'MarkHamill'],
    youtubeId: 'Me4ClnbwaOs',
    youtubeTitle: 'AUDITION TAPE: Mark Hamill auditions for Star Wars',
    likes: 2891,
    comments: 214,
    shares: 503,
  },

  // 10 ── Eden Tov update
  {
    id: 'post-eden',
    author: { name: 'Eden Tov', meta: 'Producer at A24', avatar: '/avatars/eden-tov.jpg' },
    time: '2d',
    kind: 'update',
    text: 'Three weeks into Evermore casting and the talent coming through Let It Cast has been extraordinary. The shortlist writes itself.',
    likes: 132,
    comments: 18,
    shares: 4,
  },

  // 11 ── Instagram: industry insight
  {
    id: 'ig-casting-insight',
    author: { name: 'Let It Cast 🇺🇸', meta: '@letitcast.en · Instagram', verified: true, avatar: '/avatars/lic-logo-square.png' },
    badge: 'From Instagram',
    time: '3d',
    platform: 'instagram',
    kind: 'news',
    text: "Did you know? 70% of audition submissions are never reviewed by a human. Let It Cast changes that — every tape gets a LIC score, every talent gets a fair shot. The industry is changing. 🚀",
    hashtags: ['LetItCast', 'CastingIndustry', 'FairChance', 'Actors'],
    image: '/snapapply/tip4.png',
    likes: 1243,
    comments: 102,
    shares: 234,
  },

  // 12 ── YouTube: Robert Downey Jr. / Iron Man
  {
    id: 'yt-iron-man',
    author: { name: 'Let It Cast', meta: 'Official · YouTube', verified: true, avatar: '/avatars/lic-logo-square.png' },
    badge: 'Audition Tape',
    time: '4d',
    platform: 'youtube',
    kind: 'training',
    text: "🦾 AUDITION TAPE: Robert Downey Jr. auditions for Iron Man. The tape that changed everything — and almost never happened. A masterclass in owning a room.",
    hashtags: ['AuditionTape', 'IronMan', 'RDJ', 'Marvel'],
    youtubeId: '5LlIvB3KVZ0',
    youtubeTitle: 'AUDITION TAPE: Robert Downey Jr. audition for Iron Man',
    likes: 4127,
    comments: 389,
    shares: 812,
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
