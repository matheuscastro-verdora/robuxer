export type CreateChargeInput = {
	amount: number
	currency: 'BRL'
	payment_method: 'pix'
	metadata?: Record<string, string>
	description?: string
	expiresInSeconds?: number
}

export type CreateChargeOutput = {
	id: string
	amount: number
	currency: 'BRL'
	status: 'pending' | 'paid' | 'failed' | 'refunded'
	pix: { qrcode: string; copy_paste: string }
}

const API = (Deno.env.get('ABACATEPAY_API') || '').replace(/\/$/, '')
const KEY = Deno.env.get('ABACATEPAY_KEY')!
const CUSTOM_PATH = Deno.env.get('ABACATEPAY_CHARGES_PATH') || ''

function mapPayloadForPath(path: string, input: CreateChargeInput): any {
  let body: any = {
    amount: input.amount,
    currency: input.currency,
    payment_method: input.payment_method,
    metadata: input.metadata,
  }
  if (/pixQrCode\/create$/i.test(path)) {
    body = {
      amount: input.amount,
      expiresIn: input.expiresInSeconds ?? 900,
      description: input.description ?? (input.metadata?.order_id ? `Order ${input.metadata.order_id}` : 'Order'),
      customer: undefined,
      metadata: input.metadata?.order_id ? { externalId: input.metadata.order_id } : undefined,
    }
  }
  return body
}

async function tryEndpoint(path: string, input: CreateChargeInput): Promise<Response> {
  const url = `${API}${path}`
  const payload = mapPayloadForPath(path, input)
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KEY}`,
    },
    body: JSON.stringify(payload),
  })
}

function unwrap(obj: any) { return obj?.data ?? obj }

function mapChargeResponse(raw: any): CreateChargeOutput {
  const data = unwrap(raw)
  return {
    id: data.id ?? data.charge_id ?? data.payment_id ?? data.transaction_id,
    amount: data.amount ?? data.value ?? data.total,
    currency: (data.currency ?? 'BRL') as 'BRL',
    status: (data.status ?? 'pending') as any,
    pix: {
      qrcode:
        data.pix?.qr_code_image ?? data.pix?.qrcode ?? data.qrcode ?? data.qr_code_image ?? data.qrCodeImage ?? data.qrCode ?? data.qr_code ?? data.pixQrCode?.qrCodeImage ?? data.brCodeBase64 ?? '',
      copy_paste:
        data.pix?.copy_paste ?? data.pix?.payload ?? data.copy_paste ?? data.payload ?? data.qrCode ?? data.qr_string ?? data.pixQrCode?.qrCode ?? data.brCode ?? '',
    },
  }
}

export async function createCharge(input: CreateChargeInput): Promise<CreateChargeOutput> {
  if (!API) throw new Error('ABACATEPAY_API not set')

  const candidates = CUSTOM_PATH
    ? [CUSTOM_PATH]
    : ['/v1/pixQrCode/create', '/v1/charges', '/charges', '/v1/payments', '/payments', '/v1/pix/charges', '/pix/charges']

  const errors: string[] = []
  for (const path of candidates) {
    try {
      const res = await tryEndpoint(path, input)
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        errors.push(`${path} -> ${res.status} ${txt}`)
        continue
      }
      const json = await res.json()
      return mapChargeResponse(json)
    } catch (e) {
      errors.push(`${path} -> ${String(e)}`)
    }
  }
  throw new Error(`abacatepay createCharge failed. Tried: ${errors.join(' | ')}`)
}

export async function simulatePaymentByQrId(qrId: string) {
  const paths = ['/v1/pixQrCode/simulate-payment', '/pixQrCode/simulate-payment']
  const errors: string[] = []
  for (const p of paths) {
    try {
      const url = `${API}${p}?id=${encodeURIComponent(qrId)}`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEY}`,
        },
        // Alguns gateways exigem body JSON quando o Content-Type é application/json
        body: JSON.stringify({ metadata: {} }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(()=> '')
        errors.push(`${p} -> ${res.status} ${txt}`)
        continue
      }
      return await res.json().catch(()=> ({}))
    } catch (e) {
      errors.push(`${p} -> ${String(e)}`)
    }
  }
  throw new Error(`abacatepay simulate-payment failed. Tried: ${errors.join(' | ')}`)
}

export async function verifySignature(raw: string, timestamp: string, signature: string, secret: string) {
	const encoder = new TextEncoder()
	const keyData = encoder.encode(secret)
	const message = encoder.encode(`${timestamp}.${raw}`)
	const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
	const sig = await crypto.subtle.sign('HMAC', cryptoKey, message)
	const bytes = new Uint8Array(sig)
	const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
	return hex === signature
}

export async function checkPixStatus(qrId: string) {
  const url = `${API}/v1/pixQrCode/check?id=${encodeURIComponent(qrId)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${KEY}` },
  })
  if (!res.ok) {
    const txt = await res.text().catch(()=> '')
    throw new Error(`abacatepay check-status failed: ${res.status} ${txt}`)
  }
  const json = await res.json().catch(()=> ({}))
  const data = json?.data ?? json
  return String(data?.status || '').toUpperCase()
}
