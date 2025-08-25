function json(body: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } })
}

function cors(req: Request, res: Response) {
  const headers = new Headers(res.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Headers', 'content-type')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  return new Response(res.body, { status: res.status, headers })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return cors(req, new Response(null, { status: 204 }))
  return cors(req, json({ ok: true, now: new Date().toISOString() }))
})



