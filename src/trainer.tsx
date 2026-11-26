import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import './community.css'
import { displayName } from './catalog'

type Pokemon = { id: number; name: string }
type Trainer = { name: string; favorite: Pokemon | null }
export async function communityRequest<T>(path: string, body?: object, signal?: AbortSignal): Promise<T> {
  const response = await fetch('/api/' + path, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
    const detail = data && typeof data === 'object' && 'error' in data ? data.error : null
    throw new Error(typeof detail === 'string' ? detail : 'Serviço indisponível. Tente novamente.')
  }
  return data as T
}

export function useTrainer() {
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [visible, setVisible] = useState(false)
  const [checking, setChecking] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [target, setTarget] = useState<Pokemon | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [revision, setRevision] = useState(0)
  const modal = useRef<HTMLDialogElement>(null)
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const current = await communityRequest<Trainer | null>('trainer', undefined, signal)
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
    try { await refresh() }
    catch { setError('Não foi possível consultar seu perfil.'); setUnavailable(true) }
    finally { setChecking(false) }
  }
  function open(pokemon: Pokemon | null) {
    setTarget(pokemon)
    setStatus('')
    setName('')
    setVisible(true)
    void check()
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || checking || unavailable) return
    setBusy(true)
    setError('')
    try {
      let current = trainer
      if (!current) {
        current = await communityRequest<Trainer>('trainer', { name })
        setTrainer(current)
        // A sessão pode ter sido criada em outra aba enquanto o formulário estava aberto.
        if (current.favorite && target) return
      }
      if (target && current.favorite?.id !== target.id) {
        const updated = await communityRequest<Trainer>('favorite', {
          id: target.id, previous: current.favorite?.id ?? null,
        })
        setTrainer(updated)
        setRevision(n => n + 1)
        setStatus(`${displayName(target.name)} é seu favorito!`)
      } else {
        setStatus(`Treinador ${current.name} conectado.`)
      }
      setVisible(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha na conexão.')
      await refresh().catch(() => {})
    } finally { setBusy(false) }
  }
  const title = !trainer ? 'Nome de treinador' : !target ? 'Seu treinador' :
    target.id === trainer.favorite?.id ? 'Seu favorito' : trainer.favorite ? 'Trocar favorito?' : 'Escolher favorito?'
  const dialog = <>
    {status && <div className="trainer-toast" role="status">{status}<button type="button" aria-label="Dispensar aviso" onClick={() => setStatus('')}>×</button></div>}
    {visible && <dialog ref={modal} className="trainer-dialog" aria-labelledby="trainer-title" onCancel={event => {
      if (busy) event.preventDefault()
      else setVisible(false)
    }}>
      <button className="trainer-close" aria-label="Fechar" disabled={busy} onClick={() => setVisible(false)}>×</button>
      <form onSubmit={submit}>
        <h2 id="trainer-title">{checking ? 'Perfil de treinador' : title}</h2>
        {checking ? <p role="status">Consultando perfil…</p> : !unavailable && <>
          {!trainer && <><label htmlFor="trainer-name">Como você quer ser chamado?</label>
            <input autoFocus id="trainer-name" autoComplete="nickname" placeholder="Nome de treinador" required value={name} onChange={e => setName(e.target.value)} aria-describedby="trainer-hint"/>
            <small id="trainer-hint">De 8 a 20 caracteres, sem espaços. Seu perfil fica conectado neste navegador.</small></>}
          {target ? <p>{trainer?.favorite?.id === target.id ? <><strong>{displayName(target.name)}</strong> já é seu favorito.</> :
            trainer?.favorite ? <>Substituir <strong>{displayName(trainer.favorite.name)}</strong> por <strong>{displayName(target.name)}</strong> como seu único favorito?</> :
            <>Seu voto vai para <strong>{displayName(target.name)}</strong>.</>}</p>
          : trainer && <p><strong>{trainer.name}</strong><br/>{trainer.favorite ? 'Seu favorito é ' + displayName(trainer.favorite.name) + '.' : 'Escolha um Pokémon no catálogo para votar.'}</p>}
        </>}
        {error && <p className="trainer-error" role="alert">{error}</p>}
        {unavailable && <button type="button" className="trainer-primary" onClick={() => void check()}>Tentar novamente</button>}
        {!checking && !unavailable && <div className="trainer-actions">
          {target && target.id !== trainer?.favorite?.id && <button type="button" disabled={busy} onClick={() => setVisible(false)}>Cancelar</button>}
          <button className="trainer-primary" disabled={busy}>{busy ? 'Salvando…' : !trainer ? target ? 'Criar perfil e votar' : 'Criar perfil' : target && target.id !== trainer.favorite?.id ? 'Confirmar voto' : 'Concluir'}</button>
        </div>}
      </form>
    </dialog>}
  </>
  return { trainer, revision, dialog, openTrainer: () => open(null), onFavorite: (id: number, name: string) => open({ id, name }) }
}
