export const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function resolveRobloxUser(username: string) {
	const res = await fetch(`https://users.roblox.com/v1/usernames/users`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
	})
	if (!res.ok) return null
	const data = await res.json()
	const user = data.data?.[0]
	return user ? { id: Number(user.id), name: String(user.name) } : null
}

async function isMember(userId: number, groupId: number) {
	const res = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`)
	if (!res.ok) return false
	const data = await res.json()
	return Array.isArray(data.data) && data.data.some((g: any) => g.group?.id === groupId)
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
function admin() {
	const url = Deno.env.get('SUPABASE_URL') || Deno.env.get('PROJECT_URL')!
	const key = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
	return createClient(url, key, { auth: { persistSession: false } })
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
	try {
		const body = await req.json()
		const username = String(body?.username || '').trim()
		if (!username) return new Response('username required', { status: 400, headers: corsHeaders })
		const groupId = Number(Deno.env.get('ROBLOX_GROUP_ID'))
		const roblox = await resolveRobloxUser(username)
		if (!roblox) return new Response(JSON.stringify({ isMember: false, profile: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
		const member = await isMember(roblox.id, groupId)
		const supa = admin()
		const { data: profile } = await supa.from('users').select('*').eq('roblox_username', roblox.name).maybeSingle()
		return new Response(
			JSON.stringify({ isMember: member, profile }),
			{ headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
		)
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
	}
})
