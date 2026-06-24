import type { Conversation } from './types'

/** Maya's inbox — internal Let It Cast messaging (talent desktop space). */
export const conversations: Conversation[] = [
  {
    id: 'conv-eden',
    contactName: 'Eden Tov',
    contactMeta: 'Producer at A24',
    unread: 2,
    lastMessageTime: '12:38',
    online: true,
    messages: [
      { id: 'm1', from: 'eden', text: 'Hi Maya, loved your callback tape for Fanny Brice.', time: '12:30' },
      { id: 'm2', from: 'eden', text: 'We are scheduling final callbacks for next week — are you free Tuesday?', time: '12:31' },
      { id: 'm3', from: 'me', text: 'Hi Eden! Thank you, that means a lot. Tuesday works great for me.', time: '12:36' },
      { id: 'm4', from: 'eden', text: 'Perfect, sending the details over shortly.', time: '12:38' },
    ],
  },
  {
    id: 'conv-naomi',
    contactName: 'Naomi Cross',
    contactMeta: 'Agent · Vertice Talent',
    unread: 0,
    lastMessageTime: 'Yesterday',
    online: true,
    messages: [
      { id: 'm1', from: 'naomi', text: 'Two new submissions went out today on your behalf — Rive Droite and Echo Park.', time: 'Yesterday 16:02' },
      { id: 'm2', from: 'me', text: 'Awesome, thank you Naomi!', time: 'Yesterday 16:10' },
    ],
  },
  {
    id: 'conv-marc',
    contactName: 'Marc Soler',
    contactMeta: 'Director · La Nuit Vive',
    unread: 0,
    lastMessageTime: '3d',
    messages: [
      { id: 'm1', from: 'marc', text: 'Camille was unforgettable. Thank you for trusting me with this one.', time: '3d ago' },
      { id: 'm2', from: 'me', text: 'It was the role of a lifetime — thank you for pushing me, Marc.', time: '3d ago' },
    ],
  },
  {
    id: 'conv-csa',
    contactName: 'Casting Society of America',
    contactMeta: 'Page',
    unread: 1,
    lastMessageTime: '1w',
    messages: [
      { id: 'm1', from: 'csa', text: 'Reminder: the self-tape pitching workshop starts Thursday at 6pm.', time: '1w ago' },
    ],
  },
]

export const conversationsById = Object.fromEntries(conversations.map((c) => [c.id, c]))

/** Total unread messages — shown as a badge in the talent top nav. */
export const unreadMessagesCount = conversations.reduce((sum, c) => sum + c.unread, 0)
