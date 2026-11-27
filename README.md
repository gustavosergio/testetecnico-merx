# MerxDex

Pokédex regional desenvolvida para o [teste de estágio da MERX Energia](https://github.com/Merx-TI/testetecnico). A carcaça vermelha e o visor azul do modelo de Kalos inspiraram o aparelho da tela inicial e a moldura do catálogo.

[Abrir a Pokédex](https://merxdex.vercel.app)

## Como explorar

O catálogo abre em **Todas as regiões**, com as espécies em ordem de número nacional. Os filtros **Regiões** e **Tipos** aceitam várias escolhas. Por exemplo, marcar Kanto e Kalos junto com Fogo e Água mostra as espécies de qualquer uma dessas regiões que tenham pelo menos um dos dois tipos. Limpar um filtro volta a incluir todas as opções dele. A busca aceita nomes parciais e números como `25` e `#025`. O filtro por tipo combina com a busca. A URL guarda os filtros e a página para que uma consulta possa ser compartilhada.

Abra um cartão para consultar tipos, medidas, descrição da espécie e cadeia evolutiva. Evoluções ramificadas, como as de Eevee, aparecem em ramos separados. A interface sinaliza carregamento, erro e buscas sem resultado. Em caso de falha de rede, é possível repetir a consulta.

O coração do cartão permite escolher um único favorito. Em **Entrar**, use uma conta existente ou escolha **Criar conta**. O cadastro pede um nome de 4 a 20 caracteres sem espaços, três iniciais distintos em uma ordem secreta e um PIN de quatro dígitos. O perfil começa com Pikachu como avatar. Abra o perfil para trocar a foto por nome ou número ou sair da conta. O banco reserva esse nome sem diferenciar maiúsculas e minúsculas. Ao trocar de favorito, a confirmação identifica o Pokémon atual e o novo. A página **Comunidade** destaca os três primeiros no pódio e exibe o quarto e o quinto logo abaixo. Empates seguem a ordem do número nacional. A aba **Treinadores** permite buscar por parte do nome. Cada treinador pode divulgar seu nick do Pokémon GO e uma descrição de até 500 caracteres no perfil. O modo escuro pode ser alternado no cabeçalho.

## Executar localmente

Requisitos: Git, Node.js 24 e npm. A PokéAPI e as imagens precisam de conexão com a internet.

```sh
git clone https://github.com/gustavosergio/testetecnico-merx.git
cd testetecnico-merx
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
