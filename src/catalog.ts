const API = 'https://pokeapi.co/api/v2/'
type Ref = { name: string; url: string }
type SpeciesEntry = { id: number; name: string }
type PokemonResponse = {
  id: number
  name: string
  species: Ref
  height: number
  weight: number
  types: { slot: number; type: Ref }[]
  sprites: {
    front_default: string | null
    other: { 'official-artwork': { front_default: string | null } }
  }
}
type SpeciesResponse = {
  name: string
  flavor_text_entries: { flavor_text: string; language: { name: string } }[]
  evolution_chain: { url: string } | null
}
type ChainLink = {
  species: Ref
  evolves_to: ChainLink[]
  evolution_details?: {
    min_level: number | null
    item: Ref | null
    held_item: Ref | null
  }[]
}
type EvolutionRequirement = {
  level: number | null
  items: string[]
}
export type Evolution = SpeciesEntry & {
  next: Evolution[]
  requirements: EvolutionRequirement[]
}
export type Pokemon = SpeciesEntry & {
  image: string | null
  types: string[]
  speciesUrl: string
  height: number
  weight: number
}

export const regions = [
  ['kanto', 'Kanto', 1],
  ['johto', 'Johto', 2],
  ['hoenn', 'Hoenn', 3],
  ['sinnoh', 'Sinnoh', 4],
  ['unova', 'Unova', 5],
  ['kalos', 'Kalos', 6],
  ['alola', 'Alola', 7],
  ['galar', 'Galar', 8],
  ['hisui', 'Hisui', 8],
  ['paldea', 'Paldea', 9],
] as const
export const typeLabels: Record<string, string> = {
  normal: 'Normal',
  fire: 'Fogo',
  water: 'Água',
  electric: 'Elétrico',
  grass: 'Planta',
  ice: 'Gelo',
  fighting: 'Lutador',
  poison: 'Veneno',
  ground: 'Terra',
  flying: 'Voador',
  psychic: 'Psíquico',
  bug: 'Inseto',
  rock: 'Pedra',
  ghost: 'Fantasma',
  dragon: 'Dragão',
  dark: 'Sombrio',
  steel: 'Aço',
  fairy: 'Fada',
}

export function displayName(name: string) {
  const special: Record<string, string> = {
    'nidoran-f': 'Nidoran♀',
    'nidoran-m': 'Nidoran♂',
    'mr-mime': 'Mr. Mime',
    'mime-jr': 'Mime Jr.',
    'mr-rime': 'Mr. Rime',
    'type-null': 'Type: Null',
    farfetchd: 'Farfetch’d',
    sirfetchd: 'Sirfetch’d',
    flabebe: 'Flabébé',
  }
  return (
    special[name] ??
    name
      .split('-')
      .map((s) => s[0]?.toUpperCase() + s.slice(1))
      .join(' ')
  )
}
export const numberLabel = (id: number) => '#' + String(id).padStart(3, '0')
const idFromUrl = (url: string) =>
  Number(url.replace(/\/$/, '').split('/').pop())

// Cache projected data, so opening several pages doesn't retain large move lists in memory.
function cached<T>(load: (key: string) => Promise<T>) {
  const values = new Map<string, Promise<T>>()
  return (key: string): Promise<T> => {
    const existing = values.get(key)
    if (existing) return existing
    const request = load(key).catch((error) => {
      values.delete(key)
      throw error
    })
    values.set(key, request)
    return request
  }
}
async function read<T>(path: string): Promise<T> {
  const response = await fetch(path.startsWith('https://') ? path : API + path)
  if (!response.ok) throw new Error('Falha ao consultar a PokéAPI')
  return response.json()
}
const generation = cached(async (key) => {
  const data = await read<{ pokemon_species: Ref[] }>('generation/' + key)
  return data.pokemon_species.map(({ name, url }) => ({
    name,
    id: idFromUrl(url),
  }))
})
export const listRegion = cached(async (key) => {
  if (key === 'all') {
    const { results } = await read<{ results: Ref[] }>(
      'pokemon-species?limit=100000',
    )
    return results
      .map(({ name, url }) => ({ name, id: idFromUrl(url) }))
      .sort((a, b) => a.id - b.id)
  }
  const region = regions.find(([value]) => value === key) ?? regions[0]
  let entries = await generation(String(region[2]))
  // The eight-generation endpoint also includes the seven species introduced in Hisui.
  if (key === 'hisui')
    entries = entries.filter((p) => p.id >= 899 && p.id <= 905)
  if (key === 'galar') entries = entries.filter((p) => p.id < 899)
  return [...entries].sort((a, b) => a.id - b.id)
})
export const loadTypeMatchups = cached(async (type) => {
  const { damage_relations } = await read<{
    damage_relations: { double_damage_to: Ref[]; double_damage_from: Ref[] }
  }>('type/' + type)
  return {
    strongAgainst: damage_relations.double_damage_to.map(({ name }) => name),
    weakAgainst: damage_relations.double_damage_from.map(({ name }) => name),
  }
})

export const listType = cached(async (type) => {
  const data = await read<{ pokemon: { pokemon: Ref }[] }>('type/' + type)
  return new Set(data.pokemon.map(({ pokemon }) => idFromUrl(pokemon.url)))
})
export async function loadCatalogIndex(
  regionKeys: string[],
  typeKeys: string[],
  requireAllTypes = false,
) {
  const [catalogs, typeSets] = await Promise.all([
    Promise.all((regionKeys.length ? regionKeys : ['all']).map(listRegion)),
    Promise.all(typeKeys.map(listType)),
  ])
  const byNumber = new Map<number, SpeciesEntry>()
  for (const species of catalogs.flat()) byNumber.set(species.id, species)
  const all = [...byNumber.values()].sort((a, b) => a.id - b.id)
  const [firstType, ...otherTypes] = typeSets
  const typed = !firstType
    ? null
    : requireAllTypes
      ? new Set([...firstType].filter((id) => otherTypes.every((ids) => ids.has(id))))
      : new Set(typeSets.flatMap((ids) => [...ids]))
  return { all, typed }
}
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9♀♂]/g, '')
}
export function selectEntries(
  entries: SpeciesEntry[],
  query: string,
  types: Set<number> | null,
) {
  const trimmed = query.trim()
  const numeric = /^#?\d+$/.test(trimmed)
  const term = normalize(trimmed)
  return entries.filter(
    (p) =>
      (!types || types.has(p.id)) &&
      (!trimmed ||
        (numeric
          ? p.id === Number(trimmed.replace('#', ''))
          : !!term &&
            (normalize(p.name).includes(term) ||
              normalize(displayName(p.name)).includes(term)))),
  )
}
export const loadPokemon = cached(async (id) => {
  const p = await read<PokemonResponse>('pokemon/' + id)
  return {
    id: p.id,
    name: p.species.name,
    image:
      p.sprites.other['official-artwork'].front_default ??
      p.sprites.front_default,
    types: p.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    speciesUrl: p.species.url,
    height: p.height / 10,
    weight: p.weight / 10,
  } satisfies Pokemon
})
function evolution(link: ChainLink): Evolution {
  const requirements = new Map<string, EvolutionRequirement>()
  for (const detail of link.evolution_details ?? []) {
    const requirement = {
      level: detail.min_level ?? null,
      items: [...new Set([detail.item?.name, detail.held_item?.name])]
        .filter((name): name is string => Boolean(name))
        .sort(),
    }
    if (requirement.level !== null || requirement.items.length) {
      requirements.set(JSON.stringify(requirement), requirement)
    }
  }
  return {
    requirements: [...requirements.values()],
    id: idFromUrl(link.species.url),
    name: link.species.name,
    next: link.evolves_to.map(evolution),
  }
}
export const loadDetails = cached(async (speciesUrl) => {
  const species = await read<SpeciesResponse>(speciesUrl)
  const description = ['pt-br', 'pt', 'en']
    .map((lang) =>
      species.flavor_text_entries.find((e) => e.language.name === lang),
    )
    .find(Boolean)
  const tree = species.evolution_chain
    ? await read<{ chain: ChainLink }>(species.evolution_chain.url)
    : null
  return {
    description: description?.flavor_text.replace(/\s+/g, ' ').trim(),
    lang: description?.language.name,
    tree: tree ? evolution(tree.chain) : null,
  }
})
