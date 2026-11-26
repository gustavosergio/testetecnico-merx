import { useEffect, useState } from 'react'
import { communityRequest } from './trainer'
import { displayName } from './catalog'

type Entry = { id: number; name: string; votes: number }
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
export default function Community({ revision = 0 }: { revision?: number }) {
  const [ranking, setRanking] = useState<Entry[] | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    setRanking(null)
    communityRequest<Entry[]>('ranking', undefined, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setRanking(data)
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError('Não foi possível carregar o ranking.')
      })
    return () => controller.abort()
  }, [revision, attempt])
  return (
    <section className="community" aria-labelledby="community-title">
      <h2 id="community-title">Favoritos da comunidade</h2>
      <p>Os cinco Pokémon mais escolhidos pelos treinadores.</p>
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
          {ranking.length === 0 && (
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
                  {ranking[i] ? (
                    <Art entry={ranking[i]} />
                  ) : (
                    <span aria-hidden="true">◇</span>
                  )}
                </div>
                <strong>
                  {ranking[i] ? displayName(ranking[i].name) : 'Em aberto'}
                </strong>
                <span>{votes(ranking[i]?.votes ?? 0)}</span>
              </li>
            ))}
          </ol>
          <ol className="ranking-rest" start={4}>
            {[3, 4].map((i) => (
              <li key={i}>
                <b>{i + 1}º</b>
                {ranking[i] && <Art entry={ranking[i]} />}
                <strong>
                  {ranking[i] ? displayName(ranking[i].name) : 'Em aberto'}
                </strong>
                <span>{votes(ranking[i]?.votes ?? 0)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
