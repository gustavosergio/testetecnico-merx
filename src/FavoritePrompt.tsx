import { useEffect, useRef } from 'react'
import { displayName, type Pokemon } from './catalog'
import './favorite-prompt.css'

type Props = {
  pokemon: Pokemon
  currentName?: string
  onConfirm: () => void
  onClose: () => void
}

export default function FavoritePrompt({
  pokemon,
  currentName,
  onConfirm,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  const name = displayName(pokemon.name)
  return (
    <dialog
      ref={dialog}
      className="favorite-prompt"
      aria-labelledby="favorite-question"
      aria-describedby={currentName ? 'favorite-change' : undefined}
      onClose={onClose}
    >
      <div className="favorite-conversation">
        <figure className="favorite-portrait">
          {pokemon.image && <img src={pokemon.image} alt="" />}
          <figcaption>{name}</figcaption>
        </figure>
        <div className="favorite-bubble">
          <h2 id="favorite-question">Você quer me escolher como Pokémon favorito?</h2>
          {currentName && (
            <p id="favorite-change">
              {name} vai substituir {displayName(currentName)} como seu favorito.
            </p>
          )}
        </div>
      </div>
      <form method="dialog" className="favorite-prompt-actions">
        <button autoFocus>Cancelar</button>
        <button onClick={onConfirm}>Escolher {name}</button>
      </form>
    </dialog>
  )
}
