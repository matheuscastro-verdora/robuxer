// Minimal Roblox API client for Edge Functions (Deno)
// Declare global Deno for ESLint/TS in Node tooling context
declare const Deno: {
  env: { get(key: string): string | undefined }
}

type ResolveOutput = { productId: number; price: number; sellerId: number }

function getCookie(): string {
  const cookie = Deno.env.get('ROBLOX_SECURITY_COOKIE') || ''
  if (!cookie) throw new Error('Missing ROBLOX_SECURITY_COOKIE secret')
  return cookie
}

function ttl(): number {
  const s = Number(Deno.env.get('ROBLOX_CSRF_CACHE_TTL_SECONDS') || '900')
  return Number.isFinite(s) && s > 0 ? s : 900
}

let csrfToken: string | null = null
let csrfTokenExpiresAt = 0

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

async function fetchWithRetry(url: string, init: RequestInit & { maxRetries?: number; minWaitMs?: number; maxWaitMs?: number; timeoutMs?: number } = {}) {
  const { maxRetries = 3, minWaitMs = 250, maxWaitMs = 1200, timeoutMs = 10_000, ...rest } = init
  let attempt = 0
  while (true) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs)
      const res = await fetch(url, { ...rest, signal: controller.signal })
      clearTimeout(timer)
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        if (attempt >= maxRetries) return res
        const jitter = Math.random() * (maxWaitMs - minWaitMs) + minWaitMs
        await sleep(jitter * (attempt + 1))
        attempt++
        continue
      }
      return res
    } catch (_e) {
      if (attempt >= maxRetries) throw _e
      const jitter = Math.random() * (maxWaitMs - minWaitMs) + minWaitMs
      await sleep(jitter * (attempt + 1))
      attempt++
    }
  }
}

export async function getCsrf(): Promise<string> {
  const now = Date.now()
  if (csrfToken && csrfTokenExpiresAt > now) return csrfToken

  const commonHeaders = {
    'Content-Type': 'application/json',
    'Cookie': `.ROBLOSECURITY=${getCookie()}`,
    // alguns endpoints exigem cabeçalhos típicos de navegador
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Supabase/Edge',
    'Origin': 'https://www.roblox.com',
    'Referer': 'https://www.roblox.com/',
    'Accept': 'application/json, text/plain, */*',
  } as Record<string, string>

  // Tentar endpoints "safe" que retornam 403 com X-CSRF-Token sem efetuar logout
  const candidates = [
    { url: 'https://catalog.roblox.com/v1/catalog/items/details', method: 'POST', body: '{}' },
  ]

  const errors: string[] = []
  for (const c of candidates) {
    try {
      const res = await fetch(c.url, {
        method: c.method as 'POST',
        headers: commonHeaders,
        body: c.body ?? JSON.stringify({}),
      })
      const token = res.headers.get('x-csrf-token')
      if (token) {
        csrfToken = token
        csrfTokenExpiresAt = now + ttl() * 1000
        return token
      }
      const txt = await res.text().catch(()=> '')
      errors.push(`${c.url} -> ${res.status} ${txt?.slice(0,180)}`)
    } catch (e) {
      errors.push(`${c.url} -> ${(e as Error).message}`)
    }
  }

  throw new Error(`Failed to obtain X-CSRF-Token. Tried: ${errors.join(' | ')}`)
}

// Gera um token CSRF fresco SEM cache (recomendado para cada transação sensível)
async function getFreshCsrf(): Promise<string> {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `.ROBLOSECURITY=${getCookie()}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Supabase/Edge',
    'Origin': 'https://www.roblox.com',
    'Referer': 'https://www.roblox.com/',
    'Accept': 'application/json, text/plain, */*',
  } as Record<string, string>

  // Endpoint "safe" (gera 403 + x-csrf-token, sem logout)
  const res = await fetchWithRetry('https://catalog.roblox.com/v1/catalog/items/details', {
    method: 'POST',
    headers,
    body: '{}',
    maxRetries: 1,
    timeoutMs: 10_000,
  })
  const token = res.headers.get('x-csrf-token')
  if (token) return token
  const txt = await res.text().catch(() => '')
  throw new Error(`Failed to obtain fresh X-CSRF-Token: ${res.status} ${txt?.slice(0,180)}`)
}

export async function resolveGamePass(gamePassId: number): Promise<ResolveOutput> {
  const candidates = [
    `https://apis.roblox.com/marketplace-items/v1/items/details?itemType=GamePass&itemTargetId=${gamePassId}`,
    // economy endpoints (community-known variants)
    `https://economy.roblox.com/v1/game-passes/${gamePassId}/product-info`,
    `https://economy.roblox.com/v1/game-pass/${gamePassId}/game-pass-product-info`,
  ]

  const errors: string[] = []
  for (const url of candidates) {
    try {
      // Usar headers autenticados para as APIs do Roblox
      const headers = {
        'Cookie': `.ROBLOSECURITY=${getCookie()}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Supabase/Edge',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.roblox.com',
        'Referer': 'https://www.roblox.com/',
      }
      
      const r = await fetchWithRetry(url, { 
        method: 'GET',
        headers
      })
      if (!r.ok) { errors.push(`${url} -> ${r.status}`); continue }
      const j = await r.json().catch(()=> ({}))
      const item = Array.isArray(j) ? j[0] : j
      const productId = Number(item?.ProductId ?? item?.productId ?? item?.item?.productId)
      const price = Number(item?.PriceInRobux ?? item?.priceInRobux ?? item?.price ?? item?.salePrice)
      const sellerId = Number(item?.Seller?.Id ?? item?.sellerId ?? item?.creatorId ?? item?.Creator?.Id ?? item?.creator?.id)
      if (Number.isFinite(productId) && Number.isFinite(price) && Number.isFinite(sellerId)) {
        return { productId, price, sellerId }
      }
      errors.push(`${url} -> invalid mapping`)
    } catch (e) {
      errors.push(`${url} -> ${(e as Error).message}`)
    }
  }
  throw new Error(`resolve failed: ${errors.join(' | ')}`)
}

export async function alreadyOwns(buyerUserId: number | null | undefined, gamePassId: number): Promise<boolean | null> {
  if (!buyerUserId) return null
  const url = `https://api.roblox.com/ownership/hasasset?userId=${buyerUserId}&assetId=${gamePassId}`
  const r = await fetchWithRetry(url, { method: 'GET' })
  if (!r.ok) return null
  const txt = await r.text()
  if (txt === 'true') return true
  if (txt === 'false') return false
  return null
}

export async function purchaseProduct(productId: number, expectedPrice: number, expectedSellerId: number): Promise<{ purchaseId: string }>{
  // Etapa 1: tentar sem X-CSRF-Token para capturar token no header (403 esperado)
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cookie': `.ROBLOSECURITY=${getCookie()}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://www.roblox.com',
    'Referer': 'https://www.roblox.com/',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-Requested-With': 'XMLHttpRequest',
  }

  const res = await fetchWithRetry(`https://economy.roblox.com/v1/purchases/products/${productId}`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({ expectedCurrency: 1, expectedPrice, expectedSellerId }),
  })

  if (res.status === 403 || res.status === 401) {
    // Padrão Roblox: capturar token do header da própria resposta
    const headerToken = res.headers.get('x-csrf-token')
    const tokenToUse = headerToken || (csrfToken = null, await getFreshCsrf())
    const res2 = await fetchWithRetry(`https://economy.roblox.com/v1/purchases/products/${productId}`, {
      method: 'POST',
      headers: { ...baseHeaders, 'X-CSRF-Token': tokenToUse },
      body: JSON.stringify({ expectedCurrency: 1, expectedPrice, expectedSellerId }),
    })
    if (!res2.ok) {
      const text = await res2.text().catch(()=>'')
      throw new Error(`purchase failed: ${res2.status} ${text}`)
    }
    const j2 = await res2.json().catch(()=> ({}))
    return { purchaseId: String(j2?.purchaseId || j2?.purchased || j2?.id || '') }
  }

  if (!res.ok) {
    const text = await res.text().catch(()=> '')
    throw new Error(`purchase failed: ${res.status} ${text}`)
  }
  const j = await res.json().catch(()=> ({}))
  return { purchaseId: String(j?.purchaseId || j?.purchased || j?.id || '') }
}

export function parseGamePassId(input: string | number): number {
  if (typeof input === 'number') return input
  const m = String(input).match(/(game-pass|gamepass|catalog)\/(\d+)/i) || String(input).match(/id=(\d+)/)
  if (m?.[2]) return Number(m[2])
  const n = Number(input)
  if (Number.isFinite(n) && n > 0) return n
  throw new Error('Invalid gamePassId')
}

export function parseExperienceId(input: string | number): number {
  if (typeof input === 'number') return input
  const m = String(input).match(/(games|experiences)\/(\d+)/i) || String(input).match(/placeId=(\d+)/)
  if (m?.[2]) return Number(m[2])
  const n = Number(input)
  if (Number.isFinite(n) && n > 0) return n
  throw new Error('Invalid experienceId')
}


export async function whoAmI(): Promise<{ id: number; name: string } | null> {
  const res = await fetch('https://users.roblox.com/v1/users/authenticated', {
    method: 'GET',
    headers: {
      'Cookie': `.ROBLOSECURITY=${getCookie()}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Supabase/Edge',
      'Accept': 'application/json, text/plain, */*',
      'Origin': 'https://www.roblox.com',
      'Referer': 'https://www.roblox.com/',
    },
  })
  if (!res.ok) return null
  const j = await res.json().catch(()=> ({}))
  return (j && j.id) ? { id: Number(j.id), name: String(j.name) } : null
}


