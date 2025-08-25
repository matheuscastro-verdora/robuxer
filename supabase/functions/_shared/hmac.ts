export async function verifyHmac(raw: string, ts: string | null, sig: string | null, secret: string | undefined) {
  if (!secret) return true
  if (!ts || !sig) return false
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const message = encoder.encode(`${ts}.${raw}`)
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const buf = await crypto.subtle.sign('HMAC', cryptoKey, message)
  const hex = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')
  return hex === sig
}



