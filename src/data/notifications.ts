import type { NotificationItem } from './types'

/** Maya's notification feed (talent desktop space). */
export const notifications: NotificationItem[] = [
  {
    id: 'ntf-1',
    kind: 'casting',
    title: 'New casting call matches your profile',
    detail: '“Rive Droite” is now open for Léa — 87% match.',
    time: '1h',
    read: false,
  },
  {
    id: 'ntf-2',
    kind: 'audition',
    title: 'Audition shortlisted',
    detail: 'Your self-tape for “Rive Droite” — Léa was shortlisted.',
    time: '3h',
    read: false,
  },
  {
    id: 'ntf-3',
    kind: 'message',
    title: 'New message from Eden Tov',
    detail: 'We are scheduling final callbacks for next week…',
    time: '5h',
    read: false,
  },
  {
    id: 'ntf-4',
    kind: 'audition',
    title: 'Self-tape due soon',
    detail: '“La Nuit Vive” — Marco self-tape closes in 2 days.',
    time: '1d',
    read: true,
  },
  {
    id: 'ntf-5',
    kind: 'system',
    title: 'Performance profile updated',
    detail: 'Your vulnerability score increased to 92 after Evermore.',
    time: '2d',
    read: true,
  },
  {
    id: 'ntf-6',
    kind: 'casting',
    title: 'Casting closing soon',
    detail: '“Evermore” — Fanny Brice closes in 1 day 9 hours.',
    time: '2d',
    read: true,
  },
]

/** Total unread notifications — shown as a badge in the talent top nav. */
export const unreadNotificationsCount = notifications.filter((n) => !n.read).length
