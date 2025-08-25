import { getAdminClient } from '../_shared/db.ts'

async function isMember(userId: number, groupId: number) {
	const res = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`)
	if (!res.ok) return false
	const data = await res.json()
	return Array.isArray(data.data) && data.data.some((g: any) => g.group?.id === groupId)
}

Deno.serve(async () => {
	const supabase = getAdminClient()
	const GROUP_ID = Number(Deno.env.get('ROBLOX_GROUP_ID'))
	const { data: users } = await supabase.from('users').select('*').or('joined_at.is.null,is_eligible.eq.false')
	for (const u of users || []) {
		if (!u.roblox_user_id) continue
		const member = await isMember(Number(u.roblox_user_id), GROUP_ID)
		if (member && !u.joined_at) {
			const joined = new Date().toISOString()
			const eligible = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
			await supabase.from('users').update({ joined_at: joined, eligible_at: eligible }).eq('id', u.id)
		}
		const isEligible = u.eligible_at ? Date.now() >= new Date(u.eligible_at).getTime() : false
		await supabase.from('users').update({ is_eligible: isEligible }).eq('id', u.id)
	}
	return new Response('ok')
})
