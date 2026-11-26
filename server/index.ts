interface Statement {
  bind(...params: unknown[]): Statement
  first<T>(): Promise<T | null>
  all<T>(): Promise<{ results: T[] }>
  run(): Promise<{ meta: { changes: number } }>
}
interface Env {
  DB: { prepare(sql: string): Statement }
  ASSETS: { fetch(request: Request): Promise<Response> }
}
interface TrainerRow {
  name: string
  favorite_id: number | null
  favorite_name: string | null
}
const cookie = 'kalos_trainer'
function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
}
function trainerDTO(row: TrainerRow | null) {
  if (!row) return null
  return { name: row.name, favorite: row.favorite_id ? { id: row.favorite_id, name: row.favorite_name } : null }
}
async function digest(token: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('')
}
async function handleAPI(req: Request, env: Env, url: URL) {
  const path = url.pathname
  if (path === '/api/ranking' && req.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT favorite_id AS id, MIN(favorite_name) AS name, COUNT(*) AS votes FROM trainers WHERE favorite_id IS NOT NULL GROUP BY favorite_id ORDER BY votes DESC, favorite_id LIMIT 5'
    ).all()
    return json(results)
  }
  const token = req.headers.get('Cookie')?.match(/(?:^|;\s*)kalos_trainer=([a-f0-9]{64})(?:;|$)/)?.[1]
  const hash = token ? await digest(token) : null
  const current = async () => hash ? await env.DB.prepare(
    'SELECT name, favorite_id, favorite_name FROM trainers WHERE session_hash = ?'
  ).bind(hash).first<TrainerRow>() : null
  if (path === '/api/trainer' && req.method === 'GET') return json(trainerDTO(await current()))
  if (req.method !== 'POST' || !['/api/trainer','/api/favorite'].includes(path)) {
    return json({ error: 'Rota inexistente.' }, 404)
  }
  const origin = req.headers.get('Origin')
  if ((origin && origin !== url.origin) || !req.headers.get('Content-Type')?.startsWith('application/json')) {
    return json({ error: 'Solicitação inválida.' }, 403)
  }
  const body = (await req.json().catch(() => null) as Record<string, unknown> | null)
  if (!body || typeof body !== 'object') return json({ error: 'Dados inválidos.' }, 400)
  const trainer = await current()
  if (path === '/api/trainer') {
    if (trainer) return json(trainerDTO(trainer))
    const name = typeof body.name === 'string' ? body.name.normalize('NFKC') : ''
    if (Array.from(name).length < 8 || Array.from(name).length > 20 || /[\s\p{C}]/u.test(name)) {
      return json({ error: 'Use entre 8 e 20 caracteres, sem espaços.' }, 400)
    }
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2,'0')).join('')
    const { meta } = await env.DB.prepare(
      'INSERT INTO trainers(name_key,name,session_hash) VALUES (?,?,?) ON CONFLICT(name_key) DO NOTHING'
    ).bind(name.toLowerCase(), name, await digest(secret)).run()
    if (!meta.changes) return json({ error: 'Esse nome já pertence a outro treinador. Escolha outro.' }, 409)
    const secure = url.protocol === 'https:' ? '; Secure' : ''
    return json({ name, favorite: null }, 201, {
      'Set-Cookie': `${cookie}=${secret}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Strict${secure}`
    })
  }
  if (!trainer) return json({ error: 'Identifique seu treinador para votar.' }, 401)
  const { id, previous } = body
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) {
    return json({ error: 'Pokémon inválido.' }, 400)
  }
  const conflict = () => json({ error: 'Seu favorito mudou. Confira a escolha atual e tente novamente.' }, 409)
  if (trainer.favorite_id !== previous) return conflict()
  if (id === previous) return json(trainerDTO(trainer))
  const species = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`, { signal: AbortSignal.timeout(12000) })
  if (!species.ok) return json({ error: 'Não foi possível verificar a espécie na PokéAPI.' }, species.status === 404 ? 400 : 502)
  const data = await species.json() as { id: number; name: string }
  if (data.id !== id || !data.name) return json({ error: 'Espécie desconhecida.' }, 502)
  const result = await env.DB.prepare(
    'UPDATE trainers SET favorite_id = ?, favorite_name = ? WHERE session_hash = ? AND favorite_id IS ?'
  ).bind(id, data.name, hash, previous).run()
  if (!result.meta.changes) return conflict()
  return json({ name: trainer.name, favorite: { id, name: data.name } })
}
export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req)
    try {
      return await handleAPI(req, env, url)
    } catch {
      return json({ error: 'Serviço temporariamente indisponível. Tente novamente.' }, 503)
    }
  }
}
