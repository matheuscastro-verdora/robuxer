import { getAdminClient } from '../_shared/db.ts'
import { createCharge } from '../_shared/abacatepay.ts'
import { priceInBRL } from '../_shared/pricing.ts'
import { parseGamePassId, resolveGamePass } from '../_shared/roblox.ts'

export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-hmac, x-client-ts',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
	try {
		const body = await req.json()
		const userId = String(body?.userId || '')
		const robuxLiquidInput = Number(body?.robuxLiquid || 0)
		const gamePassId = body?.gamePassId ? parseGamePassId(body.gamePassId) : undefined
		if (!userId) return new Response('invalid body', { status: 400, headers: corsHeaders })

		const supabase = getAdminClient()
		const { data: settings, error: settingsErr } = await supabase.from('settings').select('*').eq('id', 1).single()
		if (settingsErr || !settings) {
			return new Response(JSON.stringify({ error: 'settings_not_found' }), { status: 500, headers: corsHeaders })
		}

		// Se for uma cobrança vinculada a Game Pass, validar e persistir metadados
		let gp: { productId: number; price: number; sellerId: number } | null = null
		if (gamePassId) {
			gp = await resolveGamePass(gamePassId)
		}

		// Robux a serem cobrados: se game pass foi informado, usar o preço do passe; caso contrário, usar input
		const robuxToCharge = gp ? Number(gp.price) : Number(robuxLiquidInput)
		if (!robuxToCharge || robuxToCharge <= 0) return new Response('invalid amount', { status: 400, headers: corsHeaders })

		// Calcular valor em BRL com base na quantidade de Robux determinada (mínimo R$ 1,00)
		let amount_brl = priceInBRL(robuxToCharge, Number(settings.price_per_robux))
		if (amount_brl < 100) amount_brl = 100

		// Validar userId: buscar o ID da tabela users pelo auth_user_id
		let userIdForRow: string | null = null
		const uuidLike = /^[0-9a-fA-F-]{36}$/.test(userId)
		if (uuidLike) {
			const { data: u } = await supabase.from('users').select('id').eq('auth_user_id', userId).maybeSingle()
			if (u?.id) userIdForRow = u.id
		}

		// Inserir pedido incluindo metadados de Game Pass (se fornecidos)
		let order: any = null
		let insertErr: any = null
		const fullPayload = {
			user_id: userIdForRow,
			amount_brl,
			robux_liquid: robuxToCharge,
			gamepass_id: gamePassId || null,
			product_id: gp?.productId || null,
			seller_user_id: gp?.sellerId || null,
			expected_price: gp?.price || null,
		}
		{
			const { data, error } = await supabase.from('orders').insert(fullPayload).select('*').single()
			order = data
			insertErr = error
		}
		if (insertErr || !order) {
			// Fallback: schema sem colunas do gamepass
			const minimal = { user_id: userIdForRow, amount_brl, robux_liquid: robuxToCharge }
			const { data: data2, error: err2 } = await supabase.from('orders').insert(minimal).select('*').single()
			if (!err2 && data2) { order = data2; insertErr = null }
		}

		if (insertErr || !order) {
			const err: any = insertErr || {}
			console.error('orders insert error', err)
			return new Response(
				JSON.stringify({
					error: 'order_insert_failed',
					details: { message: err?.message, code: err?.code, details: err?.details, hint: err?.hint, payload: fullPayload },
				}),
				{ status: 500, headers: corsHeaders },
			)
		}

		const charge = await createCharge({
			amount: amount_brl,
			currency: 'BRL',
			payment_method: 'pix',
			metadata: { order_id: order.id, user_id: userId, gamepass_id: gamePassId ? String(gamePassId) : '', expected_price: gp?.price ? String(gp.price) : '' },
			description: `Order ${order.id}`,
			expiresInSeconds: 900,
		})

		await supabase.from('orders').update({ provider_payment_id: charge.id }).eq('id', order.id)

		return new Response(
			JSON.stringify({ orderId: order.id, providerPaymentId: charge.id, qrcode: charge.pix.qrcode, copyPaste: charge.pix.copy_paste, amountBRL: amount_brl }),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		)
	} catch (e) {
		console.error('abacatepay-create-charge error', e)
		return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
	}
})
