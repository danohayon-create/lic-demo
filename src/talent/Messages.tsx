import { useState } from 'react'
import { Send } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/cn'
import { conversations, mayaProfile, type Conversation } from '@/data'

/** Talent desktop — internal Let It Cast messaging (inbox + thread). */
export function Messages() {
  const [activeId, setActiveId] = useState(conversations[0]?.id)
  const [draft, setDraft] = useState('')
  const [localMessages, setLocalMessages] = useState<Record<string, { from: 'me' | string; text: string; time: string }[]>>(
    Object.fromEntries(conversations.map((c) => [c.id, c.messages])),
  )

  const active = conversations.find((c) => c.id === activeId)
  const thread = active ? localMessages[active.id] ?? [] : []

  const send = () => {
    if (!active || !draft.trim()) return
    setLocalMessages((cur) => ({
      ...cur,
      [active.id]: [...cur[active.id], { from: 'me', text: draft.trim(), time: 'now' }],
    }))
    setDraft('')
  }

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[420px] overflow-hidden rounded-card border border-line bg-card">
      {/* conversation list */}
      <div className="w-[280px] shrink-0 overflow-y-auto border-r border-line">
        <div className="border-b border-line px-4 py-3">
          <span className="tech-label">Messaging</span>
        </div>
        {conversations.map((c) => (
          <ConversationRow key={c.id} conv={c} active={c.id === activeId} onClick={() => setActiveId(c.id)} />
        ))}
      </div>

      {/* thread */}
      {active ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3">
            <Avatar name={active.contactName} size="sm" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink">{active.contactName}</p>
              <p className="text-xs text-muted">{active.contactMeta}</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
            {thread.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[70%] rounded-card px-3.5 py-2 text-sm leading-relaxed',
                  m.from === 'me' ? 'self-end bg-ink text-white' : 'self-start bg-paper text-ink',
                )}
              >
                {m.text}
                <div className={cn('mt-1 text-[10px]', m.from === 'me' ? 'text-white/60' : 'text-muted')}>{m.time}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-line p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={`Message ${active.contactName.split(' ')[0]}…`}
              className="flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted/60 focus:border-ink/30"
            />
            <button
              onClick={send}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white disabled:opacity-40"
              disabled={!draft.trim()}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted">No conversation selected</div>
      )}
    </div>
  )
}

function ConversationRow({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  const lastFromMe = conv.messages[conv.messages.length - 1]?.from === 'me'
  const last = conv.messages[conv.messages.length - 1]
  return (
    <button
      onClick={onClick}
      className={cn('flex w-full items-start gap-2.5 border-b border-line px-4 py-3 text-left', active ? 'bg-paper' : 'hover:bg-paper/60')}
    >
      <span className="relative shrink-0">
        <Avatar name={conv.contactName} size="md" />
        {conv.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-signal-good ring-2 ring-card" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-ink">{conv.contactName}</span>
          <span className="shrink-0 text-[11px] text-muted">{conv.lastMessageTime}</span>
        </div>
        <p className="truncate text-xs text-muted">
          {lastFromMe ? `${mayaProfile.name.split(' ')[0]}: ` : ''}
          {last?.text}
        </p>
      </div>
      {conv.unread > 0 && (
        <span className="mt-1 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-signal-no px-1 font-mono text-[10px] font-bold text-white">
          {conv.unread}
        </span>
      )}
    </button>
  )
}
