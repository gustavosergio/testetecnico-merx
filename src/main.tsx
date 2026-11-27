import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-600.css'
import '@fontsource/barlow/latin-700.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Catalog from './Catalog'
import { displayName } from './catalog'
import Device from './Device'
import TypeMatchups from './TypeMatchups'
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
      aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
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
    </button>
  )
}

const mainLinks = [
  { href: '#pokedex', label: 'Pokédex', icon: '/art/nav-pokedex.webp' },
  { href: '#tipos', label: 'Tipos', icon: '/art/nav-types.webp' },
] as const

function Navigation({ page, close }: { page: string; close?: () => void }) {
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
          <img src={icon} width="19" height="19" alt="" style={{ objectFit: 'contain' }} />
          {label}
        </a>
      ))}
      {close && (
        <a
          href="#sobre"
          aria-current={active === '#sobre' ? 'page' : undefined}
          onClick={close}
        >
          Sobre o projeto
        </a>
      )}
    </nav>
  )
}

function MobileMenu({ page }: { page: string }) {
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
      <Navigation page={page} close={close} />
    </details>
  )
}

const favoriteKey = 'merxdex-favorite'

function readFavorite(): { id: number; name: string } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(favoriteKey) ?? 'null')
    if (
      saved &&
      Number.isSafeInteger(saved.id) &&
      saved.id > 0 &&
      typeof saved.name === 'string'
    ) {
      return saved
    }
  } catch {
    // Storage may be unavailable or contain an invalid entry.
  }
  return null
}

function App() {
  const [page, setPage] = useState(location.hash)
  const [favorite, setFavorite] = useState(readFavorite)

  function onFavorite(id: number, name: string) {
    if (favorite?.id === id) return
    if (
      favorite &&
      !window.confirm(
        `Trocar ${displayName(favorite.name)} por ${displayName(name)} como favorito?`,
      )
    ) return

    const next = { id, name }
    setFavorite(next)
    try {
      localStorage.setItem(favoriteKey, JSON.stringify(next))
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
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="mast">
        <div className="mast-inner">
          <a className="brand" href="/" aria-label="MerxDex, início">
            <img src="/dex.svg" alt="" />
            Merx<span>Dex</span>
          </a>
          <Navigation page={page} />
          <div className="mast-controls">
            <a
              className="about-link"
              href="#sobre"
              aria-current={page === '#sobre' ? 'page' : undefined}
            >
              Sobre o projeto
            </a>
            <ThemeSwitch />
            <MobileMenu page={page} />
          </div>
        </div>
      </header>
      <main id="conteudo" className="main-wrap">
        {page === '#sobre' ? null : page === '#tipos' ? (
          <TypeMatchups />
        ) : (
          <>
            <section className="hero" aria-labelledby="title">
              <div className="hero-copy">
                <div className="eyeline">
                  <i aria-hidden="true" /> SISTEMA KALOS
                </div>
                <h1 id="title">
                  Pokédex regional<span>.</span>
                </h1>
                <p>
                  Explore as regiões, descubra evoluções e escolha seu Pokémon
                  favorito.
                </p>
              </div>
              <div className="device-stage">
                <Device />
              </div>
              <div className="vents" aria-hidden="true" />
            </section>
            <Catalog
              favorite={favorite?.id ?? null}
              onFavorite={onFavorite}
            />
          </>
        )}
      </main>
      <footer className="foot">
        <span>MerxDex</span>
        <a href="https://pokeapi.co/">Dados da PokéAPI</a>
      </footer>
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
