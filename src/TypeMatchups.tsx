import { useEffect, useState } from 'react'
import { loadTypeMatchups, typeLabels } from './catalog'
import './matchups.css'

const options = Object.entries(typeLabels).sort((a, b) =>
  a[1].localeCompare(b[1], 'pt-BR'),
)

function TypeIcon({ type }: { type: string }) {
  return <img src={`/art/types/${type}.png`} width="24" height="24" alt="" />
}

function TypeList({
  title,
  types,
  empty,
}: {
  title: string
  types: string[]
  empty: string
}) {
  return (
    <section className="matchup-result">
      <h3>{title}</h3>
      {types.length ? (
        <ul>
          {types.map((type) => (
            <li key={type}>
              <TypeIcon type={type} />
              {typeLabels[type]}
            </li>
          ))}
        </ul>
      ) : (
        <p>{empty}</p>
      )}
    </section>
  )
}

export default function TypeMatchups() {
  const [type, setType] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{
    type: string
    attempt: number
    data?: Awaited<ReturnType<typeof loadTypeMatchups>>
  }>()
  useEffect(() => {
    if (!type) return
    let active = true
    loadTypeMatchups(type)
      .then((data) => {
        if (active) setResult({ type, attempt, data })
      })
      .catch(() => {
        if (active) setResult({ type, attempt })
      })
    return () => {
      active = false
    }
  }, [type, attempt])
  const current =
    result?.type === type && result.attempt === attempt ? result : undefined

  return (
    <section
      className="community type-matchups"
      aria-labelledby="matchups-title"
    >
      <div className="scenery-panel">
        <h2 id="matchups-title">Vantagens e fraquezas</h2>
        <p>
          Escolha um tipo para conferir suas vantagens no ataque e fraquezas na
          defesa.
        </p>
        <div className="matchup-picker" role="group" aria-label="Escolher tipo">
          {options.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={type === key}
              onClick={() => setType(key)}
            >
              <TypeIcon type={key} />
              {label}
            </button>
          ))}
        </div>
        {type && (
          <div className="matchup-results" aria-live="polite">
            {!current ? (
              <p>Consultando {typeLabels[type]}…</p>
            ) : !current.data ? (
              <div>
                <p>Não foi possível consultar esse tipo.</p>
                <button
                  type="button"
                  className="trainer-primary"
                  onClick={() => setAttempt(attempt + 1)}
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <TypeList
                  title="Vantagem"
                  types={current.data.strongAgainst}
                  empty="Nenhum tipo recebe dano dobrado desse ataque."
                />
                <TypeList
                  title="Desvantagem"
                  types={current.data.weakAgainst}
                  empty="Nenhum tipo causa dano dobrado contra ele."
                />
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
