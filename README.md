# Kalos Dex

Pokédex regional desenvolvida para o [teste de estágio da MERX Energia](https://github.com/Merx-TI/testetecnico). A carcaça vermelha e o visor azul do modelo de Kalos inspiraram o aparelho da tela inicial e a moldura do catálogo.

[Abrir a Pokédex](https://kalosdex-gustavo-merx.memorablemuffin16.chatgpt.site)

## Como explorar

O catálogo abre em Kanto, em ordem de número nacional. Use o seletor de região para trocar de catálogo ou selecione **Todas as regiões** para pesquisar em todas as espécies. A busca aceita nomes parciais e números como `25` e `#025`. O filtro por tipo combina com a busca. A URL guarda os filtros e a página para que uma consulta possa ser compartilhada.

Abra um cartão para consultar tipos, medidas, descrição da espécie e cadeia evolutiva. Evoluções ramificadas, como as de Eevee, aparecem em ramos separados. A interface sinaliza carregamento, erro e buscas sem resultado. Em caso de falha de rede, é possível repetir a consulta.

O coração do cartão permite escolher um único favorito. No primeiro voto, cadastre um nome de 8 a 20 caracteres sem espaços. O banco reserva esse nome sem diferenciar maiúsculas e minúsculas. Ao trocar de favorito, a confirmação identifica o Pokémon atual e o novo. A página **Comunidade** destaca os três primeiros no pódio e exibe o quarto e o quinto logo abaixo. Empates seguem a ordem do número nacional.

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

## Tecnologias e decisões

- **React, TypeScript, Vite e CSS.** A navegação e o consumo REST da PokéAPI acontecem no frontend. Componentes com elementos HTML nativos oferecem navegação por teclado, foco visível e diálogos que fecham com Escape.
- **Regiões.** O catálogo agrupa as espécies pela geração de estreia e distingue Galar de Hisui, que compartilham a oitava geração. Cada espécie aparece uma vez, com sua forma padrão e numeração nacional.
- **Consultas REST.** A PokéAPI distribui informações entre geração, tipo, Pokémon, espécie e cadeia evolutiva. Para combinar busca, tipo e paginação, o frontend cruza os identificadores e só então busca os detalhes dos 12 cartões da página. Um cache em memória reaproveita consultas bem-sucedidas. A descrição prioriza português quando disponível e usa inglês como alternativa.
- **Persistência compartilhada.** Unicidade de nomes e contagem comunitária precisam de uma fonte comum entre navegadores. Um Cloudflare Worker usa D1 para essas duas funcionalidades. A sessão usa um cookie HttpOnly e o banco guarda o hash do token. O treinador continua conectado no mesmo navegador. Apagar o cookie ou trocar de dispositivo interrompe o acesso ao perfil, pois o nome é público e não há senha nem recuperação de conta.
- **Votos concorrentes.** Cada registro de treinador contém apenas um favorito. A atualização verifica se o favorito anterior ainda é o que apareceu na confirmação. Assim, uma segunda aba não pode sobrescrever silenciosamente uma escolha mais recente.

A arte dos Pokémon vem do [repositório de sprites da PokéAPI](https://github.com/PokeAPI/sprites). A ilustração do aparelho foi construída em CSS. Dados obtidos pela [PokéAPI REST](https://pokeapi.co/docs/v2).
