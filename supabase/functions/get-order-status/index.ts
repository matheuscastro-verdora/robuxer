import { getAdminClient } from '../_shared/db.ts'

export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
	const url = new URL(req.url)
	const id = url.searchParams.get('id')
	if (!id) return new Response('missing id', { status: 400, headers: corsHeaders })
	const supabase = getAdminClient()
	const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
	const payouts: any[] = []
	const { data: user } = await supabase.from('users').select('*').eq('id', order.user_id).single()
	return new Response(JSON.stringify({ order, payouts, user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
