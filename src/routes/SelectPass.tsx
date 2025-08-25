import { useEffect, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { listGamepasses, resolveGamepass, getSettings } from '../lib/api'
import { Layout } from '../components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { priceInBRL } from '../../shared/pricing'
import robuxLogo from '../assets/Robux_2019_Logo_Black (1).svg'
import { Clock, Zap, Shield, MessageCircle, ArrowLeftRight } from 'lucide-react'
import { motion } from 'framer-motion'

const schema = z.object({ experienceId: z.string().min(1) })
type FormValues = z.infer<typeof schema>

export default function SelectPass() {
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [items, setItems] = useState<{ id: number; name: string }[]>([])
  const nav = useNavigate()
  const [desiredRobux, setDesiredRobux] = useState<number>(100)
  const [settings, setSettings] = useState<{ price_per_robux: number } | null>(null)
  const [detailsById, setDetailsById] = useState<Record<number, { price?: number }>>({})

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings({ price_per_robux: 0.2 }))
  }, [])

  async function onSubmit(values: FormValues) {
    try {
      const res = await listGamepasses(values.experienceId)
      setItems(res.items || [])
      if (!res.items?.length) toast.error('Nenhum game pass encontrado. Informe manualmente no /buy-pass.')
    } catch {
      toast.error('Falha ao listar passes; informe manualmente no /buy-pass')
    }
  }

  // Buscar detalhes (preço em Robux) para cada passe listado
  useEffect(() => {
    if (!items.length) return
    let cancelled = false
    ;(async () => {
      try {
        const entries = await Promise.all(
          items.map(async (it) => {
            try {
              const info = await resolveGamepass(it.id)
              return [it.id, { price: info.price }] as const
            } catch {
              return [it.id, { price: undefined }] as const
            }
          })
        )
        if (cancelled) return
        const map: Record<number, { price?: number }> = {}
        for (const [id, detail] of entries) map[id] = detail
        setDetailsById(map)
      } catch {
        // ignore
      }
    })()
    return () => { cancelled = true }
  }, [items])

  async function pick(id: number) {
    try {
      const info = await resolveGamepass(id)
      nav(`/buy-pass?gamePassId=${id}&expectedPrice=${info.price}`)
    } catch {
      nav(`/buy-pass?gamePassId=${id}`)
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header decorativo */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-neutral-50 to-white p-6">
            <div className="flex items-center gap-2 text-neutral-800 mb-1">
              <ArrowLeftRight className="h-5 w-5" />
              <span className="font-medium">Como funciona a troca</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Estime, prepare seu Game Pass e finalize com PIX — simples e seguro.
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 bg-white">
                <img src={robuxLogo} alt="Robux" width={14} height={14} />
                {settings ? `R$ ${settings.price_per_robux.toFixed(2)}/Robux` : 'Carregando taxa...'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 bg-white">
                <i className="fa-solid fa-shield" /> 100% seguro
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 bg-white">
                <i className="fa-solid fa-bolt" /> Processamento rápido
              </span>
            </div>
            {/* Orbes decorativos */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-neutral-200/40 blur-3xl" />
          </div>
        </motion.div>
        {/* Top: Tutorial (left) + Calculadora (right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5" /> Passo a passo</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 w-7 h-7 flex items-center justify-center text-[11px] font-medium">1</div>
                  <div>
                    <div className="font-medium">Calcule sua troca</div>
                    <div className="text-muted-foreground">Use a calculadora ao lado para estimar quantos Robux receberá e o valor em reais.</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 w-7 h-7 flex items-center justify-center text-[11px] font-medium">2</div>
                  <div>
                    <div className="font-medium">Crie um servidor (experiência)</div>
                    <div className="text-muted-foreground">Se ainda não tiver, crie uma experiência no Roblox e publique (deixe pública).</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 w-7 h-7 flex items-center justify-center text-[11px] font-medium">3</div>
                  <div>
                    <div className="font-medium">Adicione um Game Pass</div>
                    <div className="text-muted-foreground">Crie ou edite um Game Pass com o valor de Robux desejado e coloque à venda. Copie o link da experiência e cole no "Selecionar Game Pass".</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 w-7 h-7 flex items-center justify-center text-[11px] font-medium">4</div>
                  <div>
                    <div className="font-medium">Pague com PIX</div>
                    <div className="text-muted-foreground">Confirme o valor e gere o QR Code para pagar no seu banco.</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 w-7 h-7 flex items-center justify-center text-[11px] font-medium">5</div>
                  <div>
                    <div className="font-medium">Processamento</div>
                    <div className="text-muted-foreground">Validamos o pagamento imediatamente. <b>A Roblox credita em ~3–5 dias.</b></div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 w-7 h-7 flex items-center justify-center text-[11px] font-medium">6</div>
                  <div>
                    <div className="font-medium">Receba seus Robux</div>
                    <div className="text-muted-foreground">Compra do Game Pass automática assim que o pagamento for conciliado.</div>
                  </div>
                </li>
              </ol>
              <div className="mt-4 text-xs text-muted-foreground">
                A Roblox credita em <b>~3–5 dias</b>. Garantimos a compra do Game Pass após a confirmação do seu pagamento.
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}>
          <Card>
            <CardHeader>
              <CardTitle>Calculadora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Robux desejado</label>
                <input type="number" className="w-full border rounded-md px-3 py-2" value={desiredRobux} onChange={(e)=>setDesiredRobux(Number(e.target.value || 0))} />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {[100, 250, 500, 1000].map(v => (
                    <motion.button key={v} type="button" whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} onClick={()=>setDesiredRobux(v)} className="px-2 py-1 rounded-md border text-sm hover:bg-accent inline-flex items-center gap-2">
                      <img src={robuxLogo} alt="Robux" width={14} height={14} />
                      {v} Robux
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="rounded-md border p-3 text-sm flex items-center justify-between">
                <div className="text-muted-foreground">Estimativa em reais</div>
                <div className="font-medium">
                  {settings ? `R$ ${(priceInBRL(desiredRobux, settings.price_per_robux)/100).toFixed(2)}` : '--'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Dica: crie/ajuste um Game Pass com {desiredRobux} Robux. Depois, localize-o abaixo e finalize.
              </div>
            </CardContent>
          </Card>
          {/* Selecionar Game Pass abaixo da calculadora */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Selecionar Game Pass</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Experience ID ou link</label>
                  <input className="w-full border rounded-md px-3 py-2" placeholder="https://www.roblox.com/games/EXPERIENCE_ID" {...register('experienceId')} />
                </div>
                <motion.button
                  disabled={formState.isSubmitting}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ y: -1 }}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-60"
                >
                  {formState.isSubmitting ? 'Buscando...' : 'Listar passes'}
                </motion.button>
              </form>

              <div className="space-y-2">
                {items.map((it) => {
                  const price = detailsById[it.id]?.price
                  return (
                    <motion.button
                      key={it.id}
                      onClick={() => pick(it.id)}
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ y: -1 }}
                      className="w-full text-left border rounded-md p-2 hover:bg-accent"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          {it.name} <span className="text-xs text-muted-foreground">#{it.id}</span>
                        </div>
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
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Roblox credit window notice */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm flex items-start gap-3">
            <div className="rounded-full bg-yellow-200 w-7 h-7 flex items-center justify-center"><Clock className="h-4 w-4 text-yellow-800" /></div>
            <div>
              <div className="font-medium text-yellow-900">Importante</div>
              <div className="text-yellow-900/90">A Roblox credita em ~3–5 dias. Esse prazo é definido pela Roblox — não por nós.</div>
            </div>
          </div>
        </motion.div>

        {/* Features (bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <div className="rounded-full bg-neutral-100 w-9 h-9 flex items-center justify-center"><Zap className="h-4 w-4" /></div>
              <div className="text-sm">
                <div className="font-medium">Processamento rápido</div>
                <div className="text-muted-foreground">Validamos seu pagamento na hora e iniciamos a compra automaticamente.</div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <div className="rounded-full bg-neutral-100 w-9 h-9 flex items-center justify-center"><Shield className="h-4 w-4" /></div>
              <div className="text-sm">
                <div className="font-medium">100% seguro</div>
                <div className="text-muted-foreground">Transações com segurança de nível bancário e dados protegidos.</div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <div className="rounded-full bg-neutral-100 w-9 h-9 flex items-center justify-center"><MessageCircle className="h-4 w-4" /></div>
              <div className="text-sm">
                <div className="font-medium">Suporte dedicado</div>
                <div className="text-muted-foreground">Equipe disponível para ajudar em qualquer etapa da sua troca.</div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}


