import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-600.css'
import '@fontsource/barlow/latin-700.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Catalog, { FavoriteDetails, LoveBall, MasterBall } from './Catalog'
import { displayName, numberLabel, type Pokemon } from './catalog'
import FavoritePrompt from './FavoritePrompt'
import Device from './Device'
import TypeMatchups from './TypeMatchups'
import TrainerGreeting from './TrainerGreeting'
import PersonalStory from './PersonalStory'
import './shell.css'
import './theme.css'

function ThemeSwitch() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('merxdex-theme')
      if (saved === 'light' || saved === 'dark') return saved === 'dark'
    } catch {}
    return false
  })
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  return (
    <button
      className="theme-switch"
      type="button"
      aria-label={dark ? 'Alterar tema para claro' : 'Alterar tema para escuro'}
      title={
        dark
          ? 'Ativar tema claro · Quick Ball'
          : 'Ativar tema escuro · Dusk Ball'
      }
      onClick={() => {
        try {
          localStorage.setItem('merxdex-theme', dark ? 'light' : 'dark')
        } catch {}
        setDark(!dark)
      }}
    >
      <img
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${dark ? 'quick' : 'dusk'}-ball.png`}
        width="42"
        height="42"
        alt=""
      />
      <span>Alterar tema</span>
    </button>
  )
}

const mainLinks = [
  { href: '#pokedex', label: 'Pokédex', icon: '/art/nav-pokedex.webp' },
  { href: '#tipos', label: 'Tipos', icon: '/art/nav-types.webp' },
  { href: '#curtidos', label: 'Curtidos', icon: null },
  { href: '#favorito', label: 'Meu favorito', icon: null },
] as const

function FavoriteIcon({ id }: { id: number }) {
  const [portraitFailed, setPortraitFailed] = useState(false)
  const [spriteFailed, setSpriteFailed] = useState(false)
  if (spriteFailed) return <MasterBall />

  const portraitId = String(id).padStart(4, '0')
  const src = portraitFailed
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
    : `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${portraitId}/Normal.png`
  return (
    <img
      className="favorite-nav-icon"
      src={src}
      width="22"
      height="22"
      alt=""
      onError={() => {
        if (portraitFailed) setSpriteFailed(true)
        else setPortraitFailed(true)
      }}
    />
  )
}

function Navigation({
  page,
  favoriteId,
  close,
}: {
  page: string
  favoriteId?: number
  close?: () => void
}) {
  const active =
    page === '#sobre' || mainLinks.some((link) => link.href === page)
      ? page
      : '#pokedex'
  return (
    <nav
      aria-label="Navegação principal"
      className={close ? 'mobile-nav' : 'desktop-nav'}
    >
      {mainLinks.map(({ href, label, icon }) => (
        <a
          href={href}
          key={href}
          aria-current={active === href ? 'page' : undefined}
          onClick={close}
        >
          {icon ? (
            <img src={icon} width="19" height="19" alt="" style={{ objectFit: 'contain' }} />
          ) : href === '#curtidos' ? (
            <LoveBall />
          ) : favoriteId ? (
            <FavoriteIcon key={favoriteId} id={favoriteId} />
          ) : (
            <MasterBall />
          )}
          {label}
        </a>
      ))}
      {close && (
        <a
          href="#sobre"
          aria-current={active === '#sobre' ? 'page' : undefined}
          onClick={close}
        >
          Relato pessoal
        </a>
      )}
    </nav>
  )
}

function MobileMenu({ page, favoriteId }: { page: string; favoriteId?: number }) {
  const menu = useRef<HTMLDetailsElement>(null)
  const toggle = useRef<HTMLElement>(null)
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (
        menu.current?.open &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      ) {
        menu.current.open = false
      }
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [])
  const close = () => {
    if (menu.current) menu.current.open = false
    toggle.current?.focus()
  }
  return (
    <details
      className="mast-menu"
      ref={menu}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && menu.current?.open) {
          event.preventDefault()
          close()
        }
      }}
    >
      <summary ref={toggle} aria-label="Menu de navegação">
        <span aria-hidden="true">⋮</span>
      </summary>
      <Navigation page={page} favoriteId={favoriteId} close={close} />
    </details>
  )
}

type SavedPokemon = Pick<Pokemon, 'id' | 'name'>
type FavoriteCandidate = SavedPokemon & Pick<Pokemon, 'image'>
type Selection = { pokemon: FavoriteCandidate; action: 'like' | 'unlike' | 'favorite' }

const favoriteKey = 'merxdex-favorite'
const likesKey = 'merxdex-likes'

function isSavedPokemon(value: unknown): value is SavedPokemon {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'number' &&
    Number.isSafeInteger(value.id) &&
    value.id > 0 &&
    'name' in value &&
    typeof value.name === 'string'
  )
}

function readFavorite(): SavedPokemon | null {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(favoriteKey) ?? 'null')
    return isSavedPokemon(saved) ? saved : null
  } catch {
    return null
  }
}

function readLikes(): SavedPokemon[] {
  try {
    const stored = localStorage.getItem(likesKey)
    if (stored === null) {
      const previousFavorite = readFavorite()
      return previousFavorite ? [previousFavorite] : []
    }
    const saved: unknown = JSON.parse(stored)
    if (Array.isArray(saved)) {
      return [...new Map(saved.filter(isSavedPokemon).map((pokemon) => [pokemon.id, pokemon])).values()]
    }
  } catch {
    // Storage may be unavailable or contain an invalid entry.
  }
  return []
}

function LikedList({
  likes,
  onUnlike,
}: {
  likes: SavedPokemon[]
  onUnlike: (pokemon: SavedPokemon) => void
}) {
  return (
    <section className="dex-detail favorite-page" aria-labelledby="likes-title">
      <h1 id="likes-title">Curtidos</h1>
      {likes.length ? (
        <ul className="liked-list">
          {likes.map((pokemon) => {
            const name = displayName(pokemon.name)
            return (
              <li key={pokemon.id}>
                <a href={`/?busca=${pokemon.id}#pokedex`}>
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                    alt=""
                    width="42"
                    height="42"
                    loading="lazy"
                    onError={(event) => { event.currentTarget.hidden = true }}
                  />
                  <span>{name} <small>{numberLabel(pokemon.id)}</small></span>
                </a>
                <button
                  className="dex-like"
                  type="button"
                  aria-label={`Descurtir ${name}`}
                  onClick={() => onUnlike(pokemon)}
                >
                  <LoveBall />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="favorite-page-empty">
          <p>Você ainda não curtiu nenhum Pokémon.</p>
          <a href="/#pokedex">Explorar a Pokédex</a>
        </div>
      )}
    </section>
  )
}

function officialArtwork(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

function FavoritePage({
  favorite,
  likedIds,
  onLike,
  onFavorite,
}: {
  favorite: SavedPokemon | null
  likedIds: ReadonlySet<number>
  onLike: (pokemon: SavedPokemon) => void
  onFavorite: (pokemon: FavoriteCandidate) => void
}) {
  const image = favorite ? officialArtwork(favorite.id) : null

  return (
    <section className="dex-detail favorite-page" aria-labelledby="favorite-page-title">
      <h1 id="favorite-page-title">Meu favorito</h1>
      {favorite ? (
        <>
          <FavoriteDetails
            key={favorite.id}
            id={favorite.id}
            favorite={favorite.id}
            likedIds={likedIds}
            onLike={onLike}
            onFavorite={onFavorite}
          />
          <div className="favorite-page-actions">
            <a href={`/?busca=${favorite.id}#pokedex`}>Ver na Pokédex</a>
            <button type="button" onClick={() => onFavorite({ ...favorite, image })}>
              <MasterBall />
              Remover dos favoritos
            </button>
          </div>
        </>
      ) : (
        <div className="favorite-page-empty">
          <p>Você ainda não tem um Pokémon favorito.</p>
          <a href="/#pokedex">Explorar a Pokédex</a>
        </div>
      )}
    </section>
  )
}

function App() {
  const [page, setPage] = useState(location.hash)
  const main = useRef<HTMLElement>(null)
  const [favorite, setFavorite] = useState(readFavorite)
  const [likes, setLikes] = useState(readLikes)
  const likedIds = new Set(likes.map(({ id }) => id))
  const [selection, setSelection] = useState<Selection | null>(null)
  const removing = selection?.action === 'favorite' && selection.pokemon.id === favorite?.id

  function saveLike({ id, name }: SavedPokemon, liked: boolean) {
    if (likedIds.has(id) === liked) return
    const next = liked
      ? [...likes, { id, name }]
      : likes.filter((pokemon) => pokemon.id !== id)
    setLikes(next)
    try {
      localStorage.setItem(likesKey, JSON.stringify(next))
    } catch {
      // Likes remain available until the page closes.
    }
  }

  function toggleLike(pokemon: SavedPokemon & { image?: string | null }) {
    if (likedIds.has(pokemon.id)) {
      saveLike(pokemon, false)
      return
    }
    setSelection({ pokemon: { ...pokemon, image: pokemon.image ?? null }, action: 'like' })
  }

  function askUnlike(pokemon: SavedPokemon) {
    setSelection({
      pokemon: { ...pokemon, image: officialArtwork(pokemon.id) },
      action: 'unlike',
    })
  }

  function askFavorite(pokemon: FavoriteCandidate) {
    setSelection({ pokemon, action: 'favorite' })
  }

  useEffect(() => {
    try {
      if (localStorage.getItem(likesKey) === null) {
        localStorage.setItem(likesKey, JSON.stringify(likes))
      }
    } catch {
      // Likes remain available until the page closes.
    }
  }, [likes])

  function saveFavorite({ id, name }: FavoriteCandidate) {
    const next = removing ? null : { id, name }
    setFavorite(next)
    try {
      if (next) localStorage.setItem(favoriteKey, JSON.stringify(next))
      else localStorage.removeItem(favoriteKey)
    } catch {
      // The favorite remains available until the page closes.
    }
  }
  useEffect(() => {
    const navigate = () => {
      if (location.hash !== '#conteudo') setPage(location.hash)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])
  return (
    <>
      <a
        className="skip"
        href="#conteudo"
        onClick={(event) => {
          event.preventDefault()
          main.current?.focus({ preventScroll: true })
          main.current?.scrollIntoView({ block: 'start' })
        }}
      >
        Pular para o conteúdo
      </a>
      <header className="mast">
        <div className="mast-inner">
          <a className="brand" href="/" aria-label="MerxDex, início">
            <img src="/dex.svg" alt="" />
            Merx<span>Dex</span>
          </a>
          <div className="mast-links">
            <Navigation page={page} favoriteId={favorite?.id} />
            <ThemeSwitch />
          </div>
          <div className="mast-controls">
            <a
              className="about-link"
              href="#sobre"
              aria-current={page === '#sobre' ? 'page' : undefined}
            >
              Relato pessoal
            </a>
            <MobileMenu page={page} favoriteId={favorite?.id} />
          </div>
        </div>
      </header>
      <main ref={main} id="conteudo" className="main-wrap" tabIndex={-1}>
        <TrainerGreeting />
        {page === '#sobre' ? <PersonalStory /> : page === '#tipos' ? (
          <TypeMatchups />
        ) : page === '#curtidos' ? (
          <LikedList likes={likes} onUnlike={askUnlike} />
        ) : page === '#favorito' ? (
          <FavoritePage
            favorite={favorite}
            likedIds={likedIds}
            onLike={toggleLike}
            onFavorite={askFavorite}
          />
        ) : (
          <>
            <section className="hero" aria-labelledby="title">
              <div className="hero-copy">
                <div className="eyeline">
                  <i aria-hidden="true" /> MERXDEX
                </div>
                <h1 id="title">
                  Explore o mundo Pokémon<span>.</span>
                </h1>
                <p>
                  Busque por nome ou número, filtre por região ou tipo e
                  descubra como cada Pokémon evolui.
                </p>
              </div>
              <div className="device-stage">
                <Device />
              </div>
              <div className="vents" aria-hidden="true" />
            </section>
            <Catalog
              favorite={favorite?.id ?? null}
              likedIds={likedIds}
              onLike={toggleLike}
              onFavorite={askFavorite}
            />
          </>
        )}
      </main>
      {selection && (
        <FavoritePrompt
          pokemon={selection.pokemon}
          currentName={favorite?.name}
          action={removing ? 'remove' : selection.action}
          onConfirm={() => {
            if (selection.action === 'favorite') saveFavorite(selection.pokemon)
            else saveLike(selection.pokemon, selection.action === 'like')
          }}
          onClose={() => setSelection(null)}
        />
      )}
      <footer className="foot">
        <span>MerxDex</span>
        <a href="https://pokeapi.co/">Dados da PokéAPI</a>
      </footer>
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
