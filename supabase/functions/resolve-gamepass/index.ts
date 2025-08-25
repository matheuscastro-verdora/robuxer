// deno-lint-ignore-file no-explicit-any
import { resolveGamePass, parseGamePassId } from '../_shared/roblox.ts'
import { verifyHmac } from '../_shared/hmac.ts'

function json(body: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } })
}

function cors(req: Request, res: Response) {
  const headers = new Headers(res.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Headers', 'content-type, x-client-hmac, x-client-ts, authorization')
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  return new Response(res.body, { status: res.status, headers })
}

Deno.serve(async (req) => {
  // basic in-memory rate limit per IP
  const ip = req.headers.get('x-forwarded-for') || 'anon'
  ;(globalThis as any).__rl = (globalThis as any).__rl || new Map<string, number[]>()
  const store: Map<string, number[]> = (globalThis as any).__rl
  const key = `resolve:${ip}`
  const now = Date.now()
  const windowMs = 60_000
  const limit = 30
  const arr = store.get(key) || []
  const fresh = arr.filter((t) => now - t < windowMs)
  if (fresh.length >= limit) return cors(req, json({ error: 'rate_limited' }, { status: 429 }))
  fresh.push(now)
  store.set(key, fresh)

  if (req.method === 'OPTIONS') return cors(req, new Response(null, { status: 204 }))
  try {
    const raw = await req.text()
    const ok = await verifyHmac(raw, req.headers.get('x-client-ts'), req.headers.get('x-client-hmac'), Deno.env.get('CLIENT_HMAC_SECRET'))
    if (!ok) return cors(req, json({ error: 'invalid_signature' }, { status: 401 }))
    const body = JSON.parse(raw || '{}')
    const gamePassId = parseGamePassId(body?.gamePassId)
    const info = await resolveGamePass(gamePassId)
    return cors(req, json({ productId: info.productId, price: info.price, sellerId: info.sellerId }))
  } catch (e) {
    const msg = (e as Error).message || 'error'
    return cors(req, json({ error: msg }, { status: 400 }))
  }
})


