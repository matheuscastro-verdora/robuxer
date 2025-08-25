import { whoAmI } from '../_shared/roblox.ts'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const me = await whoAmI()
    const ip = await fetch('https://api.ipify.org?format=json').then(r=>r.json()).catch(()=>({}))
    return new Response(JSON.stringify({ whoami: me, egressIp: ip }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})