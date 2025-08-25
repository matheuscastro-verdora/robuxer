import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type UserProfile = {
	id: string
	auth_user_id: string | null
	email: string | null
	roblox_user_id: number | null
	roblox_username: string
	joined_at: string | null
	eligible_at: string | null
	is_eligible: boolean
	is_admin?: boolean
}

export function useProfile() {
	const { user } = useAuth()
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		async function load() {
			setLoading(true)
			let data: UserProfile | null = null
			if (user?.id) {
				const { data: row } = await supabase
					.from('users')
					.select('*')
					.eq('auth_user_id', user.id)
					.maybeSingle()
				data = (row as any) ?? null
			}
			if (!data) {
				const id = localStorage.getItem('userId')
				if (id) {
					const { data: row } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
					data = (row as any) ?? null
				}
			}
			if (!cancelled) setProfile(data)
			if (!cancelled) setLoading(false)
		}
		load()
		return () => {
			cancelled = true
		}
	}, [user?.id])

	return { profile, loading }
}
