import '@fontsource/pixelify-sans/latin-400.css'
import { useEffect, useRef } from 'react'
import { displayName, type Pokemon } from './catalog'
import './favorite-prompt.css'

type Props = {
  pokemon: Pick<Pokemon, 'id' | 'name' | 'image'>
  currentName?: string
  action: 'favorite' | 'remove' | 'like' | 'unlike'
  onConfirm: () => void
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
      <form method="dialog" className="favorite-prompt-actions">
        <button autoFocus>Cancelar</button>
        <button onClick={onConfirm}>{confirmLabel}</button>
      </form>
    </dialog>
  )
}
