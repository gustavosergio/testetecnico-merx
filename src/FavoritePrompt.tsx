import '@fontsource/pixelify-sans/latin-400.css'
import { useEffect, useRef, useState } from 'react'
import { displayName, type Pokemon } from './catalog'
import './favorite-prompt.css'

type Props = {
  pokemon: Pick<Pokemon, 'id' | 'name' | 'image'>
  currentName?: string
  action: 'favorite' | 'remove' | 'like' | 'unlike'
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export default function FavoritePrompt({
  pokemon,
  currentName,
  action,
  onConfirm,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  const name = displayName(pokemon.name)
  const question = {
    favorite: 'Você quer me escolher como Pokémon favorito?',
    remove: 'Se você me remover, vai ficar sem nenhum Pokémon favorito. Quer continuar?',
    like: 'Você quer me adicionar à sua lista de curtidos?',
    unlike: 'Você quer me remover da sua lista de curtidos?',
  }[action]
  const confirmLabel = {
    favorite: `Escolher ${name}`,
    remove: 'Remover favorito',
    like: `Curtir ${name}`,
    unlike: `Remover ${name} dos curtidos`,
  }[action]
  const replacing = action === 'favorite' && currentName
  return (
    <dialog
      ref={dialog}
      className="favorite-prompt"
      aria-labelledby="favorite-question"
      aria-describedby={replacing ? 'favorite-change' : undefined}
      onCancel={(event) => { if (saving) event.preventDefault() }}
      onClose={onClose}
    >
      <div className="favorite-conversation">
        <figure className="favorite-portrait">
          {pokemon.image && (
            <img
              src={pokemon.image}
              alt=""
              onError={(event) => {
                event.currentTarget.hidden = true
              }}
            />
          )}
          <figcaption>{name}</figcaption>
        </figure>
        <div className="favorite-bubble">
          <h2 id="favorite-question">{question}</h2>
          {replacing && (
            <p id="favorite-change">
              {name} vai substituir {displayName(replacing)} como seu favorito.
            </p>
          )}
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      <form className="favorite-prompt-actions" onSubmit={async (event) => {
        event.preventDefault()
        if (saving) return
        setSaving(true)
        setError('')
        try {
          await onConfirm()
          dialog.current?.close()
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'Falha ao salvar. Tente novamente.')
        } finally {
          setSaving(false)
        }
      }}>
        <button type="button" autoFocus disabled={saving} onClick={() => dialog.current?.close()}>Cancelar</button>
        <button disabled={saving}>{confirmLabel}</button>
      </form>
    </dialog>
  )
}
