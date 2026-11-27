# MerxDex

Pokédex regional desenvolvida para o [teste de estágio da MERX Energia](https://github.com/Merx-TI/testetecnico). A versão de entrega está na branch `main` e roda inteiramente no navegador. [Abrir a versão de entrega](https://merxdex-frontend.vercel.app/)

## Tecnologias

React, TypeScript, Vite e CSS. O navegador consulta diretamente a [PokéAPI REST](https://pokeapi.co/docs/v2). O deploy na Vercel publica os arquivos estáticos do Vite.

## Executar localmente

Requisitos de desenvolvimento: Git, Node.js 24, npm e conexão com a internet para consultar a PokéAPI.

```sh
git clone https://github.com/gustavosergio/testetecnico-merx.git
cd testetecnico-merx
npm ci
npm run dev
```

Abra o endereço informado pelo Vite no terminal, normalmente `http://localhost:5173`.

```sh
npm test
npm run build
```

Os testes automatizados cobrem busca, combinação de filtros e leitura da cadeia evolutiva. O build verifica os tipos e gera o site em `dist/client`.

## Funcionalidades

- Catálogo com imagem, nome, número nacional e tipos de cada Pokémon. A paginação mostra até 14 cartões no celular e 15 no desktop.
- Busca com debounce de 250 ms por nome parcial ou pelo número nacional, com formatos como `25` e `#025`. Os filtros de região e tipo aceitam múltiplas escolhas e funcionam junto com a busca e a paginação. Ative **Dupla tipagem** para exigir os dois tipos selecionados. A URL guarda a consulta e a página.
- Modal com medidas, descrição da espécie e cadeia evolutiva. A árvore exibe ramos separados, mostra níveis e itens fornecidos pela PokéAPI e permite abrir a ficha de cada evolução pela imagem.
- Estados de carregamento, ausência de resultados e erro com opção de tentar novamente.
- Aba Tipos com vantagens de ataque e fraquezas de defesa. O cabeçalho permite alternar entre os temas claro e escuro.
- Um favorito por navegador. O coração no catálogo salva a escolha localmente. A aba Meu favorito mostra a ficha completa do Pokémon escolhido, e um balão pede confirmação ao escolher, trocar ou remover o favorito.
- Saudação opcional na primeira visita. O nome escolhido fica no navegador e aparece no topo do site.
- Navegação por teclado com foco visível, rótulos nos controles e fechamento dos diálogos com Escape.

## Decisões e dificuldades

- **Busca, filtros e paginação.** A PokéAPI distribui as informações entre endpoints de espécie, geração, tipo e Pokémon. O catálogo cruza os identificadores antes de paginar e busca os detalhes só dos cartões visíveis. Um cache em memória reaproveita consultas bem-sucedidas.
- **Regiões e evoluções.** Cada espécie aparece pela geração de estreia, com sua forma padrão. Galar e Hisui são tratados separadamente dentro da oitava geração. As evoluções são renderizadas como árvore porque uma espécie pode ter vários caminhos. A descrição prioriza português e usa inglês quando necessário.
- **Escopo da entrega.** A `main` usa o armazenamento do navegador para o favorito. A [branch versao-completa](https://github.com/gustavosergio/testetecnico-merx/tree/versao-completa) preserva o projeto anterior, com contas, perfis e ranking comunitário. [Abrir a versão completa](https://merxdex.vercel.app/)

A carcaça e o visor da Pokédex de Kalos inspiraram a ilustração do aparelho em CSS. Os sprites vêm do [repositório de imagens da PokéAPI](https://github.com/PokeAPI/sprites).

Os retratos pixelados do ícone Meu favorito vêm dos colaboradores do [PMDCollab SpriteCollab](https://github.com/PMDCollab/SpriteCollab), conforme os [créditos por espécie](https://sprites.pmdcollab.org/) e a [licença CC BY-NC 4.0 do projeto](https://github.com/PMDCollab/SpriteCollab/blob/master/LICENSE.md).
