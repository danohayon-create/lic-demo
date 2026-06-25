import { useState, useEffect, useRef } from 'react'
import { Lock, Eye, EyeOff, X } from 'lucide-react'

// SHA-256 of the demo password. To change it:
// node -e "const c=require('crypto');console.log(c.createHash('sha256').update('YOUR_PASSWORD').digest('hex'))"
const PASSWORD_HASH = '315562e267f3d5494f538981f7e1e7ebca8bb4d901fc2f001ae0a617e73c4d2f'
const SESSION_KEY = 'lic-demo-unlocked'

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function usePasswordGate() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true')

  function unlock() {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setUnlocked(true)
  }

  return { unlocked, unlock }
}

type Props = {
  onSuccess: () => void
  onClose: () => void
}

export function PasswordGateModal({ onSuccess, onClose }: Props) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const hash = await sha256(value)
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      onSuccess()
    } else {
      setError(true)
      setValue('')
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="relative w-full max-w-sm rounded-card bg-paper p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-muted hover:text-ink"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/8">
            <Lock className="h-5 w-5 text-ink" />
          </span>
        </div>

        <h2 className="mb-1 text-center text-lg font-bold tracking-tight text-ink">
          Démo protégée
        </h2>
        <p className="mb-6 text-center text-sm text-muted">
          Entrez le mot de passe pour accéder à la démo.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <input
              ref={inputRef}
              type={show ? 'text' : 'password'}
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(false) }}
              placeholder="Mot de passe"
              autoComplete="current-password"
              className={[
                'w-full rounded-btn border bg-card px-4 py-2.5 pr-10 text-sm text-ink outline-none',
                'placeholder:text-muted transition-colors',
                error
                  ? 'border-signal-bad focus:border-signal-bad'
                  : 'border-line focus:border-ink/40',
              ].join(' ')}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              tabIndex={-1}
              aria-label={show ? 'Masquer' : 'Afficher'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="text-center text-xs font-medium text-signal-bad">
              Mot de passe incorrect.
            </p>
          )}

          <button
            type="submit"
            disabled={!value || loading}
            className="mt-1 rounded-btn bg-ink py-2.5 text-sm font-semibold text-paper transition-opacity disabled:opacity-40"
          >
            {loading ? 'Vérification…' : 'Accéder à la démo'}
          </button>
        </form>
      </div>
    </div>
  )
}
