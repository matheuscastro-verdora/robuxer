import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { listGamepasses, resolveGamepass, getSettings } from '../lib/api'
import { Layout } from '../components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import {
	Stepper,
	StepperDescription,
	StepperIndicator,
	StepperItem,
	StepperSeparator,
	StepperTitle,
	StepperTrigger,
} from '../components/ui/Stepper'
import { motion } from 'framer-motion'
import { priceInBRL } from '../../shared/pricing'
import robuxLogo from '../assets/Robux_2019_Logo_Black (1).svg'
import { useNavigate } from 'react-router-dom'

const schema = z.object({ experienceId: z.string().min(1) })
type FormValues = z.infer<typeof schema>

export default function Start() {
	const steps = [
		{ step: 1, title: 'Calcule sua troca', description: 'Use a calculadora ao lado para estimar quantos Robux receberá e o valor em reais.' },
		{ step: 2, title: 'Crie um servidor (experiência)', description: 'Se ainda não tiver, crie uma experiência no Roblox e publique (deixe pública).' },
		{ step: 3, title: 'Adicione um Game Pass', description: 'Crie/edite um Game Pass com o valor desejado e coloque à venda. Depois selecione abaixo.' },
		{ step: 4, title: 'Pague com PIX', description: 'Confirme o valor e gere o QR Code para pagar no seu banco.' },
		{ step: 5, title: 'Processamento', description: 'Validamos o pagamento imediatamente. A Roblox credita em ~3–5 dias.' },
		{ step: 6, title: 'Receba seus Robux', description: 'Compra automática do Game Pass assim que o pagamento for conciliado.' },
	] as const

	const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) })
	const [desiredRobux, setDesiredRobux] = useState<number>(0)
	const [typedRobux, setTypedRobux] = useState<string>('')
	const [settings, setSettings] = useState<{ price_per_robux: number } | null>(null)
	const [items, setItems] = useState<{ id: number; name: string }[]>([])
	const [detailsById, setDetailsById] = useState<Record<number, { price?: number }>>({})
	const [activeStep, setActiveStep] = useState<number>(1)
	const nav = useNavigate()

	useEffect(() => {
		getSettings().then(setSettings).catch(() => setSettings({ price_per_robux: 0.2 }))
	}, [])

	function minRobuxForTwoBRL(ppr: number | null): number {
		if (!ppr || ppr <= 0) return 0
		return Math.max(1, Math.ceil(2 / ppr))
	}

	function onRobuxChangeText(value: string) {
		setTypedRobux(value)
		const num = Number(value)
		if (Number.isFinite(num) && num > 0) {
			setDesiredRobux(num)
			setActiveStep((s) => Math.max(s, 2))
		} else {
			setDesiredRobux(0)
		}
	}

	function onRobuxBlur() {
		const num = Number(typedRobux)
		if (!Number.isFinite(num) || num <= 0) return
		if (settings?.price_per_robux) {
			const minRbx = minRobuxForTwoBRL(settings.price_per_robux)
			if (priceInBRL(num, settings.price_per_robux) < 200) {
				setDesiredRobux(minRbx)
				setTypedRobux(String(minRbx))
				return
			}
		}
		// mantém digitado se já atende o mínimo
		setDesiredRobux(num)
		setTypedRobux(String(num))
	}

	async function onSubmit(values: FormValues) {
		try {
			const res = await listGamepasses(values.experienceId)
			setItems(res.items || [])
			setActiveStep((s) => Math.max(s, 3)) // passo 2 concluído
		} catch {}
	}

	useEffect(() => {
		if (!items.length) return
		let cancelled = false
		;(async () => {
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
				{/* Top banner + grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Left: Stepper estilizado */}
					<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
				<Card>
							<CardHeader>
								<CardTitle>Passo a passo</CardTitle>
							</CardHeader>
							<CardContent>
								<Stepper value={activeStep} defaultValue={1} orientation="vertical" className="space-y-0">
									{steps.map(({ step, title, description }, idx) => (
										<motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: idx * 0.05 }}>
											<StepperItem step={step} className="relative items-start not-last:flex-1">
												<StepperTrigger className="items-start rounded pb-8 last:pb-0">
													<StepperIndicator step={step} className="ring-1 ring-primary/20">{step}</StepperIndicator>
													<div className="mt-0.5 space-y-0.5 px-2 text-left">
														<StepperTitle className="font-medium">{title}</StepperTitle>
														<StepperDescription>{description}</StepperDescription>
													</div>
												</StepperTrigger>
												{step < steps.length && (
													<StepperSeparator className="absolute inset-y-0 top-[calc(1.5rem+0.625rem)] left-4 -order-1 m-0 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)]" />
												)}
											</StepperItem>
										</motion.div>
									))}
								</Stepper>
								<p className="text-muted-foreground mt-4 text-xs">A Roblox credita em ~3–5 dias.</p>
					</CardContent>
				</Card>
					</motion.div>

					{/* Right: Calculadora + Selecionar Game Pass */}
					<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
				<Card>
							<CardHeader>
								<CardTitle>Calculadora</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<label className="block text-sm mb-1">Robux desejado</label>
									<input type="number" className="w-full border rounded-md px-3 py-2" value={typedRobux} onChange={(e)=>onRobuxChangeText(e.target.value)} onBlur={onRobuxBlur} placeholder="0" />
									<div className="mt-2 flex flex-wrap items-center gap-2">
										{[100, 250, 500, 1000].map(v => (
											<motion.button key={v} type="button" whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} onClick={()=>{ setTypedRobux(String(v)); setDesiredRobux(v); setActiveStep((s)=>Math.max(s,2)) }} className="px-2 py-1 rounded-md border text-sm hover:bg-accent inline-flex items-center gap-2">
												<img src={robuxLogo} alt="Robux" width={14} height={14} />
												{v} Robux
											</motion.button>
										))}
									</div>
								</div>
								<div className="rounded-md border p-3 text-sm flex items-center justify-between">
									<div className="text-muted-foreground">Estimativa em reais</div>
									<div className="font-medium">{settings ? `R$ ${(priceInBRL(desiredRobux, settings.price_per_robux)/100).toFixed(2)}` : 'R$ 0,00'}</div>
						</div>
								<div className="text-xs text-muted-foreground">Dica: crie/ajuste um Game Pass com {desiredRobux} Robux. Depois localize-o abaixo e finalize.</div>
					</CardContent>
				</Card>

						<Card className="mt-6">
							<CardHeader>
								<CardTitle>Selecionar Game Pass</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
									<div>
										<label className="block text-sm mb-1">Link/ID da criação</label>
										<input className="w-full border rounded-md px-3 py-2" placeholder="https://www.roblox.com/games/EXPERIENCE_ID" {...register('experienceId')} />
									</div>
									<motion.button disabled={formState.isSubmitting} whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} className="inline-flex items-center px-4 py-2 rounded-md bg-[#8BF65B] text-neutral-900 disabled:opacity-60">
										{formState.isSubmitting ? 'Buscando...' : 'Listar passes'}
									</motion.button>
								</form>

								<div className="space-y-2 max-h-56 overflow-y-auto pr-1" style={{ scrollbarGutter: 'stable' }}>
									{items.map((it) => {
										const price = detailsById[it.id]?.price
										return (
											<motion.button key={it.id} onClick={() => pick(it.id)} whileTap={{ scale: 0.98 }} whileHover={{ y: -1 }} className="w-full text-left border rounded-md p-2 hover:bg-accent">
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
					</CardContent>
				</Card>
					</motion.div>
				</div>
			</div>
		</Layout>
	)
}
