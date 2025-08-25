import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { checkEmailExists } from '../lib/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Cube3D } from '../components/Cube3D'
import { toast } from 'sonner'
// import robuxLogo from '../assets/18.svg'

const registerSchema = z.object({
	email: z.string().email('E-mail inválido'),
	password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

type RegisterValues = z.infer<typeof registerSchema>

const loginSchema = z.object({
	email: z.string().email('E-mail inválido'),
	password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function Auth() {
	const [mode, setMode] = useState<'register' | 'login'>('register')
	const nav = useNavigate()
	const [sp] = useSearchParams()

	const [showRegPass, setShowRegPass] = useState(false)
	const [showLoginPass, setShowLoginPass] = useState(false)

	useEffect(() => {
		const m = sp.get('mode')
		if (m === 'login' || m === 'register') setMode(m)
	}, [sp])

	const registerForm = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), mode: 'onBlur' })
	const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: 'onBlur' })

	async function onRegister(values: RegisterValues) {
		// 0) e-mail: checagem na Edge Function (admin) – evita sinal falso de sucesso
		try {
			const res = await checkEmailExists(values.email.trim())
			if (res?.exists) {
				registerForm.setError('email', { type: 'manual', message: 'E-mail já cadastrado.' })
				registerForm.setFocus('email')
				return
			}
		} catch {}


		// 1) signUp
		const { error } = await supabase.auth.signUp({ email: values.email, password: values.password })
		if (error) {
			const msg = String(error.message || '').toLowerCase()
			if (msg.includes('already') || msg.includes('exist') || msg.includes('registered')) {
				registerForm.setError('email', { type: 'manual', message: 'E-mail já cadastrado.' })
				registerForm.setFocus('email')
				return
			}
			toast.error(error.message)
			return
		}

		toast.success('Conta criada.')
		nav('/start')
	}

	async function onLogin(values: LoginValues) {
		const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password })
		if (error) { toast.error(error.message); return }
		nav('/start')
	}

	async function onForgotPassword() {
		const typed = loginForm.getValues('email') || registerForm.getValues('email')
		const email = typed || window.prompt('Informe seu e-mail para redefinir a senha:') || ''
		if (!email) return
		const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?mode=login` })
		if (error) { toast.error(error.message); return }
		toast.success('Se o e-mail existir, enviaremos instruções para redefinição de senha.')
	}

	return (
		<div className="min-h-screen bg-neutral-50 flex flex-col items-center">
			{/* Logo topo: Cube 3D */}
			<div className="mt-12">
				<Cube3D size={84} src="/src/assets/18.svg" />
			</div>

			{/* Card centralizado */}
			<div className="w-full max-w-md mx-auto p-6 md:p-8">
				<div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 shadow-sm">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h1 className="text-xl font-semibold">{mode === 'register' ? 'Criar conta' : 'Entrar'}</h1>
							<p className="text-neutral-600 text-sm">{mode === 'register' ? 'Crie sua conta para começar.' : 'Use suas credenciais para acessar.'}</p>
						</div>
						<div className="flex gap-2">
							<button className={`px-3 py-2 rounded ${mode==='register'?'bg-[#8BF65B] text-neutral-900':'border'}`} onClick={()=>setMode('register')}>Registrar</button>
							<button className={`px-3 py-2 rounded ${mode==='login'?'bg-[#8BF65B] text-neutral-900':'border'}`} onClick={()=>setMode('login')}>Entrar</button>
						</div>
					</div>

					{mode === 'register' ? (
						<form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
							<label className="block">
								<span className="text-sm text-neutral-600">E-mail</span>
								<input aria-invalid={!!registerForm.formState.errors.email} className="mt-1 w-full border rounded px-3 py-2" placeholder="voce@email.com" {...registerForm.register('email')} />
								{registerForm.formState.errors.email && <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.email.message}</p>}
							</label>
							<label className="block">
								<span className="text-sm text-neutral-600">Senha</span>
								<div className="relative mt-1">
									<input aria-invalid={!!registerForm.formState.errors.password} type={showRegPass?'text':'password'} className="w-full border rounded px-3 py-2 pr-10" placeholder="••••••••" {...registerForm.register('password')} />
									<button type="button" aria-label={showRegPass?'Ocultar senha':'Mostrar senha'} onClick={()=>setShowRegPass(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-neutral-500">
										{showRegPass ? <EyeOff size={18} /> : <Eye size={18} />}
									</button>
								</div>
								{registerForm.formState.errors.password && <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.password.message}</p>}
							</label>
							<button disabled={registerForm.formState.isSubmitting} className="w-full px-4 py-2 rounded bg-[#8BF65B] text-neutral-900">{registerForm.formState.isSubmitting?'Enviando...':'Criar conta'}</button>
							<div className="text-right mt-2">
								<button className="text-sm text-neutral-600 underline underline-offset-4" type="button" onClick={onForgotPassword}>Esqueci minha senha</button>
							</div>
						</form>
					) : (
						<form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
							<label className="block">
								<span className="text-sm text-neutral-600">E-mail</span>
								<input aria-invalid={!!loginForm.formState.errors.email} className="mt-1 w-full border rounded px-3 py-2" placeholder="voce@email.com" {...loginForm.register('email')} />
								{loginForm.formState.errors.email && <p className="mt-1 text-xs text-red-600">{loginForm.formState.errors.email.message}</p>}
							</label>
							<label className="block">
								<span className="text-sm text-neutral-600">Senha</span>
								<div className="relative mt-1">
									<input aria-invalid={!!loginForm.formState.errors.password} type={showLoginPass?'text':'password'} className="w-full border rounded px-3 py-2 pr-10" placeholder="••••••••" {...loginForm.register('password')} />
									<button type="button" aria-label={showLoginPass?'Ocultar senha':'Mostrar senha'} onClick={()=>setShowLoginPass(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-neutral-500">
										{showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}
									</button>
								</div>
								{loginForm.formState.errors.password && <p className="mt-1 text-xs text-red-600">{loginForm.formState.errors.password.message}</p>}
							</label>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2 text-sm text-neutral-600">
									<input id="remember" type="checkbox" className="accent-neutral-800" />
									<label htmlFor="remember">Lembrar de mim</label>
								</div>
								<button className="text-sm text-neutral-600 underline underline-offset-4" type="button" onClick={onForgotPassword}>Esqueci minha senha</button>
							</div>
							<button disabled={loginForm.formState.isSubmitting} className="w-full px-4 py-2 rounded bg-[#8BF65B] text-neutral-900">{loginForm.formState.isSubmitting?'Entrando...':'Entrar'}</button>
						</form>
					)}

					<p className="mt-4 text-xs text-neutral-500 text-center">Ao continuar, você concorda com nossos Termos e Política de Privacidade.</p>
				</div>
			</div>
			<div className="-mt-10 mb-4">
				<img src="/src/assets/5.svg" alt="Robux" className="w-24 h-24" />
			</div>
		</div>
	)
}
