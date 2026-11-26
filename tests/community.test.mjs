import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import worker from '../server/index.ts'

// D1 executes SQLite. Run the same migration and parameterized queries in memory.
function database() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(
    readFileSync(
      new URL('../drizzle/0000_trainers.sql', import.meta.url),
      'utf8',
    ),
  )
  const wrap = (sql, args = []) => ({
    bind: (...params) => wrap(sql, params),
    run: async () => ({ meta: sqlite.prepare(sql).run(...args) }),
    first: async () => sqlite.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
  })
  return { prepare: wrap }
}
test('nomes únicos, sessão protegida, troca condicional e ranking compartilhado', async (t) => {
  const env = { DB: database() }
  t.mock.method(globalThis, 'fetch', async (url) => {
    const id = Number(new URL(url).pathname.split('/').at(-2))
    return Response.json({ id, name: { 1: 'bulbasaur', 4: 'charmander' }[id] })
  })
  async function call(path, body, cookie = '') {
    return worker.fetch(
      new Request('https://kalos.test/api/' + path, {
        method: body ? 'POST' : 'GET',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      }),
      env,
    )
  }
  for (const name of ['ash', 'nome com espaço', '012345678901234567890']) {
    assert.equal((await call('trainer', { name })).status, 400)
  }
  const signup = await call('trainer', { name: 'TreinadorA' })
  assert.equal(signup.status, 201)
  const setCookie = signup.headers.get('set-cookie')
  assert.match(setCookie, /HttpOnly/)
  assert.match(setCookie, /Secure/)
  const session = setCookie.split(';')[0]
  assert.equal((await call('trainer', { name: 'TREINADORA' })).status, 409)
  assert.deepEqual(await (await call('trainer', undefined, session)).json(), {
    name: 'TreinadorA',
    favorite: null,
  })
  assert.equal((await call('favorite', { id: 1, previous: null })).status, 401)
  assert.equal(
    (await call('favorite', { id: 1, previous: null }, session)).status,
    200,
  )
  const other = (await call('trainer', { name: 'TreinadorB' })).headers
    .get('set-cookie')
    .split(';')[0]
  await call('favorite', { id: 1, previous: null }, other)
  assert.deepEqual(await (await call('ranking')).json(), [
    { id: 1, name: 'bulbasaur', votes: 2 },
  ])
  assert.equal(
    (await call('favorite', { id: 4, previous: null }, session)).status,
    409,
  )
  assert.equal(
    (await call('favorite', { id: 4, previous: 1 }, session)).status,
    200,
  )
  assert.deepEqual(await (await call('ranking')).json(), [
    { id: 1, name: 'bulbasaur', votes: 1 },
    { id: 4, name: 'charmander', votes: 1 },
  ])
})
