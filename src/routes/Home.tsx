import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Layout } from '../components/Layout'
import { useEffect, useMemo, useState } from 'react'
import { getConfig, getSettings, membershipLookup } from '../lib/api'
import { priceInBRL } from '../../shared/pricing'

export default function Home() {
	const [groupUrl, setGroupUrl] = useState<string>('')
	const [pricePerRobux, setPricePerRobux] = useState<number>(0.2)
	const [robux, setRobux] = useState<number>(100)
	const estimatedBRL = useMemo(() => priceInBRL(robux, pricePerRobux) / 100, [robux, pricePerRobux])

	const [checkUser, setCheckUser] = useState('')
	const [checkResult, setCheckResult] = useState<{ isMember: boolean; eligible_at?: string | null; is_eligible?: boolean } | null>(null)

	useEffect(() => {
		getConfig().then(cfg => {
			if (cfg.roblox_group_id) setGroupUrl(`https://www.roblox.com/groups/${cfg.roblox_group_id}/about`)
		})
		getSettings().then(s => setPricePerRobux(s.price_per_robux)).catch(()=>{})
	}, [])

	async function onCheck() {
		const data = await membershipLookup(checkUser.trim())
		setCheckResult({ isMember: data.isMember, eligible_at: data.profile?.eligible_at ?? null, is_eligible: data.profile?.is_eligible ?? false })
	}

	function setPreset(v: number) { setRobux(v) }

	return (
		<Layout>
			<div className="max-w-5xl mx-auto space-y-12">
				{/* Hero */}
				<section className="text-center space-y-4">
					<h1 className="text-4xl font-bold">Créditos digitais fracionados via grupo Roblox</h1>
					<p className="text-muted-foreground">Recarregue Robux com PIX e receba via Group Payout. Linguagem neutra e transparente.</p>
					<div className="flex items-center justify-center gap-3">
						<Button asChild><Link to="/start">Começar</Link></Button>
						<Button variant="outline" asChild><Link to="/buy-pass">Comprar</Link></Button>
						{groupUrl && <a className="underline text-sm" href={groupUrl} target="_blank" rel="noreferrer">Ver grupo</a>}
					</div>
				</section>

				{/* Como funciona (cards) */}
				<section className="space-y-3">
					<h2 className="text-xl font-semibold">Como funciona</h2>
					<div className="grid md:grid-cols-4 gap-3">
						{[
							{ n: 1, t: 'Vincular usuário', d: 'Informe seu username Roblox.' },
							{ n: 2, t: 'Entrar no grupo', d: 'Entre no grupo para receber via payout.' },
							{ n: 3, t: 'Pagar PIX', d: 'Gere o QR e pague com seu banco.' },
							{ n: 4, t: 'Receber payout', d: 'Assim que elegível e pago.' },
						].map((c) => (
							<div key={c.n} className="rounded-md border p-4">
								<div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">{c.n}</div>
								<div className="mt-2 font-medium">{c.t}</div>
								<div className="text-sm text-muted-foreground">{c.d}</div>
							</div>
						))}
					</div>
				</section>

				{/* Calculadora rápida com presets */}
				<section className="space-y-3">
					<h2 className="text-xl font-semibold">Calculadora rápida</h2>
					<div className="flex items-center gap-3">
						<input type="number" className="w-40 border rounded-md px-3 py-2" value={robux} onChange={(e)=>setRobux(Number(e.target.value))} />
						<div className="text-sm text-muted-foreground">Preço estimado: R$ {estimatedBRL.toFixed(2)} {pricePerRobux ? `(R$ ${pricePerRobux.toFixed(2)}/Robux)` : ''}</div>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{[100, 250, 500, 1000].map(v => (
							<button key={v} onClick={()=>setPreset(v)} className="px-2 py-1 rounded-md border text-sm hover:bg-accent">{v} Robux</button>
						))}
						<Button asChild><Link to={`/buy-pass`}>Ir para compra</Link></Button>
					</div>
					<div className="text-xs text-muted-foreground">Observação: Robux de grupo têm janela de 14 dias após entrada no grupo.</div>
				</section>

				{/* Verificador de elegibilidade */}
				<section className="space-y-3">
					<h2 className="text-xl font-semibold">Verifique sua elegibilidade</h2>
					<div className="flex flex-wrap items-center gap-3">
						<input className="border rounded-md px-3 py-2" placeholder="Usuário Roblox" value={checkUser} onChange={(e)=>setCheckUser(e.target.value)} />
						<Button onClick={onCheck}>Checar</Button>
						{checkResult && (
							<div className="text-sm text-muted-foreground">
								{checkResult.isMember ? 'No grupo.' : 'Ainda não está no grupo.'} {checkResult.is_eligible ? 'Elegível para payout.' : checkResult.eligible_at ? `Elegível em ${new Date(checkResult.eligible_at).toLocaleString()}` : ''}
							</div>
						)}
					</div>
				</section>

				{/* Avisos importantes */}
				<section className="space-y-2">
					<h2 className="text-xl font-semibold">Avisos importantes</h2>
					<ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
						<li>Comunicação neutra: créditos digitais/recompensas via grupo Roblox (não é venda oficial de Robux).</li>
						<li>Sem taxa adicional nossa; o ecossistema Roblox retém 30% quando os Robux entram no Group Funds (já considerado no cálculo).</li>
						<li>Prazo de 14 dias de elegibilidade conta a partir da entrada no grupo.</li>
						<li>Após 14 dias, os Robux são pagos automaticamente assim que o pagamento for confirmado.</li>
					</ul>
				</section>

				{/* Prova social / Confiança */}
				<section className="grid md:grid-cols-3 gap-4">
					<div className="rounded-md border p-4 text-center">
						<div className="text-2xl font-semibold">~10 min</div>
						<div className="text-xs text-muted-foreground">Tempo médio p/ payout após elegibilidade</div>
					</div>
					<div className="rounded-md border p-4 text-center">
						<div className="text-2xl font-semibold">+100</div>
						<div className="text-xs text-muted-foreground">Pedidos processados</div>
					</div>
					<div className="rounded-md border p-4 text-center">
						<div className="text-2xl font-semibold">Selo</div>
						<div className="text-xs text-muted-foreground">Não é venda oficial de Robux</div>
					</div>
				</section>

				{/* FAQ curto */}
				<section className="space-y-2">
					<h2 className="text-xl font-semibold">FAQ</h2>
					<div className="space-y-2 text-sm text-muted-foreground">
						<div>
							<b>Quem é elegível?</b> Quem entra no grupo e aguarda 14 dias a partir do ingresso.
						</div>
						<div>
							<b>Quanto tempo para receber?</b> Se já elegível, minutos após o pagamento; se não, automaticamente após a data de elegibilidade.
						</div>
						<div>
							<b>Posso pedir reembolso?</b> Enquanto o pagamento não for conciliado (e sem payout gerado), é possível solicitar via suporte.
						</div>
						<div>
							<b>Problemas comuns?</b> Não está no grupo; digitou username errado; cookie invalida payout (o sistema reprocessa automaticamente em caso de erro temporário).
						</div>
					</div>
				</section>

				{/* CTA final */}
				<section className="text-center space-y-3">
					<div className="flex items-center justify-center gap-3">
						<Button asChild><Link to="/start">Começar</Link></Button>
						<Button variant="outline" asChild><Link to="/buy-pass">Comprar</Link></Button>
						<a className="underline text-sm" href="mailto:suporte@robuxer.app">Suporte</a>
					</div>
				</section>
			</div>
		</Layout>
	)
}
