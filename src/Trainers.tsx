import { useState } from 'react'
import { avatarImage, communityRequest } from './trainer'
import { displayName } from './catalog'

type PublicTrainer = {
  description: string | null
  goNick: string | null
  name: string
  avatar: number
  favorite: { id: number; name: string } | null
}

const historyKey = 'merxdex-trainer-search-history'
const historyLimit = 10

function readHistory(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(historyKey) ?? '[]')
    return Array.isArray(saved)
      ? saved
          .filter(
            (term): term is string =>
              typeof term === 'string' && !!term.trim() && term.length <= 40,
          )
          .slice(0, historyLimit)
      : []
  } catch {
    return []
  }
}

function storeHistory(terms: string[]) {
  try {
    if (terms.length) localStorage.setItem(historyKey, JSON.stringify(terms))
    else localStorage.removeItem(historyKey)
  } catch {
    // The history stays available in the current view.
  }
}

export default function Trainers() {
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState(readHistory)
  const [results, setResults] = useState<PublicTrainer[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function search(value: string) {
    const term = value.trim()
    if (!term || busy) return
    setQuery(term)
    const normalize = (value: string) => value.normalize('NFKC').toLowerCase()
    const next = [
      term,
      ...history.filter((entry) => normalize(entry) !== normalize(term)),
    ].slice(0, historyLimit)
    setHistory(next)
    storeHistory(next)
    setBusy(true)
    setError(false)
    setResults(null)
    try {
      const params = new URLSearchParams({ q: term })
      setResults(await communityRequest<PublicTrainer[]>('trainers?' + params))
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="community trainer-directory"
      aria-labelledby="trainer-directory-title"
    >
      <div className="trainer-directory-panel">
        <h2 id="trainer-directory-title">Pesquisar treinadores</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void search(query)
          }}
        >
          <label htmlFor="trainer-search">Nome de treinador</label>
          <div className="trainer-search-row">
            <input
              id="trainer-search"
              type="search"
              required
              maxLength={40}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className="trainer-primary"
              disabled={busy || !query.trim()}
            >
              Pesquisar
            </button>
          </div>
        </form>
        {history.length > 0 && (
          <section
            className="trainer-history"
            aria-labelledby="trainer-history-title"
          >
            <div className="trainer-history-heading">
              <h3 id="trainer-history-title">Buscas recentes</h3>
              <button
                type="button"
                onClick={() => {
                  setHistory([])
                  storeHistory([])
                }}
              >
                Limpar histórico
              </button>
            </div>
            <ul>
              {history.map((term) => (
                <li key={term}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void search(term)}
                  >
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {busy && <p role="status">Buscando treinadores…</p>}
        {error && (
          <p role="alert">
            Não foi possível buscar treinadores. Tente novamente.
          </p>
        )}
        {results?.length === 0 && (
          <p role="status">Nenhum treinador encontrado.</p>
        )}
        {!!results?.length && (
          <ul className="trainer-results">
            {results.map((profile) => (
              <li key={profile.name}>
                <img
                  src={avatarImage(profile.avatar)}
                  alt=""
                  width="66"
                  height="66"
                />
                <div>
                  <strong>{profile.name}</strong>
                  {profile.favorite && (
                    <p>Favorito: {displayName(profile.favorite.name)}</p>
                  )}
                  {profile.goNick && <p>Pokémon GO: {profile.goNick}</p>}
                  {profile.description && (
                    <p className="public-bio">{profile.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
