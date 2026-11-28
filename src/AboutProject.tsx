import './about-project.css'

export default function AboutProject() {
  return (
    <section className="about-project" aria-labelledby="about-project-title">
      <h1 id="about-project-title">Sobre o projeto</h1>
      <p>
        O EnergDex nasceu de um desafio técnico da MERX Energia. Inspirado na
        Pokédex de Kalos, o projeto usa dados da PokéAPI para explorar Pokémon
        por região e tipo, consultar suas evoluções e comparar as versões
        normal e shiny.
      </p>
      <p>
        Crie sua conta de treinador e use a Master Ball para escolher seu
        Pokémon favorito. Sua escolha vale um voto no pódio da Comunidade.
      </p>
      <p>
        <a href="https://github.com/gustavosergio/testetecnico-merx">
          Ver o código no GitHub
        </a>
      </p>
    </section>
  )
}
