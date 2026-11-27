const communityOrigin = 'https://kalosdex-gustavo-merx.memorablemuffin16.chatgpt.site'
const endpoints = new Set(['/api/trainer', '/api/favorite', '/api/ranking'])

function error(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url)
    if (!endpoints.has(url.pathname)) return error('Rota inexistente.', 404)

    const origin = request.headers.get('Origin')
    if (origin && origin !== url.origin) return error('Solicitação inválida.', 403)

    const headers = new Headers()
    for (const key of ['Cookie', 'Content-Type']) {
      const value = request.headers.get(key)
      if (value) headers.set(key, value)
    }
    if (origin) headers.set('Origin', communityOrigin)

    try {
      const response = await fetch(communityOrigin + url.pathname, {
        method: request.method,
        headers,
        body: request.method === 'POST' ? await request.text() : undefined,
        redirect: 'error',
      })
      if (!response.headers.get('Content-Type')?.includes('application/json')) {
        return error('Serviço da comunidade indisponível.', 502)
      }

      const resultHeaders = new Headers({
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      })
      for (const cookie of response.headers.getSetCookie()) {
        // Only relay the application session to the frontend domain.
        if (cookie.startsWith('kalos_trainer=')) resultHeaders.append('Set-Cookie', cookie)
      }
      return new Response(response.body, { status: response.status, headers: resultHeaders })
    } catch {
      return error('Serviço da comunidade indisponível.', 502)
    }
  },
}
