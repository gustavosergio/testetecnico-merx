import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-600.css'
import '@fontsource/barlow/latin-700.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Catalog from './Catalog'
import Community from './Community'
import Device from './Device'
import Trainers from './Trainers'
import { avatarImage, useTrainer } from './trainer'
import './shell.css'
import './theme.css'

type IconName = 'book' | 'trophy' | 'user'
function Icon({ name }: { name: IconName }) {
  const paths = {
    book: 'M3 4h6q2 0 3 2 1-2 3-2h6v15h-6q-2 0-3 2-1-2-3-2H3z M12 6v15',
    trophy:
      'M7 3h10v6a5 5 0 0 1-10 0z M7 5H3v2q0 5 5 5 M17 5h4v2q0 5-5 5 M12 14v5 M8 21h8 M10 19h4',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  }
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d={paths[name]} />
    </svg>
  )
}
function ThemeSwitch() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('merxdex-theme')
      if (saved === 'light' || saved === 'dark') return saved === 'dark'
    } catch {}
    return matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  return <button className="theme-switch" type="button" aria-pressed={dark} onClick={() => {
    try { localStorage.setItem('merxdex-theme', dark ? 'light' : 'dark') } catch {}
    setDark(!dark)
  }}>Modo escuro</button>
}

function App() {
  const [page, setPage] = useState(location.hash)
  const { trainer, openTrainer, onFavorite, dialog, revision } = useTrainer()
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
          <a className="brand" href="#pokedex" aria-label="Kalos Dex, início">
            <img src="/dex.svg" alt="" />
            Kalos<span>Dex</span>
          </a>
          <nav aria-label="Navegação principal">
            <a href="#pokedex" aria-current={page !== '#comunidade' && page !== '#treinadores' ? 'page' : undefined}>
              <Icon name="book" />
              Pokédex
            </a>
            <a href="#comunidade" aria-current={page === '#comunidade' ? 'page' : undefined}>
              <Icon name="trophy" />
              Comunidade
            </a>
            <a href="#treinadores" aria-current={page === '#treinadores' ? 'page' : undefined}>
              <Icon name="user" />
              Treinadores
            </a>
          </nav>
          <div className="mast-controls">
          <ThemeSwitch />
          <button className="identity" onClick={openTrainer}>
            <>
              {trainer ? (
                <img
                  width="34"
                  height="34"
                  src={avatarImage(trainer.avatar)}
                  alt=""
                />
              ) : (
                <Icon name="user" />
              )}
            </>
            {trainer?.name ?? 'Entrar'}
          </button>
          </div>
        </div>
      </header>
      <main id="conteudo" className="main-wrap">
        {page === '#treinadores' ? <Trainers /> : page === '#comunidade' ? (
          <Community revision={revision} />
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
            <section className="console">
              <div className="rail rail-top" aria-hidden="true">
                <i />
              </div>
              <div className="console-screen">
                <Catalog
                  favorite={trainer?.favorite?.id ?? null}
                  onFavorite={onFavorite}
                />
              </div>
              <div className="rail rail-bottom" aria-hidden="true">
                <i />
              </div>
            </section>
          </>
        )}
      </main>
      <footer className="foot">
        <span>KalosDex</span>
        <a href="https://pokeapi.co/">Dados da PokéAPI</a>
      </footer>
      {dialog}
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
