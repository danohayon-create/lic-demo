import { useState } from 'react'
import { Bell, Clapperboard, Film, MessageCircle, Zap } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { notifications as initial, type NotificationItem, type NotificationKind } from '@/data'

const kindIcon: Record<NotificationKind, typeof Bell> = {
  casting: Clapperboard,
  audition: Film,
  message: MessageCircle,
  system: Zap,
}

const kindTone: Record<NotificationKind, string> = {
  casting: 'bg-link/10 text-link',
  audition: 'bg-signal-good-bg text-signal-good',
  message: 'bg-gold/15 text-[#8A6D00]',
  system: 'bg-paper text-muted ring-1 ring-line',
}

/** Talent desktop — notification feed: new casting calls, audition status, messages. */
export function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>(initial)
  const unread = items.filter((n) => !n.read).length

  const markAllRead = () => setItems((cur) => cur.map((n) => ({ ...n, read: true })))
  const markRead = (id: string) => setItems((cur) => cur.map((n) => (n.id === id ? { ...n, read: true } : n)))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Notifications</h1>
          <p className="text-sm text-muted">{unread > 0 ? `${unread} unread` : 'You are all caught up'}</p>
        </div>
        {unread > 0 && (
          <Button size="sm" variant="secondary" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {items.map((n) => {
          const Icon = kindIcon[n.kind]
          return (
            <Card
              key={n.id}
              interactive
              onClick={() => markRead(n.id)}
              className={cn('flex items-start gap-3', !n.read && 'border-link/30 bg-link/[0.03]')}
            >
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', kindTone[n.kind])}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                <p className="text-sm text-muted">{n.detail}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-xs text-muted">{n.time}</span>
                {!n.read && <span className="h-2 w-2 rounded-full bg-link" />}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
