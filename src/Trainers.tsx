import { useState } from 'react'
import { avatarImage, communityRequest } from './trainer'
import { displayName } from './catalog'

type PublicTrainer = {
  name: string
  avatar: number
  favorite: { id: number; name: string } | null
}

export default function Trainers() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicTrainer[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function search() {
    setBusy(true)
    setError(false)
    setResults(null)
    try {
      const params = new URLSearchParams({ q: query.trim() })
      setResults(await communityRequest<PublicTrainer[]>('trainers?' + params))
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="community trainer-directory" aria-labelledby="trainer-directory-title">
      <h2 id="trainer-directory-title">Pesquisar treinadores</h2>
      <form onSubmit={event => { event.preventDefault(); void search() }}>
        <label htmlFor="trainer-search">Nome de treinador</label>
        <div className="trainer-search-row">
          <input id="trainer-search" type="search" required maxLength={40} value={query}
            onChange={event => setQuery(event.target.value)} />
          <button className="trainer-primary" disabled={busy || !query.trim()}>Pesquisar</button>
        </div>
      </form>
      {busy && <p role="status">Buscando treinadores…</p>}
      {error && <p role="alert">Não foi possível buscar treinadores. Tente novamente.</p>}
      {results?.length === 0 && <p role="status">Nenhum treinador encontrado.</p>}
      {!!results?.length && <ul className="trainer-results">
        {results.map(profile => <li key={profile.name}>
          <img src={avatarImage(profile.avatar)} alt="" width="66" height="66" />
          <div><strong>{profile.name}</strong>
          {profile.favorite && <p>Favorito: {displayName(profile.favorite.name)}</p>}
          </div>
        </li>)}
      </ul>}
    </section>
  )
}
