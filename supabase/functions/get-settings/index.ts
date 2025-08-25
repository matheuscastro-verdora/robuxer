import { getAdminClient } from '../_shared/db.ts'

export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
	const supabase = getAdminClient()
	const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single()
	if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
	return new Response(JSON.stringify({ c_bruto: Number(data.c_bruto), price_per_robux: Number(data.price_per_robux) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
