import { useCallback, useEffect, useRef, useState } from 'react'
import type { Evolution, Pokemon } from './catalog'
import {
  displayName,
  loadCatalogIndex,
  loadDetails,
  loadPokemon,
  numberLabel,
  regions,
  selectEntries,
  typeLabels,
} from './catalog'
import './catalog.css'

type Props = {
  favorite: number | null
  onFavorite: (id: number, name: string) => void
}
type Filters = {
  regions: string[]
  types: string[]
  search: string
  page: number
}
const pageSize = 12

function readFilters(): Filters {
  const url = new URLSearchParams(location.search)
  const validRegions = new Set(url.getAll('regiao'))
  const validTypes = new Set(url.getAll('tipo'))
  const page = Number(url.get('pagina'))
  return {
    regions: regions.map(([key]) => key).filter((key) => validRegions.has(key)),
    types: Object.keys(typeLabels).filter((key) => validTypes.has(key)),
    search: url.get('busca') || '',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  }
}
function useRequest<T>(load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{
    load: typeof load
    attempt: number
    data?: T
    error?: boolean
  }>()
  useEffect(() => {
    let current = true
    load()
      .then((data) => {
        if (current) setResult({ load, attempt, data })
      })
      .catch(() => {
        if (current) setResult({ load, attempt, error: true })
      })
    return () => {
      current = false
    }
  }, [load, attempt])
  const state =
    result?.load === load && result.attempt === attempt ? result : undefined
  return {
    data: state?.data,
    error: state?.error,
    retry: () => setAttempt((a) => a + 1),
  }
}
function ErrorPanel({ retry }: { retry: () => void }) {
  return (
    <div className="dex-message" role="alert">
      <strong>Falha ao acessar a PokéAPI</strong>
      <span>Confira sua conexão e tente de novo.</span>
      <button onClick={retry}>Tentar novamente</button>
    </div>
  )
}
function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  )
}
function Types({ types }: { types: string[] }) {
  return (
    <span className="dex-types">
      {types.map((type) => (
        <span className={'dex-type dex-type-' + type} key={type}>
          {typeLabels[type] ?? type}
        </span>
      ))}
    </span>
  )
}
function Art({ pokemon }: { pokemon: Pokemon }) {
  return pokemon.image ? (
    <img src={pokemon.image} alt="" decoding="async" />
  ) : (
    <span>Sem imagem</span>
  )
}
function Chain({ item, currentId }: { item: Evolution; currentId: number }) {
  const stage = useRequest(
    useCallback(() => loadPokemon(String(item.id)), [item.id]),
  )
  return (
    <li>
      <div
        className="dex-stage"
        aria-current={item.id === currentId ? 'true' : undefined}
      >
        <div className="dex-stage-art">
          {stage.data ? (
            <Art pokemon={stage.data} />
          ) : (
            <span aria-hidden="true">{numberLabel(item.id)}</span>
          )}
        </div>
        <strong>{displayName(item.name)}</strong>
        <small>{numberLabel(item.id)}</small>
        {stage.data && <Types types={stage.data.types} />}
        {stage.error && (
          <button type="button" onClick={stage.retry}>
            Tentar novamente
          </button>
        )}
      </div>
      {item.next.length > 0 && (
        <ul>
          {item.next.map((child) => (
            <Chain key={child.id} item={child} currentId={currentId} />
          ))}
        </ul>
      )}
    </li>
  )
}
function Details({
  pokemon,
  favorite,
  onFavorite,
  close,
}: Props & { pokemon: Pokemon; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const request = useRequest(
    useCallback(() => loadDetails(pokemon.speciesUrl), [pokemon.speciesUrl]),
  )
  useEffect(() => {
    const modal = dialog.current
    modal?.showModal()
    return () => modal?.close()
  }, [])
  return (
    <dialog
      className="dex-detail"
      ref={dialog}
      aria-labelledby="dex-detail-name"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="dex-detail-body">
        <button
          className="dex-close"
          type="button"
          aria-label="Fechar detalhes"
          onClick={close}
        >
          ×
        </button>
        <div className="dex-detail-img">
          <Art pokemon={pokemon} />
        </div>
        <div className="dex-detail-info">
          <small>{numberLabel(pokemon.id)}</small>
          <h2 id="dex-detail-name">{displayName(pokemon.name)}</h2>
          <Types types={pokemon.types} />
          <p>
            {pokemon.height.toLocaleString('pt-BR')} m{' '}
            <span aria-hidden="true"> · </span>{' '}
            {pokemon.weight.toLocaleString('pt-BR')} kg
          </p>
          {request.error ? (
            <ErrorPanel retry={request.retry} />
          ) : !request.data ? (
            <p role="status">Lendo ficha da espécie…</p>
          ) : (
            <>
              <h3>Descrição da espécie</h3>
              <p lang={request.data.lang}>
                {request.data.description || 'Descrição indisponível.'}
              </p>
              <section
                className="dex-evolution"
                aria-labelledby="dex-evolution-title"
              >
                <h3 id="dex-evolution-title">Cadeia de evolução</h3>
                {request.data.tree ? (
                  <ul className="dex-chain">
                    <Chain item={request.data.tree} currentId={pokemon.id} />
                  </ul>
                ) : (
                  <p>Cadeia indisponível.</p>
                )}
              </section>
            </>
          )}
          <button
            className="dex-primary"
            disabled={favorite === pokemon.id}
            onClick={() => {
              close()
              onFavorite(pokemon.id, pokemon.name)
            }}
          >
            <Heart filled={favorite === pokemon.id} />
            {favorite === pokemon.id
              ? 'Seu favorito'
              : 'Escolher como favorito'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
function CardGrid({
  ids,
  favorite,
  onFavorite,
  open,
}: Props & { ids: string; open: (p: Pokemon) => void }) {
  const request = useRequest(
    useCallback(() => Promise.all(ids.split(',').map(loadPokemon)), [ids]),
  )
  if (request.error) return <ErrorPanel retry={request.retry} />
  if (!request.data)
    return (
      <div className="dex-message" role="status">
        Carregando Pokémon…
      </div>
    )
  return (
    <div className="dex-grid">
      {request.data.map((p) => (
        <article className="dex-card" key={p.id}>
          <button
            className="dex-card-main"
            onClick={() => open(p)}
            aria-label={'Ver detalhes de ' + displayName(p.name)}
          >
            <span className="dex-card-number">{numberLabel(p.id)}</span>
            <span className="dex-art">
              <Art pokemon={p} />
            </span>
            <strong>{displayName(p.name)}</strong>
            <Types types={p.types} />
          </button>
          <button
            className="dex-heart"
            aria-label={
              (favorite === p.id ? 'Favorito atual: ' : 'Favoritar ') +
              displayName(p.name)
            }
            aria-pressed={favorite === p.id}
            onClick={() => {
              if (favorite !== p.id) onFavorite(p.id, p.name)
            }}
          >
            <Heart filled={favorite === p.id} />
          </button>
        </article>
      ))}
    </div>
  )
}
type Option = readonly [string, string]
const regionOptions: Option[] = regions.map(([key, label]) => [key, label])
const typeOptions = Object.entries(typeLabels).sort((a, b) =>
  a[1].localeCompare(b[1], 'pt'),
)

function FilterChoices({
  label,
  unrestricted,
  options,
  selected,
  onChange,
}: {
  label: string
  unrestricted: string
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const labels = options
    .filter(([key]) => selected.includes(key))
    .map(([, name]) => name)
  return (
    <details className="dex-choices">
      <summary>
        <strong>{label}</strong>
        <span>{labels.join(', ') || unrestricted}</span>
      </summary>
      <div role="group" aria-label={label} className="dex-options">
        {options.map(([key, name]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={selected.includes(key)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, key]
                    : selected.filter((value) => value !== key),
                )
              }
            />
            {name}
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={!selected.length}
        onClick={() => onChange([])}
      >
        Limpar {label.toLowerCase()}
      </button>
    </details>
  )
}
export default function Catalog({ favorite, onFavorite }: Props) {
  const [filters, setFilters] = useState(readFilters)
  const [detail, setDetail] = useState<Pokemon | null>(null)
  const listStart = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sync = () => setFilters(readFilters())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
  const update = (patch: Partial<Filters>, replace = false) => {
    const next = { ...filters, page: 1, ...patch }
    setFilters(next)
    const url = new URL(location.href)
    const params = {
      regiao: next.regions,
      tipo: next.types,
      busca: next.search ? [next.search] : [],
      pagina: next.page === 1 ? [] : [String(next.page)],
    }
    for (const [key, values] of Object.entries(params)) {
      url.searchParams.delete(key)
      for (const value of values) url.searchParams.append(key, value)
    }
    if (replace) history.replaceState(history.state, '', url)
    else history.pushState(history.state, '', url)
  }
  const index = useRequest(
    useCallback(
      () => loadCatalogIndex(filters.regions, filters.types),
      [filters.regions, filters.types],
    ),
  )
  const entries = index.data
    ? selectEntries(index.data.all, filters.search, index.data.typed)
    : []
  const pages = Math.max(1, Math.ceil(entries.length / pageSize))
  const page = Math.min(filters.page, pages)
  const ids = entries
    .slice((page - 1) * pageSize, page * pageSize)
    .map((p) => p.id)
    .join(',')
  const move = (target: number) => {
    update({ page: target })
    listStart.current?.scrollIntoView({ block: 'start' })
    listStart.current?.focus({ preventScroll: true })
  }
  return (
    <section className="dex-catalog" aria-label="Catálogo regional">
      <div className="dex-catalog-head">
        <div>
          <h2>Catálogo regional</h2>
          <p aria-live="polite">
            {index.data
              ? entries.length.toLocaleString('pt-BR') + ' espécies'
              : 'Consultando espécies…'}
          </p>
        </div>
      </div>
      <div className="dex-filters">
        <label className="dex-search">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="6.5" />
            <path d="m15 15 6 6" />
          </svg>
          <input
            autoComplete="off"
            type="search"
            placeholder="Buscar por nome ou número"
            aria-label="Buscar Pokémon por nome ou número"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value }, true)}
          />
        </label>
      </div>
      <div className="dex-filter-groups">
        <FilterChoices
          label="Regiões"
          unrestricted="Todas as regiões"
          options={regionOptions}
          selected={filters.regions}
          onChange={(regions) => update({ regions })}
        />
        <FilterChoices
          label="Tipos"
          unrestricted="Todos os tipos"
          options={typeOptions}
          selected={filters.types}
          onChange={(types) => update({ types })}
        />
      </div>
      <div ref={listStart} tabIndex={-1} className="dex-results">
        {index.error ? (
          <ErrorPanel retry={index.retry} />
        ) : !index.data ? (
          <div className="dex-message" role="status">
            Carregando catálogo…
          </div>
        ) : !entries.length ? (
          <div className="dex-message" role="status">
            <strong>Nenhum Pokémon encontrado</strong>
            <span>Altere a região, o tipo ou o termo de busca.</span>
            <button
              onClick={() => update({ search: '', types: [], regions: [] })}
            >
              Ver todas as espécies
            </button>
          </div>
        ) : (
          <CardGrid
            ids={ids}
            favorite={favorite}
            onFavorite={onFavorite}
            open={setDetail}
          />
        )}
      </div>
      {entries.length > 0 && (
        <nav className="dex-pages" aria-label="Paginação">
          <button disabled={page <= 1} onClick={() => move(page - 1)}>
            Anterior
          </button>
          <span>
            Página {page} de {pages}
          </span>
          <button disabled={page >= pages} onClick={() => move(page + 1)}>
            Próxima
          </button>
        </nav>
      )}
      {detail && (
        <Details
          pokemon={detail}
          favorite={favorite}
          onFavorite={onFavorite}
          close={() => setDetail(null)}
        />
      )}
    </section>
  )
}
