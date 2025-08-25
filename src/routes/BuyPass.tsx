import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPixCharge, resolveGamepass, getSettings, simulatePayment, listGamepasses } from '../lib/api'
import { PixQr } from '../components/PixQr'
import robuxLogo from '../assets/Robux_2019_Logo_Black (1).svg'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { priceInBRL } from '../../shared/pricing'
import { Layout } from '../components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/badge'
import { Dialog } from '../components/ui/Dialog'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
// removed header icons

const schema = z.object({
  input: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

function extractGamePassId(value: string): string | null {
  const m = value.match(/game-pass\/(\d+)/i)
  if (m) return m[1]
  const digits = value.match(/^\d+$/)
  return digits ? digits[0] : null
}
function extractExperienceId(value: string): string | null {
  const m = value.match(/games\/(\d+)/i)
  if (m) return m[1]
  return null
}

export default function BuyPass() {
  const { user } = useAuth()
  const { register, formState, setValue, getValues, watch } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [resolved, setResolved] = useState<{ price: number; sellerId: number; productId: number } | null>(null)
  const [charge, setCharge] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [settings, setSettings] = useState<{ price_per_robux: number } | null>(null)
  const [search] = useSearchParams()

  const [items, setItems] = useState<{ id: number; name: string }[]>([])
  const [detailsById, setDetailsById] = useState<Record<number, { price?: number }>>({})
  const [detected, setDetected] = useState<'pass' | 'experience' | 'unknown'>('unknown')
  const [selectedPassId, setSelectedPassId] = useState<number | null>(null)

  // carregar preço por Robux para estimativa em BRL
  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings({ price_per_robux: 0.2 }))
  }, [])

  // hint dinâmico
  const inputValue = watch('input')
  useEffect(() => {
    if (!inputValue) { setDetected('unknown'); return }
    if (extractGamePassId(inputValue) || /^\d+$/.test(inputValue)) { setDetected('pass'); return }
    if (extractExperienceId(inputValue)) { setDetected('experience'); return }
    setDetected('unknown')
  }, [inputValue])

  // preencher automaticamente via querystring e validar
  useEffect(() => {
    const gp = search.get('gamePassId')
    if (gp) {
      setValue('input', gp)
      ;(async () => {
        try {
          const info = await resolveGamepass(gp)
          setResolved(info)
          setSelectedPassId(Number(gp))
        } catch (_) { /* ignore */ }
      })()
    }
  }, [search, setValue])

  async function onValidate() {
    const value = getValues('input')?.trim()
    if (!value) {
      toast.error('Informe o link/ID do Game Pass ou o link/ID da criação')
      return
    }

    setResolved(null)
    setItems([])
    setDetailsById({})
    setSelectedPassId(null)

    // 1) tentar como game pass
    const maybePassId = extractGamePassId(value)
    if (maybePassId) {
      try {
        const info = await resolveGamepass(maybePassId)
        setResolved(info)
        setSelectedPassId(Number(maybePassId))
        toast.success('Passe validado!')
        return
      } catch {
        // segue para tentar como criação
      }
    }

    // 2) tentar como criação
    const expId = extractExperienceId(value) || value
    try {
      const res = await listGamepasses(expId)
      const list = res.items || []
      if (!list.length) {
        toast.error('Nenhum Game Pass encontrado para esta criação')
        return
      }
      setItems(list)
      // buscar preços
      const entries = await Promise.all(list.map(async (it: any) => {
        try {
          const info = await resolveGamepass(String(it.id))
          return [it.id, { price: info.price }] as const
        } catch { return [it.id, { price: undefined }] as const }
      }))
      const map: Record<number, { price?: number }> = {}
      for (const [id, detail] of entries) map[id] = detail
      setDetailsById(map)
      toast.success('Passes carregados! Selecione um para continuar.')
      return
    } catch {
      toast.error('Entrada inválida. Forneça um Game Pass válido ou link/ID de criação.')
    }
  }

  async function onSubmit() {
    try {
      if (!resolved) {
        toast.error('Valide ou selecione um Game Pass antes de gerar o PIX')
        return
      }
      const userId = user?.id || 'anonymous'
      const passId = selectedPassId
      if (!passId) {
        toast.error('Selecione um Game Pass válido antes de gerar o PIX')
        return
      }
      const res = await createPixCharge({ userId, gamePassId: String(passId) })
      setCharge(res)
      setOrderId(res.orderId)
      setOpen(true)
      toast.success('PIX gerado! Após o pagamento, o Game Pass será comprado automaticamente.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.response?.data?.error || 'Erro ao gerar PIX')
    }
  }

  return (
    <Layout>
      <motion.div className="max-w-xl mx-auto space-y-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
        <Card>
          <CardHeader>
            <CardTitle>Comprar Game Pass</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-3 text-sm">
              Depois que você compra, os Robux ficam guardadinhos como "pendentes" e <b>a Roblox libera em até 5 dias</b>. Esse é o tempo que a Roblox leva para liberar.
            </div>
            <form onSubmit={(e)=>{ e.preventDefault(); onSubmit() }} className="space-y-2">
              <div>
                <label className="block text-sm mb-1">Game Pass ou Criação (link ou ID)</label>
                <input className="w-full border rounded-md px-3 py-2" placeholder="https://www.roblox.com/game-pass/123 ou https://www.roblox.com/games/EXPERIENCE_ID" {...register('input')} />
                <div className="mt-1 text-xs text-muted-foreground">
                  {detected === 'pass' && 'Detectado Game Pass. Clique em Validar para carregar o resumo.'}
                  {detected === 'experience' && 'Detectada Criação/Experiência. Clique em Validar/Listar para ver os passes.'}
                  {detected === 'unknown' && 'Cole o link/ID do Game Pass ou da criação.'}
                </div>
              </div>
              <div className="rounded-md border p-3 text-sm flex items-center justify-between mt-2">
                <div className="text-muted-foreground">Resumo</div>
                <div className="flex items-center gap-2">
                  {resolved ? (
                    <>
                      <motion.span initial={{ scale: 1 }} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}>
                        <Badge variant="secondary" className="inline-flex items-center gap-1">
                          <img src={robuxLogo} alt="Robux" width={14} height={14} />
                          {resolved.price}
                        </Badge>
                      </motion.span>
                      {settings ? (
                        <Badge variant="secondary">R$ {(priceInBRL(resolved.price, settings.price_per_robux)/100).toFixed(2)}</Badge>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Informe o Game Pass ou link da criação e valide</span>
                  )}
                </div>
              </div>
              <div className="rounded-md border p-3 text-sm flex items-center justify-between">
                <div className="text-muted-foreground">Validação Game Pass</div>
                <div className="flex items-center gap-2">
                  {resolved ? (
                    <>
                      <Badge variant="secondary">Robux: {resolved.price}</Badge>
                      <Badge variant="secondary">Seller: {resolved.sellerId}</Badge>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Não validado</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={onValidate}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ y: -1 }}
                  className="inline-flex items-center px-4 py-2 rounded-md border"
                >
                  Validar/Listar
                </motion.button>
                <motion.button
                  disabled={formState.isSubmitting || !resolved}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ y: -1 }}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-[#8BF65B] text-neutral-900 disabled:opacity-60"
                >
                  {formState.isSubmitting ? 'Gerando PIX...' : 'Gerar PIX'}
                </motion.button>
              </div>

              {/* Lista de passes quando é fornecida uma criação */}
              {items.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1" style={{ scrollbarGutter: 'stable' }}>
                  {items.map((it) => {
                    const price = detailsById[it.id]?.price
                    return (
                      <motion.button key={it.id} type="button" onClick={async () => {
                        try {
                          const info = await resolveGamepass(String(it.id))
                          setResolved(info)
                          setSelectedPassId(it.id)
                          toast.success('Game Pass selecionado!')
                        } catch {
                          toast.error('Falha ao validar o passe selecionado')
                        }
                      }} whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }} className={`${selectedPassId===it.id ? 'border-[#8BF65B] bg-[#8BF65B]/10' : ''} w-full text-left border rounded-md p-2 hover:bg-accent`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>{it.name} <span className="text-xs text-muted-foreground">#{it.id}</span></div>
                          <div className="flex items-center gap-3">
                            <div className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                              <img src={robuxLogo} alt="Robux" width={14} height={14} />
                              {typeof price === 'number' ? price : '—'}
                            </div>
                            {settings && typeof price === 'number' && (
                              <div className="text-xs text-muted-foreground">R$ {(priceInBRL(price, settings.price_per_robux)/100).toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Dialog open={open} onClose={() => setOpen(false)}>
          <div className="space-y-3 text-center">
            <h3 className="text-lg font-medium">Pague com PIX</h3>
            {charge && <PixQr payload={charge.copyPaste} />}
            {charge && (
              <button className="border rounded px-3 py-1 text-sm" onClick={()=>{navigator.clipboard.writeText(charge.copyPaste); toast.success('Código PIX copiado')}}>
                Copiar código Pix
              </button>
            )}
            {charge && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  className="border rounded px-3 py-1 text-sm"
                  onClick={async ()=>{
                    try {
                      await simulatePayment(charge.providerPaymentId)
                      toast.success('Pagamento simulado com sucesso!')
                    } catch {
                      toast.error('Falha ao simular pagamento')
                    }
                  }}
                >
                  Simular pagamento
                </button>
                {orderId && <a className="underline text-sm" href={`/status/${orderId}`}>Ver status</a>}
              </div>
            )}
            {orderId && (
              <div className="pt-2">
                <a className="underline text-sm" href={`/status/${orderId}`}>Acompanhar status do pedido</a>
              </div>
            )}
            <div className="text-xs text-muted-foreground">Após a confirmação do pagamento, compraremos o Game Pass automaticamente. Robux pendem ~3–5 dias.</div>
          </div>
        </Dialog>
      </motion.div>
    </Layout>
  )
}


