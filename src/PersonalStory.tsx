import './personal-story.css'

export default function PersonalStory() {
  return (
    <article className="personal-story" aria-labelledby="personal-story-title">
      <h1 id="personal-story-title">Relato pessoal</h1>
      <p>
        Assim que abri o README do desafio técnico pela primeira vez, me
        surpreendi com a proposta. Entre tantas opções possíveis, estava lá um
        assunto que eu conheço bem e adoro: Pokémon.
      </p>
      <p>
        Pokémon faz parte da minha vida desde pequeno. Eu assistia ao anime e
        ainda assisto hoje, já tive festas de aniversário com o tema e joguei
        dezenas de jogos da franquia. Então, quando vi a proposta, fiquei ainda
        mais animado para fazer um bom projeto.
      </p>
      <p>
        Assim que terminei de ler o README com atenção, peguei um caderno e uma
        caneta que estavam na minha bolsa e comecei a anotar as ideias que vinham
        à cabeça. Pensei em várias funcionalidades que poderiam se encaixar no
        desafio. Quando cheguei à faculdade, comecei a desenvolver, e o site foi
        tomando forma.
      </p>
      <p>
        Minha inspiração veio de <em>Pokémon XYZ</em>, minha jornada favorita do
        anime, que se passa na região de Kalos. Usei a Pokédex dessa região como
        referência para o visual do site. A ideia inicial era chamar o projeto de{' '}
        <strong>KalosDex</strong>, mas, quando fui publicar na Vercel, o endereço
        já estava em uso. Foi aí que surgiu <strong>MerxDex</strong>, juntando o
        nome da empresa com a ideia da Pokédex.
      </p>
      <p>
        Em algum momento, fiquei tão empolgado desenvolvendo que perdi de vista
        um detalhe importante do README. O desafio era{' '}
        <strong>exclusivamente de frontend</strong>. Quando me dei conta, fiquei
        preocupado, porque a primeira versão já estava pronta. Ela tinha
        cadastro com nome de usuário único, de 4 a 20 caracteres, e uma senha
        formada por uma sequência de três Pokémon iniciais e um PIN de quatro
        dígitos. Também tinha a aba <strong>Favoritos da comunidade</strong>,
        onde cada pessoa podia dar um coração ao seu Pokémon favorito e conferir
        o ranking dos mais votados, que hoje vai até o top 10 na versão completa.
      </p>
      <p>
        Fiquei triste de tirar essa parte da entrega, até que pensei: por que
        não ficar com as duas versões? Preservei o projeto completo na branch{' '}
        <code>versao-completa</code> e segui desenvolvendo na <code>main</code> a
        versão só de frontend, que é a que estou entregando à MERX. Assim, quem
        estiver vendo o projeto pode explorar a versão do desafio e, se bater a
        curiosidade,{' '}
        <a href="https://energdex.vercel.app/">abrir o EnergDex com backend</a>
        {' '}para experimentar as contas e o pódio da Comunidade.
      </p>
      <p>
        E eu quis guardar a versão completa porque, sinceramente, ainda acho que
        ficou um baita projeto!
      </p>
      <p>
        <strong>P.S.</strong> Depois que escrevi este relato, o projeto mudou
        de nome. O MerxDex passou a se chamar EnergDex.
      </p>
    </article>
  )
}
