import { getAdminClient } from '../_shared/db.ts'

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
	if (!res.ok) throw new Error('roblox lookup failed')
	const data = await res.json()
	const user = data.data?.[0]
	return user ? { id: user.id as number, name: user.name as string } : null
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
	try {
		const body = await req.json()
		const username = String(body?.username || '').trim()
		const authUserId = body?.authUserId ? String(body.authUserId) : null
		if (!username) return new Response('username required', { status: 400, headers: corsHeaders })

		const roblox = await resolveRobloxUser(username)
		if (!roblox) return new Response('user not found', { status: 404, headers: corsHeaders })

		const supabase = getAdminClient()
		const { data: existing } = await supabase.from('users').select('*').eq('roblox_username', username).maybeSingle()
		let user = existing
		if (!user) {
			const { data, error } = await supabase
				.from('users')
				.insert({ roblox_user_id: roblox.id, roblox_username: roblox.name, auth_user_id: authUserId })
				.select('*')
				.single()
			if (error) throw error
			user = data
		} else {
			const update: Record<string, unknown> = {}
			if (!existing.roblox_user_id) update.roblox_user_id = roblox.id
			if (authUserId && !existing.auth_user_id) update.auth_user_id = authUserId
			if (Object.keys(update).length) {
				await supabase.from('users').update(update).eq('id', existing.id)
				const { data } = await supabase.from('users').select('*').eq('id', existing.id).single()
				user = data
			}
		}

		return new Response(JSON.stringify(user), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
	}
})
