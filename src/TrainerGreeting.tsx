import { useEffect, useRef, useState } from 'react'
import './trainer-greeting.css'

const storageKey = 'merxdex-trainer-name'

function readName() {
  try {
    return localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

export default function TrainerGreeting() {
  const [name, setName] = useState(readName)
  const [draft, setDraft] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const prompt = dialog.current
    if (name === null && prompt && !prompt.open) prompt.showModal()
  }, [name])

  function finish(value: string) {
    setName(value)
    dialog.current?.close()
    try {
      localStorage.setItem(storageKey, value)
    } catch {
      // The greeting is still available on the current page.
    }
  }

  return (
    <>
      {name && <p className="trainer-greeting">Olá, <strong>{name}</strong>!</p>}
      {name === null && (
        <dialog
          ref={dialog}
          className="trainer-welcome"
          aria-labelledby="trainer-welcome-title"
          onCancel={(event) => {
            event.preventDefault()
            finish('')
          }}
        >
          <form onSubmit={(event) => {
            event.preventDefault()
            if (draft.trim()) finish(draft.trim())
          }}>
            <h2 id="trainer-welcome-title">Como você gostaria de ser chamado, treinador?</h2>
            <label htmlFor="trainer-name">Seu nome</label>
            <input
              id="trainer-name"
              value={draft}
              maxLength={32}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="trainer-welcome-actions">
              <button type="button" onClick={() => finish('')}>Pular</button>
              <button type="submit" disabled={!draft.trim()}>Continuar</button>
            </div>
          </form>
        </dialog>
      )}
    </>
  )
}
