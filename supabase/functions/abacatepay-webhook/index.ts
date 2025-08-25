import { getAdminClient } from '../_shared/db.ts'
import { verifySignature } from '../_shared/abacatepay.ts'
import { purchaseProduct, resolveGamePass, whoAmI } from '../_shared/roblox.ts'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-abacatepay-signature, x-abacatepay-timestamp',
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
	const url = new URL(req.url)
	const raw = await req.text()
	const secret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET') || ''

	const ts = req.headers.get('x-abacatepay-timestamp') || ''
	const sig = req.headers.get('x-abacatepay-signature') || ''
	let authorized = false
	if (ts && sig) {
		const windowMs = 5 * 60 * 1000
		const now = Date.now()
		const validTs = Math.abs(now - Number(ts) * 1000) <= windowMs
		if (!validTs) return new Response('invalid timestamp', { status: 400, headers: corsHeaders })
		authorized = await verifySignature(raw, ts, sig, secret)
		if (!authorized) return new Response('invalid signature', { status: 401, headers: corsHeaders })
	}
	if (!authorized) {
		const qsSecret = url.searchParams.get('webhookSecret')
		if (!qsSecret || qsSecret !== secret) return new Response('unauthorized', { status: 401, headers: corsHeaders })
	}

	const evtRaw = JSON.parse(raw)
	const evt = evtRaw?.data ? { ...evtRaw, data: evtRaw.data } : evtRaw
	const payload = evt.data?.data ?? evt.data ?? evt
	const supabase = getAdminClient()

	const eventId: string = evt.id ?? payload?.id ?? crypto.randomUUID()
	const { data: already } = await supabase.from('event_logs').select('*').eq('id', eventId).maybeSingle()
	if (already) return new Response('ok', { headers: corsHeaders })

	const type = (evt.type || evt.event || '').toLowerCase()
	let processed = false

	if (type === 'charge.succeeded' || type === 'billing.paid') {
		const meta = payload?.metadata || evt.metadata || {}
		let orderId: string | undefined = meta.order_id || meta.externalId || meta.orderId
		if (!orderId) {
			const candidates = [payload?.id, payload?.paymentId, payload?.payment_id, payload?.pixQrCode?.id, payload?.qrCodeId, payload?.qr_id, payload?.pix?.id].filter((v) => typeof v === 'string') as string[]
			if (candidates.length) {
				const { data: ord } = await supabase.from('orders').select('*').in('provider_payment_id', candidates).limit(1).maybeSingle()
				if (ord?.id) {
					await supabase.from('orders').update({ payment_status: 'paid', paid_at: new Date().toISOString() }).eq('id', ord.id)
					// Fluxo atual: se for Game Pass, efetuar compra
					if (ord.gamepass_id && ord.expected_price) {
						try {
							const gp = await resolveGamePass(ord.gamepass_id)
							if (gp.price !== Number(ord.expected_price)) throw new Error('price_mismatch')
							const { purchaseId } = await purchaseProduct(gp.productId, Number(ord.expected_price), gp.sellerId)
							await supabase.from('orders').update({ purchase_status: 'purchased', purchase_id: purchaseId, product_id: gp.productId, seller_user_id: gp.sellerId }).eq('id', ord.id)
						} catch (e) {
							await supabase.from('orders').update({ purchase_status: 'failed', purchase_error: String(e) }).eq('id', ord.id)
						}
					}
					processed = true
				}
			}
		}
		if (!processed && orderId) {
			await supabase.from('orders').update({ payment_status: 'paid', paid_at: new Date().toISOString() }).eq('id', orderId)
			const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
			if (order?.gamepass_id && order?.expected_price) {
				try {
					// Diagnóstico: validar sessão Roblox antes de comprar
					const me = await whoAmI()
					if (!me) {
						await supabase.from('orders').update({ purchase_status: 'failed', purchase_error: 'roblox_cookie_invalid_or_challenged' }).eq('id', orderId)
						processed = true
						return new Response('ok', { headers: corsHeaders })
					}
					// revalidar (por segurança) e comprar
					const gp = await resolveGamePass(order.gamepass_id)
					if (gp.price !== Number(order.expected_price)) throw new Error('price_mismatch')
					const { purchaseId } = await purchaseProduct(gp.productId, Number(order.expected_price), gp.sellerId)
					await supabase.from('orders').update({ purchase_status: 'purchased', purchase_id: purchaseId, product_id: gp.productId, seller_user_id: gp.sellerId }).eq('id', orderId)
				} catch (e) {
					await supabase.from('orders').update({ purchase_status: 'failed', purchase_error: String(e) }).eq('id', orderId)
				}
			}
			processed = true
		}
	}

	if (type === 'charge.failed' || type === 'refund.succeeded' || type === 'billing.failed') {
		const meta = payload?.metadata || evt.metadata || {}
		const orderId = meta.order_id || meta.externalId || meta.orderId
		if (orderId) {
			await supabase.from('orders').update({ payment_status: type.includes('refund') ? 'refunded' : 'failed' }).eq('id', orderId)
			processed = true
		}
	}

	if (processed) await supabase.from('event_logs').insert({ id: eventId, type: type || 'unknown' })

	return new Response('ok', { headers: corsHeaders })
})
