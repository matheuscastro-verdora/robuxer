// deno-lint-ignore-file no-explicit-any
import { parseExperienceId } from '../_shared/roblox.ts'

function json(body: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } })
}

function cors(req: Request, res: Response) {
  const headers = new Headers(res.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Headers', 'content-type, x-client-hmac, x-client-ts, authorization')
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  return new Response(res.body, { status: res.status, headers })
}

async function listByExperience(experienceId: number) {
  // Using legacy/public endpoints (subject to change). If it fails, return empty list and FE can input manually
  // Common community endpoint: https://games.roblox.com/v1/games/{experienceId}/game-passes?limit=100
  const url = `https://games.roblox.com/v1/games/${experienceId}/game-passes?limit=100`
  const res = await fetch(url)
  if (!res.ok) return []
  const j = await res.json().catch(() => ({}))
  const data = Array.isArray(j?.data) ? j.data : []
  return data.map((gp: any) => ({ id: gp.id, name: gp.name }))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return cors(req, new Response(null, { status: 204 }))
  try {
    const body = await req.json().catch(() => ({}))
    const experienceId = parseExperienceId(body?.experienceId)
    const items = await listByExperience(experienceId)
    return cors(req, json({ items }))
  } catch (e) {
    return cors(req, json({ error: (e as Error).message || 'error', items: [] }, { status: 400 }))
  }
})



