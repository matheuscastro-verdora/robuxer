import axios from 'axios'

const functionsBase = (import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string) || '/functions/v1'
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const api = axios.create({
	baseURL: functionsBase,
	headers: { 'Content-Type': 'application/json', ...(anonKey ? { Authorization: `Bearer ${anonKey}` } : {}) },
})

export async function checkEmailExists(email: string) {
  const { data } = await api.post('/check-email', { email })
  return data as { exists: boolean; error?: string }
}

export type LinkRobloxRequest = { username: string; authUserId?: string }
export type LinkRobloxResponse = {
	id: string
	auth_user_id: string | null
	email: string | null
	roblox_user_id: number | null
	roblox_username: string
	joined_at: string | null
	eligible_at: string | null
	is_eligible: boolean
}

export async function linkRoblox(body: LinkRobloxRequest) {
	const { data } = await api.post<LinkRobloxResponse>('/link-roblox', body)
	return data
}

export async function usernameLookup(username: string) {
  const { data } = await api.post('/username-lookup', { username })
  return data as { exists: boolean; id?: number | null; name?: string | null; error?: string }
}

export type CreateChargeRequest = { userId: string; robuxLiquid?: number; gamePassId?: number | string }
export type CreateChargeResponse = {
	orderId: string
	providerPaymentId: string
	qrcode: string
	copyPaste: string
	amountBRL: number
}

export async function createPixCharge(body: CreateChargeRequest) {
  const { headers } = await signedHeaders(body)
  const { data } = await api.post<CreateChargeResponse>('/abacatepay-create-charge', body, { headers })
  return data
}

export type SettingsResponse = { c_bruto: number; price_per_robux: number }
export async function getSettings() {
	const { data } = await api.get<SettingsResponse>('/get-settings')
	return data
}

export async function getOrderStatus(id: string) {
	const { data } = await api.get(`/get-order-status`, { params: { id } })
	return data as { order: any; payouts: any[]; user: any }
}

export async function getConfig() {
	const { data } = await api.get('/get-config')
	return data as { roblox_group_id: number | null }
}

export async function membershipLookup(username: string) {
	const { data } = await api.post('/membership-lookup', { username })
	return data as { isMember: boolean; profile: any }
}

// Game Pass endpoints
export type ResolveGamepassResponse = { productId: number; price: number; sellerId: number }
export async function resolveGamepass(gamePassId: number | string) {
  const body = { gamePassId }
  const { headers } = await signedHeaders(body)
  const { data } = await api.post<ResolveGamepassResponse>('/resolve-gamepass', body, { headers })
  return data
}

export type BuyGamepassBody = {
  gamePassId: number | string
  expectedPrice: number
  sellerUserId?: number
  buyerUserId?: number | null
  robloxUserId?: number | null
  robloxUsername?: string | null
}
export async function buyGamepass(body: BuyGamepassBody) {
  const { headers } = await signedHeaders(body)
  const { data } = await api.post('/buy-gamepass', body, { headers })
  return data as { status: string; orderId?: string; purchaseId?: string; error?: string; message?: string }
}

export async function listGamepasses(experienceId: number | string) {
  const { data } = await api.post('/list-gamepasses', { experienceId })
  return data as { items: { id: number; name: string }[] }
}

// Test helpers
export async function simulatePayment(providerPaymentId: string) {
  const { data } = await api.post('/abacatepay-simulate-payment', { providerPaymentId })
  return data as { ok: boolean }
}

async function signedHeaders(body: any) {
  const ts = String(Date.now())
  const raw = JSON.stringify(body)
  const hmac = await signHmac(raw, ts)
  const headers: Record<string, string> = { 'x-client-ts': ts, 'x-client-hmac': hmac }
  return { headers }
}

async function signHmac(raw: string, ts: string) {
  const secret = import.meta.env.VITE_CLIENT_HMAC_SECRET
  if (!secret) return ''
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}.${raw}`))
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')
}