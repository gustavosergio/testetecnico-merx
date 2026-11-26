import assert from 'node:assert/strict'
import test from 'node:test'
import { loadCatalogIndex, loadDetails, selectEntries } from '../src/catalog.ts'

test('combina busca parcial, numeração nacional e tipo antes de paginar', () => {
  const entries = [
    { id: 4, name: 'charmander' },
    { id: 5, name: 'charmeleon' },
    { id: 6, name: 'charizard' },
  ]
  assert.deepEqual(selectEntries(entries, 'CHAR', new Set([6])), [entries[2]])
  assert.deepEqual(selectEntries(entries, '#004', null), [entries[0]])
  assert.deepEqual(selectEntries(entries, '#004', new Set([6])), [])
  assert.deepEqual(
    selectEntries([{ id: 669, name: 'flabebe' }], 'Flabébé', null),
    [{ id: 669, name: 'flabebe' }],
  )
})

test('preserva os ramos da evolução e usa descrição em inglês se não houver português', async (t) => {
  const ref = (name, id) => ({
    name,
    url: 'https://pokeapi.co/api/v2/pokemon-species/' + id + '/',
  })
  const leaf = (name, id) => ({ species: ref(name, id), evolves_to: [] })
  const speciesUrl = ref('eevee', 133).url
  const tree = {
    chain: {
      species: ref('eevee', 133),
      evolves_to: [leaf('jolteon', 135), leaf('vaporeon', 134)],
    },
  }
  t.mock.method(globalThis, 'fetch', async (url) =>
    Response.json(
      url === speciesUrl
        ? {
            evolution_chain: {
              url: 'https://pokeapi.co/api/v2/evolution-chain/67/',
            },
            flavor_text_entries: [
              { language: { name: 'en' }, flavor_text: 'A\nPokémon.' },
            ],
          }
        : tree,
    ),
  )
  const result = await loadDetails(speciesUrl)
  assert.equal(result.description, 'A Pokémon.')
  assert.deepEqual(
    result.tree.next.map((p) => p.name),
    ['jolteon', 'vaporeon'],
  )
})

test('une regiões e tipos, cruza os dois filtros e mantém a ordem nacional', async (t) => {
  const ref = (id) => ({
    name: String(id),
    url: 'https://pokeapi.co/api/v2/pokemon/' + id + '/',
  })
  const endpoints = {
    'generation/1': { pokemon_species: [7, 6, 1].map(ref) },
    'generation/6': { pokemon_species: [658, 661].map(ref) },
    'type/water': {
      pokemon: [7, 658, 260].map((id) => ({ pokemon: ref(id) })),
    },
    'type/flying': { pokemon: [6, 661].map((id) => ({ pokemon: ref(id) })) },
  }
  t.mock.method(globalThis, 'fetch', async (url) =>
    Response.json(endpoints[url.split('/v2/')[1]]),
  )
  const { all, typed } = await loadCatalogIndex(
    ['kalos', 'kanto'],
    ['water', 'flying'],
  )
  assert.deepEqual(
    selectEntries(all, '', typed).map((p) => p.id),
    [6, 7, 658, 661],
  )
})
