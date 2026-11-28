import { starters } from '../shared/starters.ts'
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
  description: string | null
  go_nick: string | null
  avatar_id: number
  password_hash: string | null
  name: string
  favorite_id: number | null
  favorite_name: string | null
}
const cookie = 'kalos_trainer'
function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  })
}
function trainerDTO(row: TrainerRow | null) {
  if (!row) return null
  return {
    name: row.name,
    avatar: row.avatar_id,
    description: row.description,
    goNick: row.go_nick,
    needsSetup: !row.password_hash,
    favorite: row.favorite_id
      ? { id: row.favorite_id, name: row.favorite_name }
      : null,
  }
}
async function digest(token: string) {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  )
  return Array.from(new Uint8Array(bytes), (n) =>
    n.toString(16).padStart(2, '0'),
  ).join('')
}
async function handleAPI(req: Request, env: Env, url: URL) {
  const path = url.pathname
  if (path === '/api/trainers' && req.method === 'GET') {
    const query = (url.searchParams.get('q') ?? '')
      .normalize('NFKC')
      .trim()
      .toLowerCase()
    if (!query || query.length > 40) return json([])
    const { results } = await env.DB.prepare(
      'SELECT name, avatar_id, description, go_nick, favorite_id, favorite_name FROM trainers WHERE instr(name_key, ?) > 0 ORDER BY name_key LIMIT 30',
    )
      .bind(query)
      .all<TrainerRow>()
    return json(
      results.map((row) => ({
        name: row.name,
        avatar: row.avatar_id,
        description: row.description,
        goNick: row.go_nick,
        favorite: row.favorite_id
          ? { id: row.favorite_id, name: row.favorite_name }
          : null,
      })),
    )
  }
  if (path === '/api/ranking' && req.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT favorite_id AS id, MIN(favorite_name) AS name, COUNT(*) AS votes FROM trainers WHERE favorite_id IS NOT NULL GROUP BY favorite_id ORDER BY votes DESC, favorite_id LIMIT 5',
    ).all()
    return json(results)
  }
  const token = req.headers
    .get('Cookie')
    ?.match(/(?:^|;\s*)kalos_trainer=([a-f0-9]{64})(?:;|$)/)?.[1]
  const hash = token ? await digest(token) : null
  const current = async () =>
    hash
      ? await env.DB.prepare(
          'SELECT name, avatar_id, description, go_nick, password_hash, favorite_id, favorite_name FROM trainers WHERE session_hash = ?',
        )
          .bind(hash)
          .first<TrainerRow>()
      : null
  if (path === '/api/trainer' && req.method === 'GET')
    return json(trainerDTO(await current()))
  if (
    req.method !== 'POST' ||
    !['/api/trainer', '/api/favorite'].includes(path)
  ) {
    return json({ error: 'Rota inexistente.' }, 404)
  }
  const origin = req.headers.get('Origin')
  if (
    (origin && origin !== url.origin) ||
    !req.headers.get('Content-Type')?.startsWith('application/json')
  ) {
    return json({ error: 'Solicitação inválida.' }, 403)
  }
  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null
  if (!body || typeof body !== 'object')
    return json({ error: 'Dados inválidos.' }, 400)
  const trainer = await current()
  if (path === '/api/trainer') {
    const action = body.action
    const sessionHeaders = (value: string) => ({
      'Set-Cookie':
        cookie +
        '=' +
        value +
        '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' +
        (value ? 31536000 : 0) +
        (url.protocol === 'https:' ? '; Secure' : ''),
    })
    if (action === 'logout' && trainer && trainer.password_hash) {
      await env.DB.prepare(
        'UPDATE trainers SET session_hash = lower(hex(randomblob(32))) WHERE session_hash = ?',
      )
        .bind(hash)
        .run()
      return json(null, 200, sessionHeaders(''))
    }
    if (action === 'goNick' && trainer) {
      const value = typeof body.value === 'string' ? body.value.trim() : null
      if (value === null || Array.from(value).length > 32)
        return json({ error: 'Use até 32 caracteres.' }, 400)
      await env.DB.prepare('UPDATE trainers SET go_nick=? WHERE session_hash=?')
        .bind(value || null, hash)
        .run()
      return json(trainerDTO(await current()))
    }
    if (action === 'description' && trainer) {
      const value = typeof body.value === 'string' ? body.value.trim() : null
      if (value === null || Array.from(value).length > 500)
        return json({ error: 'Use até 500 caracteres.' }, 400)
      await env.DB.prepare(
        'UPDATE trainers SET description=? WHERE session_hash=?',
      )
        .bind(value || null, hash)
        .run()
      return json(trainerDTO(await current()))
    }
    if (action === 'avatar' && trainer) {
      const query = String(body.pokemon ?? '')
        .trim()
        .toLowerCase()
      if (!/^[a-z0-9-]{1,50}$/.test(query))
        return json({ error: 'Informe o nome ou número da espécie.' }, 400)
      const r = await fetch(
        'https://pokeapi.co/api/v2/pokemon-species/' + query + '/',
        { signal: AbortSignal.timeout(10000) },
      )
      if (!r.ok)
        return json(
          { error: 'Não foi possível encontrar essa espécie.' },
          r.status === 404 ? 400 : 502,
        )
      const { id } = (await r.json()) as { id: number }
      await env.DB.prepare(
        'UPDATE trainers SET avatar_id=? WHERE session_hash=?',
      )
        .bind(id, hash)
        .run()
      return json(trainerDTO(await current()))
    }
    if (!['signup', 'login', 'setup'].includes(String(action)))
      return json({ error: 'Escolha entrar ou criar conta.' }, 400)
    const { trio, pin } = body
    if (
      !Array.isArray(trio) ||
      trio.length !== 3 ||
      new Set(trio).size !== 3 ||
      !trio.every(
        (id) => Number.isInteger(id) && Object.hasOwn(starters, id),
      ) ||
      typeof pin !== 'string' ||
      !/^[0-9]{4}$/.test(pin)
    )
      return json(
        {
          error: 'Escolha três iniciais diferentes e um PIN de quatro dígitos.',
        },
        400,
      )
    const password = async (salt: string) => {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(trio.join('-') + ':' + pin),
        'PBKDF2',
        false,
        ['deriveBits'],
      )
      const bits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode(salt),
          iterations: 100000,
          hash: 'SHA-256',
        },
        key,
        256,
      )
      return Array.from(new Uint8Array(bits), (n) =>
        n.toString(16).padStart(2, '0'),
      ).join('')
    }
    const salt = crypto.randomUUID()
    if (action === 'setup') {
      if (!trainer || trainer.password_hash)
        return json(
          { error: 'Use a sessão original do perfil para definir a senha.' },
          403,
        )
      const changed = await env.DB.prepare(
        'UPDATE trainers SET password_hash=?,salt=? WHERE session_hash=? AND password_hash IS NULL',
      )
        .bind(await password(salt), salt, hash)
        .run()
      if (!changed.meta.changes)
        return json({ error: 'A senha já foi configurada.' }, 409)
      return json(trainerDTO(await current()))
    }
    if (trainer)
      return json(
        { error: 'Saia do perfil atual antes de entrar em outro.' },
        409,
      )
    const name =
      typeof body.name === 'string' ? body.name.normalize('NFKC') : ''
    if (
      Array.from(name).length < 4 ||
      Array.from(name).length > 20 ||
      /[\s\p{C}]/u.test(name)
    ) {
      return json({ error: 'Use entre 4 e 20 caracteres, sem espaços.' }, 400)
    }
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
      n.toString(16).padStart(2, '0'),
    ).join('')
    if (action === 'login') {
      const key = name.toLowerCase()
      const now = Date.now()
      const account = await env.DB.prepare(
        'SELECT * FROM trainers WHERE name_key=?',
      )
        .bind(key)
        .first<TrainerRow & { salt: string }>()
      const denied = () => json({ error: 'Nome, trio ou PIN incorreto.' }, 401)
      if (!account?.password_hash) return denied()
      const attempt = await env.DB.prepare(
        'UPDATE trainers SET attempts=CASE WHEN window_end<=? THEN 1 ELSE attempts+1 END, window_end=CASE WHEN window_end<=? THEN ? ELSE window_end END WHERE name_key=? AND (window_end<=? OR attempts<5)',
      )
        .bind(now, now, now + 300000, key, now)
        .run()
      if (!attempt.meta.changes)
        return json({ error: 'Muitas tentativas. Aguarde cinco minutos.' }, 429)
      if ((await password(account.salt)) !== account.password_hash)
        return denied()
      await env.DB.prepare(
        'UPDATE trainers SET session_hash=?, attempts=0,window_end=0 WHERE name_key=?',
      )
        .bind(await digest(secret), key)
        .run()
      return json(trainerDTO(account), 200, sessionHeaders(secret))
    }
    const { meta } = await env.DB.prepare(
      'INSERT INTO trainers(name_key,name,session_hash,password_hash,salt) VALUES (?,?,?,?,?) ON CONFLICT(name_key) DO NOTHING',
    )
      .bind(
        name.toLowerCase(),
        name,
        await digest(secret),
        await password(salt),
        salt,
      )
      .run()
    if (!meta.changes)
      return json(
        { error: 'Esse nome já pertence a outro treinador. Escolha outro.' },
        409,
      )
    return json(
      {
        name,
        avatar: 25,
        needsSetup: false,
        goNick: null,
        description: null,
        favorite: null,
      },
      201,
      sessionHeaders(secret),
    )
  }
  if (!trainer)
    return json({ error: 'Identifique seu treinador para votar.' }, 401)
  const { id, previous } = body
  if (id !== null && (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1)) {
    return json({ error: 'Pokémon inválido.' }, 400)
  }
  const conflict = () =>
    json(
      {
        error: 'Seu favorito mudou. Confira a escolha atual e tente novamente.',
      },
      409,
    )
  if (trainer.favorite_id !== previous) return conflict()
  if (id === previous) return json(trainerDTO(trainer))
  let name: string | null = null
  if (id !== null) {
    const species = await fetch(
      `https://pokeapi.co/api/v2/pokemon-species/${id}/`,
      { signal: AbortSignal.timeout(12000) },
    )
    if (!species.ok)
      return json(
        { error: 'Não foi possível verificar a espécie na PokéAPI.' },
        species.status === 404 ? 400 : 502,
      )
    const data = (await species.json()) as { id: number; name: string }
    if (data.id !== id || !data.name)
      return json({ error: 'Espécie desconhecida.' }, 502)
    name = data.name
  }
  const result = await env.DB.prepare(
    'UPDATE trainers SET favorite_id = ?, favorite_name = ? WHERE session_hash = ? AND favorite_id IS ?',
  )
    .bind(id, name, hash, previous)
    .run()
  if (!result.meta.changes) return conflict()
  return json(
    trainerDTO({ ...trainer, favorite_id: id, favorite_name: name }),
  )
}
export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req)
    try {
      return await handleAPI(req, env, url)
    } catch {
      return json(
        { error: 'Serviço temporariamente indisponível. Tente novamente.' },
        503,
      )
    }
  },
}
