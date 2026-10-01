import { useState } from 'react'
import type { FormEvent } from 'react'
import { softGatePassword } from './access-config'

type SoftGateProps = {
  onUnlock: () => void
}

export function SoftGate({ onUnlock }: SoftGateProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (password === softGatePassword) {
      onUnlock()
      return
    }
    setError('That password does not match. Request access if you need a link.')
    setShake(true)
    window.setTimeout(() => setShake(false), 420)
  }

  return (
    <div className="gate">
      <div className="gate__glow" aria-hidden="true" />
      <div className={`gate__panel ${shake ? 'gate__panel--shake' : ''}`}>
        <p className="gate__brand">Field Map</p>
        <h1 className="gate__title">Preview access</h1>
        <p className="gate__copy">
          Soft-gated preview. Enter the shared password to open the mapper. This
          is access control for a private demo — not account login.
        </p>
        <form className="gate__form" onSubmit={onSubmit}>
          <label className="gate__label" htmlFor="gate-password">
            Password
          </label>
          <input
            id="gate-password"
            className="gate__input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError(null)
            }}
            placeholder="Shared preview password"
            autoFocus
          />
          {error ? (
            <p className="gate__error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn--primary gate__submit">
            Enter Field Map
          </button>
        </form>
        <p className="gate__contact">
          Need access? DM on X{' '}
          <a
            href="https://x.com/SamE1311025"
            target="_blank"
            rel="noreferrer"
          >
            @SamE1311025
          </a>{' '}
          · Field Map inbox TBD
        </p>
      </div>
    </div>
  )
}
