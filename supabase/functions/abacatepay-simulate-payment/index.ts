import { simulatePaymentByQrId } from '../_shared/abacatepay.ts'
import { getAdminClient } from '../_shared/db.ts'
import { resolveGamePass, purchaseProduct } from '../_shared/roblox.ts'

export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
	try {
		const body = await req.json()
		const providerPaymentId = String(body?.providerPaymentId || '')
		if (!providerPaymentId) return new Response('providerPaymentId required', { status: 400, headers: corsHeaders })
		const res = await simulatePaymentByQrId(providerPaymentId)

		// Atualizar ordem diretamente (best-effort) e tentar compra
		try {
			const supabase = getAdminClient()
			const { data: ord } = await supabase.from('orders').select('*').eq('provider_payment_id', providerPaymentId).maybeSingle()
			if (ord?.id) {
				await supabase.from('orders').update({ payment_status: 'paid', paid_at: new Date().toISOString() }).eq('id', ord.id)
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
			}
		} catch {}

		// Best-effort: acionar webhook interno para processar a ordem como paga
		try {
			const secret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET') || ''
			const u = new URL(req.url)
			u.pathname = u.pathname.replace('abacatepay-simulate-payment', 'abacatepay-webhook')
			u.searchParams.set('webhookSecret', secret)
			const evt = { id: crypto.randomUUID(), type: 'charge.succeeded', data: { id: providerPaymentId, metadata: {} } }
			await fetch(u.toString(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evt) })
		} catch {}
		return new Response(JSON.stringify({ ok: true, provider: res }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
	}
})
