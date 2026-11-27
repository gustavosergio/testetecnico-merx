import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import './community.css'
import { starters } from '../shared/starters'
import { displayName } from './catalog'

type Pokemon = { id: number; name: string }
type Trainer = {
  description: string | null
  goNick: string | null
  avatar: number
  needsSetup: boolean
  name: string
  favorite: Pokemon | null
}
export async function communityRequest<T>(
  path: string,
  body?: object,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch('/api/' + path, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })
  const data = await response.json().catch(() => null)
  if (
    !response.ok ||
    !response.headers.get('Content-Type')?.includes('application/json')
  ) {
    const detail =
      data && typeof data === 'object' && 'error' in data ? data.error : null
    throw new Error(
      typeof detail === 'string'
        ? detail
        : 'Serviço indisponível. Tente novamente.',
    )
  }
  return data as T
}

export function avatarImage(id: number) {
  return (
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' +
    id +
    '.png'
  )
}

const starterRows = [
  ['Kanto', [1, 4, 7]],
  ['Johto', [152, 155, 158]],
  ['Hoenn', [252, 255, 258]],
  ['Sinnoh', [387, 390, 393]],
  ['Unova', [495, 498, 501]],
  ['Kalos', [650, 653, 656]],
  ['Alola', [722, 725, 728]],
  ['Galar', [810, 813, 816]],
  ['Paldea', [906, 909, 912]],
] as const

function Credentials({
  setup,
  busy,
  authenticate,
}: {
  setup: boolean
  busy: boolean
  authenticate: (body: object) => Promise<void>
}) {
  const [mode, setMode] = useState<'signup' | 'login'>('login')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [trio, setTrio] = useState<number[]>([])
  function toggle(id: number) {
    setTrio((prev) =>
      prev.includes(id)
        ? prev.filter((value) => value !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev,
    )
  }
  function renderChoices(ids: readonly number[]) {
    return (
      <div className="starter-grid">
        {ids.map((id) => {
          const selected = trio.includes(id)
          return (
            <button
              key={id}
              aria-pressed={selected}
              disabled={!selected && trio.length === 3}
              type="button"
              onClick={() => toggle(id)}
            >
              <img src={avatarImage(id)} alt="" loading="lazy" />
              {starters[id]}
            </button>
          )
        })}
      </div>
    )
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void authenticate({ action: setup ? 'setup' : mode, name, trio, pin })
      }}
    >
      <fieldset disabled={busy} className="credentials">
        {setup ? (
          <p>Defina sua senha para entrar novamente com este treinador.</p>
        ) : (
          <>
            <div className="auth-tabs">
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => {
                    setMode(m)
                    setTrio([])
                    setPin('')
                  }}
                >
                  {m === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>
            <label>
              Nome de treinador
              <input
                required
                autoComplete="username"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            {mode === 'signup' && (
              <small>De 8 a 20 caracteres, sem espaços.</small>
            )}
          </>
        )}
        <p>Escolha três iniciais diferentes. A ordem faz parte da senha.</p>
        <ol className="trio-slots">
          {[0, 1, 2].map((i) => (
            <li key={i}>{starters[trio[i]] || 'Escolher'}</li>
          ))}
        </ol>
        <div className="starter-picker">
          {starterRows.map(([region, ids]) => (
            <div key={region} role="group" aria-label={region}>
              <strong>{region}</strong>
              {renderChoices(ids)}
            </div>
          ))}
        </div>
        <label>
          PIN de 4 dígitos
          <input
            type="password"
            inputMode="numeric"
            autoComplete={
              setup || mode === 'signup' ? 'new-password' : 'current-password'
            }
            pattern="[0-9]{4}"
            maxLength={4}
            required
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </label>
        <button
          className="trainer-primary"
          disabled={trio.length !== 3 || pin.length !== 4}
        >
          {busy
            ? 'Aguarde…'
            : setup
              ? 'Salvar senha'
              : mode === 'login'
                ? 'Entrar no perfil'
                : 'Cadastrar treinador'}
        </button>
      </fieldset>
    </form>
  )
}

function ProfileField({
  label,
  initial,
  multiline,
  limit,
  busy,
  save,
}: {
  label: string
  initial: string
  multiline: boolean
  limit: number
  busy: boolean
  save: (value: string) => Promise<void>
}) {
  const [value, setValue] = useState(initial)
  const length = Array.from(value).length
  const field = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValue(e.target.value),
  }
  return (
    <form
      className="profile-field"
      onSubmit={(e) => {
        e.preventDefault()
        if (length <= limit) void save(value)
      }}
    >
      <label>
        {label} <small>Opcional · visível na busca</small>
        {multiline ? <textarea rows={4} {...field} /> : <input {...field} />}
      </label>
      <small aria-live="polite">
        {length}/{limit} caracteres
      </small>
      <button
        className="trainer-primary"
        disabled={busy || value === initial || length > limit}
      >
        Salvar {multiline ? 'descrição' : 'nick'}
      </button>
    </form>
  )
}

export function useTrainer() {
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [visible, setVisible] = useState(false)
  const [checking, setChecking] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [target, setTarget] = useState<Pokemon | null>(null)
  const [avatar, setAvatar] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [revision, setRevision] = useState(0)
  const modal = useRef<HTMLDialogElement>(null)
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const current = await communityRequest<Trainer | null>(
      'trainer',
      undefined,
      signal,
    )
    setTrainer(current)
    return current
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal).catch(() => {})
    return () => controller.abort()
  }, [refresh])
  useEffect(() => {
    if (visible) modal.current?.showModal()
  }, [visible])
  async function check() {
    setChecking(true)
    setUnavailable(false)
    setError('')
    try {
      await refresh()
    } catch {
      setError('Não foi possível consultar seu perfil.')
      setUnavailable(true)
    } finally {
      setChecking(false)
    }
  }
  function open(pokemon: Pokemon | null) {
    setTarget(pokemon)
    setStatus('')
    setAvatar('')
    setVisible(true)
    void check()
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || checking || unavailable) return
    setBusy(true)
    setError('')
    try {
      const current = trainer
      if (!current) return
      if (target && current.favorite?.id !== target.id) {
        const updated = await communityRequest<Trainer>('favorite', {
          id: target.id,
          previous: current.favorite?.id ?? null,
        })
        setTrainer(updated)
        setRevision((n) => n + 1)
        setStatus(`${displayName(target.name)} é seu favorito!`)
      } else {
        setStatus(`Treinador ${current.name} conectado.`)
      }
      setVisible(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha na conexão.')
      await refresh().catch(() => {})
    } finally {
      setBusy(false)
    }
  }
  async function accountAction(body: object, close = false) {
    setBusy(true)
    setError('')
    try {
      const updated = await communityRequest<Trainer | null>('trainer', body)
      setTrainer(updated)
      setAvatar('')
      if (close || (!target && !trainer?.needsSetup && updated && !trainer))
        setVisible(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha na conexão.')
    } finally {
      setBusy(false)
    }
  }
  const title = !trainer
    ? 'Nome de treinador'
    : !target
      ? 'Seu treinador'
      : target.id === trainer.favorite?.id
        ? 'Seu favorito'
        : trainer.favorite
          ? 'Trocar favorito?'
          : 'Escolher favorito?'
  const dialog = (
    <>
      {status && (
        <div className="trainer-toast" role="status">
          {status}
          <button
            type="button"
            aria-label="Dispensar aviso"
            onClick={() => setStatus('')}
          >
            ×
          </button>
        </div>
      )}
      {visible && (
        <dialog
          ref={modal}
          className="trainer-dialog"
          aria-labelledby="trainer-title"
          onCancel={(event) => {
            if (busy) event.preventDefault()
            else setVisible(false)
          }}
        >
          <button
            className="trainer-close"
            aria-label="Fechar"
            disabled={busy}
            onClick={() => setVisible(false)}
          >
            ×
          </button>
          <h2 id="trainer-title">
            {!trainer
              ? 'Conta de treinador'
              : trainer.needsSetup
                ? 'Configure sua senha'
                : title}
          </h2>
          {checking ? (
            <p role="status">Consultando perfil…</p>
          ) : unavailable ? (
            <button onClick={() => void check()}>Tentar novamente</button>
          ) : !trainer || trainer.needsSetup ? (
            <Credentials
              setup={!!trainer}
              busy={busy}
              authenticate={accountAction}
            />
          ) : target ? (
            <form onSubmit={submit}>
              <p>
                {trainer.favorite && trainer.favorite.id !== target.id ? (
                  <>
                    Substituir{' '}
                    <strong>{displayName(trainer.favorite.name)}</strong> por{' '}
                    <strong>{displayName(target.name)}</strong>?
                  </>
                ) : (
                  <>
                    Seu favorito será{' '}
                    <strong>{displayName(target.name)}</strong>.
                  </>
                )}
              </p>
              <div className="trainer-actions">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setVisible(false)}
                >
                  Cancelar
                </button>
                <button className="trainer-primary" disabled={busy}>
                  Confirmar voto
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="avatar-heading">
                <img src={avatarImage(trainer.avatar)} alt="Foto de perfil" />
                <strong>{trainer.name}</strong>
              </div>
              <p>
                {trainer.favorite
                  ? 'Favorito: ' + displayName(trainer.favorite.name)
                  : 'Escolha seu favorito no catálogo.'}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void accountAction({ action: 'avatar', pokemon: avatar })
                }}
              >
                <label>
                  Trocar foto de perfil
                  <input
                    value={avatar}
                    required
                    placeholder="Nome ou número do Pokémon"
                    onChange={(e) => setAvatar(e.target.value)}
                  />
                </label>
                <button
                  className="trainer-primary"
                  disabled={busy || !avatar.trim()}
                >
                  Salvar foto
                </button>
              </form>
              <ProfileField
                key={'goNick' + (trainer.goNick ?? '')}
                label="Nick do Pokémon GO"
                initial={trainer.goNick ?? ''}
                multiline={false}
                limit={32}
                busy={busy}
                save={(value) => accountAction({ action: 'goNick', value })}
              />
              <ProfileField
                key={'description' + (trainer.description ?? '')}
                label="Descrição do perfil"
                initial={trainer.description ?? ''}
                multiline={true}
                limit={500}
                busy={busy}
                save={(value) =>
                  accountAction({ action: 'description', value })
                }
              />
              <div className="trainer-actions">
                <button
                  disabled={busy}
                  onClick={() => void accountAction({ action: 'logout' }, true)}
                >
                  Sair da conta
                </button>
              </div>
            </>
          )}
          {error && (
            <p className="trainer-error" role="alert">
              {error}
            </p>
          )}
        </dialog>
      )}
    </>
  )
  return {
    trainer,
    revision,
    dialog,
    openTrainer: () => open(null),
    onFavorite: (id: number, name: string) => open({ id, name }),
  }
}
