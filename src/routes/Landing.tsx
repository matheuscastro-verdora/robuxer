import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings } from '../lib/api'
import logoTop from '../assets/8.svg'
import logoFooter from '../assets/16.svg'
import { RobuxOfficialIcon } from '../components/RobuxOfficialIcon'
import { RobuxTicker } from '../components/RobuxTicker'
import { motion } from 'framer-motion'
// import robuxLogo from '../assets/18.svg'
import { Cube3D } from '../components/Cube3D'

type NavKey = 'home' | 'rates' | 'how' | 'testimonials' | 'faq' | 'cta'

export default function Landing() {
	const nav = useNavigate()
	const [mobileOpen, setMobileOpen] = useState(false)
	const [activeNav, setActiveNav] = useState<NavKey>('home')
	const programmaticScrollRef = useRef(false)

	// refs para cards origem/destino da seta
	const originRef = useRef<HTMLDivElement>(null)
	const destRef = useRef<HTMLDivElement>(null)

	// valor Robux controlado por ciclos
	const [robuxValue, setRobuxValue] = useState(80)
	const [cycleKey, setCycleKey] = useState(0)
	const runningRef = useRef(false)

	useEffect(() => { startCycle() }, [])

	function startCycle() {
		if (runningRef.current) return
		runningRef.current = true
		// 1) pulso no PIX
		setPixPulseKey(k => k + 1)
		// 2) após pequena janela, atualiza valor e pulsa Robux
		setTimeout(() => {
			updateRobux()
		}, 220)
		// 3) finaliza ciclo e agenda próximo 2–3s
		setTimeout(() => {
			runningRef.current = false
			setCycleKey(k => k + 1)
			startCycle()
		}, 2000 + Math.random() * 1000)
	}

	const [pixPulseKey, setPixPulseKey] = useState(0)

	function updateRobux() {
		setRobuxValue(prev => {
			let n = prev
			const min = 32, max = 100, maxStep = 12
			while (n === prev || Math.abs(n - prev) > maxStep) n = Math.floor(min + Math.random() * (max - min))
			setRobuxPulseKey(k => k + 1)
			return n
		})
	}

	const [robuxPulseKey, setRobuxPulseKey] = useState(0)

	useEffect(() => {
		// noop; só para dependência do BezierArrow
	}, [cycleKey])

	useEffect(() => {
		// acessibilidade: respeitar reduced motion (ciclo sem deslocamento já é tratado no componente)
	}, [])

	useEffect(() => { refreshRates().catch(() => {}) }, [])

	async function refreshRates() { await getSettings().catch(()=>{}) }

	function scrollToSection(key: NavKey) {
		const id =
			key === 'home' ? 'hero' :
			key === 'rates' ? 'exchange-rates' :
			key === 'how' ? 'how-it-works' :
			key === 'faq' ? 'faq' :
			key === 'testimonials' ? 'testimonials' :
			'cta'
		const el = document.getElementById(id)
		if (el) {
			const header = document.getElementById('header')
			const headerH = header ? header.getBoundingClientRect().height : 0
			const y = el.getBoundingClientRect().top + window.pageYOffset - headerH - 8
			programmaticScrollRef.current = true
			setActiveNav(key)
			window.scrollTo({ top: y, behavior: 'smooth' })
			setMobileOpen(false)
			setTimeout(() => { programmaticScrollRef.current = false }, 700)
		}
	}

	// Scroll spy para destacar item ativo conforme a rolagem
	useEffect(() => {
		function onScroll() {
			if (programmaticScrollRef.current) return
			const header = document.getElementById('header')
			const headerH = header ? header.getBoundingClientRect().height : 0
			const sections: { key: NavKey; id: string }[] = [
				{ key: 'home', id: 'hero' },
				{ key: 'rates', id: 'exchange-rates' },
				{ key: 'how', id: 'how-it-works' },
				{ key: 'testimonials', id: 'testimonials' },
				{ key: 'faq', id: 'faq' },
			]
			let current: NavKey = 'home'
			for (const s of sections) {
				const el = document.getElementById(s.id)
				if (!el) continue
				const top = el.getBoundingClientRect().top - headerH - 12
				if (top <= window.innerHeight * 0.33) current = s.key
			}
			setActiveNav(current)
		}
		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [])

	// typewriter
	const fullTitle = 'Troque PIX por Robux com facilidade e segurança'
	const [titleIndex, setTitleIndex] = useState(0)
	useEffect(() => {
		let active = true
		let i = 0
		const delay = 45 // mais lento e natural
		const tick = () => {
			if (!active) return
			i = Math.min(fullTitle.length, i + 1)
			setTitleIndex(i)
			if (i < fullTitle.length) setTimeout(tick, delay)
		}
		tick()
		return () => { active = false }
	}, [])

	return (
 		<div className="text-base-content">
 			{/* Header */}
 			<div id="header" className="bg-white shadow-sm sticky top-0 z-40">
 				<div className="container mx-auto px-4 py-4">
 					<div className="flex items-center justify-between">
 						<div className="flex items-center">
 							<img src={logoTop} alt="Robuxer" className="h-14 md:h-16 w-auto" />
 						</div>

 						<nav className="hidden md:flex space-x-6">
 							<button onClick={() => { setActiveNav('home'); scrollToSection('home') }} className={`${activeNav==='home' ? 'text-neutral-900 border-b-2 border-[#8BF65B]' : 'text-neutral-600 hover:text-neutral-900'} cursor-pointer`}>Home</button>
 							<button onClick={() => { setActiveNav('rates'); scrollToSection('rates') }} className={`${activeNav==='rates' ? 'text-neutral-900 border-b-2 border-[#8BF65B]' : 'text-neutral-600 hover:text-neutral-900'} cursor-pointer`}>Cotações</button>
 							<button onClick={() => { setActiveNav('how'); scrollToSection('how') }} className={`${activeNav==='how' ? 'text-neutral-900 border-b-2 border-[#8BF65B]' : 'text-neutral-600 hover:text-neutral-900'} cursor-pointer`}>Como funciona</button>
 							<button onClick={() => { setActiveNav('testimonials'); scrollToSection('testimonials') }} className={`${activeNav==='testimonials' ? 'text-neutral-900 border-b-2 border-[#8BF65B]' : 'text-neutral-600 hover:text-neutral-900'} cursor-pointer`}>Comentários</button>
 							<button onClick={() => { setActiveNav('faq'); scrollToSection('faq') }} className={`${activeNav==='faq' ? 'text-neutral-900 border-b-2 border-[#8BF65B]' : 'text-neutral-600 hover:text-neutral-900'} cursor-pointer`}>FAQ</button>
 						</nav>

 						<div className="flex items-center space-x-4">
 							<button onClick={() => nav('/auth?mode=login')} className="hidden md:block px-4 py-2 bg-neutral-100 rounded-lg text-neutral-700">Login</button>
 							<button onClick={() => nav('/auth?mode=register')} className="px-4 py-2 bg-[#8BF65B] rounded-lg text-neutral-900">Criar conta</button>
 							<button className="md:hidden text-neutral-700" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
 								<i className="fa-solid fa-bars" />
 							</button>
 						</div>
 					</div>
 				</div>
 				{/* Mobile menu */}
 				{mobileOpen && (
 					<div className="md:hidden border-t bg-white">
 						<div className="px-4 py-3 space-y-2">
 							<button onClick={() => { setActiveNav('home'); scrollToSection('home') }} className="block w-full text-left py-2">Home</button>
 							<button onClick={() => { setActiveNav('rates'); scrollToSection('rates') }} className="block w-full text-left py-2">Cotações</button>
 							<button onClick={() => { setActiveNav('how'); scrollToSection('how') }} className="block w-full text-left py-2">Como funciona</button>
 							<button onClick={() => { setActiveNav('testimonials'); scrollToSection('testimonials') }} className="block w-full text-left py-2">Comentários</button>
 							<button onClick={() => { setActiveNav('faq'); scrollToSection('faq') }} className="block w-full text-left py-2">FAQ</button>
 							<div className="pt-2 flex gap-2">
 								<button onClick={() => nav('/auth?mode=login')} className="flex-1 px-3 py-2 bg-neutral-100 rounded">Login</button>
 								<button onClick={() => nav('/auth?mode=register')} className="flex-1 px-3 py-2 bg-[#8BF65B] text-neutral-900 rounded">Criar conta</button>
 							</div>
 						</div>
 					</div>
 				)}
 			</div>

 			{/* Hero */}
 			<div id="hero" className="bg-neutral-50">
 				<div className="container mx-auto px-4 py-16">
 					<div className="flex flex-col md:flex-row items-center">
 						<div className="md:w-1/2 mb-8 md:mb-0">
 							<h1 className="text-4xl mb-4 caret-blink animate-fade-in-up" aria-label={fullTitle}>{fullTitle.slice(0, titleIndex)}</h1>
 							<p className="text-neutral-600 text-lg mb-8">A forma mais rápida e confiável de converter seu pagamento PIX em Robux. Taxas competitivas e sem complicação.</p>
 							<div className="flex flex-col sm:flex-row gap-4">
 								<motion.button whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} onClick={() => nav('/start')} className="px-6 py-3 bg-[#8BF65B] text-neutral-900 rounded-lg">Selecionar Game Pass</motion.button>
 								<motion.button whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} onClick={() => scrollToSection('how')} className="px-6 py-3 bg-white border border-neutral-300 text-neutral-700 rounded-lg">Veja como funciona</motion.button>
 							</div>
 						</div>
 						<div className="md:w-1/2 flex items-center justify-center">
						    <Cube3D size={288} src="/src/assets/18.svg" />
						</div>
 					</div>
 				</div>
 			</div>

 			{/* Rates */}
 			<div id="exchange-rates" className="py-16 bg-white">
 				<div className="container mx-auto px-4">
 					<div className="text-center mb-12">
 						<h2 className="text-3xl mb-4">Quanto vale seu PIX agora</h2>
 						<p className="text-neutral-600 max-w-2xl mx-auto">Veja em tempo real quantos Robux você recebe.</p>
 					</div>

 					<div className="bg-neutral-50 rounded-lg p-6 shadow-sm max-w-3xl mx-auto">
 						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 							<div ref={originRef} className="bg-white p-6 rounded-lg border border-neutral-200">
 								<div className="flex items-center mb-4">
 									<div className="mr-3">
 										<motion.div
 											key={pixPulseKey}
 											initial={{ scale: 1 }}
 											animate={{ scale: [1, 1.05, 1] }}
 											transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
 											className="bg-neutral-200 rounded-full w-10 h-10 flex items-center justify-center"
 										>
 											<i className="fa-solid fa-money-bill-wave" />
 										</motion.div>
 									</div>
 									<div>
 										<div className="text-sm text-neutral-500">PIX (BRL)</div>
 										<div className="text-2xl">R$ 1,00</div>
 									</div>
 								</div>
 							</div>
 							<div ref={destRef} className="bg-white p-6 rounded-lg border border-neutral-200">
 								<div className="flex items-center mb-4">
 									<div className="mr-3"><RobuxOfficialIcon size={24} pulseKey={robuxPulseKey} /></div>
 									<div>
 										<div className="text-sm text-neutral-500">Robux</div>
 										<div className="text-2xl flex items-center gap-3">
 											<RobuxTicker value={robuxValue} />
 										</div>
 									</div>
 								</div>
 								<div className="text-sm text-neutral-500 text-center">Taxa competitiva sem tarifas ocultas</div>
 							</div>
 						</div>

 						<div className="mt-6 text-center">
 							<motion.button whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} onClick={() => nav('/start')} className="px-6 py-3 bg-[#8BF65B] text-neutral-900 rounded-lg">Calcular e Selecionar</motion.button>
 						</div>
 					</div>
 				</div>
 			</div>

 			{/* How it works */}
 			<div id="how-it-works" className="py-16 bg-neutral-50">
 				<div className="container mx-auto px-4">
 					<div className="text-center mb-12">
 						<h2 className="text-3xl mb-4">Como funciona</h2>
 						<p className="text-neutral-600 max-w-2xl mx-auto">Simples, seguro e rápido. Converta seu PIX em Robux em minutos.</p>
 					</div>

 					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
 						<div className="bg-white p-6 rounded-lg shadow-sm">
 							<div className="bg-neutral-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
 								<span className="text-neutral-800">1</span>
 							</div>
 							<h3 className="text-xl mb-3">Defina a quantidade</h3>
 							<p className="text-neutral-600">Informe quantos Robux quer e veja o valor em PIX.</p>
 						</div>

 						<div className="bg-white p-6 rounded-lg shadow-sm">
 							<div className="bg-neutral-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
 								<span className="text-neutral-800">2</span>
 							</div>
 							<h3 className="text-xl mb-3">Crie seu Game Pass</h3>
 							<p className="text-neutral-600">Crie/abra sua experiência e publique um passe com o preço indicado.</p>
 						</div>

 						<div className="bg-white p-6 rounded-lg shadow-sm">
 							<div className="bg-neutral-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
 								<span className="text-neutral-800">3</span>
 							</div>
 							<h3 className="text-xl mb-3">Troque PIX por Robux</h3>
 							<p className="text-neutral-600">Envie o link do passe, pague via PIX e liberamos seus Robux.</p>
 						</div>
						
 					</div>

 					<div className="text-center mt-10">
 						<motion.button whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} onClick={() => nav('/start')} className="px-6 py-3 bg-[#8BF65B] text-neutral-900 rounded-lg">Começar</motion.button>
 					</div>
 				</div>
 			</div>

 			{/* Testimonials */}
 			<div id="testimonials" className="py-16 bg-white">
 				<div className="container mx-auto px-4">
 					<div className="text-center mb-12">
 						<h2 className="text-3xl mb-4">O que dizem nossos usuários</h2>
 						<p className="text-neutral-600 max-w-2xl mx-auto">Milhares confiam na Robuxer para trocar PIX por Robux.</p>
 					</div>

 					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 						{[
 							{ name: 'Lucas Silva', city: 'São Paulo, Brasil', seed: '123', text: 'Transação rápida e suporte atencioso.' },
 							{ name: 'Mariana Costa', city: 'Rio de Janeiro, Brasil', seed: '456', text: 'Processo simples e taxas justas.' },
 							{ name: 'Gabriel Oliveira', city: 'Brasília, Brasil', seed: '789', text: 'Seguro e transparente, recomendo.' },
 						].map((t) => (
 							<div key={t.seed} className="bg-neutral-50 p-6 rounded-lg">
 								<div className="flex items-center mb-4">
 									<img src={`https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=${t.seed}`} alt={t.name} className="w-12 h-12 rounded-full mr-3" />
 									<div>
 										<div>{t.name}</div>
 										<div className="text-sm text-neutral-500">{t.city}</div>
 									</div>
 								</div>
 								<div className="mb-4">
 									<div className="flex text-neutral-400">
 										<i className="fa-solid fa-star text-[#8BF65B]" />
 										<i className="fa-solid fa-star text-[#8BF65B]" />
 										<i className="fa-solid fa-star text-[#8BF65B]" />
 										<i className="fa-solid fa-star text-[#8BF65B]" />
 										<i className="fa-solid fa-star text-[#8BF65B]" />
 									</div>
 								</div>
 								<p className="text-neutral-600">“{t.text}”</p>
 							</div>
 						))}
 					</div>
 				</div>
 			</div>

 			{/* CTA */}
 			<div id="cta" className="py-16 bg-[#8BF65B]">
 				<div className="container mx-auto px-4 text-center">
 					<h2 className="text-3xl text-neutral-900 mb-4">Pronto para trocar PIX por Robux?</h2>
 					<p className="text-neutral-900 max-w-2xl mx-auto mb-8">Rápido, seguro e confiável.</p>
 					<button onClick={() => nav('/start')} className="px-8 py-4 bg-neutral-900 text-white rounded-lg text-lg">Selecionar Game Pass</button>
 				</div>
 			</div>

 			{/* FAQ */}
 			<div id="faq" className="py-16 bg-white">
 				<div className="container mx-auto px-4">
 					<div className="text-center mb-12">
 						<h2 className="text-3xl mb-4">Perguntas frequentes</h2>
 						<p className="text-neutral-600 max-w-2xl mx-auto">As dúvidas mais comuns sobre nosso serviço.</p>
 					</div>

 					<div className="max-w-3xl mx-auto space-y-6">
 						{faqItems.map((f, idx) => (
 							<Accordion key={idx} question={f.q} answer={f.a} />
 						))}
 					</div>

 					<div className="text-center mt-10">
 						<button onClick={() => nav('/start')} className="text-neutral-800">Começar <i className="fa-solid fa-arrow-right ml-1" /></button>
 					</div>
 				</div>
 			</div>

 			{/* Footer */}
 			<div id="footer" className="bg-neutral-100 pt-12 pb-6">
 				<div className="container mx-auto px-4">
 					<div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
 						<div>
 							<div className="flex items-center mb-4">
 								<img src={logoFooter} alt="Robuxer" className="h-20 md:h-26 w-auto" />
 							</div>
 							<p className="text-neutral-600 mb-4">A plataforma mais rápida e confiável para trocar PIX por Robux no Brasil.</p>
 							<div className="flex space-x-4">
 								<button className="text-neutral-500 hover:text-[#8BF65B] cursor-pointer" aria-label="Facebook"><i className="fa-brands fa-facebook" /></button>
 								<button className="text-neutral-500 hover:text-[#8BF65B] cursor-pointer" aria-label="Twitter"><i className="fa-brands fa-twitter" /></button>
 								<button className="text-neutral-500 hover:text-[#8BF65B] cursor-pointer" aria-label="Instagram"><i className="fa-brands fa-instagram" /></button>
 								<button className="text-neutral-500 hover:text-[#8BF65B] cursor-pointer" aria-label="Discord"><i className="fa-brands fa-discord" /></button>
 							</div>
 						</div>

 						<div>
 							<h3 className="mb-4">Links rápidos</h3>
 							<ul className="space-y-2">
 								<li><button onClick={() => scrollToSection('home')} className="text-neutral-600 hover:text-neutral-800">Home</button></li>
 								<li><button onClick={() => scrollToSection('how')} className="text-neutral-600 hover:text-neutral-800">Como funciona</button></li>
 								<li><button onClick={() => scrollToSection('rates')} className="text-neutral-600 hover:text-neutral-800">Taxas</button></li>
 								<li><button onClick={() => nav('/start')} className="text-neutral-600 hover:text-neutral-800">Trocar agora</button></li>
 								<li><button onClick={() => nav('/account')} className="text-neutral-600 hover:text-neutral-800">Conta</button></li>
 							</ul>
 						</div>

 						<div>
 							<h3 className="mb-4">Suporte</h3>
 							<ul className="space-y-2">
 								<li><button onClick={() => scrollToSection('faq')} className="text-neutral-600 hover:text-neutral-800">FAQ</button></li>
 								<li><a className="text-neutral-600 hover:text-neutral-800" href="mailto:suporte@robuxer.app">Fale conosco</a></li>
 								<li><a className="text-neutral-600 hover:text-neutral-800" href="#" target="_blank" rel="noreferrer">Termos de uso</a></li>
 								<li><a className="text-neutral-600 hover:text-neutral-800" href="#" target="_blank" rel="noreferrer">Privacidade</a></li>
 							</ul>
 						</div>

 						<div>
 							<h3 className="mb-4">Newsletter</h3>
 							<p className="text-neutral-600 mb-4">Receba novidades de taxas e promoções.</p>
 							<form className="flex" onSubmit={(e) => { e.preventDefault(); alert('Inscrição realizada!'); }}>
 								<input type="email" required placeholder="Seu e-mail" className="px-4 py-2 rounded-l-lg border border-neutral-300 focus:outline-none w-full" />
 								<button className="bg-[#8BF65B] text-neutral-900 px-4 py-2 rounded-r-lg" aria-label="Inscrever">
 									<i className="fa-solid fa-paper-plane" />
 								</button>
 							</form>
 						</div>
 					</div>

 					<div className="border-t border-neutral-200 pt-6 text-center text-neutral-500 text-sm">
 						<p>© {new Date().getFullYear()} Robuxer. Todos os direitos reservados. Não afiliado à Roblox Corporation.</p>
 					</div>
 				</div>
 			</div>
 		</div>
 	)
}

function Accordion({ question, answer }: { question: string; answer: string }) {
 	const [open, setOpen] = useState(false)
 	return (
 		<div className="border border-neutral-200 rounded-lg">
 			<button onClick={() => setOpen(v => !v)} className="flex justify-between items-center w-full p-4 text-left">
 				<span>{question}</span>
 				<i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'} text-neutral-500`} />
 			</button>
 			{open && (
 				<div className="px-4 pb-4">
 					<p className="text-neutral-600">{answer}</p>
 				</div>
 			)}
 		</div>
 	)
}

const faqItems = [
 	{ q: 'Quanto tempo leva o processo?', a: 'Geralmente 5–15 minutos após a confirmação, podendo chegar a 30 min em pico.' },
 	{ q: 'Há valores mínimo e máximo?', a: 'A compra deve ter um valor mínimo de R$2,00, mas não há um valor máximo.' },
 	{ q: 'Como recebo meus Robux?', a: 'Você cria uma experiência no Roblox e adiciona um Game Pass à venda. Após fazer a compra no nosso site, a Roblox credita em ~3–5 dias.' },
 	{ q: 'Meus dados são seguros?', a: 'Usamos criptografia padrão do setor e coletamos apenas o necessário.' },
]


