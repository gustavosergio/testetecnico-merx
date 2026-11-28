import { useEffect, useState } from 'react'
import { communityRequest } from './trainer'
import { displayName } from './catalog'

type Entry = { id: number; name: string; votes: number; voters: string[] }
type Ranking = { totalVotes: number; distinctPokemon: number; entries: Entry[] }
function Art({ entry }: { entry: Entry }) {
  return (
    <img
      alt=""
      loading="lazy"
      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.id}.png`}
    />
  )
}
function votes(n: number) {
  return n === 1 ? '1 favorito' : n + ' favoritos'
}
function Voters({ entry }: { entry: Entry }) {
  return (
    <details className="ranking-voters">
      <summary aria-label={`Quem votou em ${displayName(entry.name)}`}>Quem votou</summary>
      <p>{entry.voters.join(', ')}</p>
    </details>
  )
}
export default function Community({ revision = 0 }: { revision?: number }) {
  const [ranking, setRanking] = useState<Ranking | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    setRanking(null)
    communityRequest<Ranking>('ranking?details=1', undefined, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setRanking(data)
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError('Não foi possível carregar o ranking.')
      })
    return () => controller.abort()
  }, [revision, attempt])
  const entries = ranking?.entries ?? []
  return (
    <section className="community community-stadium" aria-labelledby="community-title">
      <div className="scenery-panel stadium-ranking">
        <h2 id="community-title">Favoritos da comunidade</h2>
        <p>Até 10 Pokémon mais escolhidos pelos treinadores.</p>
        {error ? (
          <div role="alert">
            {error}{' '}
            <button
              className="trainer-primary"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : !ranking ? (
          <p role="status">Contando votos…</p>
        ) : (
          <>
            <dl className="ranking-totals">
              <div><dt>Total de votos</dt><dd>{ranking.totalVotes}</dd></div>
              <div><dt>Pokémon diferentes</dt><dd>{ranking.distinctPokemon}</dd></div>
            </dl>
            {entries.length === 0 && (
              <p className="ranking-empty">
                O pódio espera pelo primeiro voto. Escolha seu favorito no
                catálogo!
              </p>
            )}
            <ol className="community-podium">
              {[0, 1, 2].map((i) => (
                <li key={i} className={'podium-place place-' + (i + 1)}>
                  <span className="podium-number">{i + 1}º</span>
                  <div className="podium-art">
                    {entries[i] ? (
                      <Art entry={entries[i]} />
                    ) : (
                      <span aria-hidden="true">◇</span>
                    )}
                  </div>
                  <strong>
                    {entries[i] ? displayName(entries[i].name) : 'Em aberto'}
                  </strong>
                  <span className="ranking-count">{votes(entries[i]?.votes ?? 0)}</span>
                  {entries[i] && <Voters entry={entries[i]} />}
                </li>
              ))}
            </ol>
            <ol className="ranking-rest" start={4}>
              {Array.from({ length: 7 }, (_, index) => index + 3).map((i) => (
                <li key={i}>
                  <b>{i + 1}º</b>
                  {entries[i] && <Art entry={entries[i]} />}
                  <strong>
                    {entries[i] ? displayName(entries[i].name) : 'Em aberto'}
                  </strong>
                  <span className="ranking-count">{votes(entries[i]?.votes ?? 0)}</span>
                  {entries[i] && <Voters entry={entries[i]} />}
                </li>
              ))}
            </ol>
            <p><strong>Critério de desempate.</strong> Se dois Pokémon têm o mesmo número de votos, o de menor número na Pokédex fica na frente.</p>
          </>
        )}
      </div>
    </section>
  )
}
