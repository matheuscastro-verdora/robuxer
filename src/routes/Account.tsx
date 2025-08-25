import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function Account() {
	const { user } = useAuth()
	const [profileId, setProfileId] = useState<string | null>(null)
	const [username, setUsername] = useState('')
	const [updating, setUpdating] = useState(false)

    // Segurança - alterar senha
    const [currentPass, setCurrentPass] = useState('')
    const [newPass, setNewPass] = useState('')
    const [confirmPass, setConfirmPass] = useState('')
    const [changing, setChanging] = useState(false)

	useEffect(() => {
		async function load() {
			if (!user?.id) return
			const { data: me } = await supabase.from('users').select('id, roblox_username').eq('auth_user_id', user.id).maybeSingle()
			if (me) {
				setProfileId(me.id)
				setUsername(me.roblox_username || '')
			}
		}
		load()
	}, [user?.id])

	async function updateProfile(e: React.FormEvent) {
		e.preventDefault()
		if (!profileId) return
		setUpdating(true)
		try {
			await supabase.from('users').update({ roblox_username: username }).eq('id', profileId)
			toast.success('Perfil atualizado!')
		} finally {
			setUpdating(false)
		}
	}

    async function updatePasswordInline(e?: React.FormEvent) {
        if (e) e.preventDefault()
        if (!user?.email) { toast.error('Faça login novamente.'); return }
        if (!currentPass) { toast.error('Informe sua senha atual.'); return }
        if (newPass.length < 6) { toast.error('Nova senha deve ter no mínimo 6 caracteres.'); return }
        if (newPass !== confirmPass) { toast.error('As senhas não conferem.'); return }
        setChanging(true)
        try {
            const { error: reauthErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPass })
            if (reauthErr) { toast.error('Senha atual incorreta.'); return }
            const { error } = await supabase.auth.updateUser({ password: newPass })
            if (error) { toast.error(error.message); return }
            setCurrentPass(''); setNewPass(''); setConfirmPass('')
            toast.success('Senha atualizada com sucesso!')
        } finally {
            setChanging(false)
        }
    }



	return (
		<Layout>
			<div className="space-y-6 max-w-xl">
				<Card>
					<CardHeader>
						<CardTitle>Perfil</CardTitle>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={updateProfile}>
							<label className="block">
								<span className="text-sm text-neutral-600">Usuário Roblox</span>
								<input value={username} onChange={(e)=>setUsername(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="Digite seu nome de usuário do Roblox" />
							</label>
							<div className="flex gap-2">
								<motion.button whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} disabled={updating} className="px-4 py-2 rounded bg-[#8BF65B] text-neutral-900">{updating?'Salvando...':'Salvar alterações'}</motion.button>
						</div>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Segurança</CardTitle>
					</CardHeader>
					<CardContent>
                        <form className="space-y-3 max-w-sm" onSubmit={updatePasswordInline}>
                            <div className="text-sm text-neutral-600">Para alterar sua senha, confirme sua senha atual.</div>
                            <div>
                                <label className="block text-sm text-neutral-600">Senha atual</label>
                                <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={currentPass} onChange={(e)=>setCurrentPass(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-neutral-600">Nova senha</label>
                                <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={newPass} onChange={(e)=>setNewPass(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-neutral-600">Confirmar nova senha</label>
                                <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={confirmPass} onChange={(e)=>setConfirmPass(e.target.value)} />
						</div>
                            <motion.button whileTap={{ scale: 0.96 }} whileHover={{ y: -1 }} disabled={changing} className="px-4 py-2 rounded bg-[#8BF65B] text-neutral-900">{changing?'Alterando...':'Alterar senha'}</motion.button>
                        </form>
					</CardContent>
				</Card>
			</div>
		</Layout>
	)
}
