export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
	const groupId = Deno.env.get('ROBLOX_GROUP_ID')
	return new Response(JSON.stringify({ roblox_group_id: groupId ? Number(groupId) : null }), {
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	})
})
