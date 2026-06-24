import type { Sides } from './types'

export const sides: Sides[] = [
  {
    id: 'sides-fanny-brice',
    roleId: 'fanny-brice',
    title: 'Fanny Brice — Sides',
    pages: 4,
    lines: [
      { kind: 'heading', character: '', text: 'INT. BAR — NIGHT' },
      {
        kind: 'dialogue',
        character: 'FANNY',
        text: "You think I haven't tried to leave? I packed a bag every Sunday for two years.",
      },
      { kind: 'dialogue', character: 'JAKE', text: "So what's stopping you tonight?" },
      { kind: 'dialogue', character: 'FANNY', text: 'You. The version of you who used to laugh.' },
    ],
  },
]

export const sidesById = Object.fromEntries(sides.map((s) => [s.id, s]))
