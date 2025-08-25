// deno-lint-ignore-file no-explicit-any

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

async function lookupPrimary(name: string) {
  const res = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [name], excludeBannedUsers: true }),
  })
  if (!res.ok) return { exists: false as const }
  const j = await res.json().catch(()=>({})) as any
  const item = Array.isArray(j?.data) && j.data.length > 0 ? j.data[0] : null
  if (item && item.id) return { exists: true as const, id: Number(item.id), name: String(item.requestedUsername || item.name || name) }
  return { exists: false as const }
}

async function lookupFallback(name: string) {
  const res = await fetch(`https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(name)}`)
  if (!res.ok) return { exists: false as const }
  const j = await res.json().catch(()=>({})) as any
  const id = Number(j?.Id || j?.id)
  const uname = String(j?.Username || j?.username || name)
  if (Number.isFinite(id) && id > 0) return { exists: true as const, id, name: uname }
  return { exists: false as const }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  try {
    const { username } = await req.json() as { username?: string }
    const name = String(username || '').trim()
    if (!name) return new Response(JSON.stringify({ exists: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const pri = await lookupPrimary(name)
    if (pri.exists) {
      return new Response(JSON.stringify(pri), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const fb = await lookupFallback(name)
    return new Response(JSON.stringify(fb), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ exists: false, error: String((e as Error).message || e) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})



