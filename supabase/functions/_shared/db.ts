import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getAdminClient() {
	const ref = Deno.env.get('SUPABASE_PROJECT_REF') || Deno.env.get('PROJECT_REF')
	const url =
		Deno.env.get('SUPABASE_URL') ||
		Deno.env.get('PROJECT_URL') ||
		(ref ? `https://${ref}.supabase.co` : undefined)
	if (!url) throw new Error('Missing Supabase URL env (SUPABASE_URL/PROJECT_URL)')
	const key = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
	if (!key) throw new Error('Missing SERVICE_ROLE_KEY secret')
	return createClient(url, key, { auth: { persistSession: false } })
}
