import { useCallback, useEffect, useRef, useState } from 'react'
import type { Evolution, Pokemon } from './catalog'
import {
  displayName,
  listRegion,
  listType,
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
type Filters = { region: string; type: string; search: string; page: number }
const pageSize = 12

function readFilters(): Filters {
  const url = new URLSearchParams(location.search)
  const region = url.get('regiao') || 'kanto'
  const type = url.get('tipo') || ''
  const page = Number(url.get('pagina'))
  return {
    region:
      region === 'all' || regions.some(([key]) => key === region)
        ? region
        : 'kanto',
    type: Object.hasOwn(typeLabels, type) ? type : '',
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
function Chain({ item }: { item: Evolution }) {
  return (
    <li>
      <span>{displayName(item.name)}</span>
      {item.next.length > 0 && (
        <ul>
          {item.next.map((child) => (
            <Chain key={child.id} item={child} />
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
              <h3>Cadeia de evolução</h3>
              {request.data.tree ? (
                <ul className="dex-chain">
                  <Chain item={request.data.tree} />
                </ul>
              ) : (
                <p>Cadeia indisponível.</p>
              )}
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
      regiao: next.region === 'kanto' ? '' : next.region,
      tipo: next.type,
      busca: next.search,
      pagina: next.page === 1 ? '' : String(next.page),
    }
    Object.entries(params).forEach(([k, v]) =>
      v ? url.searchParams.set(k, v) : url.searchParams.delete(k),
    )
    if (replace) history.replaceState(history.state, '', url)
    else history.pushState(history.state, '', url)
  }
  const index = useRequest(
    useCallback(async () => {
      const [all, typed] = await Promise.all([
        listRegion(filters.region),
        filters.type ? listType(filters.type) : null,
      ])
      return { all, typed }
    }, [filters.region, filters.type]),
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
        <label className="dex-region">
          <span>Região</span>
          <select
            value={filters.region}
            onChange={(e) => update({ region: e.target.value })}
          >
            <option value="all">Todas as regiões</option>
            {regions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
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
        <select
          aria-label="Filtrar por tipo"
          value={filters.type}
          onChange={(e) => update({ type: e.target.value })}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(typeLabels)
            .sort((a, b) => a[1].localeCompare(b[1], 'pt'))
            .map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
        </select>
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
              onClick={() => update({ search: '', type: '', region: 'all' })}
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
