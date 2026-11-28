# EnergDex

Pokédex regional desenvolvida para o [teste de estágio da MERX Energia](https://github.com/Merx-TI/testetecnico). A carcaça vermelha e o visor azul do modelo de Kalos inspiraram o aparelho da tela inicial e a moldura do catálogo.

[Abrir a Pokédex](https://energdex.vercel.app)

## Como explorar

- Catálogo com imagem, nome, número da Pokédex e tipos de cada Pokémon. A paginação mostra até 14 cartões no celular e 15 no desktop, com atalhos para voltar ou avançar 1, 2 ou 3 páginas.
- Busca com debounce de 250 ms por nome parcial ou pelo número da Pokédex, com formatos como `25` e `#025`. Os filtros de região e tipo aceitam múltiplas escolhas e funcionam junto com a busca e a paginação. Ative **Dupla tipagem** para exigir os dois tipos selecionados. A URL guarda a consulta e a página.
- Janela de detalhes com altura, peso, descrição da espécie e cadeia evolutiva. Na Pokédex, o botão Shiny alterna a imagem quando essa versão está disponível. A árvore exibe ramos separados, mostra níveis e itens fornecidos pela PokéAPI e permite abrir a ficha de cada evolução pela imagem.
- Estados de carregamento, ausência de resultados e erro com opção de tentar novamente.
- Aba Tipos com vantagens de ataque e fraquezas de defesa.
- **Temas com Pokébolas.** Clique na **Dusk Ball** para entrar no modo escuro e na **Quick Ball** para voltar ao modo claro. O navegador lembra sua escolha.
- A Love Ball adiciona ou remove Pokémon da lista de curtidos após confirmação no balão de fala, no catálogo, nas fichas e na aba Curtidos. A Master Ball marca um único favorito, com confirmação ao escolher, trocar ou remover. A aba Curtidos mostra a lista, e Meu favorito exibe a ficha completa do Pokémon escolhido, com as imagens normal e shiny lado a lado quando disponíveis. As curtidas ficam neste navegador, separadas por conta e por visitante. O favorito é salvo na conta e conta como voto no ranking.
- Ao entrar na conta, a saudação usa o nome do perfil.
- Navegação por teclado com foco visível, rótulos nos controles e fechamento dos diálogos com Escape.

Em **Entrar**, use uma conta existente ou escolha **Criar conta**. O cadastro pede um nome de 4 a 20 caracteres sem espaços, três iniciais distintos em uma ordem secreta e um PIN de quatro dígitos. O perfil começa com Pikachu como avatar. Abra o perfil para trocar a foto por nome ou número ou sair da conta. O banco reserva esse nome sem diferenciar maiúsculas e minúsculas. Ao trocar de favorito, a confirmação identifica o Pokémon atual e o novo. A página **Comunidade** destaca os três primeiros no pódio e exibe o quarto e o quinto logo abaixo. Empates seguem a ordem do número da Pokédex. A aba **Treinadores** permite buscar por parte do nome. Cada treinador pode divulgar seu nick do Pokémon GO e uma descrição de até 500 caracteres no perfil. O modo escuro pode ser alternado no cabeçalho.

## Executar localmente

Requisitos: Git, Node.js 24 e npm. A PokéAPI e as imagens precisam de conexão com a internet.

```sh
git clone https://github.com/gustavosergio/testetecnico-merx.git
cd testetecnico-merx
git switch versao-completa
npm ci
npm run dev
```

Abra o endereço do Vite no terminal (normalmente http://localhost:5173). O comando aplica as migrações em um banco D1 local e inicia o Worker na porta 8787. O Vite encaminha as chamadas de perfil e ranking ao Worker. O banco de desenvolvimento fica em `.wrangler/`, fora do Git. O desenvolvimento local dispensa credenciais de hospedagem.

```sh
npm test
npm run build
```

Os testes exercitam a combinação de filtros, a árvore de evolução, as regras do cadastro e a troca de votos entre sessões. O build verifica os tipos e gera a aplicação em `dist/client` e o Worker em `dist/server`.

## Deploy na Vercel

Importe este repositório na Vercel com a raiz do projeto no diretório do repositório. O arquivo `vercel.json` define o build do Vite e a pasta publicada. As funções em `api/` encaminham cadastro, favoritos e ranking ao Worker existente, que mantém o banco D1 compartilhado. Como a sessão é vinculada ao domínio, mudar de endereço não transfere o cookie do treinador.

## Tecnologias e decisões

- **React, TypeScript, Vite e CSS.** A navegação e o consumo REST da PokéAPI acontecem no frontend. Componentes com elementos HTML nativos oferecem navegação por teclado, foco visível e diálogos que fecham com Escape.
- **Regiões.** O catálogo agrupa as espécies pela geração de estreia e distingue Galar de Hisui, que compartilham a oitava geração. Cada espécie aparece uma vez, com sua forma padrão e numeração nacional.
- **Consultas REST.** A PokéAPI distribui informações entre geração, tipo, Pokémon, espécie e cadeia evolutiva. Para combinar busca, tipo e paginação, o frontend cruza os identificadores e só então busca os detalhes dos cartões da página atual: até 14 no celular em duas colunas e até 15 no desktop em cinco colunas. Um cache em memória reaproveita consultas bem-sucedidas. A descrição prioriza português quando disponível e usa inglês como alternativa.
- **Persistência compartilhada.** Unicidade de nomes e contagem comunitária precisam de uma fonte comum entre navegadores. Um Cloudflare Worker usa D1 para essas duas funcionalidades. A sessão usa um cookie HttpOnly e o banco guarda o hash do token. O treinador continua conectado no mesmo navegador. Para entrar novamente, use o nome, o trio na mesma ordem e o PIN. A senha é derivada com PBKDF2 e salt individual. Após cinco tentativas na janela de cinco minutos, novas entradas ficam temporariamente bloqueadas. Uma nova entrada substitui a sessão anterior. Treinadores cadastrados antes da introdução da senha podem defini-la na sessão original, preservando seus votos.
- **Votos concorrentes.** Cada registro de treinador contém apenas um favorito. A atualização verifica se o favorito anterior ainda é o que apareceu na confirmação. Assim, uma segunda aba não pode sobrescrever silenciosamente uma escolha mais recente.

A arte dos Pokémon vem do [repositório de sprites da PokéAPI](https://github.com/PokeAPI/sprites). A ilustração do aparelho foi construída em CSS. Dados obtidos pela [PokéAPI REST](https://pokeapi.co/docs/v2).

Os retratos pixelados do ícone Meu favorito vêm dos colaboradores do [PMDCollab SpriteCollab](https://github.com/PMDCollab/SpriteCollab), conforme os [créditos por espécie](https://sprites.pmdcollab.org/) e a [licença CC BY-NC 4.0 do projeto](https://github.com/PMDCollab/SpriteCollab/blob/master/LICENSE.md).
