// deno-lint-ignore-file no-explicit-any
import { getAdminClient } from '../_shared/db.ts'
import { resolveGamePass, alreadyOwns, purchaseProduct, parseGamePassId, whoAmI } from '../_shared/roblox.ts'
import { verifyHmac } from '../_shared/hmac.ts'
import { priceInBRL } from '../_shared/pricing.ts'

type Input = {
  gamePassId: number | string
  expectedPrice: number
  sellerUserId?: number
  buyerUserId?: number | null
  robloxUserId?: number | null
  robloxUsername?: string | null
}

async function resolveBuyerUserId(supa: any, body: Input): Promise<number | null> {
  const direct = Number(body.buyerUserId ?? body.robloxUserId)
  if (Number.isFinite(direct) && direct > 0) return direct
  const username = String(body.robloxUsername || '').trim()
  if (!username) return null
  try {
    const { data: existing } = await supa.from('users').select('roblox_user_id').eq('roblox_username', username).maybeSingle()
    const id = Number(existing?.roblox_user_id)
    if (Number.isFinite(id) && id > 0) return id
  } catch {}
  try {
    const res = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    })
    if (res.ok) {
      const j = await res.json().catch(()=> ({}))
      const id = Number(j?.data?.[0]?.id)
      if (Number.isFinite(id) && id > 0) return id
    }
  } catch {}
  return null
}

function json(body: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } })
}

function cors(req: Request, res: Response) {
  const headers = new Headers(res.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Headers', 'content-type, x-client-hmac, x-client-ts')
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  return new Response(res.body, { status: res.status, headers })
}

Deno.serve(async (req) => {
  // rate limit simples por IP (memória do processo)
  const ip = req.headers.get('x-forwarded-for') || 'anon'
  ;(globalThis as any).__rl = (globalThis as any).__rl || new Map<string, number[]>()
  const store: Map<string, number[]> = (globalThis as any).__rl
  const key = `buy:${ip}`
  const now = Date.now()
  const windowMs = 60_000
  const limit = 10
  const arr = store.get(key) || []
  const fresh = arr.filter((t) => now - t < windowMs)
  if (fresh.length >= limit) return cors(req, json({ error: 'rate_limited' }, { status: 429 }))
  fresh.push(now)
  store.set(key, fresh)

  if (req.method === 'OPTIONS') return cors(req, new Response(null, { status: 204 }))
  const supa = getAdminClient()
  try {
    const raw = await req.text()
    const ok = await verifyHmac(raw, req.headers.get('x-client-ts'), req.headers.get('x-client-hmac'), Deno.env.get('CLIENT_HMAC_SECRET'))
    if (!ok) return cors(req, json({ error: 'invalid_signature' }, { status: 401 }))
    const body = JSON.parse(raw || '{}') as Input

    const gamePassId = parseGamePassId(body.gamePassId)
    const expectedPrice = Number(body.expectedPrice)
    if (!Number.isFinite(expectedPrice) || expectedPrice <= 0) {
      return cors(req, json({ error: 'expectedPrice inválido' }, { status: 400 }))
    }

    const buyerUserIdFinal = await resolveBuyerUserId(supa, body)

    const info = await resolveGamePass(gamePassId)
    if (info.price !== expectedPrice) {
      return cors(req, json({ error: 'price_mismatch', detected: info.price }, { status: 409 }))
    }
    if (body.sellerUserId && Number(body.sellerUserId) !== info.sellerId) {
      return cors(req, json({ error: 'seller_mismatch', detected: info.sellerId }, { status: 409 }))
    }

    // preço BRL a partir do settings (fallback 0.20)
    const { data: settings } = await supa.from('settings').select('*').eq('id', 1).maybeSingle()
    const ppr = Number(settings?.price_per_robux || 0.2)
    const amount_brl = Math.max(100, priceInBRL(expectedPrice, ppr)) // mínimo R$ 1,00

    // idempotência por último pedido comprado recentemente
    const { data: recent } = await supa
      .from('orders')
      .select('*')
      .eq('gamepass_id', gamePassId)
      .eq('expected_price', expectedPrice)
      .order('created_at', { ascending: false })
      .limit(1)

    if (recent && recent[0]?.purchase_status === 'purchased') {
      const created = new Date(recent[0].created_at).getTime()
      if (Date.now() - created < 6 * 60 * 60 * 1000) {
        return cors(req, json({ status: 'already_purchased', orderId: recent[0].id }))
      }
    }

    // inserir em orders (fluxo compra direta, já "pago")
    const { data: order, error: insErr } = await supa
      .from('orders')
      .insert({
        user_id: null,
        amount_brl,
        robux_liquid: expectedPrice,
        route: 'GAMEPASS',
        payment_status: 'paid',
        gamepass_id: gamePassId,
        product_id: info.productId,
        expected_price: expectedPrice,
        seller_user_id: body.sellerUserId || info.sellerId,
        buyer_user_id: buyerUserIdFinal || null,
        purchase_status: 'pending',
      })
      .select()
      .single()

    if (insErr) throw insErr

    // se já possui, marcar como purchased e retornar
    const own = await alreadyOwns(buyerUserIdFinal || null, gamePassId)
    if (own === true) {
      await supa.from('orders').update({ purchase_status: 'purchased', purchase_error: 'alreadyOwned' }).eq('id', order.id)
      return cors(req, json({ status: 'alreadyOwned', orderId: order.id }))
    }

    // Diagnóstico: validar sessão Roblox antes de comprar
    const me = await whoAmI()
    if (!me) {
      await supa.from('orders').update({ purchase_status: 'failed', purchase_error: 'roblox_cookie_invalid_or_challenged' }).eq('id', order.id)
      return cors(req, json({ error: 'roblox_cookie_invalid_or_challenged', orderId: order.id }, { status: 401 }))
    }

    // tenta comprar
    try {
      const { purchaseId } = await purchaseProduct(info.productId, expectedPrice, info.sellerId)
      await supa
        .from('orders')
        .update({ purchase_status: 'purchased', purchase_id: purchaseId, product_id: info.productId, updated_at: new Date().toISOString() })
        .eq('id', order.id)
      return cors(req, json({ status: 'ok', orderId: order.id, purchaseId }))
    } catch (e) {
      const msg = (e as Error).message || 'purchase_failed'
      await supa
        .from('orders')
        .update({ purchase_status: 'failed', purchase_error: msg, updated_at: new Date().toISOString() })
        .eq('id', order.id)
      const status = /403|401/.test(msg) ? 403 : /429/.test(msg) ? 429 : 500
      return cors(req, json({ error: 'purchase_failed', message: msg }, { status }))
    }
  } catch (e) {
    const msg = (e as Error).message || 'error'
    return cors(req, json({ error: msg }, { status: 400 }))
  }
})