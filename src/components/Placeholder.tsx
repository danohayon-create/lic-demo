import type { ReactNode } from 'react'
import { Card } from './ui'

type PlaceholderProps = {
  /** Uppercase technical label above the title. */
  label: string
  title: string
  /** Short description of what this screen will become. */
  children?: ReactNode
  /** Route path, shown as a mono breadcrumb. */
  route?: string
}

/** Generic "screen not built yet" placeholder used across studio & app routes. */
export function Placeholder({ label, title, route, children }: PlaceholderProps) {
  return (
    <Card className="flex flex-col gap-3">
      <span className="tech-label">{label}</span>
      <h2 className="text-2xl font-bold tracking-tight text-ink">{title}</h2>
      {route && <code className="font-mono text-xs text-link">{route}</code>}
      <p className="max-w-prose text-sm leading-relaxed text-muted">
        {children ?? 'Écran placeholder. Le contenu détaillé arrive à l’étape suivante.'}
      </p>
    </Card>
  )
}
