// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  try {
    const { email } = await req.json() as { email?: string }
    const e = String(email || '').trim().toLowerCase()
    if (!e) return new Response(JSON.stringify({ exists: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const url = Deno.env.get('SUPABASE_URL') || Deno.env.get('PROJECT_URL')!
    const key = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(url, key, { auth: { persistSession: false } })

    const { data, error } = await supabase.auth.admin.getUserByEmail(e)
    if (error && !String(error.message || '').toLowerCase().includes('user not found')) {
      return new Response(JSON.stringify({ exists: false, error: String(error.message) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const exists = !!data?.user?.id
    return new Response(JSON.stringify({ exists }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ exists: false, error: String((e as Error).message || e) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})



